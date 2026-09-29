import React from 'react';
import { useBank } from '../context/BankContext';
import { UserRole } from '../types/bank';
import { ArrowLeftRight, Globe2, LogOut, Moon, Plus, RefreshCw, Sun } from 'lucide-react';
import { useLanguage } from '../context/LanguageContext';

interface HeaderProps {
  currentTab: string;
  setCurrentTab: (tab: string) => void;
  onOpenTransferModal: () => void;
  onOpenNewAccountModal: () => void;
  onLogout: () => void;
  isCustomerSession?: boolean;
  theme: 'light' | 'dark';
  onToggleTheme: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentTab,
  setCurrentTab,
  onOpenTransferModal,
  onOpenNewAccountModal,
  onLogout,
  isCustomerSession = false,
  theme,
  onToggleTheme
}) => {
  const { currentRole, setCurrentRole, amlAlerts, accounts, activeCustomerAccountId, setActiveCustomerAccountId, resetDemoData, isDbConnected, dbSyncStatus } = useBank();
  const { t, toggleLanguage } = useLanguage();

  const pendingAlertCount = amlAlerts.filter(a => a.status === 'investigating').length;

  const navItems = [
    { id: 'overview', label: t('overview') },
    { id: 'accounts', label: t('accounts') },
    { id: 'transactions', label: t('ledger') },
    { id: 'loans', label: t('credit') },
    { id: 'compliance', label: t('risk') },
    { id: 'cards', label: t('cards') },
    { id: 'vault', label: t('vault') }
  ];

  return (
    <header className="sticky top-0 z-40 w-full border-b border-slate-800 bg-slate-950/95 backdrop-blur px-6 py-3.5 flex items-center justify-between">
      {/* Zone 1: Single Text Element Brand Wordmark */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => setCurrentTab('overview')}
          className="text-left group cursor-pointer focus:outline-none"
        >
          <span className="text-base font-bold tracking-tight text-white flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-blue-500 ring-4 ring-blue-500/20 inline-block" />
            BanglaBank
          </span>
        </button>
        <span className="text-xs text-slate-500 hidden sm:inline-block">· {t('coreBanking')}</span>
        {isDbConnected && (
          <span className="hidden xl:inline-flex items-center gap-1.5 text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block animate-pulse" />
            Firestore DB Active
          </span>
        )}
      </div>

      {/* Zone 2: Clean 4-6 text navigation links */}
      <nav className={`${isCustomerSession ? 'hidden' : 'hidden lg:flex'} items-center gap-6 text-sm font-medium text-slate-400`}>
        {navItems.map(item => {
          const isActive = currentTab === item.id && currentRole !== 'client';
          return (
            <button
              key={item.id}
              onClick={() => {
                if (currentRole === 'client') setCurrentRole('director');
                setCurrentTab(item.id);
              }}
              className={`transition-colors relative py-1 text-xs uppercase tracking-wider font-semibold ${
                isActive ? 'text-blue-400' : 'text-slate-400 hover:text-slate-100'
              }`}
            >
              {item.label}
              {item.id === 'compliance' && pendingAlertCount > 0 && (
                <span className="ml-1.5 inline-flex items-center justify-center text-[10px] text-amber-300 font-mono">
                  ({pendingAlertCount})
                </span>
              )}
              {isActive && (
                <span className="absolute bottom-0 left-0 w-full h-0.5 bg-blue-500 rounded-full" />
              )}
            </button>
          );
        })}
      </nav>

      {/* Zone 3: 1-2 Primary Actions & Role Switcher */}
      <div className="flex items-center gap-3">
        {/* Role Switcher */}
        {!isCustomerSession && <div className="flex items-center gap-2 bg-slate-900 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs">
          <span className="text-slate-400 text-[11px] uppercase tracking-wider hidden sm:inline">{t('role')}:</span>
          <select
            value={currentRole}
            onChange={(e) => {
              const newRole = e.target.value as UserRole;
              setCurrentRole(newRole);
              if (newRole === 'client') {
                setCurrentTab('client_portal');
              } else if (currentTab === 'client_portal') {
                setCurrentTab('overview');
              }
            }}
            className="bg-transparent text-slate-200 text-xs font-medium focus:outline-none cursor-pointer"
          >
            <option value="director" className="bg-slate-900 text-white">{t('director')}</option>
            <option value="teller" className="bg-slate-900 text-white">{t('teller')}</option>
            <option value="compliance" className="bg-slate-900 text-white">{t('compliance')}</option>
            <option value="client" className="bg-slate-900 text-white">{t('customer')}</option>
          </select>
        </div>}

        {/* If in client mode, quick account selector */}
        {currentRole === 'client' && !isCustomerSession && (
          <div className="hidden md:flex items-center gap-1.5 bg-slate-900 border border-slate-800 rounded-lg px-2 py-1.5 text-xs">
            <span className="text-slate-400 text-[11px]">Account:</span>
            <select
              value={activeCustomerAccountId}
              onChange={(e) => setActiveCustomerAccountId(e.target.value)}
              className="bg-transparent text-slate-200 text-xs font-medium focus:outline-none cursor-pointer max-w-[130px] truncate"
            >
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id} className="bg-slate-900 text-white">
                  {acc.accountHolderName}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Primary Action Buttons */}
        {currentRole !== 'client' ? (
          <>
            <button
              onClick={onOpenTransferModal}
              className="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-500 transition-colors whitespace-nowrap flex items-center gap-1.5 shadow-sm shadow-blue-500/10 cursor-pointer"
            >
              <ArrowLeftRight className="w-3.5 h-3.5" />
              <span>{t('transfer')}</span>
            </button>

            <button
              onClick={onOpenNewAccountModal}
              className="hidden sm:flex px-3 py-1.5 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors whitespace-nowrap items-center gap-1.5 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{t('newAccount')}</span>
            </button>
          </>
        ) : (
          <button
            onClick={onOpenTransferModal}
            className="px-3 py-1.5 text-xs font-medium text-white bg-emerald-600 rounded-lg hover:bg-emerald-500 transition-colors whitespace-nowrap flex items-center gap-1.5 cursor-pointer"
          >
            <ArrowLeftRight className="w-3.5 h-3.5" />
            <span>{t('sendMoney')}</span>
          </button>
        )}

        {/* Demo Data Reset Button */}
        <button
          onClick={resetDemoData}
          title="Reset demo data to default"
          className="p-1.5 text-slate-400 hover:text-slate-200 rounded hover:bg-slate-800/60 transition-colors cursor-pointer"
        >
          <RefreshCw className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onLogout}
          title="Sign out"
          className="p-1.5 text-slate-400 hover:text-red-300 rounded hover:bg-red-500/10 transition-colors cursor-pointer"
        >
          <LogOut className="w-3.5 h-3.5" />
        </button>

        <button
          onClick={onToggleTheme}
          title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
          className="p-1.5 text-slate-400 hover:text-blue-400 rounded hover:bg-slate-800/60 transition-colors cursor-pointer"
        >
          {theme === 'dark' ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
        </button>

        <button
          onClick={toggleLanguage}
          title="Switch language"
          className="flex items-center gap-1 p-1.5 text-xs font-semibold text-slate-400 hover:text-blue-400 rounded hover:bg-slate-800/60 transition-colors cursor-pointer"
        >
          <Globe2 className="w-4 h-4" />
          <span className="hidden xl:inline">{t('language')}</span>
        </button>
      </div>
    </header>
  );
};
