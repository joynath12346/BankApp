import uuid
from decimal import Decimal
from django.db import models
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator
from django.conf import settings


def generate_account_id():
    return f"acc-{uuid.uuid4().hex[:6]}"


def generate_transaction_id():
    return f"tx-{uuid.uuid4().hex[:8]}"


def generate_loan_id():
    return f"loan-{uuid.uuid4().hex[:6]}"


def generate_card_id():
    return f"crd-{uuid.uuid4().hex[:6]}"


def generate_aml_alert_id():
    return f"aml-{uuid.uuid4().hex[:6]}"


class BankAccount(models.Model):
    ACCOUNT_TYPES = [
        ('checking', 'Standard Checking'),
        ('savings', 'High-Yield Savings'),
        ('business_checking', 'Commercial Operating Checking'),
        ('money_market', 'Money Market Account'),
        ('treasury_escrow', 'Treasury Escrow Account'),
    ]

    STATUS_CHOICES = [
        ('active', 'Active & Unrestricted'),
        ('frozen', 'Compliance Frozen'),
        ('dormant', 'Dormant'),
        ('restricted', 'Administrative Restrictions'),
    ]

    CURRENCY_CHOICES = [
        ('USD', 'US Dollar ($)'),
        ('EUR', 'Euro (€)'),
        ('GBP', 'British Pound (£)'),
        ('JPY', 'Japanese Yen (¥)'),
        ('CAD', 'Canadian Dollar (CA$)'),
    ]

    id = models.CharField(max_length=64, primary_key=True, default=generate_account_id)
    account_number = models.CharField(max_length=32, unique=True, db_index=True)
    routing_number = models.CharField(max_length=16, default="021000089")
    swift_bic = models.CharField(max_length=16, default="AEGSHZUS33")
    account_holder_name = models.CharField(max_length=255, db_index=True)
    company_name = models.CharField(max_length=255, blank=True, null=True)
    account_holder_email = models.EmailField()
    account_holder_phone = models.CharField(max_length=32)
    account_type = models.CharField(max_length=32, choices=ACCOUNT_TYPES, default='checking')
    currency = models.CharField(max_length=8, choices=CURRENCY_CHOICES, default='USD')
    
    balance = models.DecimalField(max_digits=18, decimal_places=2, default=Decimal('0.00'))
    available_balance = models.DecimalField(max_digits=18, decimal_places=2, default=Decimal('0.00'))
    hold_balance = models.DecimalField(max_digits=18, decimal_places=2, default=Decimal('0.00'))
    overdraft_limit = models.DecimalField(max_digits=18, decimal_places=2, default=Decimal('1000.00'))
    
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default='active')
    kyc_tier = models.PositiveSmallIntegerField(default=1, validators=[MinValueValidator(1), MaxValueValidator(3)])
    opened_date = models.DateField(default=timezone.now)
    branch_code = models.CharField(max_length=16, default="NYC-01")
    interest_rate_annual = models.DecimalField(max_digits=5, decimal_places=2, default=Decimal('1.50'))
    notes = models.TextField(blank=True, default="")

    class Meta:
        ordering = ['-balance']
        verbose_name = 'Bank Account'
        verbose_name_plural = 'Bank Accounts'

    def __str__(self):
        return f"{self.account_holder_name} - {self.account_number} ({self.currency} {self.balance})"

    def recalculate_available(self):
        self.available_balance = max(Decimal('0.00'), self.balance - self.hold_balance)


class Transaction(models.Model):
    TRANSACTION_TYPES = [
        ('deposit', 'Deposit'),
        ('withdrawal', 'Withdrawal'),
        ('internal_transfer', 'Internal Book Transfer'),
        ('wire_clearing', 'Fedwire / SWIFT Wire Clearing'),
        ('ach_debit', 'ACH Clearing'),
        ('card_pos', 'Card POS Settlement'),
        ('loan_disbursement', 'Loan Disbursement'),
        ('loan_repayment', 'Loan Repayment'),
        ('interest_credit', 'Interest Yield Credit'),
    ]

    STATUS_CHOICES = [
        ('settled', 'Settled & Cleared'),
        ('pending', 'Pending Clearing'),
        ('flagged', 'AML Flagged Review'),
        ('reversed', 'Reversed'),
    ]

    id = models.CharField(max_length=64, primary_key=True, default=generate_transaction_id)
    reference_number = models.CharField(max_length=64, unique=True, db_index=True)
    source_account = models.ForeignKey(BankAccount, on_delete=models.CASCADE, related_name='outgoing_transactions')
    target_account = models.ForeignKey(BankAccount, on_delete=models.SET_NULL, null=True, blank=True, related_name='incoming_transactions')
    target_account_number = models.CharField(max_length=64, blank=True, default="")
    
    counterparty_name = models.CharField(max_length=255)
    counterparty_bank = models.CharField(max_length=255, blank=True, default="Aegis Horizon Bank")
    transaction_type = models.CharField(max_length=32, choices=TRANSACTION_TYPES)
    category = models.CharField(max_length=64, default="Clearing")
    
    amount = models.DecimalField(max_digits=18, decimal_places=2, validators=[MinValueValidator(Decimal('0.01'))])
    currency = models.CharField(max_length=8, default="USD")
    direction = models.CharField(max_length=8, choices=[('credit', 'Credit (+)'), ('debit', 'Debit (-)')])
    timestamp = models.DateTimeField(default=timezone.now, db_index=True)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default='settled')
    
    risk_score = models.IntegerField(default=5, validators=[MinValueValidator(0), MaxValueValidator(100)])
    fee = models.DecimalField(max_digits=10, decimal_places=2, default=Decimal('0.00'))
    memo = models.CharField(max_length=255, blank=True, default="")
    aml_notes = models.TextField(blank=True, default="")

    class Meta:
        ordering = ['-timestamp']
        verbose_name = 'Transaction Ledger Entry'
        verbose_name_plural = 'Transaction Ledger Entries'

    def __str__(self):
        return f"{self.reference_number}: {self.direction.upper()} {self.currency} {self.amount} - {self.counterparty_name}"


