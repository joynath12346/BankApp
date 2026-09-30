# Aegis Bank Management System

Aegis Bank is a full-stack banking management application built with React, TypeScript, Django REST Framework, and PostgreSQL.

## Live Application

- Frontend: https://aegis-bank-frontend.onrender.com/
- Backend API: https://aegis-bank-api-3cgp.onrender.com/api/v1/

The hosted application can be used from any computer or phone with an internet connection, a modern browser, and an authorized application account. Source-code installation is not required for normal use.

## Requirements for Local Development

Install the following software before running the source code:

- Git
- Python 3.11 or newer
- Node.js 20 or newer
- npm
- A code editor such as Visual Studio Code
- Access to the GitHub repository
- A Neon PostgreSQL connection string

## 1. Clone the Repository

```powershell
git clone https://github.com/joynath12346/BankApp.git
cd BankApp
git checkout main
```

## 2. Configure the Django Backend

Open a terminal in the backend directory:

```powershell
cd backend_django
python -m venv venv
venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

Create a file named `.env` inside `backend_django`:

```env
DATABASE_URL=your_neon_postgresql_connection_string
DATABASE_SSL_REQUIRE=True
DJANGO_SECRET_KEY=your_private_random_secret
DJANGO_DEBUG=True
```

Apply the database migrations and start Django:

```powershell
python manage.py migrate
python manage.py runserver
```

The local backend API will be available at:

```text
http://127.0.0.1:8000/api/v1/
```

The Django administration panel will be available at:

```text
http://127.0.0.1:8000/admin/
```

## 3. Configure the React Frontend

Open a second terminal in the project root and install the frontend packages:

```powershell
npm install
```

Create a file named `.env.local` in the project root:

```env
VITE_API_BASE_URL=http://127.0.0.1:8000
```

Start the frontend development server:

```powershell
npm run dev
```

Open the address displayed by Vite, normally:

```text
http://localhost:5173/
```

## Using the Existing Database

When another computer uses the same Neon `DATABASE_URL`, it connects to the same database and can access the existing application users and banking records. Database migrations should still be run after downloading new backend changes.

For an isolated development environment, create another Neon database or database branch and use its connection string instead.

## User Roles

The system supports:

- Administrator
- Bank Manager
- Teller
- Compliance Officer
- Customer

Django checks the authenticated user's role before allowing protected operations. Customers are restricted to their own linked account data.

## Main Features

- Secure login, registration, logout, and session restoration
- Bank account management
- Deposits and withdrawals
- Money transfers
- Transaction ledger
- Loan applications, approval, and disbursement
- Card management
- AML and compliance alerts
- Branch vault management
- Foreign exchange rates
- Reports and analytics
- Persistent audit logs
- Role-based frontend navigation and backend permissions

## Important API Endpoints

| Endpoint | Purpose |
| --- | --- |
| `/api/v1/auth/login/` | Log in |
| `/api/v1/auth/register/` | Register a customer |
| `/api/v1/auth/logout/` | Log out |
| `/api/v1/auth/session/` | Restore the current session |
| `/api/v1/accounts/` | Manage bank accounts |
| `/api/v1/transactions/` | View transactions |
| `/api/v1/transfers/execute/` | Execute transfers |
| `/api/v1/loans/` | Manage loans |
| `/api/v1/cards/` | Manage bank cards |
| `/api/v1/aml-alerts/` | Manage compliance alerts |
| `/api/v1/vault/` | View or manage vault information |
| `/api/v1/exchange-rates/` | View exchange rates |
| `/api/v1/audit-logs/` | View authorized audit history |

## Verification

Check and build the frontend:

```powershell
npm run lint
npm run build
```

Run the backend tests from `backend_django`:

```powershell
python manage.py test
```

## Deployment

The project is deployed on Render as two services:

- `aegis-bank-api`: Django API served through Gunicorn
- `aegis-bank-frontend`: React static site built by Vite

The PostgreSQL database is hosted by Neon. Render receives secret environment variables through its dashboard; secrets are not stored in this repository.

## Security

Never commit or share:

- Neon database connection strings
- Django secret keys
- GitHub passwords or personal access tokens
- Application user passwords
- Authentication tokens
- Production `.env` files

Only commit example environment files containing placeholder values. Keep `.env` and `.env.local` ignored by Git.
