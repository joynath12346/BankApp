import React, { useMemo } from 'react';
import { BarChart3, Download, FileText, TrendingUp } from 'lucide-react';
import { useBank } from '../context/BankContext';
import { useLanguage } from '../context/LanguageContext';

const money = (value: number) => `BDT ${value.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;

export const ReportsAnalytics: React.FC = () => {
  const { accounts, transactions, loans } = useBank();
  const { language } = useLanguage();
  const locale = language === 'bn' ? 'bn-BD' : 'en-US';

  const daily = useMemo(() => {
    const grouped = new Map<string, { credits: number; debits: number; count: number }>();
    transactions.forEach(tx => {
      const day = tx.timestamp.slice(0, 10);
      const row = grouped.get(day) || { credits: 0, debits: 0, count: 0 };
      tx.direction === 'credit' ? (row.credits += tx.amount) : (row.debits += tx.amount);
      row.count += 1;
      grouped.set(day, row);
    });
    return [...grouped.entries()].sort(([a], [b]) => b.localeCompare(a)).slice(0, 7);
  }, [transactions]);

  const loanSummary = useMemo(() => {
    const statuses = ['submitted', 'under_review', 'approved', 'disbursed', 'repaid', 'rejected'] as const;
    return statuses.map(status => ({
      status,
      count: loans.filter(loan => loan.status === status).length,
      amount: loans.filter(loan => loan.status === status).reduce((sum, loan) => sum + (loan.approvedAmount || loan.requestedAmount), 0)
    })).filter(row => row.count > 0);
  }, [loans]);

  const deposits = useMemo(() => {
    const total = accounts.reduce((sum, account) => sum + account.balance, 0);
    const months = [...Array(6)].map((_, index) => {
      const month = new Date();
      month.setMonth(month.getMonth() - (5 - index));
      const prefix = month.toISOString().slice(0, 7);
      const net = transactions.filter(tx => tx.timestamp.startsWith(prefix)).reduce((sum, tx) => sum + (tx.direction === 'credit' ? tx.amount : -tx.amount), 0);
      return { label: month.toLocaleDateString(locale, { month: 'short' }), value: Math.max(0, total - net * (5 - index)) };
    });
    return months;
  }, [accounts, transactions, locale]);

  const downloadCsv = () => {
    const rows = [['date', 'credits', 'debits', 'transactions'], ...daily.map(([date, row]) => [date, row.credits.toFixed(2), row.debits.toFixed(2), String(row.count)])];
    const blob = new Blob([rows.map(row => row.join(',')).join('\n')], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'banglabank-daily-transactions.csv';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const printPdf = () => window.print();
  const maxLoan = Math.max(...loanSummary.map(row => row.amount), 1);
  const maxDeposit = Math.max(...deposits.map(row => row.value), 1);

  return (
    <section className="space-y-6 print:bg-white print:text-black" aria-label="Reports and analytics">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-blue-400">Control Center / Intelligence</p>
          <h1 className="mt-1 text-2xl font-bold text-white print:text-black">Reports &amp; Analytics</h1>
          <p className="mt-1 text-sm text-slate-400">Daily movement, credit performance, and deposit growth at a glance.</p>
        </div>
        <div className="flex gap-2 print:hidden">
          <button onClick={downloadCsv} className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-blue-500"><Download className="h-4 w-4" /> Export CSV</button>
          <button onClick={printPdf} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-500"><FileText className="h-4 w-4" /> Export PDF</button>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <article className="rounded-xl border border-slate-800 bg-slate-900/80 p-5">
          <div className="mb-4 flex items-center justify-between"><div><h2 className="font-semibold text-white">Daily transaction report</h2><p className="text-xs text-slate-500">Last seven active days</p></div><BarChart3 className="h-5 w-5 text-blue-400" /></div>
          <div className="space-y-3">{daily.length === 0 && <p className="text-sm text-slate-500">No transaction data available.</p>}{daily.map(([date, row]) => <div key={date} className="grid grid-cols-[80px_1fr_92px] items-center gap-3 text-xs"><span className="font-mono text-slate-400">{date.slice(5)}</span><div className="h-2 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-blue-500" style={{ width: `${Math.min(100, (row.credits / Math.max(row.credits, row.debits, 1)) * 100)}%` }} /></div><span className="text-right text-slate-300">{row.count} txns</span></div>)}</div>
          <div className="mt-4 flex gap-5 text-xs text-slate-400"><span>Credits <b className="text-emerald-400">{money(daily.reduce((sum, [, row]) => sum + row.credits, 0))}</b></span><span>Debits <b className="text-amber-300">{money(daily.reduce((sum, [, row]) => sum + row.debits, 0))}</b></span></div>
        </article>

        <article className="rounded-xl border border-slate-800 bg-slate-900/80 p-5">
          <div className="mb-4 flex items-center justify-between"><div><h2 className="font-semibold text-white">Loan performance</h2><p className="text-xs text-slate-500">Portfolio by lifecycle stage</p></div><TrendingUp className="h-5 w-5 text-emerald-400" /></div>
          <div className="space-y-3">{loanSummary.map(row => <div key={row.status} className="grid grid-cols-[105px_1fr_82px] items-center gap-3 text-xs"><span className="capitalize text-slate-400">{row.status.replace('_', ' ')}</span><div className="h-2 overflow-hidden rounded-full bg-slate-800"><div className="h-full rounded-full bg-emerald-500" style={{ width: `${(row.amount / maxLoan) * 100}%` }} /></div><span className="text-right text-slate-300">{money(row.amount)}</span></div>)}</div>
          <p className="mt-4 text-xs text-slate-500">{loans.length} facilities · {money(loans.reduce((sum, loan) => sum + loan.remainingBalance, 0))} outstanding</p>
        </article>

        <article className="rounded-xl border border-slate-800 bg-slate-900/80 p-5 lg:col-span-2">
          <div className="mb-4 flex items-center justify-between"><div><h2 className="font-semibold text-white">Deposit growth trend</h2><p className="text-xs text-slate-500">Estimated balance trend from ledger activity</p></div><span className="text-sm font-semibold text-blue-300">{money(accounts.reduce((sum, account) => sum + account.balance, 0))} current</span></div>
          <div className="flex h-44 items-end gap-3">{deposits.map(point => <div key={point.label} className="flex flex-1 flex-col items-center gap-2"><div className="w-full rounded-t-md bg-gradient-to-t from-blue-700 to-cyan-400 transition-all" style={{ height: `${Math.max(8, (point.value / maxDeposit) * 100)}%` }} title={money(point.value)} /><span className="text-xs text-slate-500">{point.label}</span></div>)}</div>
        </article>
      </div>
    </section>
  );
};
