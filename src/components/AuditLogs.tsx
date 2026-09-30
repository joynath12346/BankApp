import React, { useMemo, useState } from 'react';
import { Download, FileText, History, Search } from 'lucide-react';
import { useBank } from '../context/BankContext';
import { useLanguage } from '../context/LanguageContext';

type AuditEntry = { id: string; timestamp: string; actor: string; action: string; resource: string; status: string; amount?: number };

export const AuditLogs: React.FC = () => {
  const { transactions, loans } = useBank();
  const { language } = useLanguage();
  const [query, setQuery] = useState('');
  const locale = language === 'bn' ? 'bn-BD' : 'en-US';
  const money = (value: number) => `BDT ${value.toLocaleString(locale, { maximumFractionDigits: 0 })}`;

  const entries = useMemo<AuditEntry[]>(() => {
    const transactionEntries = transactions.map(tx => ({
      id: `tx-${tx.id}`, timestamp: tx.timestamp, actor: tx.accountHolderName || 'System',
      action: tx.type.replaceAll('_', ' '), resource: tx.referenceNumber, status: tx.status, amount: tx.amount
    }));
    const loanEntries = loans.map(loan => ({
      id: `loan-${loan.id}`, timestamp: loan.createdAt, actor: loan.applicantName || 'System',
      action: `loan ${loan.status.replaceAll('_', ' ')}`, resource: loan.loanNumber, status: loan.status, amount: loan.approvedAmount || loan.requestedAmount
    }));
    return [...transactionEntries, ...loanEntries].sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }, [loans, transactions]);

  const filtered = entries.filter(entry => `${entry.actor} ${entry.action} ${entry.resource} ${entry.status}`.toLowerCase().includes(query.toLowerCase()));
  const exportCsv = () => {
    const rows = [['timestamp', 'actor', 'action', 'resource', 'status', 'amount'], ...filtered.map(row => [row.timestamp, row.actor, row.action, row.resource, row.status, row.amount ? row.amount.toFixed(2) : ''])];
    const url = URL.createObjectURL(new Blob([rows.map(row => row.map(value => `"${value.replaceAll('"', '""')}"`).join(',')).join('\n')], { type: 'text/csv;charset=utf-8' }));
    const anchor = document.createElement('a'); anchor.href = url; anchor.download = 'banglabank-audit-logs.csv'; anchor.click(); URL.revokeObjectURL(url);
  };

  return <section className="space-y-6 print:bg-white print:text-black">
    <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div><p className="text-xs uppercase tracking-[0.2em] text-blue-400">Governance / Control</p><h1 className="mt-1 text-2xl font-bold text-white print:text-black">Audit Logs</h1><p className="mt-1 text-sm text-slate-400">Traceable activity across transactions and lending decisions.</p></div>
      <div className="flex gap-2 print:hidden"><button onClick={exportCsv} className="inline-flex items-center gap-2 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-xs font-semibold text-slate-200 hover:border-blue-500"><Download className="h-4 w-4" /> Export CSV</button><button onClick={() => window.print()} className="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-xs font-semibold text-white hover:bg-blue-500"><FileText className="h-4 w-4" /> Export PDF</button></div>
    </div>
    <div className="rounded-xl border border-slate-800 bg-slate-900/80 p-4"><div className="mb-4 flex items-center justify-between"><div className="flex items-center gap-2 text-sm font-semibold text-white"><History className="h-4 w-4 text-blue-400" /> Activity timeline <span className="text-xs font-normal text-slate-500">{filtered.length} events</span></div><div className="relative"><Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-slate-500" /><input value={query} onChange={event => setQuery(event.target.value)} placeholder="Filter audit events" className="rounded-lg border border-slate-700 bg-slate-950 py-2 pl-9 pr-3 text-xs text-white outline-none focus:border-blue-500" /></div></div><div className="overflow-x-auto"><table className="w-full text-left text-xs"><thead className="border-b border-slate-800 text-[10px] uppercase tracking-wider text-slate-500"><tr><th className="px-3 py-3">Time</th><th className="px-3 py-3">Actor</th><th className="px-3 py-3">Action</th><th className="px-3 py-3">Resource</th><th className="px-3 py-3">Status</th><th className="px-3 py-3 text-right">Amount</th></tr></thead><tbody className="divide-y divide-slate-800/70">{filtered.map(entry => <tr key={entry.id} className="text-slate-300"><td className="whitespace-nowrap px-3 py-3 font-mono text-slate-500">{new Date(entry.timestamp).toLocaleString(locale, { dateStyle: 'medium', timeStyle: 'short' })}</td><td className="px-3 py-3 font-medium text-white">{entry.actor}</td><td className="px-3 py-3 capitalize">{entry.action}</td><td className="px-3 py-3 font-mono text-blue-300">{entry.resource}</td><td className="px-3 py-3"><span className="rounded-full bg-emerald-500/10 px-2 py-1 capitalize text-emerald-300">{entry.status}</span></td><td className="px-3 py-3 text-right">{entry.amount ? money(entry.amount) : '—'}</td></tr>)}</tbody></table>{filtered.length === 0 && <p className="py-8 text-center text-sm text-slate-500">No audit events match this filter.</p>}</div></div>
  </section>;
};
