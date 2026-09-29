from rest_framework import serializers
from .models import (
    BankAccount,
    Transaction,
    LoanApplication,
    BankCard,
    AMLAlert,
    BranchVault,
    ExchangeRate
)

class BankAccountSerializer(serializers.ModelSerializer):
    class Meta:
        model = BankAccount
        fields = '__all__'
        read_only_fields = ['id', 'opened_date']


class TransactionSerializer(serializers.ModelSerializer):
    source_account_number = serializers.CharField(source='source_account.account_number', read_only=True)
    source_holder_name = serializers.CharField(source='source_account.account_holder_name', read_only=True)

    class Meta:
        model = Transaction
        fields = '__all__'
        read_only_fields = ['id', 'timestamp']


class TransferExecutionSerializer(serializers.Serializer):
    source_account_id = serializers.CharField()
    target_type = serializers.ChoiceField(choices=['internal', 'domestic_wire', 'international_swift'])
    target_account_id = serializers.CharField(required=False, allow_blank=True)
    target_account_number = serializers.CharField(required=False, allow_blank=True)
    counterparty_name = serializers.CharField()
    counterparty_bank = serializers.CharField(required=False, allow_blank=True)
    amount = serializers.DecimalField(max_digits=18, decimal_places=2, min_value=0.01)
    currency = serializers.CharField(default="USD")
    memo = serializers.CharField(required=False, allow_blank=True)


class LoanApplicationSerializer(serializers.ModelSerializer):
    applicant_account_number = serializers.CharField(source='account.account_number', read_only=True)

    class Meta:
        model = LoanApplication
        fields = '__all__'
        read_only_fields = ['id', 'created_at']


class BankCardSerializer(serializers.ModelSerializer):
    linked_account_number = serializers.CharField(source='account.account_number', read_only=True)

    class Meta:
        model = BankCard
        fields = '__all__'
        read_only_fields = ['id', 'issued_date']


class AMLAlertSerializer(serializers.ModelSerializer):
    account_number = serializers.CharField(source='account.account_number', read_only=True)

    class Meta:
        model = AMLAlert
        fields = '__all__'
        read_only_fields = ['id', 'flagged_at']


class BranchVaultSerializer(serializers.ModelSerializer):
    class Meta:
        model = BranchVault
        fields = '__all__'


class ExchangeRateSerializer(serializers.ModelSerializer):
    class Meta:
        model = ExchangeRate
        fields = '__all__'
