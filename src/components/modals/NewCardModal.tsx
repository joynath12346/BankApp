import React, { useState } from 'react';
import { useBank } from '../../context/BankContext';
import { CardTier } from '../../types/bank';
import { X, CreditCard, CheckCircle2 } from 'lucide-react';

interface NewCardModalProps {
  onClose: () => void;
  defaultAccountId?: string;
}

export const NewCardModal: React.FC<NewCardModalProps> = ({ onClose, defaultAccountId }) => {
  const { accounts, issueCard } = useBank();

  const [accountId, setAccountId] = useState<string>(
    defaultAccountId || accounts[0]?.id || ''
  );
  const selectedAccount = accounts.find(a => a.id === accountId);
  const [holderName, setHolderName] = useState(selectedAccount?.accountHolderName || '');
  const [tier, setTier] = useState<CardTier>('executive_black');
  const [dailyLimit, setDailyLimit] = useState<number>(25000);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!holderName.trim()) return;

    issueCard({
      accountId,
      cardholderName: holderName.trim(),
      tier,
      dailyLimit
    });

    setSuccess(true);
    setTimeout(() => {
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-0.5">
              <span>Card Issuance Desk</span>
              <span aria-hidden="true">·</span>
              <span>EMV Tokenization</span>
            </div>
            <h2 className="text-lg font-bold text-white">Issue Commercial or Debit Card</h2>
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
          {success && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-300 text-xs font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Card tokenized and issued into active card fleet.</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Target Account</label>
            <select
              value={accountId}
              onChange={e => {
                const id = e.target.value;
                setAccountId(id);
                const acc = accounts.find(a => a.id === id);
                if (acc) setHolderName(acc.accountHolderName);
              }}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 cursor-pointer"
            >
              {accounts.map(acc => (
                <option key={acc.id} value={acc.id}>
                  {acc.accountHolderName} ({acc.accountNumber})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Cardholder Embossed Name</label>
            <input
              type="text"
              value={holderName}
              onChange={e => setHolderName(e.target.value)}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 uppercase font-medium"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Card Tier & Finish</label>
            <select
              value={tier}
              onChange={e => setTier(e.target.value as CardTier)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none cursor-pointer"
            >
              <option value="executive_black">Executive Black Metal (High Net Worth)</option>
              <option value="business_gold">Commercial Gold Prestige (Business)</option>
              <option value="platinum_standard">Platinum Signature (Retail)</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-300 mb-1">Daily Spending Limit (BDT)</label>
            <input
              type="number"
              step="1000"
              min="500"
              max="100000"
              value={dailyLimit}
              onChange={e => setDailyLimit(Number(e.target.value))}
              required
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-blue-500"
            />
          </div>

          <div className="p-3 bg-slate-950 rounded-lg border border-slate-800 text-[11px] text-slate-400 space-y-1">
            <div>Chip: EMV 4.3 Standard Tokenization</div>
            <div>Contactless: NFC ISO/IEC 14443 Enabled</div>
            <div>Fraud Protection: 24/7 AI Velocity Screening</div>
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            Authorize & Tokenize Card
          </button>
        </form>
      </div>
    </div>
  );
};
