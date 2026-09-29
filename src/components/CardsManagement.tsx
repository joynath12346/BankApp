import React, { useState } from 'react';
import { useBank } from '../context/BankContext';
import { BankCard, CardTier } from '../types/bank';
import {
  CreditCard,
  Lock,
  Unlock,
  Plus,
  Eye,
  EyeOff,
  Wifi,
  Globe,
  DollarSign,
  Shield,
  Sliders,
  CheckCircle2
} from 'lucide-react';

interface CardsManagementProps {
  onOpenNewCardModal: () => void;
}

export const CardsManagement: React.FC<CardsManagementProps> = ({ onOpenNewCardModal }) => {
  const { cards, toggleCardLock, updateCardSettings } = useBank();
  const [selectedCardId, setSelectedCardId] = useState<string>(cards[0]?.id || '');
  const [revealedVirtual, setRevealedVirtual] = useState<{ [id: string]: boolean }>({});
  const [isFlipped, setIsFlipped] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);

  const selectedCard = cards.find(c => c.id === selectedCardId) || cards[0];

  const toggleReveal = (id: string) => {
    setRevealedVirtual(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleUpdateLimit = (newLimit: number) => {
    if (!selectedCard) return;
    updateCardSettings(selectedCard.id, { dailyLimit: newLimit });
    setNotice(`Daily limit set to $${newLimit.toLocaleString()}`);
    setTimeout(() => setNotice(null), 2500);
  };

  const handleToggleOnline = () => {
    if (!selectedCard) return;
    updateCardSettings(selectedCard.id, { onlineAllowed: !selectedCard.onlineAllowed });
  };

  const handleToggleAtm = () => {
    if (!selectedCard) return;
    updateCardSettings(selectedCard.id, { atmWithdrawalAllowed: !selectedCard.atmWithdrawalAllowed });
  };

  const handleToggleInternational = () => {
    if (!selectedCard) return;
    updateCardSettings(selectedCard.id, { internationalAllowed: !selectedCard.internationalAllowed });
  };

  const getTierGradient = (tier: CardTier) => {
    switch (tier) {
      case 'executive_black':
        return 'from-zinc-900 via-neutral-900 to-black border-zinc-700 text-zinc-100 shadow-2xl';
      case 'business_gold':
        return 'from-amber-900/90 via-yellow-950 to-neutral-950 border-amber-500/40 text-amber-100 shadow-xl';
      case 'platinum_standard':
      default:
        return 'from-slate-800 via-slate-900 to-slate-950 border-slate-700 text-slate-100 shadow-lg';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span>Visa & Mastercard Fleet Issuance</span>
            <span aria-hidden="true">·</span>
            <span>EMV Chip & Contactless Tokenization</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">Commercial & Consumer Card Fleet</h1>
        </div>

        <button
          onClick={onOpenNewCardModal}
          className="px-3.5 py-2 text-xs font-semibold text-white bg-blue-600 hover:bg-blue-500 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-sm shadow-blue-500/10"
        >
          <Plus className="w-4 h-4" />
          <span>Issue New Card</span>
        </button>
      </div>

      {notice && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-lg text-emerald-300 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{notice}</span>
        </div>
      )}

      {/* Main Grid: Card Showcase & Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Card Visual & Flipper (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          {selectedCard ? (
            <div>
              {/* The Physical Card Container */}
              <div
                onClick={() => setIsFlipped(!isFlipped)}
                className={`relative w-full aspect-[1.586/1] rounded-2xl p-6 bg-gradient-to-br ${getTierGradient(
                  selectedCard.tier
                )} border transition-transform duration-300 cursor-pointer select-none flex flex-col justify-between overflow-hidden shadow-2xl`}
              >
                {/* Background decorative texture */}
                <div className="absolute top-0 right-0 w-48 h-48 bg-white/5 rounded-full blur-2xl pointer-events-none" />

                {!isFlipped ? (
                  /* FRONT OF CARD */
                  <>
                    <div className="flex items-start justify-between relative z-10">
                      <div>
                        <div className="text-[11px] font-semibold tracking-widest uppercase opacity-80">
                          Aegis Horizon
                        </div>
                        <div className="text-[9px] uppercase tracking-wider text-slate-400">
                          {selectedCard.tier.replace('_', ' ')}
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Wifi className="w-4 h-4 opacity-75" />
                        <span className="font-bold text-xs tracking-wider">{selectedCard.cardBrand}</span>
                      </div>
                    </div>

                    {/* EMV Chip */}
                    <div className="my-auto relative z-10 flex items-center gap-3">
                      <div className="w-11 h-8 rounded-md bg-gradient-to-br from-amber-200 to-amber-400 border border-amber-300/60 shadow-inner flex items-center justify-center">
                        <div className="w-7 h-5 border border-amber-600/40 rounded-xs grid grid-cols-2 gap-0.5" />
                      </div>
                      {selectedCard.status === 'locked' && (
                        <span className="text-[11px] font-semibold text-rose-300 bg-rose-950/80 px-2 py-0.5 rounded border border-rose-500/40 flex items-center gap-1">
                          <Lock className="w-3 h-3" /> Card Frozen
                        </span>
                      )}
                    </div>

                    {/* Card Number & Holder */}
                    <div className="relative z-10 space-y-2">
                      <div className="font-mono text-base tracking-widest text-slate-100 flex items-center justify-between">
                        <span>
                          {revealedVirtual[selectedCard.id]
                            ? selectedCard.fullCardNumberVirtual
                            : selectedCard.cardNumberMasked}
                        </span>
                        <button
                          type="button"
                          onClick={e => {
                            e.stopPropagation();
                            toggleReveal(selectedCard.id);
                          }}
                          className="p-1 hover:text-white text-slate-400 cursor-pointer"
                        >
                          {revealedVirtual[selectedCard.id] ? (
                            <EyeOff className="w-4 h-4" />
                          ) : (
                            <Eye className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      <div className="flex items-end justify-between text-xs">
                        <div>
                          <div className="text-[9px] text-slate-400 uppercase tracking-wider">Cardholder</div>
                          <div className="font-medium tracking-wide">{selectedCard.cardholderName}</div>
                        </div>

                        <div>
                          <div className="text-[9px] text-slate-400 uppercase tracking-wider">Valid Thru</div>
                          <div className="font-mono text-slate-200">
                            {selectedCard.expMonth}/{selectedCard.expYear}
                          </div>
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  /* BACK OF CARD */
                  <>
                    <div className="-mx-6 -mt-2 h-10 bg-slate-950 w-[calc(100%+3rem)]" />

                    <div className="space-y-3 relative z-10">
                      <div className="flex items-center justify-end gap-2">
                        <span className="text-[10px] text-slate-400 uppercase">CVV / CVC</span>
                        <div className="px-3 py-1 bg-white text-slate-900 font-mono text-xs font-bold rounded">
                          {selectedCard.cvv}
                        </div>
                      </div>

                      <div className="text-[9px] text-slate-400 leading-tight">
                        Issued by Aegis Horizon Bank NA pursuant to license by Visa USA Inc. Authorized signature required. For lost or stolen cards call +1 (800) 555-0199.
                      </div>

                      <div className="pt-2 border-t border-slate-700/60 flex items-center justify-between text-[10px] text-slate-400">
                        <span>PIN: ****</span>
                        <span className="font-mono">CID: {selectedCard.pin}</span>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="text-center text-[11px] text-slate-500 mt-2">
                Click card to flip between front / security CVV reverse
              </div>
            </div>
          ) : (
            <div className="p-8 rounded-xl bg-slate-900 border border-slate-800 text-center text-slate-400 text-xs">
              No card selected.
            </div>
          )}

          {/* Quick Card Selector Carousel */}
          <div className="space-y-2">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              Issued Cards ({cards.length})
            </div>
            <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
              {cards.map(c => (
                <div
                  key={c.id}
                  onClick={() => setSelectedCardId(c.id)}
                  className={`p-3 rounded-lg border text-xs cursor-pointer transition-all flex items-center justify-between ${
                    c.id === selectedCard?.id
                      ? 'bg-blue-600/10 border-blue-500/50'
                      : 'bg-slate-900/60 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div>
                    <div className="font-medium text-white">{c.cardholderName}</div>
                    <div className="font-mono text-[11px] text-slate-400">{c.cardNumberMasked}</div>
                  </div>

                  <div className="text-right">
                    <span className={`text-[10px] uppercase font-semibold ${c.status === 'active' ? 'text-emerald-400' : 'text-rose-400'}`}>
                      {c.status}
                    </span>
                    <div className="text-[10px] text-slate-500 font-mono">${c.dailyLimit.toLocaleString()}/day</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right: Security & Usage Control Center (7 cols) */}
        {selectedCard && (
          <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-6">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <h2 className="text-sm font-semibold text-white">Card Security & Authorization Controls</h2>
                <p className="text-xs text-slate-400">Cardholder: {selectedCard.cardholderName}</p>
              </div>

              <button
                onClick={() => toggleCardLock(selectedCard.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 cursor-pointer ${
                  selectedCard.status === 'active'
                    ? 'bg-rose-600/20 text-rose-300 border border-rose-500/40 hover:bg-rose-600/30'
                    : 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/40 hover:bg-emerald-600/30'
                }`}
              >
                {selectedCard.status === 'active' ? (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>Freeze Card Instantly</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-3.5 h-3.5" />
                    <span>Unfreeze Card</span>
                  </>
                )}
              </button>
            </div>

            {/* Daily Limit Slider */}
            <div className="space-y-3 p-4 rounded-lg bg-slate-950 border border-slate-800">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-white flex items-center gap-1.5">
                  <Sliders className="w-4 h-4 text-blue-400" />
                  <span>Daily Spending Ceiling</span>
                </span>
                <span className="font-mono text-emerald-400 font-bold tabular-nums">
                  ${selectedCard.dailyLimit.toLocaleString()} / day
                </span>
              </div>

              <input
                type="range"
                min="500"
                max="50000"
                step="500"
                value={selectedCard.dailyLimit}
                onChange={e => handleUpdateLimit(Number(e.target.value))}
                className="w-full accent-blue-500 cursor-pointer"
              />

              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>$500</span>
                <span>$25,000</span>
                <span>$50,000</span>
              </div>
            </div>

            {/* Toggle Switches */}
            <div className="space-y-3">
              <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Channel Authorization Permissions
              </div>

              {/* Online Purchases */}
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-white">Online & E-Commerce Purchases</div>
                  <div className="text-[11px] text-slate-400">Allow card tokenization and web merchant debits</div>
                </div>
                <button
                  type="button"
                  onClick={handleToggleOnline}
                  className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${
                    selectedCard.onlineAllowed ? 'bg-blue-600' : 'bg-slate-800'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                      selectedCard.onlineAllowed ? 'right-1' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              {/* ATM Withdrawals */}
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-white">Physical ATM Cash Withdrawals</div>
                  <div className="text-[11px] text-slate-400">Permit magnetic swipe and chip cash dispensations</div>
                </div>
                <button
                  type="button"
                  onClick={handleToggleAtm}
                  className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${
                    selectedCard.atmWithdrawalAllowed ? 'bg-blue-600' : 'bg-slate-800'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                      selectedCard.atmWithdrawalAllowed ? 'right-1' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              {/* International Usage */}
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between">
                <div>
                  <div className="text-xs font-semibold text-white">International & Cross-Border Transactions</div>
                  <div className="text-[11px] text-slate-400">Enable multi-currency FX settlement outside US</div>
                </div>
                <button
                  type="button"
                  onClick={handleToggleInternational}
                  className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${
                    selectedCard.internationalAllowed ? 'bg-blue-600' : 'bg-slate-800'
                  }`}
                >
                  <span
                    className={`w-4 h-4 rounded-full bg-white absolute top-1 transition-transform ${
                      selectedCard.internationalAllowed ? 'right-1' : 'left-1'
                    }`}
                  />
                </button>
              </div>
            </div>

            {/* Issued Details */}
            <div className="p-3.5 bg-slate-950/40 rounded-lg border border-slate-800/80 text-[11px] text-slate-400 grid grid-cols-2 gap-2">
              <div>Issued Date: <span className="text-white font-mono">{selectedCard.issuedDate}</span></div>
              <div>Card Brand: <span className="text-white">{selectedCard.cardBrand} Premium</span></div>
              <div>Account Linked: <span className="text-white font-mono">{selectedCard.accountNumber}</span></div>
              <div>PIN Verification: <span className="text-emerald-400 font-mono">Synchronized</span></div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
