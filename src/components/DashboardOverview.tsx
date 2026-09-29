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
import { useLanguage } from '../context/LanguageContext';
import { motion } from 'motion/react';

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
  const { t, language } = useLanguage();
  const locale = language === 'bn' ? 'bn-BD' : 'en-BD';

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
    <motion.div
      className="space-y-6"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
    >
      {/* Top Banner: Headquarters & Operational Context */}
      <motion.div
        className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 p-6"
        initial={{ opacity: 0, scale: 0.985 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4, delay: 0.08 }}
      >
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-medium text-slate-400 mb-1">
              <span>{t('federalReserveAccount')}</span>
              <span aria-hidden="true">·</span>
              <span>{t('fedwireNode')}</span>
              <span aria-hidden="true">·</span>
              <span className="text-emerald-400">{t('allNodesOperational')}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">
              {t('controlCenter')}
            </h1>
            <p className="text-sm text-slate-400 max-w-2xl mt-1">
              {t('controlCenterDescription')}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenTransferModal}
              className="px-4 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>{t('initiateWire')}</span>
            </button>
            <button
              onClick={onOpenNewAccountModal}
              className="px-4 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              {t('openAccount')}
            </button>
          </div>
        </div>

        {/* Subtle decorative background gradient */}
        <div className="absolute top-0 right-0 -mt-8 -mr-8 w-96 h-96 bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />
      </motion.div>

      {/* KPI Cards Grid */}
      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4"
        initial="hidden"
        animate="show"
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.16 } } }}
      >
        {/* Total Deposits */}
        <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} transition={{ duration: 0.3 }} className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>{t('totalDeposits')}</span>
            <Landmark className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-white tabular-nums">
            BDT {totalDepositsUSD.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
            <span className="text-emerald-400 font-medium">+{language === 'bn' ? '৩.৪' : '3.4'}% {t('thisMonth')}</span>
            <span aria-hidden="true">·</span>
            <span>{accounts.length.toLocaleString(locale)} {t('activeAccounts')}</span>
          </div>
        </motion.div>

        {/* Credit Book Portfolio */}
        <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} transition={{ duration: 0.3 }} className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>{t('grossLoanBook')}</span>
            <BadgeDollarSign className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-white tabular-nums">
            BDT {totalLoansBooked.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
            <span className="text-indigo-400 font-medium">{pendingLoanCount.toLocaleString(locale)} {t('inUnderwriting')}</span>
            <span aria-hidden="true">·</span>
            <span>{t('nplRatio')}: {language === 'bn' ? '০.১২' : '0.12'}%</span>
          </div>
        </motion.div>

        {/* Branch Vault & Central Reserve */}
        <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} transition={{ duration: 0.3 }} className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>{t('branchVault')}</span>
            <Vault className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-white tabular-nums">
            BDT {vault.vaultCashUSD.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
            <span className="text-emerald-400 font-medium">LCR: 142%</span>
            <span aria-hidden="true">·</span>
            <span>{t('audited')} {vault.lastAuditedAt.slice(11, 16)}</span>
          </div>
        </motion.div>

        {/* Daily Clearing Volume & Compliance */}
        <motion.div variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }} transition={{ duration: 0.3 }} className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>{t('dailyClearing')}</span>
            <TrendingUp className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-2xl font-bold tracking-tight text-white tabular-nums">
            BDT {dailyVolumeUSD.toLocaleString(locale, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="flex items-center gap-2 mt-2 text-xs text-slate-400">
            {pendingAmlCount > 0 ? (
              <span className="text-amber-400 font-medium flex items-center gap-1">
                <ShieldAlert className="w-3.5 h-3.5" />
                {pendingAmlCount.toLocaleString(locale)} {t('amlAlertsQueued')}
              </span>
            ) : (
              <span className="text-slate-400">{t('zeroExceptions')}</span>
            )}
            <span aria-hidden="true">·</span>
            <span>{transactions.length.toLocaleString(locale)} {t('totalTransactions')}</span>
          </div>
        </motion.div>
      </motion.div>

      {/* Middle Row: Deposit Composition & Core Banking Operations Quick Bar */}
      <motion.div
        className="grid grid-cols-1 lg:grid-cols-3 gap-6"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        {/* Deposit Allocation breakdown */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white tracking-wide">{t('depositStructure')}</h2>
            <button
              onClick={() => onSelectTab('accounts')}
              className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 cursor-pointer"
            >
              <span>{t('manage')}</span>
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
                  <span>{t('escrow')}</span>
                </div>
                <div className="font-semibold text-white tabular-nums">BDT {(escrowSum / 1000000).toFixed(2)}M</div>
                <div className="text-[11px] text-slate-500">{escrowPct}% {t('ofBook')}</div>
              </div>

              <div>
                <div className="flex items-center gap-1.5 text-slate-400 mb-0.5">
                  <span className="w-2 h-2 rounded-full bg-indigo-500 inline-block" />
                  <span>{t('checking')}</span>
                </div>
                <div className="font-semibold text-white tabular-nums">BDT {(checkingSum / 1000000).toFixed(2)}M</div>
                <div className="text-[11px] text-slate-500">{checkingPct}% {t('ofBook')}</div>
              </div>

              <div>
                <div className="flex items-center gap-1.5 text-slate-400 mb-0.5">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                  <span>{t('savings')}</span>
                </div>
                <div className="font-semibold text-white tabular-nums">BDT {(savingsSum / 1000000).toFixed(2)}M</div>
                <div className="text-[11px] text-slate-500">{savingsPct}% {t('ofBook')}</div>
              </div>
            </div>
          </div>

          <div className="mt-5 p-3 rounded-lg bg-slate-950/60 border border-slate-800 text-xs flex items-center justify-between">
            <span className="text-slate-400">{t('reserveRequirement')}:</span>
            <span className="font-mono text-white font-medium">{language === 'bn' ? '১০.০' : '10.0'}% (BDT {(828500).toLocaleString(locale)} {t('reserveHeld')})</span>
          </div>
        </div>

        {/* Operational Routing & Quick Desk */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-white tracking-wide">{t('operationalDesks')}</h2>
            <span className="text-xs text-slate-500">{t('liveServices')}</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <button
              onClick={() => onSelectTab('accounts')}
              className="p-3 text-left rounded-lg bg-slate-950/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/40 transition-all cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-lg bg-blue-500/10 text-blue-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <Building className="w-4 h-4" />
              </div>
              <div className="text-xs font-semibold text-slate-200">{t('accountDirectory')}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">{accounts.length.toLocaleString(locale)} {t('totalAccounts')}</div>
            </button>

            <button
              onClick={() => onSelectTab('loans')}
              className="p-3 text-left rounded-lg bg-slate-950/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/40 transition-all cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <FileCheck2 className="w-4 h-4" />
              </div>
              <div className="text-xs font-semibold text-slate-200">{t('creditUnderwriting')}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">{loans.length.toLocaleString(locale)} {t('facilitiesActive')}</div>
            </button>

            <button
              onClick={() => onSelectTab('compliance')}
              className="p-3 text-left rounded-lg bg-slate-950/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/40 transition-all cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <ShieldAlert className="w-4 h-4" />
              </div>
              <div className="text-xs font-semibold text-slate-200">{t('amlRiskQueue')}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">
                {pendingAmlCount > 0 ? `${pendingAmlCount.toLocaleString(locale)} ${t('actionItems')}` : t('allCleared')}
              </div>
            </button>

            <button
              onClick={() => onSelectTab('cards')}
              className="p-3 text-left rounded-lg bg-slate-950/60 border border-slate-800 hover:border-slate-700 hover:bg-slate-800/40 transition-all cursor-pointer group"
            >
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center mb-2 group-hover:scale-105 transition-transform">
                <CreditCard className="w-4 h-4" />
              </div>
              <div className="text-xs font-semibold text-slate-200">{t('cards')}</div>
              <div className="text-[11px] text-slate-500 mt-0.5">{activeCardsCount.toLocaleString(locale)} {t('issuedCards')}</div>
            </button>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-400">
            <div className="flex items-center gap-4">
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                Fedwire RTGS: {t('instant')}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                SWIFT GPI Tracking: {t('connected')}
              </span>
              <span className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                ACH {t('batchWindow')}: 17:00 EST
              </span>
            </div>
            <button
              onClick={() => onSelectTab('vault')}
              className="text-blue-400 hover:underline cursor-pointer"
            >
              {t('viewVaultRates')} →
            </button>
          </div>
        </div>
      </motion.div>

      {/* Recent Ledger Transactions Feed */}
      <motion.div
        className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden"
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.52 }}
      >
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white tracking-wide">{t('liveJournal')}</h2>
            <p className="text-xs text-slate-400">{t('journalDescription')}</p>
          </div>
          <button
            onClick={() => onSelectTab('transactions')}
            className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1 cursor-pointer"
          >
            <span>{t('fullLedger')}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">{t('reference')}</th>
                <th className="py-3 px-4">{t('accountHolder')}</th>
                <th className="py-3 px-4">{t('counterpartyNode')}</th>
                <th className="py-3 px-4">{t('type')}</th>
                <th className="py-3 px-4 text-right">{t('amount')}</th>
                <th className="py-3 px-4">{t('status')}</th>
                <th className="py-3 px-4 text-right">{t('timestamp')}</th>
                <th className="py-3 px-4 text-center">{t('action')}</th>
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
                        {t('settled')}
                      </span>
                    )}
                    {tx.status === 'flagged' && (
                      <span className="text-amber-400 flex items-center gap-1 font-medium">
                        <ShieldAlert className="w-3.5 h-3.5" />
                        {t('amlFlagged')}
                      </span>
                    )}
                    {tx.status === 'pending' && (
                      <span className="text-blue-400 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {t('clearing')}
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
                      {t('receipt')}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.div>
    </motion.div>
  );
};
