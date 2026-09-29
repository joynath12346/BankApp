import React, { useState } from 'react';
import { useBank } from '../context/BankContext';
import { useLanguage } from '../context/LanguageContext';
import {
  CreditCard,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  ShieldCheck,
  Download,
  Building,
  Lock,
  Unlock,
  Coins
} from 'lucide-react';
import { Transaction } from '../types/bank';

interface CustomerPortalViewProps {
  onOpenTransferModal: () => void;
  onOpenDepositModal: () => void;
  onSelectTransaction: (tx: Transaction) => void;
  onSwitchToManager: () => void;
  isStandaloneCustomer?: boolean;
}

export const CustomerPortalView: React.FC<CustomerPortalViewProps> = ({
  onOpenTransferModal,
  onOpenDepositModal,
  onSelectTransaction,
  onSwitchToManager,
  isStandaloneCustomer = false
}) => {
  const { accounts, activeCustomerAccountId, setActiveCustomerAccountId, transactions, cards, toggleCardLock } = useBank();
  const { language, t } = useLanguage();

  const account = accounts.find(a => a.id === activeCustomerAccountId) || accounts[0];
  const clientTransactions = transactions.filter(
    t => t.accountId === account?.id || t.targetAccountId === account?.id
  );
  const clientCards = cards.filter(c => c.accountId === account?.id);
  const accountTypeLabel = {
    checking: t('checking'), savings: t('savings'), business_checking: t('businessChecking'),
    money_market: t('moneyMarket'), treasury_escrow: t('treasuryEscrow')
  }[account.type];

  const downloadStatement = () => {
    const text = `BANGLABANK - ${language === 'bn' ? 'অ্যাকাউন্ট বিবরণী' : 'ACCOUNT STATEMENT'}\n` +
      `${language === 'bn' ? 'অ্যাকাউন্টধারী' : 'Account Holder'}: ${account.accountHolderName}\n` +
      `${language === 'bn' ? 'অ্যাকাউন্ট নম্বর' : 'Account Number'}: ${account.accountNumber}\n` +
      `${t('routing')} / ABA: ${account.routingNumber}\n` +
      `${language === 'bn' ? 'লেজার ব্যালেন্স' : 'Ledger Balance'}: BDT ${account.balance.toLocaleString('en-BD', { minimumFractionDigits: 2 })}\n` +
      `${t('availableTransfer')}: BDT ${account.availableBalance.toLocaleString('en-BD', { minimumFractionDigits: 2 })}\n` +
      `${language === 'bn' ? 'তারিখ' : 'As of'}: ${new Date().toLocaleString(language === 'bn' ? 'bn-BD' : 'en-BD')}\n\n` +
      `${language === 'bn' ? 'লেনদেন তালিকা' : 'TRANSACTION LEDGER'}:\n` +
      clientTransactions.map(t => `${t.timestamp} | ${t.referenceNumber} | ${t.counterpartyName} | ${t.direction === 'credit' ? '+' : '-'}BDT ${t.amount.toLocaleString('en-BD')} | ${t.status}`).join('\n');

    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `BanglaBank_Statement_${account.accountNumber}.txt`;
    a.click();
  };

  return (
    <div className="space-y-6">
      {/* Top Banner & Customer Switcher */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span>{t('digitalBanking')}</span>
            <span aria-hidden="true">·</span>
            <span>{t('privateSuite')}</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight text-white">
            {t('welcomeBack')}, {account.accountHolderName}
          </h1>
          <p className="text-xs text-slate-400 mt-1">
            {t('account')}: <span className="font-mono text-slate-300">{account.accountNumber}</span> · {t('routing')}: {account.routingNumber}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {!isStandaloneCustomer && <select
            value={account.id}
            onChange={e => setActiveCustomerAccountId(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none cursor-pointer"
          >
            {accounts.map(acc => (
              <option key={acc.id} value={acc.id}>
                {t('switchView')}: {acc.accountHolderName}
              </option>
            ))}
          </select>}

          <button
            onClick={onSwitchToManager}
            className="px-3.5 py-2 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            {isStandaloneCustomer ? t('signOut') : t('executiveConsole')}
          </button>
        </div>
      </div>

      {/* Account Balances and Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Balances Card */}
        <div className="md:col-span-2 bg-slate-900/80 border border-slate-800 rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-slate-400 uppercase tracking-wider">
              {accountTypeLabel} {t('portfolio')}
            </span>
            <span className="text-xs text-emerald-400 font-medium flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" /> {t('depositProtection')}
            </span>
          </div>

          <div>
            <div className="text-3xl font-extrabold text-white font-mono tabular-nums tracking-tight">
              BDT {account.balance.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>
            <div className="flex items-center gap-3 mt-1 text-xs text-slate-400">
              <span>{t('availableTransfer')}: <strong className="text-emerald-400 font-mono">BDT {account.availableBalance.toLocaleString('en-BD', { minimumFractionDigits: 2 })}</strong></span>
              {account.holdBalance > 0 && (
                <span>{t('hold')}: <strong className="text-amber-400 font-mono">BDT {account.holdBalance.toLocaleString('en-BD')}</strong></span>
              )}
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 flex flex-wrap gap-3">
            <button
              onClick={onOpenTransferModal}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <ArrowUpRight className="w-4 h-4" />
              <span>{t('sendFunds')}</span>
            </button>

            <button
              onClick={onOpenDepositModal}
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Coins className="w-4 h-4" />
              <span>{t('directDeposit')}</span>
            </button>

            <button
              onClick={downloadStatement}
              className="px-4 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>{t('statement')}</span>
            </button>
          </div>
        </div>

        {/* Client Linked Card */}
        <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6 flex flex-col justify-between">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-white flex items-center gap-1.5">
              <CreditCard className="w-4 h-4 text-blue-400" />
              <span>{t('debitCard')}</span>
            </span>
            {clientCards[0] && (
              <span className={`text-[10px] uppercase font-bold ${clientCards[0].status === 'active' ? 'text-emerald-400' : 'text-rose-400'}`}>
                {clientCards[0].status === 'active' ? t('active') : t('locked')}
              </span>
            )}
          </div>

          {clientCards[0] ? (
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-gradient-to-br from-slate-800 to-slate-950 border border-slate-700 text-xs space-y-3 shadow-lg">
                <div className="flex justify-between items-center text-[10px] text-slate-400">
                  <span>BanglaBank Visa</span>
                  <span>{t('expires')}: {clientCards[0].expMonth}/{clientCards[0].expYear}</span>
                </div>
                <div className="font-mono text-sm tracking-wider text-white">
                  {clientCards[0].cardNumberMasked}
                </div>
                <div className="flex justify-between items-end text-[11px] text-slate-300">
                  <span>{clientCards[0].cardholderName}</span>
                  <span className="font-mono text-[10px] text-slate-400">CVV: ***</span>
                </div>
              </div>

              <button
                onClick={() => toggleCardLock(clientCards[0].id)}
                className={`w-full py-2 rounded-lg text-xs font-semibold transition-colors flex items-center justify-center gap-1.5 cursor-pointer ${
                  clientCards[0].status === 'active'
                    ? 'bg-rose-600/20 text-rose-300 border border-rose-500/30 hover:bg-rose-600/30'
                    : 'bg-emerald-600/20 text-emerald-300 border border-emerald-500/30 hover:bg-emerald-600/30'
                }`}
              >
                {clientCards[0].status === 'active' ? (
                  <>
                    <Lock className="w-3.5 h-3.5" />
                    <span>{t('lockCard')}</span>
                  </>
                ) : (
                  <>
                    <Unlock className="w-3.5 h-3.5" />
                    <span>{t('unlockCard')}</span>
                  </>
                )}
              </button>
            </div>
          ) : (
            <div className="p-6 text-center text-slate-500 text-xs">
              {t('noCard')}
            </div>
          )}
        </div>
      </div>

      {/* Client Transaction Statement History */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white tracking-wide">{t('accountActivity')}</h2>
          <span className="text-xs text-slate-500">{clientTransactions.length} {t('items')}</span>
        </div>

        <div className="divide-y divide-slate-800/80 text-xs">
          {clientTransactions.length === 0 ? (
            <div className="p-8 text-center text-slate-400">
              {t('noTransactions')}
            </div>
          ) : (
            clientTransactions.map(tx => {
              const isDebit = tx.accountId === account.id && tx.direction === 'debit';
              return (
                <div
                  key={tx.id}
                  onClick={() => onSelectTransaction(tx)}
                  className="p-4 hover:bg-slate-800/30 transition-colors flex items-center justify-between cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                      isDebit ? 'bg-slate-800 text-slate-400' : 'bg-emerald-500/10 text-emerald-400'
                    }`}>
                      {isDebit ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownLeft className="w-4 h-4" />}
                    </div>
                    <div>
                      <div className="font-semibold text-white">{tx.counterpartyName}</div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-2">
                        <span>{tx.category}</span>
                        <span aria-hidden="true">·</span>
                        <span className="font-mono">{tx.referenceNumber}</span>
                        <span aria-hidden="true">·</span>
                        <span>{tx.timestamp}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right">
                    <div className={`font-mono font-bold tabular-nums ${isDebit ? 'text-slate-200' : 'text-emerald-400'}`}>
                      {isDebit ? '-' : '+'}BDT {tx.amount.toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                    </div>
                    <div className="text-[10px] text-slate-500 capitalize">{tx.status}</div>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};
