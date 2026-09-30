from decimal import Decimal
from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from django.shortcuts import get_object_or_404
from django.utils import timezone

from .models import (
    BankAccount,
    Transaction,
    LoanApplication,
    BankCard,
    AMLAlert,
    BranchVault,
    ExchangeRate,
    AuditLog
)
from .serializers import (
    BankAccountSerializer,
    TransactionSerializer,
    TransferExecutionSerializer,
    LoanApplicationSerializer,
    BankCardSerializer,
    AMLAlertSerializer,
    BranchVaultSerializer,
    ExchangeRateSerializer,
    AuditLogSerializer
)
from .services import BankingClearingService, LoanUnderwritingService
from .auth_views import record_audit
from .permissions import (
    user_role, AccountPermission, TransactionPermission, TransferPermission,
    LoanPermission, CardPermission, CompliancePermission, VaultPermission,
    ReadAuthenticatedPermission, AuditPermission,
)

class BankAccountViewSet(viewsets.ModelViewSet):
    queryset = BankAccount.objects.all()
    serializer_class = BankAccountSerializer
    permission_classes = [AccountPermission]

    def get_queryset(self):
        qs = super().get_queryset()
        profile = getattr(self.request.user, 'bank_profile', None)
        return qs.filter(pk=profile.account_id) if user_role(self.request.user) == 'customer' and profile else qs

    def perform_create(self, serializer):
        account = serializer.save()
        record_audit(self.request, 'create', 'account', account.pk)

    def perform_update(self, serializer):
        account = serializer.save()
        record_audit(self.request, 'update', 'account', account.pk)

    @action(detail=True, methods=['post'])
    def deposit(self, request, pk=None):
        account = self.get_object()
        amount = Decimal(str(request.data.get('amount', '0')))
        memo = request.data.get('memo', 'In-branch counter deposit')
        
        if amount <= 0:
            return Response({'error': 'Amount must be greater than zero'}, status=status.HTTP_400_BAD_REQUEST)
        if account.status == 'frozen':
            return Response({'error': 'Account is frozen'}, status=status.HTTP_403_FORBIDDEN)

        account.balance += amount
        account.recalculate_available()
        account.save()

        tx = Transaction.objects.create(
            reference_number=f"TXN-DEP-{timezone.now().strftime('%Y%m%d%H%M%S')}",
            source_account=account,
            counterparty_name="Branch Cash / Direct Remittance",
            counterparty_bank="Aegis Horizon Bank",
            transaction_type="deposit",
            category="Deposit",
            amount=amount,
            currency=account.currency,
            direction="credit",
            status="settled",
            memo=memo
        )
        record_audit(request, 'deposit', 'account', account.pk, {'amount': str(amount), 'transaction_id': tx.pk})

        return Response({
            'message': 'Deposit successful',
            'account': BankAccountSerializer(account).data,
            'transaction': TransactionSerializer(tx).data
        })

    @action(detail=True, methods=['post'])
    def withdraw(self, request, pk=None):
        account = self.get_object()
        amount = Decimal(str(request.data.get('amount', '0')))
        memo = request.data.get('memo', 'Teller cash withdrawal')

        if amount <= 0:
            return Response({'error': 'Amount must be greater than zero'}, status=status.HTTP_400_BAD_REQUEST)
        if account.status in ['frozen', 'restricted']:
            return Response({'error': f'Account is {account.status}'}, status=status.HTTP_403_FORBIDDEN)
        if amount > (account.available_balance + account.overdraft_limit):
            return Response({'error': 'Insufficient funds'}, status=status.HTTP_400_BAD_REQUEST)

        account.balance -= amount
        account.recalculate_available()
        account.save()

        tx = Transaction.objects.create(
            reference_number=f"TXN-WTH-{timezone.now().strftime('%Y%m%d%H%M%S')}",
            source_account=account,
            counterparty_name="Teller Cash Drawer #1",
            counterparty_bank="Aegis Horizon Bank",
            transaction_type="withdrawal",
            category="Withdrawal",
            amount=amount,
            currency=account.currency,
            direction="debit",
            status="settled",
            memo=memo
        )
        record_audit(request, 'withdraw', 'account', account.pk, {'amount': str(amount), 'transaction_id': tx.pk})

        return Response({
            'message': 'Withdrawal successful',
            'account': BankAccountSerializer(account).data,
            'transaction': TransactionSerializer(tx).data
        })

    @action(detail=True, methods=['post'])
    def toggle_freeze(self, request, pk=None):
        account = self.get_object()
        reason = request.data.get('reason', 'Administrative action')
        account.status = 'active' if account.status == 'frozen' else 'frozen'
        account.notes += f"\n[Status changed to {account.status}: {reason}]"
        account.save()
        record_audit(request, 'change_status', 'account', account.pk, {'status': account.status, 'reason': reason})
        return Response({'status': account.status, 'message': f'Account {account.status}'})


class TransactionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Transaction.objects.all()
    serializer_class = TransactionSerializer
    permission_classes = [TransactionPermission]

    def get_queryset(self):
        qs = super().get_queryset()
        profile = getattr(self.request.user, 'bank_profile', None)
        if user_role(self.request.user) == 'customer' and profile:
            qs = qs.filter(source_account_id=profile.account_id)
        acc_id = self.request.query_params.get('account_id')
        if acc_id:
            qs = qs.filter(source_account_id=acc_id)
        return qs


class TransferExecutionAPIView(APIView):
    permission_classes = [TransferPermission]

    def post(self, request):
        serializer = TransferExecutionSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        data = serializer.validated_data
        profile = getattr(request.user, 'bank_profile', None)
        if user_role(request.user) == 'customer' and (not profile or data['source_account_id'] != profile.account_id):
            return Response({'error': 'Customers may transfer only from their own account.'}, status=status.HTTP_403_FORBIDDEN)
        try:
            tx = BankingClearingService.process_transfer(
                source_account_id=data['source_account_id'],
                target_type=data['target_type'],
                counterparty_name=data['counterparty_name'],
                amount=data['amount'],
                currency=data.get('currency', 'USD'),
                memo=data.get('memo', ''),
                target_account_id=data.get('target_account_id'),
                target_account_number=data.get('target_account_number', ''),
                counterparty_bank=data.get('counterparty_bank', '')
            )
            record_audit(request, 'transfer', 'transaction', tx.pk, {'amount': str(data['amount']), 'source_account_id': data['source_account_id']})
            return Response({
                'message': 'Transfer processed successfully',
                'transaction': TransactionSerializer(tx).data
            }, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class LoanApplicationViewSet(viewsets.ModelViewSet):
    queryset = LoanApplication.objects.all()
    serializer_class = LoanApplicationSerializer
    permission_classes = [LoanPermission]

    def get_queryset(self):
        qs = super().get_queryset()
        profile = getattr(self.request.user, 'bank_profile', None)
        return qs.filter(account_id=profile.account_id) if user_role(self.request.user) == 'customer' and profile else qs

    def perform_create(self, serializer):
        profile = getattr(self.request.user, 'bank_profile', None)
        loan = serializer.save(account=profile.account) if user_role(self.request.user) == 'customer' and profile else serializer.save()
        record_audit(self.request, 'create', 'loan', loan.pk)

    @action(detail=True, methods=['post'])
    def approve(self, request, pk=None):
        loan = self.get_object()
        approved_amt = request.data.get('approved_amount', loan.requested_amount)
        loan.status = 'approved'
        loan.approved_amount = Decimal(str(approved_amt))
        loan.approved_at = timezone.now().date()
        loan.reviewed_by = request.data.get('reviewer', 'Senior Underwriting Officer')
        loan.save()
        record_audit(request, 'approve', 'loan', loan.pk, {'approved_amount': str(loan.approved_amount)})
        return Response(LoanApplicationSerializer(loan).data)

    @action(detail=True, methods=['post'])
    def disburse(self, request, pk=None):
        loan = self.get_object()
        if loan.status != 'approved':
            return Response({'error': 'Loan must be approved prior to disbursement'}, status=status.HTTP_400_BAD_REQUEST)

        disburse_amount = loan.approved_amount or loan.requested_amount
        acc = loan.account
        acc.balance += disburse_amount
        acc.recalculate_available()
        acc.save()

        loan.status = 'disbursed'
        loan.disbursed_at = timezone.now().date()
        loan.remaining_balance = disburse_amount
        loan.save()

        tx = Transaction.objects.create(
            reference_number=f"TXN-LON-{timezone.now().strftime('%Y%m%d%H%M%S')}",
            source_account=acc,
            counterparty_name="Aegis Credit Facilities Desk",
            counterparty_bank="Aegis Horizon Bank",
            transaction_type="loan_disbursement",
            category="Credit Facility",
            amount=disburse_amount,
            currency=acc.currency,
            direction="credit",
            status="settled",
            fee=Decimal('250.00'),
            memo=f"Disbursement of {loan.loan_number} ({loan.purpose})"
        )
        record_audit(request, 'disburse', 'loan', loan.pk, {'amount': str(disburse_amount), 'transaction_id': tx.pk})

        return Response({
            'message': 'Loan disbursed successfully to borrower account',
            'loan': LoanApplicationSerializer(loan).data,
            'transaction': TransactionSerializer(tx).data
        })


class BankCardViewSet(viewsets.ModelViewSet):
    queryset = BankCard.objects.all()
    serializer_class = BankCardSerializer
    permission_classes = [CardPermission]

    def get_queryset(self):
        qs = super().get_queryset()
        profile = getattr(self.request.user, 'bank_profile', None)
        return qs.filter(account_id=profile.account_id) if user_role(self.request.user) == 'customer' and profile else qs

    @action(detail=True, methods=['post'])
    def toggle_lock(self, request, pk=None):
        card = self.get_object()
        card.status = 'locked' if card.status == 'active' else 'active'
        card.save()
        record_audit(request, 'toggle_lock', 'card', card.pk, {'status': card.status})
        return Response({'status': card.status, 'message': f'Card is now {card.status}'})


class AMLAlertViewSet(viewsets.ModelViewSet):
    queryset = AMLAlert.objects.all()
    serializer_class = AMLAlertSerializer
    permission_classes = [CompliancePermission]

    @action(detail=True, methods=['post'])
    def resolve(self, request, pk=None):
        alert = self.get_object()
        action_decision = request.data.get('action') # 'cleared', 'escalated_sar', 'account_frozen'
        notes = request.data.get('notes', '')

        if action_decision not in ['cleared', 'escalated_sar', 'account_frozen']:
            return Response({'error': 'Invalid action decision'}, status=status.HTTP_400_BAD_REQUEST)

        alert.status = action_decision
        alert.notes += f"\n[Resolved as {action_decision.upper()}: {notes}]"
        alert.save()
        record_audit(request, 'resolve', 'aml_alert', alert.pk, {'decision': action_decision})

        if action_decision == 'account_frozen':
            acc = alert.account
            acc.status = 'frozen'
            acc.notes += f"\n[Compliance frozen by AML Alert {alert.id}]"
            acc.save()

        return Response(AMLAlertSerializer(alert).data)


class BranchVaultAPIView(APIView):
    permission_classes = [VaultPermission]

    def get(self, request):
        vault, _ = BranchVault.objects.get_or_create(branch_code="NYC-01")
        return Response(BranchVaultSerializer(vault).data)

    def post(self, request):
        vault, _ = BranchVault.objects.get_or_create(branch_code="NYC-01")
        counted_cash = request.data.get('counted_cash')
        auditor = request.data.get('auditor_name', 'Chief Branch Auditor')

        if counted_cash is not None:
            vault.vault_cash_usd = Decimal(str(counted_cash))
            vault.last_audited_at = timezone.now()
            vault.auditor_name = auditor
            vault.daily_eod_reconciled = True
            vault.save()
            record_audit(request, 'reconcile', 'branch_vault', vault.pk, {'counted_cash': str(counted_cash), 'auditor': auditor})

        return Response({
            'message': 'Daily EOD Vault Reconciled',
            'vault': BranchVaultSerializer(vault).data
        })


class ExchangeRateViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = ExchangeRate.objects.all()
    serializer_class = ExchangeRateSerializer
    permission_classes = [ReadAuthenticatedPermission]


class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = AuditLog.objects.select_related('actor').all()
    serializer_class = AuditLogSerializer
    permission_classes = [AuditPermission]

    def get_queryset(self):
        qs = super().get_queryset()
        action_name = self.request.query_params.get('action')
        actor = self.request.query_params.get('actor')
        if action_name:
            qs = qs.filter(action=action_name)
        if actor:
            qs = qs.filter(actor_name__icontains=actor)
        return qs
