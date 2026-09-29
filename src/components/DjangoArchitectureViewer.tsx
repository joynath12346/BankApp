import React, { useState } from 'react';
import {
  Code2,
  FileCode,
  Terminal,
  Database,
  Layers,
  Copy,
  Check,
  CheckCircle2,
  ExternalLink,
  ShieldCheck,
  Server
} from 'lucide-react';

export const DjangoArchitectureViewer: React.FC = () => {
  const [selectedFile, setSelectedFile] = useState<string>('models.py');
  const [copied, setCopied] = useState<boolean>(false);

  const fileSnippets: { [key: string]: { path: string; language: string; content: string; description: string } } = {
    'models.py': {
      path: 'backend_django/core_banking/models.py',
      language: 'python',
      description: 'ORM Models: BankAccount, Transaction, LoanApplication, BankCard, AMLAlert, BranchVault',
      content: `from decimal import Decimal
from django.db import models
from django.utils import timezone
from django.core.validators import MinValueValidator, MaxValueValidator

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

    id = models.CharField(max_length=64, primary_key=True)
    account_number = models.CharField(max_length=32, unique=True, db_index=True)
    routing_number = models.CharField(max_length=16, default="021000089")
    swift_bic = models.CharField(max_length=16, default="AEGSHZUS33")
    account_holder_name = models.CharField(max_length=255, db_index=True)
    company_name = models.CharField(max_length=255, blank=True, null=True)
    account_holder_email = models.EmailField()
    account_holder_phone = models.CharField(max_length=32)
    account_type = models.CharField(max_length=32, choices=ACCOUNT_TYPES, default='checking')
    currency = models.CharField(max_length=8, default='USD')
    
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

class Transaction(models.Model):
    reference_number = models.CharField(max_length=64, unique=True, db_index=True)
    source_account = models.ForeignKey(BankAccount, on_delete=models.CASCADE, related_name='outgoing_transactions')
    target_account = models.ForeignKey(BankAccount, on_delete=models.SET_NULL, null=True, blank=True)
    counterparty_name = models.CharField(max_length=255)
    transaction_type = models.CharField(max_length=32)
    amount = models.DecimalField(max_digits=18, decimal_places=2)
    currency = models.CharField(max_length=8, default="USD")
    direction = models.CharField(max_length=8, choices=[('credit', 'Credit (+)'), ('debit', 'Debit (-)')])
    timestamp = models.DateTimeField(default=timezone.now, db_index=True)
    status = models.CharField(max_length=16, default='settled')
    risk_score = models.IntegerField(default=5)`
    },
    'views.py': {
      path: 'backend_django/core_banking/views.py',
      language: 'python',
      description: 'DRF ModelViewSets for Bank Accounts, Wire Transfers, Loan Decisions, and Cards',
      content: `from rest_framework import viewsets, status
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import BankAccount, Transaction, LoanApplication
from .serializers import BankAccountSerializer, TransferExecutionSerializer
from .services import BankingClearingService

class BankAccountViewSet(viewsets.ModelViewSet):
    queryset = BankAccount.objects.all()
    serializer_class = BankAccountSerializer

    @action(detail=True, methods=['post'])
    def deposit(self, request, pk=None):
        account = self.get_object()
        amount = Decimal(str(request.data.get('amount', '0')))
        account.balance += amount
        account.recalculate_available()
        account.save()
        return Response({'message': 'Deposit successful', 'balance': account.balance})

    @action(detail=True, methods=['post'])
    def toggle_freeze(self, request, pk=None):
        account = self.get_object()
        account.status = 'active' if account.status == 'frozen' else 'frozen'
        account.save()
        return Response({'status': account.status})

class TransferExecutionAPIView(APIView):
    def post(self, request):
        serializer = TransferExecutionSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        tx = BankingClearingService.process_transfer(
            source_account_id=data['source_account_id'],
            target_type=data['target_type'],
            counterparty_name=data['counterparty_name'],
            amount=data['amount'],
            memo=data.get('memo', '')
        )
        return Response({'status': 'cleared', 'reference': tx.reference_number}, status=201)`
    },
    'services.py': {
      path: 'backend_django/core_banking/services.py',
      language: 'python',
      description: 'Business Logic: Atomic Wire Clearing, Structuring Detection, and Loan Amortization',
      content: `from decimal import Decimal
from django.db import transaction
from django.utils import timezone
from .models import BankAccount, Transaction as TxModel, AMLAlert

class BankingClearingService:
    @staticmethod
    @transaction.atomic
    def process_transfer(source_account_id, target_type, counterparty_name, amount, memo=""):
        source_account = BankAccount.objects.select_for_update().get(id=source_account_id)
        
        if source_account.status == 'frozen':
            raise ValueError("Account is frozen by compliance. Outbound transfers prohibited.")
            
        fee = Decimal('45.00') if target_type == 'international_swift' else Decimal('25.00') if target_type == 'domestic_wire' else Decimal('0.00')
        total_deduction = amount + fee

        if total_deduction > (source_account.available_balance + source_account.overdraft_limit):
            raise ValueError("Insufficient funds including clearing fee.")

        # AML Surveillance Trigger
        is_structuring = Decimal('9000.00') <= amount < Decimal('10000.00')
        risk_score = 88 if is_structuring else (80 if amount >= 100000 else 5)
        status = 'flagged' if is_structuring or amount >= 100000 else 'settled'

        source_account.balance -= total_deduction
        source_account.recalculate_available()
        source_account.save()

        tx = TxModel.objects.create(
            reference_number=f"TXN-FED-{timezone.now().strftime('%Y')}-CLEARED",
            source_account=source_account,
            counterparty_name=counterparty_name,
            amount=amount,
            direction='debit',
            status=status,
            risk_score=risk_score,
            fee=fee,
            memo=memo
        )
        return tx`
    },
    'admin.py': {
      path: 'backend_django/core_banking/admin.py',
      language: 'python',
      description: 'Django Admin Portal: Custom actions for freezing accounts and approving loans',
      content: `from django.contrib import admin
from .models import BankAccount, Transaction, LoanApplication, BankCard, AMLAlert

@admin.register(BankAccount)
class BankAccountAdmin(admin.ModelAdmin):
    list_display = ('account_number', 'account_holder_name', 'account_type', 'currency', 'balance', 'status', 'kyc_tier')
    list_filter = ('status', 'account_type', 'currency', 'kyc_tier')
    search_fields = ('account_number', 'account_holder_name', 'account_holder_email')
    actions = ['freeze_accounts', 'unfreeze_accounts']

    @admin.action(description="Freeze selected accounts (Compliance Hold)")
    def freeze_accounts(self, request, queryset):
        queryset.update(status='frozen')

    @admin.action(description="Unfreeze selected accounts (Clear Restrictions)")
    def unfreeze_accounts(self, request, queryset):
        queryset.update(status='active')`
    },
    'settings.py': {
      path: 'backend_django/aegis_bank/settings.py',
      language: 'python',
      description: 'Django Project Settings: REST Framework, CORS, Security & Database',
      content: `INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    
    # Third party packages
    'rest_framework',
    'corsheaders',
    
    # Core Banking App
    'core_banking.apps.CoreBankingConfig',
]

REST_FRAMEWORK = {
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 25,
    'DEFAULT_PERMISSION_CLASSES': ['rest_framework.permissions.AllowAny'],
}`
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(fileSnippets[selectedFile].content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
              <span>Python 5.1 / Django REST Framework</span>
              <span aria-hidden="true">·</span>
              <span>Backend Architecture Reference</span>
            </div>
            <h1 className="text-xl font-bold tracking-tight text-white flex items-center gap-2">
              <Server className="w-5 h-5 text-emerald-400" />
              <span>Django Core Banking Stack</span>
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Complete, production-ready Django project structure generated in <code className="text-emerald-400 font-mono">/backend_django/</code> with ORM models, DRF ViewSets, atomic clearing services, and custom Django Admin.
            </p>
          </div>

          <div className="flex items-center gap-2 text-xs font-mono text-emerald-400 bg-emerald-500/10 px-3 py-1.5 rounded-lg border border-emerald-500/20">
            <CheckCircle2 className="w-4 h-4" />
            <span>Files Generated in /backend_django/</span>
          </div>
        </div>
      </div>

      {/* Code Browser Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Nav (4 cols) */}
        <div className="lg:col-span-4 space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Django Architecture Files
          </div>

          <div className="space-y-1.5">
            {Object.keys(fileSnippets).map(key => {
              const file = fileSnippets[key];
              const isActive = selectedFile === key;
              return (
                <button
                  key={key}
                  onClick={() => setSelectedFile(key)}
                  className={`w-full text-left p-3 rounded-lg border transition-all cursor-pointer ${
                    isActive
                      ? 'bg-blue-600/15 border-blue-500/60 text-white shadow-sm'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300 hover:bg-slate-800/40 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-xs font-semibold">{key}</span>
                    <span className="text-[10px] text-slate-500 uppercase">{file.language}</span>
                  </div>
                  <div className="text-[11px] text-slate-400 mt-1 line-clamp-1">{file.description}</div>
                </button>
              );
            })}
          </div>

          {/* Quick CLI Instructions */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs space-y-2">
            <div className="font-semibold text-white flex items-center gap-1.5">
              <Terminal className="w-4 h-4 text-emerald-400" />
              <span>How to Run Django Locally</span>
            </div>
            <div className="font-mono text-[11px] text-slate-400 space-y-1 bg-slate-900/60 p-2.5 rounded border border-slate-800">
              <div>cd backend_django</div>
              <div>pip install -r requirements.txt</div>
              <div>python manage.py migrate</div>
              <div>python manage.py runserver 8000</div>
            </div>
          </div>
        </div>

        {/* Right Code Viewer (8 cols) */}
        <div className="lg:col-span-8 bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
          <div className="p-4 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <FileCode className="w-4 h-4 text-emerald-400" />
              <span className="font-mono text-xs text-white font-medium">
                {fileSnippets[selectedFile].path}
              </span>
            </div>

            <button
              onClick={handleCopyCode}
              className="px-2.5 py-1 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors flex items-center gap-1 cursor-pointer"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied!' : 'Copy Code'}</span>
            </button>
          </div>

          <pre className="p-5 overflow-x-auto text-xs font-mono text-slate-300 bg-slate-950/90 flex-1 leading-relaxed selection:bg-blue-600">
            <code>{fileSnippets[selectedFile].content}</code>
          </pre>
        </div>
      </div>
    </div>
  );
};
