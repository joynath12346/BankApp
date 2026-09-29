# Aegis Horizon Core Banking System — Django Backend Architecture

A full-stack, enterprise-grade core banking backend built on **Django 5.1** and **Django REST Framework (DRF)**.

---

## 1. Directory Structure

```
backend_django/
├── manage.py                       # Django CLI executable
├── requirements.txt                # Python dependencies
├── aegis_bank/
│   ├── __init__.py
│   ├── settings.py                 # Core settings, database, CORS, DRF configuration
│   ├── urls.py                     # Master URL routing
│   ├── wsgi.py                     # WSGI gateway for Gunicorn/production
│   └── asgi.py                     # ASGI gateway for async workers
└── core_banking/
    ├── __init__.py
    ├── apps.py                     # AppConfig declaration
    ├── models.py                   # BankAccount, Transaction, LoanApplication, BankCard, AMLAlert, BranchVault, ExchangeRate
    ├── serializers.py              # DRF ModelSerializers & Transfer payload validators
    ├── views.py                    # DRF ModelViewSets & APIViews
    ├── urls.py                     # API routing (/api/v1/accounts/, /api/v1/transfers/execute/, etc.)
    ├── services.py                 # BankingClearingService, LoanUnderwritingService, AMLSurveillanceService
    ├── forms.py                    # Server-side HTML forms
    └── admin.py                    # Custom Django Admin panel with bulk actions
```

---

## 2. Quick Start & Setup

### A. Environment & Dependencies
```bash
# 1. Create and activate Python virtual environment
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# 2. Install dependencies
pip install -r requirements.txt
```

### B. Database Migrations

The backend uses PostgreSQL. Copy the PostgreSQL variables from the root
`.env.example` into `backend_django/.env`, then create the configured database
and user before running migrations.

```bash
# Generate and apply migrations
python manage.py makemigrations core_banking
python manage.py migrate

# Create executive superuser for Django Admin
python manage.py createsuperuser
```

### C. Run the Development Server
```bash
python manage.py runserver 8000
```
- **REST API Root**: `http://localhost:8000/api/v1/`
- **Django Admin Portal**: `http://localhost:8000/admin/`

---

## 3. Core REST API Endpoints

| HTTP Method | Endpoint | Description |
|---|---|---|
| `GET / POST` | `/api/v1/accounts/` | List all accounts or register a new customer portfolio |
| `GET / PUT` | `/api/v1/accounts/{id}/` | Retrieve or update account details |
| `POST` | `/api/v1/accounts/{id}/deposit/` | Cash or certified check deposit |
| `POST` | `/api/v1/accounts/{id}/withdraw/` | Cash withdrawal with balance validation |
| `POST` | `/api/v1/accounts/{id}/toggle_freeze/` | Enact or release administrative freeze |
| `POST` | `/api/v1/transfers/execute/` | Execute Fedwire, SWIFT, or Book Transfer with fee and AML checking |
| `GET` | `/api/v1/transactions/` | Interbank clearing ledger entries |
| `GET / POST` | `/api/v1/loans/` | List active credit facilities or submit loan application |
| `POST` | `/api/v1/loans/{id}/approve/` | Senior underwriter loan approval |
| `POST` | `/api/v1/loans/{id}/disburse/` | Disburse approved principal to borrower deposit account |
| `GET / POST` | `/api/v1/cards/` | List or issue new debit/credit cards |
| `POST` | `/api/v1/cards/{id}/toggle_lock/` | Lock or unlock card instantly |
| `GET / POST` | `/api/v1/aml-alerts/` | List flagged suspicious activity reports |
| `POST` | `/api/v1/aml-alerts/{id}/resolve/` | Clear false positive or file FinCEN SAR |
| `GET / POST` | `/api/v1/vault/` | Branch vault reserves and End-of-Day (EOD) audit reconciliation |
| `GET` | `/api/v1/exchange-rates/` | Real-time foreign exchange currency rates |
