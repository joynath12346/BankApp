from decimal import Decimal
from django import forms
from .models import BankAccount, LoanApplication

class AccountCreationForm(forms.ModelForm):
    class Meta:
        model = BankAccount
        fields = [
            'account_holder_name',
            'company_name',
            'account_holder_email',
            'account_holder_phone',
            'account_type',
            'currency',
            'balance',
            'overdraft_limit',
            'kyc_tier',
        ]
        widgets = {
            'account_holder_name': forms.TextInput(attrs={'class': 'form-control'}),
            'company_name': forms.TextInput(attrs={'class': 'form-control'}),
            'account_holder_email': forms.EmailInput(attrs={'class': 'form-control'}),
            'account_holder_phone': forms.TextInput(attrs={'class': 'form-control'}),
            'account_type': forms.Select(attrs={'class': 'form-select'}),
            'currency': forms.Select(attrs={'class': 'form-select'}),
            'balance': forms.NumberInput(attrs={'class': 'form-control'}),
            'overdraft_limit': forms.NumberInput(attrs={'class': 'form-control'}),
            'kyc_tier': forms.Select(choices=[(1, 'Tier 1 - Standard'), (2, 'Tier 2 - Enhanced'), (3, 'Tier 3 - Institutional')], attrs={'class': 'form-select'}),
        }


class WireTransferForm(forms.Form):
    source_account = forms.ModelChoiceField(
        queryset=BankAccount.objects.filter(status='active'),
        widget=forms.Select(attrs={'class': 'form-select'})
    )
    transfer_type = forms.ChoiceField(
        choices=[
            ('internal', 'Internal Book Transfer ($0.00 fee)'),
            ('domestic_wire', 'Fedwire RTGS ($25.00 fee)'),
            ('international_swift', 'SWIFT GPI Cross-Border ($45.00 fee)')
        ],
        widget=forms.Select(attrs={'class': 'form-select'})
    )
    counterparty_name = forms.CharField(max_length=255, widget=forms.TextInput(attrs={'class': 'form-control'}))
    counterparty_bank = forms.CharField(max_length=255, required=False, widget=forms.TextInput(attrs={'class': 'form-control'}))
    target_account_number = forms.CharField(max_length=64, widget=forms.TextInput(attrs={'class': 'form-control'}))
    amount = forms.DecimalField(max_digits=18, decimal_places=2, min_value=Decimal('0.01'), widget=forms.NumberInput(attrs={'class': 'form-control'}))
    memo = forms.CharField(max_length=255, required=False, widget=forms.TextInput(attrs={'class': 'form-control'}))


class LoanApplicationForm(forms.ModelForm):
    class Meta:
        model = LoanApplication
        fields = [
            'account',
            'applicant_name',
            'applicant_email',
            'loan_type',
            'requested_amount',
            'term_months',
            'interest_rate',
            'credit_score',
            'dti_ratio',
            'collateral_description',
            'collateral_value',
            'purpose'
        ]
        widgets = {
            'account': forms.Select(attrs={'class': 'form-select'}),
            'applicant_name': forms.TextInput(attrs={'class': 'form-control'}),
            'applicant_email': forms.EmailInput(attrs={'class': 'form-control'}),
            'loan_type': forms.Select(attrs={'class': 'form-select'}),
            'requested_amount': forms.NumberInput(attrs={'class': 'form-control'}),
            'term_months': forms.NumberInput(attrs={'class': 'form-control'}),
            'interest_rate': forms.NumberInput(attrs={'class': 'form-control'}),
            'credit_score': forms.NumberInput(attrs={'class': 'form-control'}),
            'dti_ratio': forms.NumberInput(attrs={'class': 'form-control'}),
            'collateral_description': forms.Textarea(attrs={'class': 'form-control', 'rows': 2}),
            'collateral_value': forms.NumberInput(attrs={'class': 'form-control'}),
            'purpose': forms.TextInput(attrs={'class': 'form-control'}),
        }
