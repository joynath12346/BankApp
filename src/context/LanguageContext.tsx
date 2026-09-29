import React, { createContext, useContext, useMemo, useState } from 'react';

export type Language = 'en' | 'bn';

const translations = {
  en: {
    securePortal: 'Secure banking portal', coreBanking: 'Institutional Core Banking', signIn: 'Sign in', register: 'Register',
    fullName: 'Full name', email: 'Email', password: 'Password', loginId: 'Admin ID or customer email',
    createAccount: 'Create customer account', overview: 'Overview', accounts: 'Accounts',
    ledger: 'Ledger & Clearing', credit: 'Credit Facilities', risk: 'Risk & AML', cards: 'Card Fleet',
    vault: 'Vault & FX', role: 'Role', director: 'Branch Director', teller: 'Head Teller / Operations',
    compliance: 'Risk & AML Officer', customer: 'Customer Portal View', transfer: 'Transfer',
    newAccount: 'New Account', sendMoney: 'Send Money', signOut: 'Sign out', language: 'বাংলা',
    digitalBanking: 'Customer Digital Banking Experience', privateSuite: 'Private Client Wealth & Corporate Suite',
    welcomeBack: 'Welcome back', account: 'Account', routing: 'Routing', switchView: 'Switch View',
    executiveConsole: 'Return to Executive Console', portfolio: 'Portfolio', depositProtection: 'Deposit Protection · BDT Account',
    availableTransfer: 'Available to transfer', hold: 'Hold', sendFunds: 'Send Funds / Wire',
    directDeposit: 'Direct Deposit / Funding', statement: 'Official Statement', debitCard: 'Your Debit Card',
    expires: 'EXP', lockCard: 'Lock Card Instantly', unlockCard: 'Unlock Card', noCard: 'No active card linked to this account.',
    accountActivity: 'Account Activity & Clearings', items: 'items', noTransactions: 'No transactions on record for this account.',
    active: 'Active', locked: 'Locked', checking: 'Checking', savings: 'Savings', businessChecking: 'Business Checking', moneyMarket: 'Money Market', treasuryEscrow: 'Treasury Escrow',
    federalReserveAccount: 'Federal Reserve Master Account #021000089', fedwireNode: 'Fedwire Node NY-PRIMARY', allNodesOperational: 'All Nodes Operational',
    controlCenter: 'Branch & Treasury Control Center', controlCenterDescription: 'Real-time core ledger monitoring for New York Flagship (NYC-01), commercial credit underwriting, interbank wire settlements, and compliance risk surveillance.',
    initiateWire: 'Initiate Wire Transfer', openAccount: 'Open Account', totalDeposits: 'Total Customer Deposits', thisMonth: 'this month', activeAccounts: 'active accounts',
    grossLoanBook: 'Gross Loan Book Booked', inUnderwriting: 'in underwriting', nplRatio: 'NPL Ratio', branchVault: 'Branch Physical Vault', audited: 'Audited',
    dailyClearing: 'Daily Clearing Volume', amlAlertsQueued: 'AML alerts queued', zeroExceptions: 'Zero flagged exceptions', totalTransactions: 'total txns',
    depositStructure: 'Deposit Structure', manage: 'Manage', escrow: 'Escrow', ofBook: 'of book', reserveRequirement: 'Statutory Reserve Requirement', reserveHeld: 'reserve held',
    operationalDesks: 'Banking Operational Desks', liveServices: 'Live Services', accountDirectory: 'Account Directory', totalAccounts: 'Total Accounts',
    creditUnderwriting: 'Credit Underwriting', facilitiesActive: 'Facilities Active', amlRiskQueue: 'AML Risk Queue', actionItems: 'Action Items', allCleared: 'All Cleared', issuedCards: 'Issued Cards',
    instant: 'Instant', connected: 'Connected', batchWindow: 'Batch Window', viewVaultRates: 'View Vault & FX Rates', liveJournal: 'Live Transaction Journal',
    journalDescription: 'Recent interbank clearings, wires, and internal book transfers', fullLedger: 'Full Ledger', reference: 'Reference', accountHolder: 'Account & Holder',
    counterpartyNode: 'Counterparty / Clearing Node', type: 'Type', amount: 'Amount', status: 'Status', timestamp: 'Timestamp', action: 'Action', settled: 'Settled', amlFlagged: 'AML Flagged', clearing: 'Clearing', receipt: 'Receipt'
  },
  bn: {
    securePortal: 'নিরাপদ ব্যাংকিং পোর্টাল', coreBanking: 'প্রাতিষ্ঠানিক মূল ব্যাংকিং', signIn: 'লগইন', register: 'নিবন্ধন',
    fullName: 'পূর্ণ নাম', email: 'ইমেইল', password: 'পাসওয়ার্ড', loginId: 'অ্যাডমিন আইডি অথবা গ্রাহকের ইমেইল',
    createAccount: 'গ্রাহক অ্যাকাউন্ট তৈরি করুন', overview: 'সারসংক্ষেপ', accounts: 'অ্যাকাউন্ট',
    ledger: 'লেনদেন ও ক্লিয়ারিং', credit: 'ঋণ সুবিধা', risk: 'ঝুঁকি ও এএমএল', cards: 'কার্ড',
    vault: 'ভল্ট ও বৈদেশিক মুদ্রা', role: 'ভূমিকা', director: 'শাখা পরিচালক', teller: 'প্রধান টেলার / পরিচালনা',
    compliance: 'ঝুঁকি ও এএমএল কর্মকর্তা', customer: 'গ্রাহক পোর্টাল', transfer: 'স্থানান্তর',
    newAccount: 'নতুন অ্যাকাউন্ট', sendMoney: 'টাকা পাঠান', signOut: 'লগআউট', language: 'English',
    digitalBanking: 'গ্রাহক ডিজিটাল ব্যাংকিং সেবা', privateSuite: 'ব্যক্তিগত ও ব্যবসায়িক ব্যাংকিং',
    welcomeBack: 'স্বাগতম', account: 'অ্যাকাউন্ট', routing: 'রাউটিং', switchView: 'অ্যাকাউন্ট দেখুন',
    executiveConsole: 'এক্সিকিউটিভ কনসোলে ফিরুন', portfolio: 'পোর্টফোলিও', depositProtection: 'আমানত সুরক্ষা · বিডিটি অ্যাকাউন্ট',
    availableTransfer: 'স্থানান্তরের জন্য উপলভ্য', hold: 'হোল্ড', sendFunds: 'টাকা পাঠান / ওয়্যার',
    directDeposit: 'সরাসরি জমা / অর্থায়ন', statement: 'অফিসিয়াল বিবরণী', debitCard: 'আপনার ডেবিট কার্ড',
    expires: 'মেয়াদ', lockCard: 'কার্ড তাৎক্ষণিক লক করুন', unlockCard: 'কার্ড আনলক করুন', noCard: 'এই অ্যাকাউন্টে কোনো সক্রিয় কার্ড যুক্ত নেই।',
    accountActivity: 'অ্যাকাউন্ট কার্যক্রম ও ক্লিয়ারিং', items: 'টি লেনদেন', noTransactions: 'এই অ্যাকাউন্টে কোনো লেনদেন নেই।',
    active: 'সক্রিয়', locked: 'লক করা', checking: 'চেকিং', savings: 'সঞ্চয়ী', businessChecking: 'ব্যবসায়িক চেকিং', moneyMarket: 'মানি মার্কেট', treasuryEscrow: 'ট্রেজারি এসক্রো',
    federalReserveAccount: 'ফেডারেল রিজার্ভ মাস্টার অ্যাকাউন্ট #০২১০০০০৮৯', fedwireNode: 'ফেডওয়্যার নোড NY-PRIMARY', allNodesOperational: 'সব নোড সচল',
    controlCenter: 'শাখা ও ট্রেজারি নিয়ন্ত্রণ কেন্দ্র', controlCenterDescription: 'নিউইয়র্ক প্রধান শাখা (NYC-01), বাণিজ্যিক ঋণ যাচাই, আন্তঃব্যাংক ওয়্যার নিষ্পত্তি এবং কমপ্লায়েন্স ঝুঁকির তাৎক্ষণিক পর্যবেক্ষণ।',
    initiateWire: 'ওয়্যার স্থানান্তর শুরু করুন', openAccount: 'অ্যাকাউন্ট খুলুন', totalDeposits: 'মোট গ্রাহক আমানত', thisMonth: 'এই মাসে', activeAccounts: 'সক্রিয় অ্যাকাউন্ট',
    grossLoanBook: 'মোট অনুমোদিত ঋণ', inUnderwriting: 'ঋণ যাচাইাধীন', nplRatio: 'খেলাপি ঋণের হার', branchVault: 'শাখার নগদ ভল্ট', audited: 'নিরীক্ষিত',
    dailyClearing: 'দৈনিক ক্লিয়ারিং পরিমাণ', amlAlertsQueued: 'এএমএল সতর্কতা অপেক্ষমাণ', zeroExceptions: 'কোনো সন্দেহজনক ব্যতিক্রম নেই', totalTransactions: 'মোট লেনদেন',
    depositStructure: 'আমানতের কাঠামো', manage: 'পরিচালনা', escrow: 'এসক্রো', ofBook: 'মোটের', reserveRequirement: 'বিধিবদ্ধ রিজার্ভের প্রয়োজন', reserveHeld: 'রিজার্ভ সংরক্ষিত',
    operationalDesks: 'ব্যাংকিং পরিচালনা বিভাগ', liveServices: 'সচল সেবা', accountDirectory: 'অ্যাকাউন্ট তালিকা', totalAccounts: 'মোট অ্যাকাউন্ট',
    creditUnderwriting: 'ঋণ যাচাই', facilitiesActive: 'সক্রিয় ঋণ সুবিধা', amlRiskQueue: 'এএমএল ঝুঁকি তালিকা', actionItems: 'করণীয় বিষয়', allCleared: 'সব নিষ্পত্তি হয়েছে', issuedCards: 'ইস্যু করা কার্ড',
    instant: 'তাৎক্ষণিক', connected: 'সংযুক্ত', batchWindow: 'ব্যাচ সময়সীমা', viewVaultRates: 'ভল্ট ও বৈদেশিক মুদ্রার হার দেখুন', liveJournal: 'সরাসরি লেনদেন জার্নাল',
    journalDescription: 'সাম্প্রতিক আন্তঃব্যাংক ক্লিয়ারিং, ওয়্যার ও অভ্যন্তরীণ স্থানান্তর', fullLedger: 'সম্পূর্ণ খতিয়ান', reference: 'রেফারেন্স', accountHolder: 'অ্যাকাউন্ট ও গ্রাহক',
    counterpartyNode: 'প্রতিপক্ষ / ক্লিয়ারিং নোড', type: 'ধরন', amount: 'পরিমাণ', status: 'অবস্থা', timestamp: 'সময়', action: 'কার্যক্রম', settled: 'নিষ্পত্তি হয়েছে', amlFlagged: 'এএমএল চিহ্নিত', clearing: 'ক্লিয়ারিং চলছে', receipt: 'রসিদ'
  }
} as const;

type TranslationKey = keyof typeof translations.en;

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
  t: (key: TranslationKey) => string;
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => localStorage.getItem('banglabank_language') === 'bn' ? 'bn' : 'en');
  const setLanguage = (next: Language) => {
    localStorage.setItem('banglabank_language', next);
    setLanguageState(next);
  };
  const value = useMemo(() => ({
    language,
    setLanguage,
    toggleLanguage: () => setLanguage(language === 'en' ? 'bn' : 'en'),
    t: (key: TranslationKey) => translations[language][key]
  }), [language]);

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
}
