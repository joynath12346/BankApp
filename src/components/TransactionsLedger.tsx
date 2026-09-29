import React, { useState, useMemo } from 'react';
import { useBank } from '../context/BankContext';
import { Transaction, TransactionType, TransactionStatus } from '../types/bank';
import {
  Search,
  ArrowUpRight,
  ArrowDownLeft,
  CheckCircle2,
  Clock,
  ShieldAlert,
  Download,
  Filter,
  Receipt,
  Building2,
  ExternalLink
} from 'lucide-react';

interface TransactionsLedgerProps {
  onOpenTransferModal: () => void;
  onSelectTransaction: (tx: Transaction) => void;
}

export const TransactionsLedger: React.FC<TransactionsLedgerProps> = ({
  onOpenTransferModal,
  onSelectTransaction
}) => {
  const { transactions } = useBank();
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [directionFilter, setDirectionFilter] = useState<string>('all');

  const filteredTransactions = useMemo(() => {
    return transactions.filter(tx => {
      const matchesSearch =
        tx.referenceNumber.toLowerCase().includes(search.toLowerCase()) ||
        tx.accountHolderName.toLowerCase().includes(search.toLowerCase()) ||
        tx.accountNumber.toLowerCase().includes(search.toLowerCase()) ||
        tx.counterpartyName.toLowerCase().includes(search.toLowerCase()) ||
        (tx.memo && tx.memo.toLowerCase().includes(search.toLowerCase()));

      const matchesType = typeFilter === 'all' || tx.type === typeFilter;
      const matchesStatus = statusFilter === 'all' || tx.status === statusFilter;
      const matchesDir = directionFilter === 'all' || tx.direction === directionFilter;

      return matchesSearch && matchesType && matchesStatus && matchesDir;
    });
  }, [transactions, search, typeFilter, statusFilter, directionFilter]);

  const totalSettledVolume = filteredTransactions
    .filter(t => t.status === 'settled')
    .reduce((s, t) => s + t.amount, 0);

  const flaggedCount = transactions.filter(t => t.status === 'flagged').length;

  const exportCSV = () => {
    const headers = 'Reference,Account Holder,Account Number,Counterparty,Type,Amount,Currency,Direction,Status,Timestamp\n';
    const rows = filteredTransactions
      .map(t =>
        `"${t.referenceNumber}","${t.accountHolderName}","${t.accountNumber}","${t.counterpartyName}","${t.category}",${t.amount},"${t.currency}","${t.direction}","${t.status}","${t.timestamp}"`
      )
      .join('\n');
    const blob = new Blob([headers + rows], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Aegis_Bank_Clearing_Ledger_${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span>Interbank Clearing & Settlement Journal</span>
            <span aria-hidden="true">·</span>
            <span>Fedwire / SWIFT / Automated Clearing House</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">Central Ledger & Transfers</h1>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCSV}
            className="px-3 py-2 text-xs font-medium text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export CSV</span>
          </button>
          <button
            onClick={onOpenTransferModal}
            className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm shadow-blue-500/10"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Initiate Transfer</span>
          </button>
        </div>
      </div>

      {/* Metric Highlights */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800">
          <div className="text-[11px] text-slate-400">Total Filtered Volume</div>
          <div className="text-xl font-bold text-white font-mono tabular-nums mt-1">
            ${totalSettledVolume.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800">
          <div className="text-[11px] text-slate-400">Total Transactions</div>
          <div className="text-xl font-bold text-slate-200 font-mono tabular-nums mt-1">
            {filteredTransactions.length}
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800">
          <div className="text-[11px] text-slate-400">Settled Ratio</div>
          <div className="text-xl font-bold text-emerald-400 font-mono tabular-nums mt-1">
            {Math.round(((transactions.filter(t => t.status === 'settled').length) / (transactions.length || 1)) * 100)}%
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800">
          <div className="text-[11px] text-slate-400">AML Exceptions</div>
          <div className="text-xl font-bold text-amber-400 font-mono tabular-nums mt-1">
            {flaggedCount} Flagged
          </div>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search by reference #, counterparty, sender account, or memo..."
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={e => setTypeFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="all">All Channels</option>
            <option value="wire_clearing">Wire Clearing (Fed/SWIFT)</option>
            <option value="ach_debit">ACH Clearing</option>
            <option value="internal_transfer">Book Transfers</option>
            <option value="deposit">Deposits</option>
            <option value="withdrawal">Withdrawals</option>
            <option value="card_pos">Card POS</option>
            <option value="loan_disbursement">Credit Disbursements</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="settled">Settled</option>
            <option value="pending">Pending</option>
            <option value="flagged">AML Flagged</option>
          </select>

          {/* Direction Filter */}
          <select
            value={directionFilter}
            onChange={e => setDirectionFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="all">All Flows</option>
            <option value="credit">Credits In (+)</option>
            <option value="debit">Debits Out (-)</option>
          </select>
        </div>
      </div>

      {/* Ledger Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Reference & Clearing Time</th>
                <th className="py-3 px-4">Originating Account</th>
                <th className="py-3 px-4">Counterparty / Clearing Node</th>
                <th className="py-3 px-4">Channel / Category</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4">Status & AML</th>
                <th className="py-3 px-4 text-center">Receipt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-slate-400">
                    <p className="text-sm font-medium">No ledger transactions match the filter criteria.</p>
                  </td>
                </tr>
              ) : (
                filteredTransactions.map(tx => (
                  <tr
                    key={tx.id}
                    onClick={() => onSelectTransaction(tx)}
                    className="hover:bg-slate-800/30 transition-colors cursor-pointer group"
                  >
                    <td className="py-3.5 px-4 font-mono text-[11px]">
                      <div className="font-semibold text-white">{tx.referenceNumber}</div>
                      <div className="text-[10px] text-slate-500">{tx.timestamp}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-200">{tx.accountHolderName}</div>
                      <div className="font-mono text-[11px] text-slate-500">{tx.accountNumber}</div>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-white font-medium">{tx.counterpartyName}</div>
                      {tx.counterpartyBank && (
                        <div className="text-[11px] text-slate-400">{tx.counterpartyBank}</div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="text-slate-300 font-medium">{tx.category}</div>
                      {tx.memo && (
                        <div className="text-[11px] text-slate-500 truncate max-w-xs">{tx.memo}</div>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-right tabular-nums font-mono font-medium">
                      <span className={tx.direction === 'credit' ? 'text-emerald-400' : 'text-slate-200'}>
                        {tx.direction === 'credit' ? '+' : '-'}
                        {tx.currency} {tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      </span>
                      {tx.fee > 0 && (
                        <div className="text-[10px] text-slate-500">Fee: ${tx.fee.toFixed(2)}</div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      {tx.status === 'settled' && (
                        <span className="text-emerald-400 flex items-center gap-1 font-medium">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Settled
                        </span>
                      )}
                      {tx.status === 'flagged' && (
                        <span className="text-amber-400 flex items-center gap-1 font-medium" title={tx.amlNotes}>
                          <ShieldAlert className="w-3.5 h-3.5" />
                          AML Exception
                        </span>
                      )}
                      {tx.status === 'pending' && (
                        <span className="text-blue-400 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5" />
                          Clearing
                        </span>
                      )}
                    </td>

                    <td className="py-3.5 px-4 text-center" onClick={e => e.stopPropagation()}>
                      <button
                        onClick={() => onSelectTransaction(tx)}
                        className="px-2 py-1 text-[11px] text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-700 rounded transition-colors cursor-pointer flex items-center gap-1 mx-auto"
                      >
                        <Receipt className="w-3 h-3 text-blue-400" />
                        <span>Voucher</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
