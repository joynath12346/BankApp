import React, { useState } from 'react';
import { useBank } from '../../context/BankContext';
import { BankAccount } from '../../types/bank';
import { X, Coins, ArrowDownLeft, ArrowUpRight, CheckCircle2, AlertCircle } from 'lucide-react';

interface DepositWithdrawModalProps {
  account: BankAccount;
  defaultMode?: 'deposit' | 'withdraw';
  onClose: () => void;
}

export const DepositWithdrawModal: React.FC<DepositWithdrawModalProps> = ({
  account,
  defaultMode = 'deposit',
  onClose
}) => {
  const { depositFunds, withdrawFunds } = useBank();
  const [mode, setMode] = useState<'deposit' | 'withdraw'>(defaultMode);
  const [amount, setAmount] = useState<string>('5000');
  const [method, setMethod] = useState<string>('Cash Counter Deposit');
  const [memo, setMemo] = useState<string>('Standard branch counter transaction');
  const [statusMsg, setStatusMsg] = useState<{ type: 'error' | 'success'; text: string } | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const num = parseFloat(amount);
    if (isNaN(num) || num <= 0) {
      setStatusMsg({ type: 'error', text: 'Enter a valid amount.' });
      return;
    }

    if (mode === 'deposit') {
      const ok = depositFunds(account.id, num, `${method}: ${memo}`);
      if (ok) {
        setStatusMsg({ type: 'success', text: `Successfully deposited $${num.toLocaleString()} to account.` });
        setTimeout(() => onClose(), 1500);
      } else {
        setStatusMsg({ type: 'error', text: 'Deposit failed. Account might be frozen.' });
      }
    } else {
      const res = withdrawFunds(account.id, num, `${method}: ${memo}`);
      if (res.success) {
        setStatusMsg({ type: 'success', text: `Successfully processed withdrawal of $${num.toLocaleString()}.` });
        setTimeout(() => onClose(), 1500);
      } else {
        setStatusMsg({ type: 'error', text: res.message || 'Withdrawal rejected.' });
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-0.5">
              <span>Teller Operations Desk</span>
              <span aria-hidden="true">·</span>
              <span>{account.accountNumber}</span>
            </div>
            <h2 className="text-lg font-bold text-white">
              {mode === 'deposit' ? 'Cash & Check Deposit' : 'Cash Withdrawal'}
            </h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch between deposit & withdrawal */}
        <div className="flex border-b border-slate-800 bg-slate-950/50">
          <button
            type="button"
            onClick={() => setMode('deposit')}
            className={`flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              mode === 'deposit'
                ? 'text-emerald-400 border-b-2 border-emerald-500 bg-emerald-500/5'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowDownLeft className="w-4 h-4" />
            <span>Deposit Funds</span>
          </button>

          <button
            type="button"
            onClick={() => setMode('withdraw')}
            className={`flex-1 py-2.5 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer ${
              mode === 'withdraw'
                ? 'text-blue-400 border-b-2 border-blue-500 bg-blue-500/5'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Cash Withdrawal</span>
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {statusMsg && (
            <div
              className={`p-3 rounded-lg text-xs font-medium flex items-center gap-2 ${
                statusMsg.type === 'success'
                  ? 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-300'
                  : 'bg-rose-500/10 border border-rose-500/30 text-rose-300'
              }`}
            >
              {statusMsg.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              )}
              <span>{statusMsg.text}</span>
            </div>
          )}

          {/* Account snapshot */}
          <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 text-xs flex items-center justify-between">
            <div>
              <div className="font-semibold text-white">{account.accountHolderName}</div>
              <div className="text-[11px] text-slate-500 font-mono">{account.accountNumber}</div>
            </div>
            <div className="text-right">
              <div className="text-slate-400 text-[10px]">Available Balance</div>
              <div className="font-mono font-bold text-emerald-400 tabular-nums">
                ${account.availableBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">
              Amount ({account.currency})
            </label>
            <input
              type="number"
              step="0.01"
              min="1"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white font-mono focus:outline-none focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Method / Verification</label>
            <select
              value={method}
              onChange={e => setMethod(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none cursor-pointer"
            >
              {mode === 'deposit' ? (
                <>
                  <option value="Cash Counter Deposit">Teller Physical Cash Counter</option>
                  <option value="Certified Cashiers Check">Certified Cashier's Check</option>
                  <option value="ACH Merchant Settlement">ACH Direct Settlement</option>
                  <option value="Wire Transfer Credit">Inbound Wire Credit</option>
                </>
              ) : (
                <>
                  <option value="Teller Cash Payout">Teller Counter Cash Payout</option>
                  <option value="Official Cashiers Check Issued">Issue Official Cashier's Check</option>
                  <option value="ATM Cash Dispensation">Branch ATM Cash Dispensation</option>
                </>
              )}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Audit Memo</label>
            <input
              type="text"
              value={memo}
              onChange={e => setMemo(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          <button
            type="submit"
            className={`w-full py-2.5 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer ${
              mode === 'deposit'
                ? 'bg-emerald-600 hover:bg-emerald-500'
                : 'bg-blue-600 hover:bg-blue-500'
            }`}
          >
            {mode === 'deposit' ? 'Complete Cash Deposit' : 'Authorize Cash Withdrawal'}
          </button>
        </form>
      </div>
    </div>
  );
};
