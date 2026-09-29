import React, { useState, useMemo } from 'react';
import { useBank } from '../context/BankContext';
import { BankAccount, AccountType, AccountStatus, Currency } from '../types/bank';
import {
  Search,
  Filter,
  Plus,
  ShieldCheck,
  ShieldAlert,
  ArrowUpDown,
  Lock,
  Unlock,
  Coins,
  ArrowUpRight,
  Copy,
  Check,
  ChevronRight
} from 'lucide-react';

interface AccountsManagementProps {
  onOpenNewAccountModal: () => void;
  onOpenDepositModal: (account: BankAccount) => void;
  onOpenTransferWithSource: (account: BankAccount) => void;
  onSelectAccount: (account: BankAccount) => void;
}

export const AccountsManagement: React.FC<AccountsManagementProps> = ({
  onOpenNewAccountModal,
  onOpenDepositModal,
  onOpenTransferWithSource,
  onSelectAccount
}) => {
  const { accounts, toggleAccountStatus } = useBank();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [currencyFilter, setCurrencyFilter] = useState<string>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 1500);
  };

  const filteredAccounts = useMemo(() => {
    return accounts.filter(acc => {
      const matchesSearch =
        acc.accountHolderName.toLowerCase().includes(search.toLowerCase()) ||
        acc.accountNumber.toLowerCase().includes(search.toLowerCase()) ||
        (acc.companyName && acc.companyName.toLowerCase().includes(search.toLowerCase())) ||
        acc.accountHolderEmail.toLowerCase().includes(search.toLowerCase());

      const matchesType = typeFilter === 'all' || acc.type === typeFilter;
      const matchesStatus = statusFilter === 'all' || acc.status === statusFilter;
      const matchesCurrency = currencyFilter === 'all' || acc.currency === currencyFilter;

      return matchesSearch && matchesType && matchesStatus && matchesCurrency;
    });
  }, [accounts, search, typeFilter, statusFilter, currencyFilter]);

  const totalCalculatedBalance = filteredAccounts.reduce((sum, acc) => sum + acc.balance, 0);
  const activeCount = accounts.filter(a => a.status === 'active').length;
  const frozenCount = accounts.filter(a => a.status === 'frozen').length;
  const restrictedCount = accounts.filter(a => a.status === 'restricted').length;

  const formatAccountType = (type: AccountType) => {
    switch (type) {
      case 'treasury_escrow':
        return 'Treasury Escrow';
      case 'business_checking':
        return 'Commercial Operating';
      case 'checking':
        return 'Standard Checking';
      case 'savings':
        return 'High-Yield Savings';
      case 'money_market':
        return 'Money Market Account';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header & Metrics Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span>Customer Core Accounts</span>
            <span aria-hidden="true">·</span>
            <span>{accounts.length} total portfolios</span>
            <span aria-hidden="true">·</span>
            <span className="text-emerald-400">{activeCount} active</span>
            {frozenCount > 0 && (
              <>
                <span aria-hidden="true">·</span>
                <span className="text-rose-400 font-medium">{frozenCount} compliance frozen</span>
              </>
            )}
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">Accounts & Deposits Directory</h1>
        </div>

        <button
          onClick={onOpenNewAccountModal}
          className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm shadow-blue-500/10"
        >
          <Plus className="w-4 h-4" />
          <span>Open New Account</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by customer name, corporate entity, account number, or email..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        {/* Filter controls */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Type filter */}
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="all">All Types</option>
            <option value="checking">Checking</option>
            <option value="savings">High-Yield Savings</option>
            <option value="business_checking">Commercial Operating</option>
            <option value="treasury_escrow">Treasury Escrow</option>
            <option value="money_market">Money Market</option>
          </select>

          {/* Status filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="active">Active</option>
            <option value="frozen">Frozen</option>
            <option value="restricted">Restricted</option>
          </select>

          {/* Currency filter */}
          <select
            value={currencyFilter}
            onChange={e => setCurrencyFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="all">All Currencies</option>
            <option value="USD">USD ($)</option>
            <option value="EUR">EUR (€)</option>
            <option value="GBP">GBP (£)</option>
            <option value="JPY">JPY (¥)</option>
          </select>
        </div>
      </div>

      {/* Accounts High-Density Grid */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Account Number</th>
                <th className="py-3 px-4">Client / Entity</th>
                <th className="py-3 px-4">Classification</th>
                <th className="py-3 px-4">KYC Tier</th>
                <th className="py-3 px-4 text-right">Ledger Balance</th>
                <th className="py-3 px-4 text-right">Available Balance</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredAccounts.length === 0 ? (
                <tr>
                  <td colSpan={8} className="py-12 text-center text-slate-400">
                    <p className="text-sm font-medium">No accounts match the active filter criteria.</p>
                    <p className="text-xs text-slate-500 mt-1">Try resetting search filters or create a new account.</p>
                  </td>
                </tr>
              ) : (
                filteredAccounts.map(acc => {
                  const isCopied = copiedId === acc.id;
                  return (
                    <tr
                      key={acc.id}
                      className="hover:bg-slate-800/30 transition-colors group cursor-pointer"
                      onClick={() => onSelectAccount(acc)}
                    >
                      <td className="py-3.5 px-4 font-mono text-[11px] text-slate-200">
                        <div className="flex items-center gap-1.5">
                          <span>{acc.accountNumber}</span>
                          <button
                            onClick={e => {
                              e.stopPropagation();
                              handleCopy(acc.accountNumber, acc.id);
                            }}
                            className="text-slate-500 hover:text-slate-200 p-0.5 rounded cursor-pointer"
                            title="Copy Account Number"
                          >
                            {isCopied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
                          </button>
                        </div>
                        <div className="text-[10px] text-slate-500">Routing: {acc.routingNumber}</div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="font-semibold text-white">{acc.accountHolderName}</div>
                        {acc.companyName ? (
                          <div className="text-[11px] text-slate-400">{acc.companyName}</div>
                        ) : (
                          <div className="text-[11px] text-slate-500">{acc.accountHolderEmail}</div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="text-slate-200 font-medium">{formatAccountType(acc.type)}</div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          {acc.currency} · {acc.interestRateAnnual}% APY
                        </div>
                      </td>

                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1">
                          <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                          <span className="font-medium text-slate-300">Tier {acc.kycTier}</span>
                        </div>
                        <div className="text-[10px] text-slate-500">
                          {acc.kycTier === 3 ? 'Institutional' : acc.kycTier === 2 ? 'Enhanced Corporate' : 'Standard'}
                        </div>
                      </td>

                      <td className="py-3.5 px-4 text-right tabular-nums font-mono font-medium text-white">
                        {acc.currency} {acc.balance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>

                      <td className="py-3.5 px-4 text-right tabular-nums font-mono font-medium">
                        <span className={acc.availableBalance <= 0 ? 'text-amber-400' : 'text-emerald-400'}>
                          {acc.currency} {acc.availableBalance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </span>
                        {acc.holdBalance > 0 && (
                          <div className="text-[10px] text-slate-500 font-mono">
                            Hold: {acc.currency} {acc.holdBalance.toLocaleString('en-US')}
                          </div>
                        )}
                      </td>

                      <td className="py-3.5 px-4">
                        {acc.status === 'active' && (
                          <span className="text-emerald-400 font-medium flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 inline-block" />
                            Active
                          </span>
                        )}
                        {acc.status === 'frozen' && (
                          <span className="text-rose-400 font-medium flex items-center gap-1">
                            <Lock className="w-3.5 h-3.5" />
                            Frozen
                          </span>
                        )}
                        {acc.status === 'restricted' && (
                          <span className="text-amber-400 font-medium flex items-center gap-1">
                            <ShieldAlert className="w-3.5 h-3.5" />
                            Restricted
                          </span>
                        )}
                      </td>

                      <td className="py-3.5 px-4 text-right" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button
                            onClick={() => onOpenDepositModal(acc)}
                            className="px-2 py-1 text-[11px] text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors cursor-pointer flex items-center gap-1"
                            title="Deposit Cash or Check"
                          >
                            <Coins className="w-3 h-3 text-emerald-400" />
                            <span>Deposit</span>
                          </button>

                          <button
                            onClick={() => onOpenTransferWithSource(acc)}
                            className="px-2 py-1 text-[11px] text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors cursor-pointer flex items-center gap-1"
                            title="Initiate Outbound Transfer"
                          >
                            <ArrowUpRight className="w-3 h-3 text-blue-400" />
                            <span>Transfer</span>
                          </button>

                          <button
                            onClick={() => {
                              const newStatus = acc.status === 'frozen' ? 'active' : 'frozen';
                              toggleAccountStatus(
                                acc.id,
                                newStatus,
                                newStatus === 'frozen' ? 'Manual freeze by Operations Officer' : 'Compliance unfreeze authorized'
                              );
                            }}
                            className={`p-1 rounded text-xs transition-colors cursor-pointer ${
                              acc.status === 'frozen'
                                ? 'text-rose-400 hover:bg-rose-950/40'
                                : 'text-slate-500 hover:text-slate-300 hover:bg-slate-800'
                            }`}
                            title={acc.status === 'frozen' ? 'Unfreeze Account' : 'Freeze Account'}
                          >
                            {acc.status === 'frozen' ? <Lock className="w-3.5 h-3.5" /> : <Unlock className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
