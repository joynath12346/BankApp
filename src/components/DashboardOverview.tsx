import React from 'react';
import { useBank } from '../context/BankContext';
import {
  Landmark,
  BadgeDollarSign,
  ArrowUpRight,
  ArrowDownLeft,
  ShieldAlert,
  CreditCard,
  Building,
  TrendingUp,
  Vault,
  Clock,
  ExternalLink,
  ChevronRight,
  CheckCircle2,
  FileCheck2
} from 'lucide-react';
import { Transaction } from '../types/bank';

interface DashboardOverviewProps {
  onSelectTab: (tab: string) => void;
  onOpenTransferModal: () => void;
  onOpenNewAccountModal: () => void;
  onSelectTransaction: (tx: Transaction) => void;
}

export const DashboardOverview: React.FC<DashboardOverviewProps> = ({
  onSelectTab,
  onOpenTransferModal,
  onOpenNewAccountModal,
  onSelectTransaction
}) => {
  const { accounts, transactions, loans, cards, amlAlerts, vault } = useBank();

  // Financial calculations with tabular accuracy
  const totalDepositsUSD = accounts.reduce((sum, acc) => {
    if (acc.currency === 'USD') return sum + acc.balance;
    if (acc.currency === 'EUR') return sum + acc.balance * 1.085;
    if (acc.currency === 'GBP') return sum + acc.balance * 1.298;
    if (acc.currency === 'JPY') return sum + acc.balance * 0.0067;
    return sum + acc.balance;
  }, 0);

  const totalLoansBooked = loans
    .filter(l => l.status === 'disbursed' || l.status === 'approved')
    .reduce((sum, l) => sum + (l.approvedAmount || l.requestedAmount), 0);

  const pendingLoanCount = loans.filter(l => l.status === 'submitted' || l.status === 'under_review').length;
  const pendingAmlCount = amlAlerts.filter(a => a.status === 'investigating').length;
  const activeCardsCount = cards.filter(c => c.status === 'active').length;

  const dailyVolumeUSD = transactions
    .filter(t => t.timestamp.startsWith('2026-09-29'))
    .reduce((sum, t) => sum + t.amount, 0);

  const recentTransactions = transactions.slice(0, 6);

  // Group deposits by category for composition bar
  const escrowSum = accounts.filter(a => a.type === 'treasury_escrow').reduce((s, a) => s + a.balance, 0);
  const checkingSum = accounts.filter(a => a.type === 'checking' || a.type === 'business_checking').reduce((s, a) => s + a.balance, 0);
  const savingsSum = accounts.filter(a => a.type === 'savings' || a.type === 'money_market').reduce((s, a) => s + a.balance, 0);

  const escrowPct = Math.round((escrowSum / (totalDepositsUSD || 1)) * 100);
  const checkingPct = Math.round((checkingSum / (totalDepositsUSD || 1)) * 100);
  const savingsPct = 100 - escrowPct - checkingPct;

  return (
    <div className="space-y-6">
      {/* Top Banner: Headquarters & Operational Context */}
      <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-1">
              <span>Federal Reserve Master Account #021000089</span>
              <span aria-hidden="true">·</span>
              <span>Fedwire Node NY-PRIMARY</span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-400">All Nodes Operational</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              Branch & Treasury Control Center
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl mt-1">
              Real-time core ledger monitoring for New York Flagship (NYC-01), commercial credit underwriting, interbank wire settlements, and compliance risk surveillance.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenTransferModal}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Initiate Wire Transfer</span>
            </button>
            <button
              onClick={onOpenNewAccountModal}
              className="px-4 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              Open Account
            </button>
          </div>
        </div>

        {/* Subtle decorative background gradient */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Deposits */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Total Customer Deposits</span>
            <Landmark className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-white tabular-nums">
            ${totalDepositsUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
            <span className="text-emerald-400 font-medium">+3.4% this month</span>
            <span aria-hidden="true">·</span>
            <span>{accounts.length} active accounts</span>
          </div>
        </div>

        {/* Credit Book Portfolio */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Gross Loan Book Booked</span>
            <BadgeDollarSign className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-white tabular-nums">
            ${totalLoansBooked.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
            <span className="text-indigo-400 font-medium">{pendingLoanCount} in underwriting</span>
            <span aria-hidden="true">·</span>
            <span>NPL Ratio: 0.12%</span>
          </div>
        </div>

        {/* Branch Vault & Central Reserve */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Branch Physical Vault</span>
            <Vault className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-white tabular-nums">
            ${vault.vaultCashUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
            <span className="text-emerald-400 font-medium">LCR: 142%</span>
            <span aria-hidden="true">·</span>
            <span>Audited {vault.lastAuditedAt.slice(11, 16)}</span>
          </div>
        </div>

        {/* Daily Clearing Volume & Compliance */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Daily Clearing Volume</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-white tabular-nums">
            ${dailyVolumeUSD.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
            {pendingAmlCount > 0 ? (
              <span className="text-amber-400 font-medium flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                {pendingAmlCount} AML alerts queued
              </span>
            ) : (
              <span className="text-slate-400">Zero flagged exceptions</span>
            )}
            <span aria-hidden="true">·</span>
            <span>{transactions.length} total txns</span>
          </div>
        </div>
      </div>

      {/* Middle Row: Deposit Composition & Core Banking Operations Quick Bar */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Deposit Allocation breakdown */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white tracking-wide">Deposit Structure</h2>
            <button
              onClick={() => onSelectTab('accounts')}
              className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 cursor-pointer"
            >
              <span>Manage</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="space-y-4">
            {/* Visual ratio bar */}
            <div className="w-full h-3 bg-slate-800 rounded-full overflow-hidden flex">
              <div style={{ width: `${escrowPct}%` }} className="bg-blue-500 h-full" title={`Escrow: ${escrowPct}%`} />
              <div style={{ width: `${checkingPct}%` }} className="bg-indigo-500 h-full" title={`Operating: ${checkingPct}%`} />
              <div style={{ width: `${savingsPct}%` }} className="bg-emerald-500 h-full" title={`Yield: ${savingsPct}%`} />
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-xs">
              <div>
                <div className="flex items-center gap-1.5 text-slate-400 mb-0.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500 inline-block" />
                  <span>Escrow</span>
                </div>
                <div className="font-semibold text-white tabular-nums">${(escrowSum / 1000000).toFixed(2)}M</div>
                <div className="text-[11px] text-slate-500">{escrowPct}% of book</div>
              </div>

              <div>
                <div className="flex items-center gap-1.5 text-slate-400 mb-0.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
                  <span>Checking</span>
                </div>
                <div className="font-semibold text-white tabular-nums">${(checkingSum / 1000000).toFixed(2)}M</div>
                <div className="text-[11px] text-slate-500">{checkingPct}% of book</div>
              </div>

              <div>
                <div className="flex items-center gap-1.5 text-slate-400 mb-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                  <span>Savings</span>
                </div>
                <div className="font-semibold text-white tabular-nums">${(savingsSum / 1000000).toFixed(2)}M</div>
                <div className="text-[11px] text-slate-500">{savingsPct}% of book</div>
              </div>
            </div>
          </div>

          <div className="mt-5 p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs flex items-center justify-between">
            <span className="text-slate-400">Statutory Reserve Requirement:</span>
            <span className="font-mono text-white font-medium">10.0% ($828,500 held at Fed)</span>
          </div>
        </div>

        {/* Operational Routing & Quick Desk */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white tracking-wide">Banking Operational Desks</h2>
            <span className="text-xs text-slate-500">Live Services</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              onClick={() => onSelectTab('accounts')}
              className="p-3 text-left rounded-lg bg-slate-950/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/40 transition-all cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <Building className="w-4 h-4" />
              </div>
              <div className="text-xs font-semibold text-slate-200">Account Directory</div>
              <div className="text-[11px] text-slate-500 mt-0.5">{accounts.length} Total Accounts</div>
            </button>

            <button
              onClick={() => onSelectTab('loans')}
              className="p-3 text-left rounded-lg bg-slate-950/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/40 transition-all cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <FileCheck2 className="w-4 h-4" />
              </div>
              <div className="text-xs font-semibold text-slate-200">Credit Underwriting</div>
              <div className="text-[11px] text-slate-500 mt-0.5">{loans.length} Facilities Active</div>
            </button>

            <button
              onClick={() => onSelectTab('compliance')}
              className="p-3 text-left rounded-lg bg-slate-950/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/40 transition-all cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div className="text-xs font-semibold text-slate-200">AML Risk Queue</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {pendingAmlCount > 0 ? `${pendingAmlCount} Action Items` : 'All Cleared'}
              </div>
            </button>

            <button
              onClick={() => onSelectTab('cards')}
              className="p-3 text-left rounded-lg bg-slate-950/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/40 transition-all cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <CreditCard className="w-4 h-4" />
              </div>
              <div className="text-xs font-semibold text-slate-200">Card Fleet</div>
              <div className="text-[11px] text-slate-500 mt-0.5">{activeCardsCount} Issued Cards</div>
            </button>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Fedwire RTGS: Instant
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                SWIFT GPI Tracking: Connected
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                ACH Batch Window: 17:00 EST
              </span>
            </div>
            <button
              onClick={() => onSelectTab('vault')}
              className="text-blue-400 hover:underline cursor-pointer"
            >
              View Vault & FX Rates →
            </button>
          </div>
        </div>
      </div>

      {/* Recent Ledger Transactions Feed */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white tracking-wide">Live Transaction Journal</h2>
            <p className="text-xs text-slate-400">Recent interbank clearings, wires, and internal book transfers</p>
          </div>
          <button
            onClick={() => onSelectTab('transactions')}
            className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 cursor-pointer"
          >
            <span>Full Ledger</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Reference</th>
                <th className="py-3 px-4">Account & Holder</th>
                <th className="py-3 px-4">Counterparty / Clearing Node</th>
                <th className="py-3 px-4">Type</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Timestamp</th>
                <th className="py-3 px-4 text-center">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {recentTransactions.map(tx => (
                <tr key={tx.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-[11px] text-slate-300 font-medium">
                    {tx.referenceNumber}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="font-medium text-white">{tx.accountHolderName}</div>
                    <div className="font-mono text-[11px] text-slate-500">{tx.accountNumber}</div>
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="text-slate-200">{tx.counterpartyName}</div>
                    {tx.counterpartyBank && (
                      <div className="text-[11px] text-slate-500">{tx.counterpartyBank}</div>
                    )}
                  </td>
                  <td className="py-3.5 px-4">
                    <span className="text-slate-300">{tx.category}</span>
                  </td>
                  <td className="py-3.5 px-4 text-right tabular-nums font-mono font-medium">
                    <span className={tx.direction === 'credit' ? 'text-emerald-400' : 'text-slate-200'}>
                      {tx.direction === 'credit' ? '+' : '-'}
                      {tx.currency} {tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                  </td>
                  <td className="py-3.5 px-4">
                    {tx.status === 'settled' && (
                      <span className="text-emerald-400 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Settled
                      </span>
                    )}
                    {tx.status === 'flagged' && (
                      <span className="text-amber-400 flex items-center gap-1 font-medium">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        AML Flagged
                      </span>
                    )}
                    {tx.status === 'pending' && (
                      <span className="text-blue-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        Clearing
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono text-[11px] text-slate-500">
                    {tx.timestamp}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={() => onSelectTransaction(tx)}
                      className="px-2 py-1 text-[11px] text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors cursor-pointer"
                    >
                      Receipt
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
