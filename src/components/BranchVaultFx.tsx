import React, { useState } from 'react';
import { useBank } from '../context/BankContext';
import { Currency } from '../types/bank';
import {
  Vault,
  Coins,
  ArrowRightLeft,
  CheckCircle2,
  FileCheck,
  TrendingUp,
  TrendingDown,
  Building2,
  ShieldCheck,
  RotateCcw
} from 'lucide-react';

export const BranchVaultFx: React.FC = () => {
  const { vault, exchangeRates, reconcileEodVault } = useBank();

  // FX Converter State
  const [amountInput, setAmountInput] = useState<number>(10000);
  const [fromCurrency, setFromCurrency] = useState<Currency>('USD');
  const [toCurrency, setToCurrency] = useState<Currency>('EUR');

  // EOD Reconciliation State
  const [countedCashInput, setCountedCashInput] = useState<string>(vault.vaultCashUSD.toString());
  const [auditorInput, setAuditorInput] = useState<string>(vault.auditorName);
  const [eodSuccess, setEodSuccess] = useState<boolean>(false);

  // FX Conversion Math
  const fromRate = exchangeRates.find(r => r.code === fromCurrency)?.rateToUSD || 1;
  const toRate = exchangeRates.find(r => r.code === toCurrency)?.rateToUSD || 1;
  
  // Amount in USD = amountInput * fromRate
  // Amount in target = (amountInput * fromRate) / toRate
  const convertedAmount = (amountInput * fromRate) / toRate;
  const spreadMargin = convertedAmount * 0.002; // 20 bps institutional spread

  const handleEodSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(countedCashInput);
    if (!isNaN(val) && val >= 0) {
      reconcileEodVault(val, auditorInput || 'Authorized Auditor');
      setEodSuccess(true);
      setTimeout(() => setEodSuccess(false), 4000);
    }
  };

  const theoreticalVault = vault.vaultCashUSD;
  const variance = parseFloat(countedCashInput || '0') - theoreticalVault;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span>Branch Physical Operations & Treasury Desk</span>
            <span aria-hidden="true">·</span>
            <span>Flagship Downtown NYC-01</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">Branch Vault & FX Exchange Desk</h1>
        </div>

        {eodSuccess && (
          <div className="p-2.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            <span>End-of-Day Ledger Reconciled and Signed Off.</span>
          </div>
        )}
      </div>

      {/* Vault KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Physical Vault Reserve (USD)</span>
            <Vault className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono tabular-nums">
            ${vault.vaultCashUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-500 mt-2">Class 3 High-Security Dual Key Vault</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Teller Counter Drawers</span>
            <Coins className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-2xl font-bold text-white font-mono tabular-nums">
            ${vault.tellerDrawersCashUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-500 mt-2">Active cash across 6 teller stations</div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-1">
            <span>Federal Reserve Statutory Deposit</span>
            <Building2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-2xl font-bold text-emerald-400 font-mono tabular-nums">
            ${vault.centralBankDepositUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-500 mt-2">
            Statutory Reserve Ratio: {(vault.reserveRequirementRatio * 100).toFixed(1)}% (Compliant)
          </div>
        </div>
      </div>

      {/* Main Row: Foreign Exchange Desk & End of Day Reconciliation */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* FX Exchange Rates & Converter (7 cols) */}
        <div className="lg:col-span-7 bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-6">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-sm font-semibold text-white">Foreign Exchange (FX) Matrix</h2>
              <p className="text-xs text-slate-400">Institutional spot rates with live clearing spreads</p>
            </div>
            <span className="text-[11px] font-mono text-emerald-400 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
              FX FEED LIVE
            </span>
          </div>

          {/* Rates Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-950/60 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                <tr>
                  <th className="py-2.5 px-3">Currency</th>
                  <th className="py-2.5 px-3 text-right">USD Equivalent</th>
                  <th className="py-2.5 px-3 text-right">Bank Buy Rate</th>
                  <th className="py-2.5 px-3 text-right">Bank Sell Rate</th>
                  <th className="py-2.5 px-3 text-right">24h Change</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-slate-300">
                {exchangeRates.map(rate => (
                  <tr key={rate.code} className="hover:bg-slate-800/30 transition-colors">
                    <td className="py-3 px-3">
                      <div className="font-semibold text-white flex items-center gap-1.5">
                        <span className="font-mono text-slate-400">{rate.symbol}</span>
                        <span>{rate.code}</span>
                      </div>
                      <div className="text-[10px] text-slate-500">{rate.name}</div>
                    </td>

                    <td className="py-3 px-3 text-right font-mono tabular-nums text-white">
                      ${rate.rateToUSD.toFixed(4)}
                    </td>

                    <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-300">
                      ${rate.buyRate.toFixed(4)}
                    </td>

                    <td className="py-3 px-3 text-right font-mono tabular-nums text-slate-300">
                      ${rate.sellRate.toFixed(4)}
                    </td>

                    <td className="py-3 px-3 text-right font-mono tabular-nums">
                      <span className={rate.change24h >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                        {rate.change24h >= 0 ? '+' : ''}{rate.change24h}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* FX Converter Calculator */}
          <div className="p-4 rounded-lg bg-slate-950 border border-slate-800 space-y-4">
            <div className="text-xs font-semibold text-white flex items-center gap-2">
              <ArrowRightLeft className="w-4 h-4 text-blue-400" />
              <span>Institutional Currency Conversion Calculator</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-[11px] text-slate-400 mb-1">Source Amount</label>
                <input
                  type="number"
                  min="1"
                  value={amountInput}
                  onChange={e => setAmountInput(Number(e.target.value))}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none font-mono"
                />
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">From Currency</label>
                <select
                  value={fromCurrency}
                  onChange={e => setFromCurrency(e.target.value as Currency)}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none cursor-pointer"
                >
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="CAD">CAD - Canadian Dollar</option>
                  <option value="JPY">JPY - Japanese Yen</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] text-slate-400 mb-1">To Currency</label>
                <select
                  value={toCurrency}
                  onChange={e => setToCurrency(e.target.value as Currency)}
                  className="w-full bg-slate-900 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none cursor-pointer"
                >
                  <option value="EUR">EUR - Euro</option>
                  <option value="USD">USD - US Dollar</option>
                  <option value="GBP">GBP - British Pound</option>
                  <option value="CAD">CAD - Canadian Dollar</option>
                  <option value="JPY">JPY - Japanese Yen</option>
                </select>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs">
              <span className="text-slate-400">Net Converted Output:</span>
              <span className="font-mono text-base font-bold text-emerald-400 tabular-nums">
                {toCurrency} {convertedAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </span>
            </div>
          </div>
        </div>

        {/* EOD Reconciliation & Auditing (5 cols) */}
        <div className="lg:col-span-5 bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-5">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h2 className="text-sm font-semibold text-white">Daily End-of-Day (EOD) Audit</h2>
              <p className="text-xs text-slate-400">Cash drawer balancing and vault sign-off</p>
            </div>
            <FileCheck className="w-5 h-5 text-indigo-400" />
          </div>

          <form onSubmit={handleEodSubmit} className="space-y-4">
            <div className="p-3.5 rounded-lg bg-slate-950 border border-slate-800 space-y-2 text-xs">
              <div className="flex justify-between text-slate-400">
                <span>Theoretical Vault Balance:</span>
                <span className="font-mono text-white font-medium">
                  ${vault.vaultCashUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                </span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Last Certified Audit:</span>
                <span className="font-mono text-slate-300">{vault.lastAuditedAt}</span>
              </div>
              <div className="flex justify-between text-slate-400">
                <span>Audited By:</span>
                <span className="text-slate-200">{vault.auditorName}</span>
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Physically Counted Vault Total (USD)
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={countedCashInput}
                onChange={e => setCountedCashInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 font-mono"
                required
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300 mb-1">
                Auditing Officer Signature / Name
              </label>
              <input
                type="text"
                value={auditorInput}
                onChange={e => setAuditorInput(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
                required
              />
            </div>

            {/* Calculated Variance */}
            <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
              <span className="text-slate-400">Audit Discrepancy / Variance:</span>
              <span className={`font-mono font-bold tabular-nums ${
                variance === 0 ? 'text-emerald-400' : 'text-rose-400'
              }`}>
                ${variance.toFixed(2)} {variance === 0 ? '(Balanced)' : '(Discrepancy)'}
              </span>
            </div>

            <button
              type="submit"
              className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
            >
              Certify & Sign Off Daily Vault
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
