from django.contrib.auth.models import User
from rest_framework import status
from rest_framework.test import APITestCase

from .models import AuditLog, BankAccount, UserProfile


class RoleAccessTests(APITestCase):
    password = 'Strong-test-password-42!'

    def setUp(self):
        self.account = BankAccount.objects.create(
            account_number='BB0000000001', account_holder_name='Test Customer',
            account_holder_email='customer@example.com', account_holder_phone='01000000000',
        )
        self.users = {}
        for role in ('administrator', 'bank_manager', 'teller', 'compliance_officer', 'customer'):
            user = User.objects.create_user(username=role, email=f'{role}@example.com', password=self.password)
            UserProfile.objects.create(user=user, role=role, account=self.account if role == 'customer' else None)
            self.users[role] = user

    def login(self, role):
        response = self.client.post('/api/v1/auth/login/', {'identifier': role, 'password': self.password}, format='json')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {response.data['token']}")

    def test_login_records_audit_event(self):
        self.login('administrator')
        self.assertTrue(AuditLog.objects.filter(actor=self.users['administrator'], action='login').exists())

    def test_anonymous_api_access_is_rejected(self):
        response = self.client.get('/api/v1/accounts/')
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_teller_cannot_access_compliance_alerts(self):
        self.login('teller')
        response = self.client.get('/api/v1/aml-alerts/')
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)

    def test_compliance_officer_can_read_audit_log(self):
        self.login('compliance_officer')
        response = self.client.get('/api/v1/audit-logs/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)

    def test_customer_sees_only_linked_account(self):
        BankAccount.objects.create(
            account_number='BB0000000002', account_holder_name='Another Customer',
            account_holder_email='other@example.com', account_holder_phone='01000000001',
        )
        self.login('customer')
        response = self.client.get('/api/v1/accounts/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        results = response.data.get('results', response.data)
        self.assertEqual(len(results), 1)
        self.assertEqual(results[0]['id'], self.account.pk)
