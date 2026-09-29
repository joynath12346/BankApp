import React, { FormEvent, useEffect, useState } from 'react';
import { Building2, LockKeyhole, Moon, Sun, UserPlus } from 'lucide-react';
import { BankProvider, useBank } from './context/BankContext';
import { Header } from './components/Header';
import { DashboardOverview } from './components/DashboardOverview';
import { AccountsManagement } from './components/AccountsManagement';
import { AccountDetailDrawer } from './components/AccountDetailDrawer';
import { TransactionsLedger } from './components/TransactionsLedger';
import { LoanManagement } from './components/LoanManagement';
import { RiskComplianceHub } from './components/RiskComplianceHub';
import { CardsManagement } from './components/CardsManagement';
import { BranchVaultFx } from './components/BranchVaultFx';
import { CustomerPortalView } from './components/CustomerPortalView';

// Modals
import { TransferModal } from './components/modals/TransferModal';
import { NewAccountModal } from './components/modals/NewAccountModal';
import { DepositWithdrawModal } from './components/modals/DepositWithdrawModal';
import { TransactionReceiptModal } from './components/modals/TransactionReceiptModal';
import { NewCardModal } from './components/modals/NewCardModal';
import { BankAccount, Transaction } from './types/bank';

const AUTH_SESSION_KEY = 'aegis_authenticated_user';
const CUSTOMER_USERS_KEY = 'aegis_customer_users';
const THEME_KEY = 'banglabank_theme';
type Theme = 'light' | 'dark';

type AuthSession =
  | { kind: 'admin'; name: string }
  | { kind: 'customer'; name: string; accountId: string };

interface CustomerUser {
  username: string;
  password: string;
  name: string;
  email: string;
  accountId: string;
}

function readCustomerUsers(): CustomerUser[] {
  try {
    return JSON.parse(localStorage.getItem(CUSTOMER_USERS_KEY) || '[]');
  } catch {
    return [];
  }
}

function readAuthSession(): AuthSession | null {
  try {
    return JSON.parse(sessionStorage.getItem(AUTH_SESSION_KEY) || 'null');
  } catch {
    return null;
  }
}

