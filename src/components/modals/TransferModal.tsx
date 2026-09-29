import React, { useState } from 'react';
import { useBank } from '../../context/BankContext';
import { BankAccount, Currency } from '../../types/bank';
import {
  X,
  ArrowRight,
  ShieldAlert,
  Building,
  CheckCircle2,
  DollarSign,
  AlertCircle
} from 'lucide-react';

interface TransferModalProps {
  onClose: () => void;
  defaultSourceAccount?: BankAccount | null;
}

export const TransferModal: React.FC<TransferModalProps> = ({ onClose, defaultSourceAccount }) => {
  const { accounts, executeTransfer } = useBank();

  const [sourceAccountId, setSourceAccountId] = useState<string>(
    defaultSourceAccount?.id || accounts[0]?.id || ''
  );
  const [transferType, setTransferType] = useState<'internal' | 'domestic_wire' | 'international_swift'>('internal');
  const [targetAccountId, setTargetAccountId] = useState<string>(
    accounts.find(a => a.id !== (defaultSourceAccount?.id || accounts[0]?.id))?.id || ''
  );
  const [counterpartyName, setCounterpartyName] = useState('');
  const [counterpartyBank, setCounterpartyBank] = useState('Federal Reserve Bank of NY');
  const [targetAccountNumber, setTargetAccountNumber] = useState('');
  const [swiftCode, setSwiftCode] = useState('CHASUS33XXX');
  const [amount, setAmount] = useState<string>('5000');
  const [memo, setMemo] = useState('Commercial invoice clearing settlement');
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const sourceAccount = accounts.find(a => a.id === sourceAccountId);
  const targetInternalAccount = accounts.find(a => a.id === targetAccountId);

  const fee = transferType === 'international_swift' ? 45.00 : transferType === 'domestic_wire' ? 25.00 : 0.00;
  const numAmount = parseFloat(amount) || 0;
  const totalDeduction = numAmount + fee;

  const isStructuringSuspect = numAmount >= 9000 && numAmount < 10000;
  const isHighValue = numAmount >= 100000;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!sourceAccount) {
      setErrorMessage('Please select a valid source account.');
      return;
    }

    if (numAmount <= 0) {
      setErrorMessage('Transfer amount must be greater than zero.');
      return;
    }

    const cName = transferType === 'internal'
      ? (targetInternalAccount?.accountHolderName || 'Internal Client')
      : counterpartyName.trim();

    if (!cName) {
      setErrorMessage('Beneficiary name is required.');
      return;
    }

    const res = executeTransfer({
      sourceAccountId: sourceAccount.id,
      targetType: transferType,
      counterpartyName: cName,
      counterpartyBank: transferType === 'internal' ? 'Aegis Horizon Bank' : counterpartyBank,
      targetAccountNumber: transferType === 'internal' ? targetInternalAccount?.accountNumber : targetAccountNumber,
      targetAccountId: transferType === 'internal' ? targetAccountId : undefined,
      amount: numAmount,
      currency: sourceAccount.currency,
      memo
    });

    if (res.success) {
      setSuccessMessage(
        `Transfer cleared! Reference code: ${res.transaction?.referenceNumber}${res.transaction?.status === 'flagged' ? ' (Flagged for AML Review)' : ''}`
      );
      setTimeout(() => {
        onClose();
      }, 2000);
    } else {
      setErrorMessage(res.message || 'Transfer failed. Check balance.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-0.5">
              <span>Electronic Funds Clearance</span>
              <span aria-hidden="true">·</span>
              <span>RTGS / Fedwire / SWIFT</span>
            </div>
            <h2 className="text-lg font-bold text-white">Initiate Outbound Funds Transfer</h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {errorMessage && (
            <div className="p-3 bg-rose-500/10 border border-rose-500/30 rounded-lg text-rose-300 text-xs font-medium flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-300 text-xs font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
              <span>{successMessage}</span>
            </div>
          )}

          {/* Source Account */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Debited Source Account</label>
            <select
              value={sourceAccountId}
              onChange={e => setSourceAccountId(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id} disabled={acc.status === 'frozen'}>
                  {acc.accountHolderName} — {acc.accountNumber} (${acc.availableBalance.toLocaleString()} avail)
                  {acc.status === 'frozen' ? ' [FROZEN]' : ''}
                </option>
              ))}
            </select>
          </div>

          {/* Transfer Channel Selector */}
          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1.5">Clearing Channel & Protocol</label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTransferType('internal')}
                className={`py-2 px-2.5 rounded-lg border text-xs font-medium transition-all text-center cursor-pointer ${
                  transferType === 'internal'
                    ? 'bg-blue-600/15 border-blue-500 text-blue-400'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div>Internal Book</div>
                <div className="text-[10px] text-slate-500">$0.00 fee · Instant</div>
              </button>

              <button
                type="button"
                onClick={() => setTransferType('domestic_wire')}
                className={`py-2 px-2.5 rounded-lg border text-xs font-medium transition-all text-center cursor-pointer ${
                  transferType === 'domestic_wire'
                    ? 'bg-blue-600/15 border-blue-500 text-blue-400'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div>Fedwire RTGS</div>
                <div className="text-[10px] text-slate-500">$25.00 fee · Real-Time</div>
              </button>

              <button
                type="button"
                onClick={() => setTransferType('international_swift')}
                className={`py-2 px-2.5 rounded-lg border text-xs font-medium transition-all text-center cursor-pointer ${
                  transferType === 'international_swift'
                    ? 'bg-blue-600/15 border-blue-500 text-blue-400'
                    : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-slate-200'
                }`}
              >
                <div>SWIFT GPI</div>
                <div className="text-[10px] text-slate-500">$45.00 fee · Cross-Border</div>
              </button>
            </div>
          </div>

          {/* Internal Destination vs External Destination */}
          {transferType === 'internal' ? (
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Beneficiary Aegis Account</label>
              <select
                value={targetAccountId}
                onChange={e => setTargetAccountId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
              >
                {accounts
                  .filter(a => a.id !== sourceAccountId)
                  .map(acc => (
                    <option key={acc.id} value={acc.id}>
                      {acc.accountHolderName} ({acc.accountNumber})
                    </option>
                  ))}
              </select>
            </div>
          ) : (
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Beneficiary Legal Name</label>
                <input
                  type="text"
                  placeholder="e.g. JPMorgan Chase Clearing / Apex Global LP"
                  value={counterpartyName}
                  onChange={e => setCounterpartyName(e.target.value)}
                  required
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {transferType === 'international_swift' ? 'SWIFT / BIC Code' : 'ABA Routing Number'}
                  </label>
                  <input
                    type="text"
                    placeholder={transferType === 'international_swift' ? 'CHASUS33XXX' : '021000021'}
                    value={swiftCode}
                    onChange={e => setSwiftCode(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none font-mono"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    {transferType === 'international_swift' ? 'IBAN / Target Account' : 'Beneficiary Account #'}
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 9812-4412-0012"
                    value={targetAccountNumber}
                    onChange={e => setTargetAccountNumber(e.target.value)}
                    required
                    className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-slate-300 mb-1">Receiving Intermediary Bank</label>
                <input
                  type="text"
                  placeholder="e.g. Citibank NA New York / Deutsche Bank AG"
                  value={counterpartyBank}
                  onChange={e => setCounterpartyBank(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none"
                />
              </div>
            </div>
          )}

          {/* Amount & Memo */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Transfer Amount (USD)</label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">Payment Reference / Memo</label>
              <input
                type="text"
                value={memo}
                onChange={e => setMemo(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          {/* Compliance Detection Preview */}
          {(isStructuringSuspect || isHighValue) && (
            <div className="p-3 bg-amber-500/10 border border-amber-500/30 rounded-lg text-xs text-amber-300 flex items-start gap-2">
              <ShieldAlert className="w-4 h-4 shrink-0 text-amber-400 mt-0.5" />
              <div>
                <div className="font-semibold">Automated AML Surveillance Notice</div>
                <div className="text-[11px] text-amber-300/80 mt-0.5">
                  {isStructuringSuspect
                    ? 'Amount ($9,000–$9,999) triggers Bank Secrecy Act structuring screening algorithm.'
                    : 'Transaction exceeds $100,000 threshold and will be logged in regulatory clearing reports.'}
                </div>
              </div>
            </div>
          )}

          {/* Financial Math Summary Box */}
          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 text-xs space-y-1.5 font-mono">
            <div className="flex justify-between text-slate-400">
              <span>Transfer Principal:</span>
              <span className="text-white">${numAmount.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
            <div className="flex justify-between text-slate-400">
              <span>Clearing Fee:</span>
              <span className="text-slate-300">${fee.toFixed(2)}</span>
            </div>
            <div className="pt-1.5 border-t border-slate-800 flex justify-between font-bold text-white">
              <span>Total Debit from Account:</span>
              <span className="text-emerald-400">${totalDeduction.toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
            </div>
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            Authorize & Execute Clearing
          </button>
        </form>
      </div>
    </div>
  );
};
