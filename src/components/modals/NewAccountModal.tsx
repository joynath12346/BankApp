import React, { useState } from 'react';
import { useBank } from '../../context/BankContext';
import { AccountType, Currency } from '../../types/bank';
import { X, Building, CheckCircle2, User, CreditCard } from 'lucide-react';

interface NewAccountModalProps {
  onClose: () => void;
  onSuccessCreated?: (accountId: string) => void;
}

export const NewAccountModal: React.FC<NewAccountModalProps> = ({ onClose, onSuccessCreated }) => {
  const { createAccount, issueCard } = useBank();

  const [holderName, setHolderName] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('+1 (555) ');
  const [accountType, setAccountType] = useState<AccountType>('checking');
  const [currency, setCurrency] = useState<Currency>('USD');
  const [initialDeposit, setInitialDeposit] = useState<string>('25000');
  const [overdraftLimit, setOverdraftLimit] = useState<string>('5000');
  const [kycTier, setKycTier] = useState<1 | 2 | 3>(2);
  const [issueDebitCard, setIssueDebitCard] = useState<boolean>(true);
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!holderName.trim()) return;

    const newAcc = createAccount({
      accountHolderName: holderName.trim(),
      companyName: companyName.trim() || undefined,
      accountHolderEmail: email.trim() || `${holderName.toLowerCase().replace(/\s+/g, '.')}@example.com`,
      accountHolderPhone: phone.trim(),
      type: accountType,
      currency,
      balance: parseFloat(initialDeposit) || 0,
      overdraftLimit: parseFloat(overdraftLimit) || 0,
      kycTier
    });

    if (issueDebitCard) {
      issueCard({
        accountId: newAcc.id,
        cardholderName: holderName.trim(),
        tier: kycTier === 3 ? 'executive_black' : accountType === 'business_checking' ? 'business_gold' : 'platinum_standard',
        dailyLimit: accountType === 'business_checking' ? 25000 : 10000
      });
    }

    setSuccess(true);
    setTimeout(() => {
      onSuccessCreated?.(newAcc.id);
      onClose();
    }, 1500);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="w-full max-w-xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/40">
          <div>
            <div className="flex items-center gap-2 text-xs text-slate-400 mb-0.5">
              <span>Account Onboarding Wizard</span>
              <span aria-hidden="true">·</span>
              <span>Branch NYC-01</span>
            </div>
            <h2 className="text-lg font-bold text-white">Open New Banking Portfolio</h2>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {success && (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-300 text-xs font-medium flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Account successfully opened and registered with core ledger.</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Account Holder Legal Name *
              </label>
              <input
                type="text"
                placeholder="e.g. Katherine Pierce"
                value={holderName}
                onChange={e => setHolderName(e.target.value)}
                required
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Corporate Entity / Company (Optional)
              </label>
              <input
                type="text"
                placeholder="e.g. Pierce Asset Holdings LP"
                value={companyName}
                onChange={e => setCompanyName(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Primary Contact Email
              </label>
              <input
                type="email"
                placeholder="katherine@pierceassets.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Direct Telephone
              </label>
              <input
                type="text"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Account Classification
              </label>
              <select
                value={accountType}
                onChange={e => setAccountType(e.target.value as AccountType)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none cursor-pointer"
              >
                <option value="checking">Standard Checking</option>
                <option value="savings">High-Yield Savings (4.25% APY)</option>
                <option value="business_checking">Commercial Operating Checking</option>
                <option value="treasury_escrow">Treasury Escrow Account</option>
                <option value="money_market">Money Market Account</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Settlement Currency
              </label>
              <select
                value={currency}
                onChange={e => setCurrency(e.target.value as Currency)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none cursor-pointer"
              >
                <option value="USD">USD ($) - United States Dollar</option>
                <option value="EUR">EUR (€) - European Euro</option>
                <option value="GBP">GBP (£) - British Pound</option>
                <option value="JPY">JPY (¥) - Japanese Yen</option>
                <option value="CAD">CAD (CA$) - Canadian Dollar</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Initial Funding Deposit
              </label>
              <input
                type="number"
                min="0"
                step="100"
                value={initialDeposit}
                onChange={e => setInitialDeposit(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Overdraft Facility Line
              </label>
              <input
                type="number"
                min="0"
                step="500"
                value={overdraftLimit}
                onChange={e => setOverdraftLimit(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                KYC Verification Tier
              </label>
              <select
                value={kycTier}
                onChange={e => setKycTier(Number(e.target.value) as 1 | 2 | 3)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none cursor-pointer"
              >
                <option value="1">Tier 1 - Simplified Retail</option>
                <option value="2">Tier 2 - Enhanced Corporate</option>
                <option value="3">Tier 3 - Institutional / FinCEN</option>
              </select>
            </div>
          </div>

          {/* Issue Debit Card Option */}
          <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CreditCard className="w-4 h-4 text-blue-400" />
              <div>
                <div className="text-xs font-medium text-white">Issue Instant Virtual Visa Card</div>
                <div className="text-[11px] text-slate-400">Tokenized card with EMV chip configuration</div>
              </div>
            </div>

            <input
              type="checkbox"
              checked={issueDebitCard}
              onChange={e => setIssueDebitCard(e.target.checked)}
              className="w-4 h-4 accent-blue-600 rounded cursor-pointer"
            />
          </div>

          <button
            type="submit"
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
          >
            Create Customer Account & Disburse Routing
          </button>
        </form>
      </div>
    </div>
  );
};