function AccessPortal({ onLogin, theme, onToggleTheme }: { onLogin: (session: AuthSession) => void; theme: Theme; onToggleTheme: () => void }) {
  const { createAccount } = useBank();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const normalizedUsername = username.trim().toLowerCase();
    const normalizedEmail = email.trim().toLowerCase();

    if (mode === 'register') {
      if (!name.trim() || !normalizedEmail || password.length < 4) {
        setError('Complete every field. Password must contain at least 4 characters.');
        return;
      }
      const users = readCustomerUsers();
      if (users.some(user => user.username === normalizedEmail || user.email.toLowerCase() === normalizedEmail)) {
        setError('That email address is already registered.');
        return;
      }
      const account = createAccount({
        accountHolderName: name.trim(),
        accountHolderEmail: normalizedEmail,
        accountHolderPhone: 'Not provided',
        type: 'checking',
        currency: 'BDT',
        balance: 0,
        notes: 'Customer self-registration account.'
      });
      const customer: CustomerUser = {
        username: normalizedEmail,
        password,
        name: name.trim(),
        email: normalizedEmail,
        accountId: account.id
      };
      localStorage.setItem(CUSTOMER_USERS_KEY, JSON.stringify([...users, customer]));
      const session: AuthSession = { kind: 'customer', name: customer.name, accountId: customer.accountId };
      sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
      setError('');
      onLogin(session);
      return;
    }

    let session: AuthSession | null = null;
    if (normalizedUsername === 'admin' && password === 'admin') {
      session = { kind: 'admin', name: 'Administrator' };
    } else {
      const customer = readCustomerUsers().find(
        user => user.username === normalizedUsername && user.password === password
      );
      if (customer) session = { kind: 'customer', name: customer.name, accountId: customer.accountId };
    }
    if (!session) {
      setError('Incorrect ID or password.');
      return;
    }
    sessionStorage.setItem(AUTH_SESSION_KEY, JSON.stringify(session));
    setError('');
    onLogin(session);
  };

  return (
    <main className={`${theme === 'light' ? 'light-theme' : ''} min-h-screen bg-slate-950 text-slate-100 flex items-center justify-center p-6 relative`}>
      <button
        type="button"
        onClick={onToggleTheme}
        title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
        className="absolute right-5 top-5 rounded-lg border border-slate-700 bg-slate-900 p-2.5 text-slate-300 transition hover:text-white"
      >
        {theme === 'dark' ? <Sun className="h-5 w-5" /> : <Moon className="h-5 w-5" />}
      </button>
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl shadow-blue-950/20">
        <div className="mb-8 flex items-center gap-3">
          <div className="rounded-xl bg-blue-600/15 p-3 text-blue-400">
            <Building2 className="h-7 w-7" />
          </div>
          <div>
            <h1 className="text-xl font-bold tracking-tight text-white">BanglaBank</h1>
            <p className="text-sm text-slate-400">Secure banking portal</p>
          </div>
        </div>

        <div className="mb-6 grid grid-cols-2 rounded-lg bg-slate-950 p-1">
          <button type="button" onClick={() => { setMode('login'); setError(''); }} className={`rounded-md px-3 py-2 text-sm font-semibold transition ${mode === 'login' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}>Sign in</button>
          <button type="button" onClick={() => { setMode('register'); setError(''); }} className={`rounded-md px-3 py-2 text-sm font-semibold transition ${mode === 'register' ? 'bg-slate-800 text-white' : 'text-slate-400 hover:text-white'}`}>Register</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {mode === 'register' && (
            <>
              <div>
                <label htmlFor="customer-name" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">Full name</label>
                <input id="customer-name" value={name} onChange={event => setName(event.target.value)} autoComplete="name" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" placeholder="Your full name" />
              </div>
              <div>
                <label htmlFor="customer-email" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">Email</label>
                <input id="customer-email" type="email" value={email} onChange={event => setEmail(event.target.value)} autoComplete="email" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20" placeholder="you@example.com" />
              </div>
            </>
          )}
          {mode === 'login' && (
            <div>
              <label htmlFor="login-id" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">
                Admin ID or customer email
              </label>
              <input
                id="login-id"
                value={username}
                onChange={(event) => setUsername(event.target.value)}
                autoComplete="username"
                autoFocus
                className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
                placeholder="Admin ID or customer email"
              />
            </div>
          )}

          <div>
            <label htmlFor="login-password" className="mb-2 block text-xs font-semibold uppercase tracking-wider text-slate-400">
              Password
            </label>
            <input
              id="login-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              autoComplete="current-password"
              className="w-full rounded-lg border border-slate-700 bg-slate-950 px-4 py-3 text-sm text-white outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              placeholder="Enter password"
            />
          </div>

          {error && (
            <p role="alert" className="rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-sm text-red-300">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-400/50"
          >
            {mode === 'login' ? <LockKeyhole className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />}
            {mode === 'login' ? 'Sign in' : 'Create customer account'}
          </button>
        </form>
      </div>
    </main>
  );
}

function BankPortalContent({ session, onLogout, theme, onToggleTheme }: { session: AuthSession; onLogout: () => void; theme: Theme; onToggleTheme: () => void }) {
  const { currentRole, setCurrentRole, accounts, setActiveCustomerAccountId } = useBank();
  const [currentTab, setCurrentTab] = useState<string>(session.kind === 'customer' ? 'client_portal' : 'overview');

  useEffect(() => {
    if (session.kind === 'customer') {
      setCurrentRole('client');
      setActiveCustomerAccountId(session.accountId);
      setCurrentTab('client_portal');
    } else {
      setCurrentRole('director');
      setCurrentTab('overview');
    }
  }, [session, setActiveCustomerAccountId, setCurrentRole]);

  // Modals state
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferDefaultSource, setTransferDefaultSource] = useState<BankAccount | null>(null);

  const [isNewAccountModalOpen, setIsNewAccountModalOpen] = useState(false);

  const [depositModalAccount, setDepositModalAccount] = useState<BankAccount | null>(null);

  const [activeReceiptTransaction, setActiveReceiptTransaction] = useState<Transaction | null>(null);

  const [isNewCardModalOpen, setIsNewCardModalOpen] = useState(false);
  const [newCardDefaultAccountId, setNewCardDefaultAccountId] = useState<string | undefined>(undefined);

  const [drawerAccount, setDrawerAccount] = useState<BankAccount | null>(null);

  // Quick action openers
  const handleOpenTransfer = (source?: BankAccount | null) => {
    setTransferDefaultSource(source || null);
    setIsTransferModalOpen(true);
  };

  const handleOpenDeposit = (acc: BankAccount) => {
    setDepositModalAccount(acc);
  };

  const handleOpenNewCard = (accId?: string) => {
    setNewCardDefaultAccountId(accId);
    setIsNewCardModalOpen(true);
  };

  return (
    <div className={`${theme === 'light' ? 'light-theme' : ''} min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans`}>
      {/* 3-Zone Header Contract */}
      <Header
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        onOpenTransferModal={() => handleOpenTransfer(null)}
        onOpenNewAccountModal={() => setIsNewAccountModalOpen(true)}
        onLogout={onLogout}
        isCustomerSession={session.kind === 'customer'}
        theme={theme}
        onToggleTheme={onToggleTheme}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8">
        {currentRole === 'client' || currentTab === 'client_portal' ? (
          <CustomerPortalView
            onOpenTransferModal={() => handleOpenTransfer(null)}
            onOpenDepositModal={() => {
              const defaultAcc = accounts[0];
              if (defaultAcc) setDepositModalAccount(defaultAcc);
            }}
            onSelectTransaction={(tx) => setActiveReceiptTransaction(tx)}
            onSwitchToManager={() => {
              if (session.kind === 'customer') {
                onLogout();
                return;
              }
              setCurrentRole('director');
              setCurrentTab('overview');
            }}
            isStandaloneCustomer={session.kind === 'customer'}
          />
        ) : (
          <>
            {currentTab === 'overview' && (
              <DashboardOverview
                onSelectTab={setCurrentTab}
                onOpenTransferModal={() => handleOpenTransfer(null)}
                onOpenNewAccountModal={() => setIsNewAccountModalOpen(true)}
                onSelectTransaction={(tx) => setActiveReceiptTransaction(tx)}
              />
            )}

            {currentTab === 'accounts' && (
              <AccountsManagement
                onOpenNewAccountModal={() => setIsNewAccountModalOpen(true)}
                onOpenDepositModal={handleOpenDeposit}
                onOpenTransferWithSource={(acc) => handleOpenTransfer(acc)}
                onSelectAccount={(acc) => setDrawerAccount(acc)}
              />
            )}

            {currentTab === 'transactions' && (
              <TransactionsLedger
                onOpenTransferModal={() => handleOpenTransfer(null)}
                onSelectTransaction={(tx) => setActiveReceiptTransaction(tx)}
              />
            )}

            {currentTab === 'loans' && <LoanManagement />}

            {currentTab === 'compliance' && <RiskComplianceHub />}

            {currentTab === 'cards' && (
              <CardsManagement onOpenNewCardModal={() => handleOpenNewCard()} />
            )}

            {currentTab === 'vault' && <BranchVaultFx />}

          </>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 px-6 py-6 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <span className="font-semibold text-slate-300">BanglaBank</span>
            <span aria-hidden="true">·</span>
            <span>Member Federal Reserve System</span>
            <span aria-hidden="true">·</span>
            <span>FDIC Insured #33812</span>
          </div>
          <div>
            <span>Routing ABA: 021000089 · SWIFT: AEGSHZUS33 · Equal Housing Lender</span>
          </div>
        </div>
      </footer>

      {/* Account Detail Drawer */}
      {drawerAccount && (
        <AccountDetailDrawer
          account={drawerAccount}
          onClose={() => setDrawerAccount(null)}
          onOpenDeposit={() => {
            handleOpenDeposit(drawerAccount);
          }}
          onOpenTransfer={() => {
            handleOpenTransfer(drawerAccount);
          }}
          onOpenNewCard={() => {
            handleOpenNewCard(drawerAccount.id);
          }}
          onSelectTransaction={(tx) => {
            setActiveReceiptTransaction(tx);
          }}
        />
      )}

      {/* Transfer Modal */}
      {isTransferModalOpen && (
        <TransferModal
          defaultSourceAccount={transferDefaultSource}
          onClose={() => {
            setIsTransferModalOpen(false);
            setTransferDefaultSource(null);
          }}
        />
      )}

      {/* New Account Modal */}
      {isNewAccountModalOpen && (
        <NewAccountModal
          onClose={() => setIsNewAccountModalOpen(false)}
          onSuccessCreated={(accId) => {
            const created = accounts.find(a => a.id === accId);
            if (created) setDrawerAccount(created);
          }}
        />
      )}

      {/* Deposit & Withdrawal Modal */}
      {depositModalAccount && (
        <DepositWithdrawModal
          account={depositModalAccount}
          defaultMode="deposit"
          onClose={() => setDepositModalAccount(null)}
        />
      )}

      {/* Transaction Clearance Receipt Voucher Modal */}
      {activeReceiptTransaction && (
        <TransactionReceiptModal
          transaction={activeReceiptTransaction}
          onClose={() => setActiveReceiptTransaction(null)}
        />
      )}

      {/* New Card Issuance Modal */}
      {isNewCardModalOpen && (
        <NewCardModal
          defaultAccountId={newCardDefaultAccountId}
          onClose={() => setIsNewCardModalOpen(false)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <BankProvider>
      <AuthenticatedApplication />
    </BankProvider>
  );
}

function AuthenticatedApplication() {
  const [session, setSession] = useState<AuthSession | null>(readAuthSession);
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem(THEME_KEY) === 'light' ? 'light' : 'dark'));

  const toggleTheme = () => {
    setTheme(current => {
      const next = current === 'dark' ? 'light' : 'dark';
      localStorage.setItem(THEME_KEY, next);
      return next;
    });
  };

  if (!session) return <AccessPortal onLogin={setSession} theme={theme} onToggleTheme={toggleTheme} />;

  const handleLogout = () => {
    sessionStorage.removeItem(AUTH_SESSION_KEY);
    setSession(null);
  };

  return <BankPortalContent session={session} onLogout={handleLogout} theme={theme} onToggleTheme={toggleTheme} />;
}
