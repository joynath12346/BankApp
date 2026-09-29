import React, { useState } from 'react';
import { Transaction } from '../../types/bank';
import {
  X,
  Printer,
  Copy,
  Check,
  ShieldCheck,
  Building,
  CheckCircle2,
  FileCheck2
} from 'lucide-react';

interface TransactionReceiptModalProps {
  transaction: Transaction;
  onClose: () => void;
}

export const TransactionReceiptModal: React.FC<TransactionReceiptModalProps> = ({
  transaction,
  onClose
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopyRef = () => {
    navigator.clipboard.writeText(transaction.referenceNumber);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/80 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-0.5">
              <span>Federal Reserve Settlement Voucher</span>
              <span aria-hidden="true">·</span>
              <span>Audit Document</span>
            </div>
            <h2 className="text-lg font-bold text-white">Clearing & Settlement Voucher</h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Voucher Paper Styling */}
        <div className="p-6 space-y-6 bg-slate-950/40">
          {/* Bank Seal & Document Header */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-center space-y-1 relative overflow-hidden">
            <div className="text-xs uppercase tracking-widest font-bold text-white">
              BanglaBank
            </div>
            <div className="text-[11px] text-slate-400">
              Interbank Clearing Desk · Federal Reserve District 02
            </div>
            <div className="pt-2 text-xs font-mono text-blue-400 flex items-center justify-center gap-1.5">
              <span>{transaction.referenceNumber}</span>
              <button
                onClick={handleCopyRef}
                className="text-slate-500 hover:text-white cursor-pointer"
                title="Copy Reference"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>

          {/* Amount Badge */}
          <div className="text-center py-2">
            <div className="text-xs uppercase tracking-wider text-slate-400 font-medium">Cleared Amount</div>
            <div className="text-3xl font-extrabold text-white font-mono tabular-nums tracking-tight mt-1">
              {transaction.currency} {transaction.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
            </div>
            <div className="text-[11px] text-slate-500 capitalize mt-0.5">
              Direction: {transaction.direction} flow ({transaction.category})
            </div>
          </div>

          {/* Detailed Ledger Attributes */}
          <div className="space-y-2.5 text-xs">
            <div className="flex justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">Originating Account Holder:</span>
              <span className="font-semibold text-white">{transaction.accountHolderName}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">Originating Account #:</span>
              <span className="font-mono text-slate-200">{transaction.accountNumber}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">Beneficiary / Counterparty:</span>
              <span className="font-semibold text-white">{transaction.counterpartyName}</span>
            </div>

            {transaction.counterpartyBank && (
              <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                <span className="text-slate-400">Counterparty Institution:</span>
                <span className="text-slate-300">{transaction.counterpartyBank}</span>
              </div>
            )}

            <div className="flex justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">Settlement Protocol:</span>
              <span className="font-medium text-slate-200 capitalize">{transaction.type.replace('_', ' ')}</span>
            </div>

            <div className="flex justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">Certified Timestamp:</span>
              <span className="font-mono text-slate-300">{transaction.timestamp}</span>
            </div>

            {transaction.memo && (
              <div className="flex justify-between py-1.5 border-b border-slate-800/80">
                <span className="text-slate-400">Payment Memo:</span>
                <span className="text-slate-300 text-right max-w-xs">{transaction.memo}</span>
              </div>
            )}

            <div className="flex justify-between py-1.5 border-b border-slate-800/80">
              <span className="text-slate-400">Transaction Fee:</span>
              <span className="font-mono text-slate-300">BDT {transaction.fee.toFixed(2)}</span>
            </div>
          </div>

          {/* Compliance Audit Validation Stamp */}
          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-emerald-400" />
              <div>
                <div className="font-semibold text-white">OFAC & BSA Cryptographic Audit Stamp</div>
                <div className="text-[11px] text-slate-500">Node Clearance: Verified Immutable</div>
              </div>
            </div>

            <div className="font-mono text-[11px] text-emerald-400 font-bold">
              STATUS: {transaction.status.toUpperCase()}
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between">
          <button
            onClick={handlePrint}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Printer className="w-4 h-4" />
            <span>Print Voucher</span>
          </button>

          <button
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold transition-colors cursor-pointer"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