class LoanApplication(models.Model):
    LOAN_TYPES = [
        ('commercial_term', 'Commercial Term Facility'),
        ('fixed_mortgage', 'Fixed Real Estate Mortgage'),
        ('working_capital', 'Working Capital Line'),
        ('auto_credit', 'Automotive / Equipment Credit'),
        ('unsecured_revolving', 'Unsecured Revolving Facility'),
    ]

    STATUS_CHOICES = [
        ('submitted', 'Application Submitted'),
        ('under_review', 'Underwriting Review'),
        ('approved', 'Approved'),
        ('disbursed', 'Disbursed & Active'),
        ('rejected', 'Rejected'),
        ('repaid', 'Repaid in Full'),
    ]

    id = models.CharField(max_length=64, primary_key=True, default=generate_loan_id)
    loan_number = models.CharField(max_length=64, unique=True, db_index=True)
    account = models.ForeignKey(BankAccount, on_delete=models.CASCADE, related_name='loans')
    applicant_name = models.CharField(max_length=255)
    applicant_email = models.EmailField()
    loan_type = models.CharField(max_length=32, choices=LOAN_TYPES)
    
    requested_amount = models.DecimalField(max_digits=18, decimal_places=2)
    approved_amount = models.DecimalField(max_digits=18, decimal_places=2, null=True, blank=True)
    term_months = models.PositiveIntegerField(default=36)
    interest_rate = models.DecimalField(max_digits=5, decimal_places=2)
    monthly_payment = models.DecimalField(max_digits=18, decimal_places=2)
    
    credit_score = models.IntegerField(validators=[MinValueValidator(300), MaxValueValidator(850)])
    dti_ratio = models.DecimalField(max_digits=5, decimal_places=2)
    collateral_description = models.TextField(blank=True, default="")
    collateral_value = models.DecimalField(max_digits=18, decimal_places=2, null=True, blank=True)
    
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default='submitted')
    created_at = models.DateField(default=timezone.now)
    approved_at = models.DateField(null=True, blank=True)
    disbursed_at = models.DateField(null=True, blank=True)
    reviewed_by = models.CharField(max_length=255, blank=True, default="")
    purpose = models.CharField(max_length=255)
    
    total_paid = models.DecimalField(max_digits=18, decimal_places=2, default=Decimal('0.00'))
    remaining_balance = models.DecimalField(max_digits=18, decimal_places=2)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.loan_number} - {self.applicant_name} ({self.status})"


class BankCard(models.Model):
    TIER_CHOICES = [
        ('platinum_standard', 'Platinum Standard (Retail)'),
        ('business_gold', 'Business Gold Prestige'),
        ('executive_black', 'Executive Black Metal Signature'),
    ]

    STATUS_CHOICES = [
        ('active', 'Active & Operational'),
        ('locked', 'Frozen by User/Bank'),
        ('cancelled', 'Cancelled'),
    ]

    id = models.CharField(max_length=64, primary_key=True, default=generate_card_id)
    account = models.ForeignKey(BankAccount, on_delete=models.CASCADE, related_name='cards')
    cardholder_name = models.CharField(max_length=255)
    card_number_masked = models.CharField(max_length=32)
    full_card_number_virtual = models.CharField(max_length=32)
    exp_month = models.CharField(max_length=2)
    exp_year = models.CharField(max_length=2)
    cvv = models.CharField(max_length=4)
    pin = models.CharField(max_length=4)
    
    tier = models.CharField(max_length=32, choices=TIER_CHOICES, default='executive_black')
    card_brand = models.CharField(max_length=16, default="Visa")
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default='active')
    
    daily_limit = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('15000.00'))
    spent_today = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal('0.00'))
    international_allowed = models.BooleanField(default=True)
    atm_withdrawal_allowed = models.BooleanField(default=True)
    online_allowed = models.BooleanField(default=True)
    contactless_allowed = models.BooleanField(default=True)
    issued_date = models.DateField(default=timezone.now)

    def __str__(self):
        return f"{self.card_number_masked} ({self.cardholder_name})"


