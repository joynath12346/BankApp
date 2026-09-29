import math
import uuid
from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from .models import BankAccount, Transaction as TxModel, AMLAlert, BranchVault

class BankingClearingService:
    @staticmethod
    @transaction.atomic
    def process_transfer(source_account_id, target_type, counterparty_name, amount, 
                         currency="USD", memo="", target_account_id=None, 
                         target_account_number="", counterparty_bank=""):
        source_account = BankAccount.objects.select_for_update().get(id=source_account_id)
        
        if source_account.status == 'frozen':
            raise ValueError("Account is frozen by compliance. Outbound transfers prohibited.")
            
        fee = Decimal('45.00') if target_type == 'international_swift' else Decimal('25.00') if target_type == 'domestic_wire' else Decimal('0.00')
        total_deduction = amount + fee

        if total_deduction > (source_account.available_balance + source_account.overdraft_limit):
            raise ValueError(f"Insufficient funds: requires {currency} {total_deduction} including clearing fee.")

        # Determine AML risk score
        risk_score = 5
        is_flagged = False
        flag_reason = ""

        if amount >= Decimal('100000.00'):
            risk_score = 80
            is_flagged = True
            flag_reason = "High value wire clearing exceeding $100,000 threshold"
        elif target_type == 'international_swift' and amount >= Decimal('25000.00'):
            risk_score = 72
            is_flagged = True
            flag_reason = "Cross-border international SWIFT velocity threshold exceeded"
        elif Decimal('9000.00') <= amount < Decimal('10000.00'):
            risk_score = 88
            is_flagged = True
            flag_reason = "BSA/AML structuring alert: Transaction amount $9,000-$9,999"

        status = 'flagged' if is_flagged else 'settled'
        prefix = 'SWF' if target_type == 'international_swift' else 'FED' if target_type == 'domestic_wire' else 'INT'
        ref_code = f"TXN-{prefix}-{timezone.now().strftime('%Y')}-{uuid.uuid4().hex[:6].upper()}"

        # Deduct from source account
        source_account.balance -= total_deduction
        source_account.recalculate_available()
        source_account.save()

        # Create source transaction
        source_tx = TxModel.objects.create(
            reference_number=ref_code,
            source_account=source_account,
            target_account_id=target_account_id if target_type == 'internal' else None,
            target_account_number=target_account_number or "EXTERNAL-CLEARING",
            counterparty_name=counterparty_name,
            counterparty_bank=counterparty_bank or ("Aegis Horizon Bank" if target_type == 'internal' else "Federal Reserve Bank Network"),
            transaction_type='internal_transfer' if target_type == 'internal' else 'wire_clearing',
            category='Book Transfer' if target_type == 'internal' else 'Wire Clearing',
            amount=amount,
            currency=currency,
            direction='debit',
            status=status,
            risk_score=risk_score,
            fee=fee,
            memo=memo,
            aml_notes=flag_reason if is_flagged else ""
        )

        # If internal transfer, credit target account
        if target_type == 'internal' and target_account_id:
            target_account = BankAccount.objects.select_for_update().get(id=target_account_id)
            target_account.balance += amount
            target_account.recalculate_available()
            target_account.save()

            TxModel.objects.create(
                reference_number=f"{ref_code}-CR",
                source_account=target_account,
                target_account=source_account,
                target_account_number=source_account.account_number,
                counterparty_name=source_account.account_holder_name,
                counterparty_bank="Aegis Horizon Bank",
                transaction_type='internal_transfer',
                category='Book Transfer Credit',
                amount=amount,
                currency=currency,
                direction='credit',
                status='settled',
                risk_score=2,
                fee=Decimal('0.00'),
                memo=f"Transfer from {source_account.account_holder_name}: {memo}"
            )

        # Create AML Alert if flagged
        if is_flagged:
            AMLAlert.objects.create(
                transaction=source_tx,
                reference_number=ref_code,
                account=source_account,
                customer_name=source_account.account_holder_name,
                severity='critical' if risk_score > 80 else 'high',
                flag_type='structuring_detection' if 'structuring' in flag_reason.lower() else 'high_value_wire',
                description=flag_reason,
                amount=amount,
                currency=currency,
                status='investigating',
                assigned_to='Compliance Officer (Queued for Review)'
            )

        return source_tx


class LoanUnderwritingService:
    @staticmethod
    def calculate_amortization(principal, annual_interest_rate_pct, term_months):
        r = (annual_interest_rate_pct / 100) / 12
        n = term_months
        p = float(principal)
        if r == 0:
            monthly_payment = p / n
        else:
            monthly_payment = (p * (r * ((1 + r) ** n))) / (((1 + r) ** n) - 1)
        total_payment = monthly_payment * n
        total_interest = total_payment - p
        return {
            'monthly_payment': round(Decimal(str(monthly_payment)), 2),
            'total_payment': round(Decimal(str(total_payment)), 2),
            'total_interest': round(Decimal(str(total_interest)), 2),
        }
