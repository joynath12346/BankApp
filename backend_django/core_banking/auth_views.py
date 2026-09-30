from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.db import transaction
from rest_framework import serializers, status
from rest_framework.authentication import TokenAuthentication
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from .models import BankAccount, UserProfile, AuditLog


def client_ip(request):
    forwarded = request.META.get('HTTP_X_FORWARDED_FOR', '')
    return forwarded.split(',')[0].strip() if forwarded else request.META.get('REMOTE_ADDR')


def record_audit(request, action, resource_type, resource_id='', details=None, status_value='success'):
    profile = getattr(request.user, 'bank_profile', None)
    AuditLog.objects.create(
        actor=request.user if request.user.is_authenticated else None,
        actor_name=request.user.get_full_name() or request.user.username if request.user.is_authenticated else 'Anonymous',
        role=profile.role if profile else ('administrator' if getattr(request.user, 'is_superuser', False) else ''),
        action=action,
        resource_type=resource_type,
        resource_id=str(resource_id),
        status=status_value,
        details=details or {},
        ip_address=client_ip(request),
    )


def session_payload(user, token):
    profile, _ = UserProfile.objects.get_or_create(
        user=user,
        defaults={'role': 'administrator' if user.is_superuser else 'customer'},
    )
    return {
        'token': token.key,
        'user': {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'name': user.get_full_name() or user.username,
            'role': profile.role,
            'account_id': profile.account_id,
        },
    }


class LoginAPIView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        identifier = str(request.data.get('identifier', '')).strip()
        password = str(request.data.get('password', ''))
        username = identifier
        if '@' in identifier:
            match = User.objects.filter(email__iexact=identifier).first()
            if match:
                username = match.username
        user = authenticate(request, username=username, password=password)
        if not user or not user.is_active:
            return Response({'error': 'Incorrect ID or password.'}, status=status.HTTP_401_UNAUTHORIZED)
        token, _ = Token.objects.get_or_create(user=user)
        profile, _ = UserProfile.objects.get_or_create(user=user, defaults={'role': 'administrator' if user.is_superuser else 'customer'})
        AuditLog.objects.create(actor=user, actor_name=user.get_full_name() or user.username, role=profile.role, action='login', resource_type='user', resource_id=str(user.pk), ip_address=client_ip(request))
        return Response(session_payload(user, token))


class RegisterAPIView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []

    class InputSerializer(serializers.Serializer):
        name = serializers.CharField(max_length=150)
        email = serializers.EmailField()
        password = serializers.CharField(min_length=8, write_only=True)

    @transaction.atomic
    def post(self, request):
        data = self.InputSerializer(data=request.data)
        data.is_valid(raise_exception=True)
        email = data.validated_data['email'].lower()
        if User.objects.filter(email__iexact=email).exists():
            return Response({'error': 'That email address is already registered.'}, status=status.HTTP_400_BAD_REQUEST)
        account = BankAccount.objects.create(
            account_number=f"BB{User.objects.count() + 1:010d}",
            account_holder_name=data.validated_data['name'],
            account_holder_email=email,
            account_holder_phone='Not provided',
            account_type='checking', currency='USD', notes='Customer self-registration account.',
        )
        user = User.objects.create_user(username=email, email=email, password=data.validated_data['password'])
        user.first_name = data.validated_data['name']
        user.save(update_fields=['first_name'])
        UserProfile.objects.create(user=user, role='customer', account=account)
        token = Token.objects.create(user=user)
        AuditLog.objects.create(actor=user, actor_name=user.get_full_name(), role='customer', action='register', resource_type='user', resource_id=str(user.pk), ip_address=client_ip(request))
        return Response(session_payload(user, token), status=status.HTTP_201_CREATED)


class LogoutAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        record_audit(request, 'logout', 'user', request.user.pk)
        Token.objects.filter(user=request.user).delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class SessionAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        token = Token.objects.get(user=request.user)
        return Response(session_payload(request.user, token))