class AMLAlert(models.Model):
    SEVERITY_CHOICES = [
        ('critical', 'Critical Risk'),
        ('high', 'High Risk'),
        ('medium', 'Medium Risk'),
        ('low', 'Low / Informational'),
    ]

    STATUS_CHOICES = [
        ('investigating', 'Under Investigation'),
        ('cleared', 'Cleared / False Positive'),
        ('escalated_sar', 'FinCEN SAR Report Filed'),
        ('account_frozen', 'Account Preventatively Frozen'),
    ]

    id = models.CharField(max_length=64, primary_key=True, default=generate_aml_alert_id)
    transaction = models.ForeignKey(Transaction, on_delete=models.SET_NULL, null=True, blank=True)
    reference_number = models.CharField(max_length=64, blank=True, default="")
    account = models.ForeignKey(BankAccount, on_delete=models.CASCADE, related_name='aml_alerts')
    customer_name = models.CharField(max_length=255)
    severity = models.CharField(max_length=16, choices=SEVERITY_CHOICES)
    flag_type = models.CharField(max_length=64)
    description = models.TextField()
    amount = models.DecimalField(max_digits=18, decimal_places=2)
    currency = models.CharField(max_length=8, default="USD")
    flagged_at = models.DateTimeField(default=timezone.now)
    status = models.CharField(max_length=16, choices=STATUS_CHOICES, default='investigating')
    assigned_to = models.CharField(max_length=255, blank=True, default="Compliance Officer")
    notes = models.TextField(blank=True, default="")

    class Meta:
        ordering = ['-flagged_at']

    def __str__(self):
        return f"AML Alert {self.id}: {self.customer_name} ({self.severity})"


class BranchVault(models.Model):
    branch_name = models.CharField(max_length=255, default="Downtown Flagship NYC-01")
    branch_code = models.CharField(max_length=16, unique=True, default="NYC-01")
    vault_cash_usd = models.DecimalField(max_digits=18, decimal_places=2, default=Decimal('14250000.00'))
    teller_drawers_cash_usd = models.DecimalField(max_digits=18, decimal_places=2, default=Decimal('485000.00'))
    reserve_requirement_ratio = models.DecimalField(max_digits=5, decimal_places=4, default=Decimal('0.1000'))
    central_bank_deposit_usd = models.DecimalField(max_digits=18, decimal_places=2, default=Decimal('28500000.00'))
    last_audited_at = models.DateTimeField(default=timezone.now)
    daily_eod_reconciled = models.BooleanField(default=True)
    auditor_name = models.CharField(max_length=255, default="Arthur Kensington (Chief Auditor)")

    def __str__(self):
        return f"{self.branch_name} (${self.vault_cash_usd})"


class ExchangeRate(models.Model):
    code = models.CharField(max_length=8, primary_key=True)
    name = models.CharField(max_length=64)
    symbol = models.CharField(max_length=8)
    rate_to_usd = models.DecimalField(max_digits=10, decimal_places=4)
    buy_rate = models.DecimalField(max_digits=10, decimal_places=4)
    sell_rate = models.DecimalField(max_digits=10, decimal_places=4)
    change_24h = models.DecimalField(max_digits=6, decimal_places=2)

    def __str__(self):
        return f"{self.code} ($ {self.rate_to_usd})"


class UserProfile(models.Model):
    ROLE_CHOICES = [
        ('administrator', 'Administrator'),
        ('bank_manager', 'Bank Manager'),
        ('teller', 'Teller'),
        ('compliance_officer', 'Compliance Officer'),
        ('customer', 'Customer'),
    ]

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='bank_profile')
    role = models.CharField(max_length=32, choices=ROLE_CHOICES, default='customer', db_index=True)
    account = models.ForeignKey(BankAccount, on_delete=models.SET_NULL, null=True, blank=True, related_name='portal_users')

    def __str__(self):
        return f"{self.user.username} ({self.get_role_display()})"


class AuditLog(models.Model):
    actor = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True)
    actor_name = models.CharField(max_length=255)
    role = models.CharField(max_length=32, blank=True)
    action = models.CharField(max_length=100, db_index=True)
    resource_type = models.CharField(max_length=100)
    resource_id = models.CharField(max_length=100, blank=True)
    status = models.CharField(max_length=32, default='success')
    details = models.JSONField(default=dict, blank=True)
    ip_address = models.GenericIPAddressField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True, db_index=True)

    class Meta:
        ordering = ['-created_at']

    def __str__(self):
        return f"{self.created_at}: {self.actor_name} {self.action} {self.resource_type}"
