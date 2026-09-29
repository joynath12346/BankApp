from django.contrib import admin
from .models import (
    BankAccount,
    Transaction,
    LoanApplication,
    BankCard,
    AMLAlert,
    BranchVault,
    ExchangeRate
)

@admin.register(BankAccount)
class BankAccountAdmin(admin.ModelAdmin):
    list_display = ('account_number', 'account_holder_name', 'account_type', 'currency', 'balance', 'available_balance', 'status', 'kyc_tier')
    list_filter = ('status', 'account_type', 'currency', 'kyc_tier', 'branch_code')
    search_fields = ('account_number', 'account_holder_name', 'account_holder_email', 'company_name')
    readonly_fields = ('id', 'opened_date')
    actions = ['freeze_accounts', 'unfreeze_accounts']

    @admin.action(description="Freeze selected accounts (Compliance Hold)")
    def freeze_accounts(self, request, queryset):
        queryset.update(status='frozen')

    @admin.action(description="Unfreeze selected accounts (Clear Restrictions)")
    def unfreeze_accounts(self, request, queryset):
        queryset.update(status='active')


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ('reference_number', 'source_account', 'counterparty_name', 'transaction_type', 'amount', 'currency', 'direction', 'status', 'timestamp')
    list_filter = ('status', 'transaction_type', 'direction', 'currency')
    search_fields = ('reference_number', 'counterparty_name', 'memo', 'source_account__account_number')
    readonly_fields = ('id', 'timestamp')


@admin.register(LoanApplication)
class LoanApplicationAdmin(admin.ModelAdmin):
    list_display = ('loan_number', 'applicant_name', 'loan_type', 'requested_amount', 'status', 'credit_score', 'interest_rate')
    list_filter = ('status', 'loan_type')
    search_fields = ('loan_number', 'applicant_name', 'applicant_email')
    actions = ['approve_applications']

    @admin.action(description="Approve selected loan applications")
    def approve_applications(self, request, queryset):
        for loan in queryset.filter(status__in=['submitted', 'under_review']):
            loan.status = 'approved'
            loan.approved_amount = loan.requested_amount
            loan.save()


@admin.register(BankCard)
class BankCardAdmin(admin.ModelAdmin):
    list_display = ('card_number_masked', 'cardholder_name', 'tier', 'status', 'daily_limit', 'spent_today')
    list_filter = ('status', 'tier', 'card_brand')
    search_fields = ('cardholder_name', 'card_number_masked')
    actions = ['lock_cards', 'unlock_cards']

    @admin.action(description="Lock selected cards")
    def lock_cards(self, request, queryset):
        queryset.update(status='locked')

    @admin.action(description="Unlock selected cards")
    def unlock_cards(self, request, queryset):
        queryset.update(status='active')


@admin.register(AMLAlert)
class AMLAlertAdmin(admin.ModelAdmin):
    list_display = ('id', 'customer_name', 'severity', 'flag_type', 'amount', 'currency', 'status', 'flagged_at')
    list_filter = ('severity', 'status', 'flag_type')
    search_fields = ('customer_name', 'reference_number', 'description')


@admin.register(BranchVault)
class BranchVaultAdmin(admin.ModelAdmin):
    list_display = ('branch_name', 'branch_code', 'vault_cash_usd', 'teller_drawers_cash_usd', 'daily_eod_reconciled', 'last_audited_at')


@admin.register(ExchangeRate)
class ExchangeRateAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'rate_to_usd', 'buy_rate', 'sell_rate', 'change_24h')
