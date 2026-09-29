import React, { useState } from 'react';
import { useBank } from '../context/BankContext';
import { BankAccount, Transaction } from '../types/bank';
import {
  X,
  CreditCard,
  Lock,
  Unlock,
  Coins,
  ArrowUpRight,
  ShieldCheck,
  ShieldAlert,
  Clock,
  CheckCircle2,
  FileText,
  DollarSign,
  AlertCircle
} from 'lucide-react';

interface AccountDetailDrawerProps {
  account: BankAccount;
  onClose: () => void;
  onOpenDeposit: () => void;
  onOpenTransfer: () => void;
  onOpenNewCard: () => void;
  onSelectTransaction: (tx: Transaction) => void;
}

export const AccountDetailDrawer: React.FC<AccountDetailDrawerProps> = ({
  account,
  onClose,
  onOpenDeposit,
  onOpenTransfer,
  onOpenNewCard,
  onSelectTransaction
}) => {
  const {
    transactions,
    cards,
    toggleAccountStatus,
    updateAccountOverdraft,
    applyAccountHold,
    releaseAccountHold,
    toggleCardLock
  } = useBank();

  const [holdAmountInput, setHoldAmountInput] = useState('');
  const [holdReasonInput, setHoldReasonInput] = useState('');
  const [showHoldForm, setShowHoldForm] = useState(false);
  const [overdraftInput, setOverdraftInput] = useState(account.overdraftLimit.toString());
  const [isEditingOverdraft, setIsEditingOverdraft] = useState(false);

  // Account specific transactions & cards
  const accountTransactions = transactions.filter(
    t => t.accountId === account.id || t.targetAccountId === account.id
  );
  const accountCards = cards.filter(c => c.accountId === account.id);

  const handleApplyHold = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(holdAmountInput);
    if (!isNaN(amt) && amt > 0 && holdReasonInput.trim()) {
      applyAccountHold(account.id, amt, holdReasonInput.trim());
      setHoldAmountInput('');
      setHoldReasonInput('');
      setShowHoldForm(false);
    }
  };

  const handleSaveOverdraft = () => {
    const val = parseFloat(overdraftInput);
    if (!isNaN(val) && val >= 0) {
      updateAccountOverdraft(account.id, val);
      setIsEditingOverdraft(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-slate-950/70 backdrop-blur-xs flex justify-end">
      <div className="w-full max-w-2xl bg-slate-900 border-l border-slate-800 h-full overflow-y-auto flex flex-col shadow-2xl">
        {/* Drawer Header */}
        <div className="p-6 border-b border-slate-800 flex items-start justify-between bg-slate-950/40">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
              <span className="font-mono">{account.accountNumber}</span>
              <span aria-hidden="true">·</span>
              <span>Routing: {account.routingNumber}</span>
              <span aria-hidden="true">·</span>
              <span>SWIFT: {account.swiftBic}</span>
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">{account.accountHolderName}</h2>
            {account.companyName && (
              <p className="text-xs text-slate-400 font-medium">{account.companyName}</p>
            )}
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 flex-1">
          {/* Status & Compliance Banner */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-xs">
            <div className="flex items-center gap-2">
              <span className="text-slate-400">Account Standing:</span>
              {account.status === 'active' && (
                <span className="text-emerald-400 font-semibold flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-emerald-400" /> Active & Unrestricted
                </span>
              )}
              {account.status === 'frozen' && (
                <span className="text-rose-400 font-semibold flex items-center gap-1">
                  <Lock className="w-3.5 h-3.5" /> Frozen by Compliance
                </span>
              )}
              {account.status === 'restricted' && (
                <span className="text-amber-400 font-semibold flex items-center gap-1">
                  <ShieldAlert className="w-3.5 h-3.5" /> Administrative Restrictions Active
                </span>
              )}
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const nextStatus = account.status === 'frozen' ? 'active' : 'frozen';
                  toggleAccountStatus(account.id, nextStatus, 'Operations manager status override');
                }}
                className={`px-2.5 py-1 rounded text-xs font-medium transition-colors cursor-pointer flex items-center gap-1 ${
                  account.status === 'frozen'
                    ? 'bg-emerald-600/20 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-600/30'
                    : 'bg-rose-600/20 text-rose-400 border border-rose-500/30 hover:bg-rose-600/30'
                }`}
              >
                {account.status === 'frozen' ? (
                  <>
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Unfreeze Account</span>
                  </>
                ) : (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Freeze Account</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Balance Matrix */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800">
              <div className="text-[11px] text-slate-400">Ledger Balance</div>
              <div className="text-lg font-bold text-white font-mono tabular-nums mt-1">
                ${account.balance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800">
              <div className="text-[11px] text-slate-400">Available Funds</div>
              <div className="text-lg font-bold text-emerald-400 font-mono tabular-nums mt-1">
                ${account.availableBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800">
              <div className="text-[11px] text-slate-400">Hold / Collateral</div>
              <div className="text-lg font-bold text-amber-400 font-mono tabular-nums mt-1">
                ${account.holdBalance.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="p-3.5 rounded-lg bg-slate-950/60 border border-slate-800">
              <div className="text-[11px] text-slate-400">Overdraft Line</div>
              <div className="text-lg font-bold text-slate-200 font-mono tabular-nums mt-1">
                ${account.overdraftLimit.toLocaleString('en-US', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Quick Action Buttons */}
          <div className="flex flex-wrap gap-2.5">
            <button
              onClick={onOpenDeposit}
              className="flex-1 min-w-[140px] px-3 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <Coins className="w-4 h-4" />
              <span>Deposit Cash / Check</span>
            </button>

            <button
              onClick={onOpenTransfer}
              className="flex-1 min-w-[140px] px-3 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>Send Wire / Transfer</span>
            </button>

            <button
              onClick={() => setShowHoldForm(!showHoldForm)}
              className="px-3 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium transition-colors cursor-pointer"
            >
              {showHoldForm ? 'Cancel Hold Action' : '+ Place Escrow Hold'}
            </button>
          </div>

          {/* Place Hold Inline Form */}
          {showHoldForm && (
            <form onSubmit={handleApplyHold} className="p-4 rounded-lg bg-slate-950 border border-amber-500/30 space-y-3">
              <div className="text-xs font-semibold text-amber-400 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                <span>Apply Regulatory or Escrow Hold</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Hold Amount (USD)</label>
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    max={account.availableBalance}
                    value={holdAmountInput}
                    onChange={e => setHoldAmountInput(e.target.value)}
                    placeholder="e.g. 50000"
                    required
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-slate-400 mb-1">Legal / Compliance Reason</label>
                  <input
                    type="text"
                    value={holdReasonInput}
                    onChange={e => setHoldReasonInput(e.target.value)}
                    placeholder="e.g. Escrow pending title discharge"
                    required
                    className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="submit"
                  className="px-3 py-1.5 bg-amber-600 hover:bg-amber-500 text-white rounded text-xs font-medium cursor-pointer"
                >
                  Commit Hold
                </button>
              </div>
            </form>
          )}

          {/* Release Hold Button if hold exists */}
          {account.holdBalance > 0 && !showHoldForm && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/20 rounded-lg flex items-center justify-between text-xs">
              <span className="text-amber-200">
                Active Hold Balance: <strong>${account.holdBalance.toLocaleString()}</strong>
              </span>
              <button
                onClick={() => releaseAccountHold(account.id, account.holdBalance)}
                className="px-2.5 py-1 bg-amber-600/30 hover:bg-amber-600/40 text-amber-200 rounded text-xs font-medium cursor-pointer"
              >
                Release Full Hold
              </button>
            </div>
          )}

          {/* Linked Cards Section */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                <CreditCard className="w-3.5 h-3.5 text-blue-400" />
                <span>Linked Cards ({accountCards.length})</span>
              </h3>
              <button
                onClick={onOpenNewCard}
                className="text-xs text-blue-400 hover:text-blue-300 font-medium cursor-pointer"
              >
                + Issue Card
              </button>
            </div>

            {accountCards.length === 0 ? (
              <div className="p-4 rounded-lg bg-slate-950/40 border border-slate-800 text-center text-xs text-slate-500">
                No active debit or corporate cards issued to this account.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {accountCards.map(c => (
                  <div key={c.id} className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-slate-300 font-medium">{c.cardNumberMasked}</span>
                      <span className={`text-[10px] uppercase font-semibold ${c.status === 'active' ? 'text-emerald-400' : 'text-rose-400'}`}>
                        {c.status}
                      </span>
                    </div>
                    <div className="text-[11px] text-slate-400 flex items-center justify-between">
                      <span>Exp: {c.expMonth}/{c.expYear}</span>
                      <span>Daily: ${c.dailyLimit.toLocaleString()}</span>
                    </div>
                    <div className="pt-2 border-t border-slate-800/80 flex items-center justify-between">
                      <button
                        onClick={() => toggleCardLock(c.id)}
                        className="text-xs text-slate-400 hover:text-white cursor-pointer flex items-center gap-1"
                      >
                        {c.status === 'active' ? <Lock className="w-3 h-3 text-rose-400" /> : <Unlock className="w-3 h-3 text-emerald-400" />}
                        <span>{c.status === 'active' ? 'Freeze Card' : 'Unfreeze Card'}</span>
                      </button>
                      <span className="text-[10px] text-slate-500">{c.tier.replace('_', ' ').toUpperCase()}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Account Ledger Transactions */}
          <div className="space-y-3">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-indigo-400" />
              <span>Statement History ({accountTransactions.length})</span>
            </h3>

            {accountTransactions.length === 0 ? (
              <div className="p-4 rounded-lg bg-slate-950/40 border border-slate-800 text-center text-xs text-slate-500">
                No transactions recorded for this account yet.
              </div>
            ) : (
              <div className="divide-y divide-slate-800/80 border border-slate-800 rounded-lg overflow-hidden bg-slate-950/40 text-xs">
                {accountTransactions.map(tx => {
                  const isDebit = tx.accountId === account.id && tx.direction === 'debit';
                  return (
                    <div
                      key={tx.id}
                      onClick={() => onSelectTransaction(tx)}
                      className="p-3 hover:bg-slate-800/40 transition-colors flex items-center justify-between cursor-pointer"
                    >
                      <div>
                        <div className="font-medium text-white">{tx.counterpartyName}</div>
                        <div className="text-[11px] text-slate-500 flex items-center gap-2">
                          <span className="font-mono">{tx.referenceNumber}</span>
                          <span aria-hidden="true">·</span>
                          <span>{tx.timestamp.slice(0, 16)}</span>
                        </div>
                      </div>

                      <div className="text-right">
                        <div className={`font-mono font-medium tabular-nums ${isDebit ? 'text-slate-200' : 'text-emerald-400'}`}>
                          {isDebit ? '-' : '+'}${tx.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                        </div>
                        <div className="text-[10px] text-slate-500 capitalize">{tx.status}</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs text-slate-500">
          <span>Branch NYC-01 · Opened {account.openedDate}</span>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg cursor-pointer"
          >
            Close Drawer
          </button>
        </div>
      </div>
    </div>
  );
};
