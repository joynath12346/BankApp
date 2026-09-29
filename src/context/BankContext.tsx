import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import {
  BankAccount,
  Transaction,
  LoanApplication,
  BankCard,
  AmlAlert,
  BranchVaultState,
  ExchangeRate,
  UserRole,
  AccountStatus,
  LoanType,
  CardTier,
  Currency
} from '../types/bank';
import {
  INITIAL_ACCOUNTS,
  INITIAL_TRANSACTIONS,
  INITIAL_LOANS,
  INITIAL_CARDS,
  INITIAL_AML_ALERTS,
  INITIAL_BRANCH_VAULT,
  INITIAL_EXCHANGE_RATES
} from '../data/mockBankData';
import { db, testFirestoreConnection } from '../services/firebase';
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  onSnapshot,
  getDocs,
  writeBatch
} from 'firebase/firestore';
import { handleFirestoreError, OperationType } from '../services/firestoreErrors';

interface BankContextType {
  accounts: BankAccount[];
  transactions: Transaction[];
  loans: LoanApplication[];
  cards: BankCard[];
  amlAlerts: AmlAlert[];
  vault: BranchVaultState;
  exchangeRates: ExchangeRate[];
  currentRole: UserRole;
  setCurrentRole: (role: UserRole) => void;
  activeCustomerAccountId: string;
  setActiveCustomerAccountId: (id: string) => void;
  selectedAccount: BankAccount | null;
  setSelectedAccount: (account: BankAccount | null) => void;
  
  // Database status
  isDbConnected: boolean;
  dbSyncStatus: 'synced' | 'connecting' | 'offline';
  
  // Actions
  createAccount: (data: Partial<BankAccount>) => BankAccount;
  depositFunds: (accountId: string, amount: number, memo?: string) => boolean;
  withdrawFunds: (accountId: string, amount: number, memo?: string) => { success: boolean; message?: string };
  executeTransfer: (params: {
    sourceAccountId: string;
    targetType: 'internal' | 'domestic_wire' | 'international_swift';
    counterpartyName: string;
    counterpartyBank?: string;
    targetAccountNumber?: string;
    targetAccountId?: string;
    amount: number;
    currency: Currency;
    memo?: string;
  }) => { success: boolean; message?: string; transaction?: Transaction };
  toggleAccountStatus: (accountId: string, newStatus: AccountStatus, reason?: string) => void;
  updateAccountOverdraft: (accountId: string, newLimit: number) => void;
  applyAccountHold: (accountId: string, holdAmount: number, reason: string) => boolean;
  releaseAccountHold: (accountId: string, releaseAmount: number) => boolean;
  
  // Loans
  submitLoanApplication: (data: {
    applicantName: string;
    applicantEmail: string;
    accountId: string;
    loanType: LoanType;
    requestedAmount: number;
    termMonths: number;
    interestRate: number;
    creditScore: number;
    dtiRatio: number;
    collateralDescription?: string;
    collateralValue?: number;
    purpose: string;
  }) => LoanApplication;
  reviewLoan: (loanId: string, decision: 'approved' | 'rejected', notes?: string, approvedAmount?: number) => void;
  disburseLoan: (loanId: string) => { success: boolean; message?: string };
  recordLoanPayment: (loanId: string, amount: number) => { success: boolean; message?: string };

  // Cards
  issueCard: (data: {
    accountId: string;
    cardholderName: string;
    tier: CardTier;
    dailyLimit: number;
  }) => BankCard;
  toggleCardLock: (cardId: string) => void;
  updateCardSettings: (cardId: string, updates: Partial<BankCard>) => void;

  // Compliance
  resolveAmlAlert: (alertId: string, status: 'cleared' | 'escalated_sar' | 'account_frozen', notes: string) => void;

  // Vault & FX
  reconcileEodVault: (countedCash: number, auditor: string) => void;
  resetDemoData: () => void;
}

const BankContext = createContext<BankContextType | undefined>(undefined);

const STORAGE_KEYS = {
  ACCOUNTS: 'aegis_bank_accounts_v1',
  TRANSACTIONS: 'aegis_bank_transactions_v1',
  LOANS: 'aegis_bank_loans_v1',
  CARDS: 'aegis_bank_cards_v1',
  ALERTS: 'aegis_bank_alerts_v1',
  VAULT: 'aegis_bank_vault_v1',
  ROLE: 'aegis_bank_role_v1',
  CLIENT_ACC: 'aegis_bank_client_acc_v1'
};

export const BankProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accounts, setAccounts] = useState<BankAccount[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ACCOUNTS);
    const loaded: BankAccount[] = saved ? JSON.parse(saved) : INITIAL_ACCOUNTS;
    return loaded.map(account => ({
      ...account,
      currency: account.currency === 'USD' ? 'BDT' : account.currency
    }));
  });

  const [transactions, setTransactions] = useState<Transaction[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
    const loaded: Transaction[] = saved ? JSON.parse(saved) : INITIAL_TRANSACTIONS;
    return loaded.map(transaction => ({
      ...transaction,
      currency: transaction.currency === 'USD' ? 'BDT' : transaction.currency
    }));
  });

  const [loans, setLoans] = useState<LoanApplication[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.LOANS);
    return saved ? JSON.parse(saved) : INITIAL_LOANS;
  });

  const [cards, setCards] = useState<BankCard[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CARDS);
    return saved ? JSON.parse(saved) : INITIAL_CARDS;
  });

  const [amlAlerts, setAmlAlerts] = useState<AmlAlert[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ALERTS);
    const loaded: AmlAlert[] = saved ? JSON.parse(saved) : INITIAL_AML_ALERTS;
    return loaded.map(alert => ({
      ...alert,
      currency: alert.currency === 'USD' ? 'BDT' : alert.currency
    }));
  });

  const [vault, setVault] = useState<BranchVaultState>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.VAULT);
    return saved ? JSON.parse(saved) : INITIAL_BRANCH_VAULT;
  });

  const [exchangeRates] = useState<ExchangeRate[]>(INITIAL_EXCHANGE_RATES);
  const [currentRole, setCurrentRole] = useState<UserRole>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.ROLE);
    return (saved as UserRole) || 'director';
  });

  const [activeCustomerAccountId, setActiveCustomerAccountId] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.CLIENT_ACC);
    return saved || 'acc-002';
  });

  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
  const [isDbConnected, setIsDbConnected] = useState<boolean>(false);
  const [dbSyncStatus, setDbSyncStatus] = useState<'synced' | 'connecting' | 'offline'>('connecting');
  const isInitialSeeded = useRef<boolean>(false);

  // Firestore Seed & Real-Time Synchronization
  useEffect(() => {
    let unsubscribeAccounts: () => void = () => {};
    let unsubscribeTx: () => void = () => {};
    let unsubscribeLoans: () => void = () => {};
    let unsubscribeCards: () => void = () => {};
    let unsubscribeAlerts: () => void = () => {};
    let unsubscribeVault: () => void = () => {};

    const initFirestoreSync = async () => {
      try {
        const connected = await testFirestoreConnection();
        setIsDbConnected(connected);

        // Check if accounts collection exists/empty
        const accountsCol = collection(db, 'accounts');
        const snap = await getDocs(accountsCol);

        if (snap.empty && !isInitialSeeded.current) {
          isInitialSeeded.current = true;
          // Seed initial database records into Firestore
          const batch = writeBatch(db);

          INITIAL_ACCOUNTS.forEach(acc => {
            batch.set(doc(db, 'accounts', acc.id), acc);
          });

          INITIAL_TRANSACTIONS.forEach(tx => {
            batch.set(doc(db, 'transactions', tx.id), tx);
          });

          INITIAL_LOANS.forEach(ln => {
            batch.set(doc(db, 'loans', ln.id), ln);
          });

          INITIAL_CARDS.forEach(c => {
            batch.set(doc(db, 'cards', c.id), c);
          });

          INITIAL_AML_ALERTS.forEach(a => {
            batch.set(doc(db, 'aml_alerts', a.id), a);
          });

          batch.set(doc(db, 'vault', 'NYC-01'), INITIAL_BRANCH_VAULT);
          await batch.commit();
        }

        // Attach Real-Time Listeners
        unsubscribeAccounts = onSnapshot(
          collection(db, 'accounts'),
          snapshot => {
            if (!snapshot.empty) {
              const loadedAccounts = snapshot.docs.map(d => d.data() as BankAccount);
              setAccounts(loadedAccounts);
              setDbSyncStatus('synced');
            }
          },
          error => {
            handleFirestoreError(error, OperationType.LIST, 'accounts', null);
          }
        );

        unsubscribeTx = onSnapshot(
          collection(db, 'transactions'),
          snapshot => {
            if (!snapshot.empty) {
              const loadedTx = snapshot.docs.map(d => d.data() as Transaction);
              // Sort descending by timestamp
              loadedTx.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
              setTransactions(loadedTx);
            }
          },
          error => {
            handleFirestoreError(error, OperationType.LIST, 'transactions', null);
          }
        );

        unsubscribeLoans = onSnapshot(
          collection(db, 'loans'),
          snapshot => {
            if (!snapshot.empty) {
              const loadedLoans = snapshot.docs.map(d => d.data() as LoanApplication);
              setLoans(loadedLoans);
            }
          },
          error => {
            handleFirestoreError(error, OperationType.LIST, 'loans', null);
          }
        );

        unsubscribeCards = onSnapshot(
          collection(db, 'cards'),
          snapshot => {
            if (!snapshot.empty) {
              const loadedCards = snapshot.docs.map(d => d.data() as BankCard);
              setCards(loadedCards);
            }
          },
          error => {
            handleFirestoreError(error, OperationType.LIST, 'cards', null);
          }
        );

        unsubscribeAlerts = onSnapshot(
          collection(db, 'aml_alerts'),
          snapshot => {
            if (!snapshot.empty) {
              const loadedAlerts = snapshot.docs.map(d => d.data() as AmlAlert);
              setAmlAlerts(loadedAlerts);
            }
          },
          error => {
            handleFirestoreError(error, OperationType.LIST, 'aml_alerts', null);
          }
        );

        unsubscribeVault = onSnapshot(
          doc(db, 'vault', 'NYC-01'),
          snapshot => {
            if (snapshot.exists()) {
              setVault(snapshot.data() as BranchVaultState);
            }
          },
          error => {
            handleFirestoreError(error, OperationType.GET, 'vault/NYC-01', null);
          }
        );

        setDbSyncStatus('synced');
        setIsDbConnected(true);
      } catch (err) {
        console.warn('Firestore initial synchronization notice:', err);
        setDbSyncStatus('offline');
      }
    };

    initFirestoreSync();

    return () => {
      unsubscribeAccounts();
      unsubscribeTx();
      unsubscribeLoans();
      unsubscribeCards();
      unsubscribeAlerts();
      unsubscribeVault();
    };
  }, []);

  // Sync state to LocalStorage as instant local cache
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ACCOUNTS, JSON.stringify(accounts));
  }, [accounts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
  }, [transactions]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.LOANS, JSON.stringify(loans));
  }, [loans]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CARDS, JSON.stringify(cards));
  }, [cards]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ALERTS, JSON.stringify(amlAlerts));
  }, [amlAlerts]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.VAULT, JSON.stringify(vault));
  }, [vault]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.ROLE, currentRole);
  }, [currentRole]);

  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.CLIENT_ACC, activeCustomerAccountId);
  }, [activeCustomerAccountId]);

  // Sync selected account with latest accounts list
  useEffect(() => {
    if (selectedAccount) {
      const updated = accounts.find(a => a.id === selectedAccount.id);
      if (updated) setSelectedAccount(updated);
    }
  }, [accounts]);

  const generateAccountNumber = () => {
    const p1 = '4820';
    const p2 = Math.floor(1000 + Math.random() * 9000).toString();
    const p3 = Math.floor(1000 + Math.random() * 9000).toString();
    return `${p1}-${p2}-${p3}`;
  };

  const createAccount = (data: Partial<BankAccount>): BankAccount => {
    const id = `acc-${Date.now().toString().slice(-4)}`;
    const accNumber = data.accountNumber || generateAccountNumber();
    const initialBal = Number(data.balance) || 0;
    
    const newAcc: BankAccount = {
      id,
      accountNumber: accNumber,
      routingNumber: '021000089',
      swiftBic: 'AEGSHZUS33',
      accountHolderName: data.accountHolderName || 'New Account Holder',
      accountHolderEmail: data.accountHolderEmail || 'customer@aegisbank.com',
      accountHolderPhone: data.accountHolderPhone || '+1 (555) 012-3456',
      companyName: data.companyName || '',
      type: data.type || 'checking',
      currency: data.currency || 'BDT',
      balance: initialBal,
      availableBalance: initialBal,
      holdBalance: 0,
      overdraftLimit: Number(data.overdraftLimit) || 1000,
      status: 'active',
      kycTier: data.kycTier || 1,
      openedDate: new Date().toISOString().slice(0, 10),
      branchCode: 'NYC-01',
      interestRateAnnual: data.interestRateAnnual || 1.5,
      notes: data.notes || 'Created via Bank Operations Wizard.'
    };

    setAccounts(prev => [newAcc, ...prev]);

    // Persist to Firestore
    setDoc(doc(db, 'accounts', newAcc.id), newAcc).catch(err => {
      handleFirestoreError(err, OperationType.WRITE, `accounts/${newAcc.id}`, null);
    });

    if (initialBal > 0) {
      const initialTx: Transaction = {
        id: `tx-${Date.now()}`,
        referenceNumber: `TXN-DEP-${Date.now().toString().slice(-6)}`,
        accountId: id,
        accountNumber: accNumber,
        accountHolderName: newAcc.accountHolderName,
        counterpartyName: 'Branch Initial Vault Inflow',
        counterpartyBank: 'BanglaBank',
        type: 'deposit',
        category: 'Account Funding',
        amount: initialBal,
        currency: newAcc.currency,
        direction: 'credit',
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        status: 'settled',
        riskScore: 2,
        fee: 0,
        memo: 'Initial account activation deposit'
      };
      setTransactions(prev => [initialTx, ...prev]);
      setDoc(doc(db, 'transactions', initialTx.id), initialTx).catch(err => {
        handleFirestoreError(err, OperationType.WRITE, `transactions/${initialTx.id}`, null);
      });
    }

    return newAcc;
  };

  const depositFunds = (accountId: string, amount: number, memo?: string): boolean => {
    const acc = accounts.find(a => a.id === accountId);
    if (!acc || acc.status === 'frozen') return false;

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) return false;

    const newBal = acc.balance + numAmount;
    const updatedAccount = {
      ...acc,
      balance: newBal,
      availableBalance: newBal - acc.holdBalance
    };

    setAccounts(prev =>
      prev.map(a => (a.id === accountId ? updatedAccount : a))
    );

    // Persist account to Firestore
    updateDoc(doc(db, 'accounts', accountId), {
      balance: updatedAccount.balance,
      availableBalance: updatedAccount.availableBalance
    }).catch(err => {
      handleFirestoreError(err, OperationType.UPDATE, `accounts/${accountId}`, null);
    });

    const tx: Transaction = {
      id: `tx-${Date.now()}`,
      referenceNumber: `TXN-DEP-${Date.now().toString().slice(-6)}`,
      accountId: acc.id,
      accountNumber: acc.accountNumber,
      accountHolderName: acc.accountHolderName,
      counterpartyName: 'Branch Cash / Direct Remittance',
      counterpartyBank: 'BanglaBank',
      type: 'deposit',
      category: 'Cash & Remittance Deposit',
      amount: numAmount,
      currency: acc.currency,
      direction: 'credit',
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      status: 'settled',
      riskScore: numAmount > 10000 ? 35 : 4,
      fee: 0,
      memo: memo || 'In-branch counter deposit'
    };

    setTransactions(prev => [tx, ...prev]);
    setDoc(doc(db, 'transactions', tx.id), tx).catch(err => {
      handleFirestoreError(err, OperationType.WRITE, `transactions/${tx.id}`, null);
    });

    // Update branch vault cash
    const newVaultCash = vault.vaultCashUSD + (acc.currency === 'BDT' ? numAmount : numAmount * 1.08);
    setVault(v => ({
      ...v,
      vaultCashUSD: newVaultCash
    }));
    updateDoc(doc(db, 'vault', 'NYC-01'), { vaultCashUSD: newVaultCash }).catch(err => {
      handleFirestoreError(err, OperationType.UPDATE, 'vault/NYC-01', null);
    });

    return true;
  };

  const withdrawFunds = (accountId: string, amount: number, memo?: string) => {
    const acc = accounts.find(a => a.id === accountId);
    if (!acc) return { success: false, message: 'Account not found' };
    if (acc.status === 'frozen' || acc.status === 'restricted') {
      return { success: false, message: `Account is ${acc.status}. Withdrawals blocked.` };
    }

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) return { success: false, message: 'Invalid amount' };

    const totalAllowed = acc.availableBalance + acc.overdraftLimit;
    if (numAmount > totalAllowed) {
      return { success: false, message: 'Insufficient funds (exceeds available balance + overdraft limit)' };
    }

    const newBal = acc.balance - numAmount;
    const updatedAccount = {
      ...acc,
      balance: newBal,
      availableBalance: newBal - acc.holdBalance
    };

    setAccounts(prev =>
      prev.map(a => (a.id === accountId ? updatedAccount : a))
    );

    updateDoc(doc(db, 'accounts', accountId), {
      balance: updatedAccount.balance,
      availableBalance: updatedAccount.availableBalance
    }).catch(err => {
      handleFirestoreError(err, OperationType.UPDATE, `accounts/${accountId}`, null);
    });

    const tx: Transaction = {
      id: `tx-${Date.now()}`,
      referenceNumber: `TXN-WTH-${Date.now().toString().slice(-6)}`,
      accountId: acc.id,
      accountNumber: acc.accountNumber,
      accountHolderName: acc.accountHolderName,
      counterpartyName: 'Teller Cash Drawer #1',
      counterpartyBank: 'BanglaBank',
      type: 'withdrawal',
      category: 'Counter Cash Withdrawal',
      amount: numAmount,
      currency: acc.currency,
      direction: 'debit',
      timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
      status: 'settled',
      riskScore: numAmount >= 10000 ? 55 : 5,
      fee: 0,
      memo: memo || 'Authorized branch counter withdrawal'
    };

    setTransactions(prev => [tx, ...prev]);
    setDoc(doc(db, 'transactions', tx.id), tx).catch(err => {
      handleFirestoreError(err, OperationType.WRITE, `transactions/${tx.id}`, null);
    });

    // Subtract from vault
    const newVaultCash = Math.max(0, vault.vaultCashUSD - (acc.currency === 'BDT' ? numAmount : numAmount * 1.08));
    setVault(v => ({
      ...v,
      vaultCashUSD: newVaultCash
    }));
    updateDoc(doc(db, 'vault', 'NYC-01'), { vaultCashUSD: newVaultCash }).catch(err => {
      handleFirestoreError(err, OperationType.UPDATE, 'vault/NYC-01', null);
    });

    return { success: true };
  };

  const executeTransfer = (params: {
    sourceAccountId: string;
    targetType: 'internal' | 'domestic_wire' | 'international_swift';
    counterpartyName: string;
    counterpartyBank?: string;
    targetAccountNumber?: string;
    targetAccountId?: string;
    amount: number;
    currency: Currency;
    memo?: string;
  }) => {
    const { sourceAccountId, targetType, counterpartyName, counterpartyBank, targetAccountNumber, targetAccountId, amount, currency, memo } = params;
    const sourceAcc = accounts.find(a => a.id === sourceAccountId);

    if (!sourceAcc) return { success: false, message: 'Source account not found' };
    if (sourceAcc.status === 'frozen') return { success: false, message: 'Source account is frozen by compliance.' };

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) return { success: false, message: 'Invalid transfer amount' };

    const fee = targetType === 'international_swift' ? 45.00 : targetType === 'domestic_wire' ? 25.00 : 0.00;
    const totalDeduction = numAmount + fee;

    if (totalDeduction > sourceAcc.availableBalance + sourceAcc.overdraftLimit) {
      return { success: false, message: `Insufficient funds. Transfer requires ${sourceAcc.currency} ${totalDeduction.toFixed(2)} (including fee).` };
    }

    // Determine AML risk score
    let riskScore = 5;
    let isFlagged = false;
    let flagReason = '';

    if (numAmount >= 100000) {
      riskScore = 80;
      isFlagged = true;
      flagReason = 'High value clearing exceeding BDT 100,000 threshold';
    } else if (targetType === 'international_swift' && numAmount >= 25000) {
      riskScore = 72;
      isFlagged = true;
      flagReason = 'Cross-border foreign wire exceeding velocity thresholds';
    } else if (numAmount >= 9000 && numAmount < 10000) {
      riskScore = 88;
      isFlagged = true;
      flagReason = 'Potential Structuring / BSA Threshold Avoidance (BDT 9,000 - BDT 9,999)';
    }

    const txStatus = isFlagged ? 'flagged' : 'settled';
    const refCode = `TXN-${targetType === 'international_swift' ? 'SWF' : targetType === 'domestic_wire' ? 'FED' : 'INT'}-${Date.now().toString().slice(-6)}`;

    // Debit source account
    const newSourceBal = sourceAcc.balance - totalDeduction;
    const updatedSource = {
      ...sourceAcc,
      balance: newSourceBal,
      availableBalance: newSourceBal - sourceAcc.holdBalance
    };

    setAccounts(prev =>
      prev.map(a => {
        if (a.id === sourceAccountId) return updatedSource;
        if (targetType === 'internal' && targetAccountId && a.id === targetAccountId) {
          const newBal = a.balance + numAmount;
          return {
            ...a,
            balance: newBal,
            availableBalance: newBal - a.holdBalance
          };
        }
        return a;
      })
    );

    updateDoc(doc(db, 'accounts', sourceAccountId), {
      balance: updatedSource.balance,
      availableBalance: updatedSource.availableBalance
    }).catch(err => {
      handleFirestoreError(err, OperationType.UPDATE, `accounts/${sourceAccountId}`, null);
    });

    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);

    const sourceTx: Transaction = {
      id: `tx-${Date.now()}`,
      referenceNumber: refCode,
      accountId: sourceAcc.id,
      accountNumber: sourceAcc.accountNumber,
      accountHolderName: sourceAcc.accountHolderName,
      targetAccountId,
      targetAccountNumber: targetAccountNumber || 'EXTERNAL-CLEARING',
      counterpartyName,
      counterpartyBank: counterpartyBank || (targetType === 'internal' ? 'BanglaBank' : 'External Bank Network'),
      type: targetType === 'internal' ? 'internal_transfer' : 'wire_clearing',
      category: targetType === 'internal' ? 'Book Transfer' : targetType === 'international_swift' ? 'SWIFT Wire' : 'Fedwire Domestic',
      amount: numAmount,
      currency,
      direction: 'debit',
      timestamp: nowStr,
      status: txStatus,
      riskScore,
      amlNotes: isFlagged ? flagReason : undefined,
      fee,
      memo: memo || 'Electronic funds transfer'
    };

    setTransactions(prev => [sourceTx, ...prev]);
    setDoc(doc(db, 'transactions', sourceTx.id), sourceTx).catch(err => {
      handleFirestoreError(err, OperationType.WRITE, `transactions/${sourceTx.id}`, null);
    });

    // If internal transfer, create recipient transaction and update recipient account
    if (targetType === 'internal' && targetAccountId) {
      const recipientAcc = accounts.find(a => a.id === targetAccountId);
      if (recipientAcc) {
        const newRecipBal = recipientAcc.balance + numAmount;
        updateDoc(doc(db, 'accounts', targetAccountId), {
          balance: newRecipBal,
          availableBalance: newRecipBal - recipientAcc.holdBalance
        }).catch(err => {
          handleFirestoreError(err, OperationType.UPDATE, `accounts/${targetAccountId}`, null);
        });

        const recipTx: Transaction = {
          id: `tx-${Date.now() + 1}`,
          referenceNumber: `${refCode}-CR`,
          accountId: recipientAcc.id,
          accountNumber: recipientAcc.accountNumber,
          accountHolderName: recipientAcc.accountHolderName,
          targetAccountId: sourceAcc.id,
          targetAccountNumber: sourceAcc.accountNumber,
          counterpartyName: sourceAcc.accountHolderName,
          counterpartyBank: 'BanglaBank',
          type: 'internal_transfer',
          category: 'Book Transfer Credit',
          amount: numAmount,
          currency,
          direction: 'credit',
          timestamp: nowStr,
          status: 'settled',
          riskScore: 2,
          fee: 0,
          memo: `Transfer received from ${sourceAcc.accountHolderName}: ${memo || ''}`
        };
        setTransactions(prev => [recipTx, ...prev]);
        setDoc(doc(db, 'transactions', recipTx.id), recipTx).catch(err => {
          handleFirestoreError(err, OperationType.WRITE, `transactions/${recipTx.id}`, null);
        });
      }
    }

    // If flagged, append to AML Alerts
    if (isFlagged) {
      const newAlert: AmlAlert = {
        id: `aml-${Date.now()}`,
        transactionId: sourceTx.id,
        referenceNumber: refCode,
        accountId: sourceAcc.id,
        accountNumber: sourceAcc.accountNumber,
        customerName: sourceAcc.accountHolderName,
        severity: riskScore > 80 ? 'critical' : 'high',
        flagType: numAmount >= 9000 && numAmount < 10000 ? 'structuring_detection' : 'high_value_wire',
        description: flagReason,
        amount: numAmount,
        currency,
        flaggedAt: nowStr,
        status: 'investigating',
        assignedTo: 'Compliance Officer (Queued for Review)'
      };
      setAmlAlerts(prev => [newAlert, ...prev]);
      setDoc(doc(db, 'aml_alerts', newAlert.id), newAlert).catch(err => {
        handleFirestoreError(err, OperationType.WRITE, `aml_alerts/${newAlert.id}`, null);
      });
    }

    return { success: true, transaction: sourceTx };
  };

  const toggleAccountStatus = (accountId: string, newStatus: AccountStatus, reason?: string) => {
    setAccounts(prev =>
      prev.map(a => {
        if (a.id === accountId) {
          const updated = {
            ...a,
            status: newStatus,
            notes: reason ? `${a.notes || ''} [Status changed to ${newStatus}: ${reason}]` : a.notes
          };
          updateDoc(doc(db, 'accounts', accountId), { status: newStatus, notes: updated.notes }).catch(err => {
            handleFirestoreError(err, OperationType.UPDATE, `accounts/${accountId}`, null);
          });
          return updated;
        }
        return a;
      })
    );
  };

  const updateAccountOverdraft = (accountId: string, newLimit: number) => {
    setAccounts(prev =>
      prev.map(a => {
        if (a.id === accountId) {
          const lim = Math.max(0, newLimit);
          updateDoc(doc(db, 'accounts', accountId), { overdraftLimit: lim }).catch(err => {
            handleFirestoreError(err, OperationType.UPDATE, `accounts/${accountId}`, null);
          });
          return { ...a, overdraftLimit: lim };
        }
        return a;
      })
    );
  };

  const applyAccountHold = (accountId: string, holdAmount: number, reason: string): boolean => {
    const acc = accounts.find(a => a.id === accountId);
    if (!acc) return false;
    const numHold = Number(holdAmount);
    if (isNaN(numHold) || numHold <= 0) return false;

    const newHold = acc.holdBalance + numHold;
    const newAvail = Math.max(0, acc.balance - newHold);
    const newNotes = `${acc.notes || ''} [Hold applied: BDT ${numHold.toLocaleString()} - ${reason}]`;

    setAccounts(prev =>
      prev.map(a =>
        a.id === accountId
          ? { ...a, holdBalance: newHold, availableBalance: newAvail, notes: newNotes }
          : a
      )
    );

    updateDoc(doc(db, 'accounts', accountId), {
      holdBalance: newHold,
      availableBalance: newAvail,
      notes: newNotes
    }).catch(err => {
      handleFirestoreError(err, OperationType.UPDATE, `accounts/${accountId}`, null);
    });

    return true;
  };

  const releaseAccountHold = (accountId: string, releaseAmount: number): boolean => {
    const acc = accounts.find(a => a.id === accountId);
    if (!acc) return false;
    const numRelease = Number(releaseAmount);
    if (isNaN(numRelease) || numRelease <= 0) return false;

    const newHold = Math.max(0, acc.holdBalance - numRelease);
    const newAvail = acc.balance - newHold;

    setAccounts(prev =>
      prev.map(a =>
        a.id === accountId
          ? { ...a, holdBalance: newHold, availableBalance: newAvail }
          : a
      )
    );

    updateDoc(doc(db, 'accounts', accountId), {
      holdBalance: newHold,
      availableBalance: newAvail
    }).catch(err => {
      handleFirestoreError(err, OperationType.UPDATE, `accounts/${accountId}`, null);
    });

    return true;
  };

  const submitLoanApplication = (data: {
    applicantName: string;
    applicantEmail: string;
    accountId: string;
    loanType: LoanType;
    requestedAmount: number;
    termMonths: number;
    interestRate: number;
    creditScore: number;
    dtiRatio: number;
    collateralDescription?: string;
    collateralValue?: number;
    purpose: string;
  }): LoanApplication => {
    const acc = accounts.find(a => a.id === data.accountId);
    const r = data.interestRate / 100 / 12;
    const n = data.termMonths;
    const p = data.requestedAmount;
    const monthlyPayment = (p * (r * Math.pow(1 + r, n))) / (Math.pow(1 + r, n) - 1);

    const newLoan: LoanApplication = {
      id: `loan-${Date.now().toString().slice(-4)}`,
      loanNumber: `LN-${data.loanType.slice(0, 3).toUpperCase()}-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      applicantName: data.applicantName,
      applicantEmail: data.applicantEmail,
      accountId: data.accountId,
      accountNumber: acc?.accountNumber || 'PENDING',
      loanType: data.loanType,
      requestedAmount: data.requestedAmount,
      termMonths: data.termMonths,
      interestRate: data.interestRate,
      monthlyPayment: Number(monthlyPayment.toFixed(2)),
      creditScore: data.creditScore,
      dtiRatio: data.dtiRatio,
      collateralDescription: data.collateralDescription,
      collateralValue: data.collateralValue,
      status: 'submitted',
      createdAt: new Date().toISOString().slice(0, 10),
      purpose: data.purpose,
      totalPaid: 0,
      remainingBalance: data.requestedAmount
    };

    setLoans(prev => [newLoan, ...prev]);
    setDoc(doc(db, 'loans', newLoan.id), newLoan).catch(err => {
      handleFirestoreError(err, OperationType.WRITE, `loans/${newLoan.id}`, null);
    });

    return newLoan;
  };

  const reviewLoan = (loanId: string, decision: 'approved' | 'rejected', notes?: string, approvedAmount?: number) => {
    setLoans(prev =>
      prev.map(l => {
        if (l.id === loanId) {
          const appAmt = approvedAmount || l.requestedAmount;
          const updated = {
            ...l,
            status: decision,
            approvedAmount: decision === 'approved' ? appAmt : undefined,
            remainingBalance: decision === 'approved' ? appAmt : l.remainingBalance,
            approvedAt: decision === 'approved' ? new Date().toISOString().slice(0, 10) : undefined,
            reviewedBy: 'Marcus Sterling (Senior Underwriting Director)',
            notes: notes ? `${l.notes || ''} [Underwriting ${decision}: ${notes}]` : l.notes
          };

          updateDoc(doc(db, 'loans', loanId), updated).catch(err => {
            handleFirestoreError(err, OperationType.UPDATE, `loans/${loanId}`, null);
          });

          return updated;
        }
        return l;
      })
    );
  };

  const disburseLoan = (loanId: string) => {
    const loan = loans.find(l => l.id === loanId);
    if (!loan) return { success: false, message: 'Loan application not found' };
    if (loan.status !== 'approved') return { success: false, message: 'Loan must be approved before disbursement' };

    const acc = accounts.find(a => a.id === loan.accountId);
    if (!acc) return { success: false, message: 'Borrower bank account not linked' };

    const disburseAmt = loan.approvedAmount || loan.requestedAmount;

    // Credit borrower's account
    const newBal = acc.balance + disburseAmt;
    setAccounts(prev =>
      prev.map(a => (a.id === acc.id ? { ...a, balance: newBal, availableBalance: newBal - a.holdBalance } : a))
    );

    updateDoc(doc(db, 'accounts', acc.id), {
      balance: newBal,
      availableBalance: newBal - acc.holdBalance
    }).catch(err => {
      handleFirestoreError(err, OperationType.UPDATE, `accounts/${acc.id}`, null);
    });

    // Create loan disbursement transaction
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const tx: Transaction = {
      id: `tx-${Date.now()}`,
      referenceNumber: `TXN-LON-${Date.now().toString().slice(-6)}`,
      accountId: acc.id,
      accountNumber: acc.accountNumber,
      accountHolderName: acc.accountHolderName,
      counterpartyName: 'BanglaBank Credit Facilities Desk',
      counterpartyBank: 'BanglaBank',
      type: 'loan_disbursement',
      category: 'Credit Facility',
      amount: disburseAmt,
      currency: acc.currency,
      direction: 'credit',
      timestamp: nowStr,
      status: 'settled',
      riskScore: 8,
      fee: 250,
      memo: `Disbursement of ${loan.loanNumber} (${loan.purpose})`
    };

    setTransactions(prev => [tx, ...prev]);
    setDoc(doc(db, 'transactions', tx.id), tx).catch(err => {
      handleFirestoreError(err, OperationType.WRITE, `transactions/${tx.id}`, null);
    });

    // Update loan status to disbursed
    setLoans(prev =>
      prev.map(l => (l.id === loanId ? { ...l, status: 'disbursed', disbursedAt: nowStr.slice(0, 10) } : l))
    );

    updateDoc(doc(db, 'loans', loanId), {
      status: 'disbursed',
      disbursedAt: nowStr.slice(0, 10)
    }).catch(err => {
      handleFirestoreError(err, OperationType.UPDATE, `loans/${loanId}`, null);
    });

    return { success: true };
  };

  const recordLoanPayment = (loanId: string, amount: number) => {
    const loan = loans.find(l => l.id === loanId);
    if (!loan) return { success: false, message: 'Loan not found' };
    if (loan.status !== 'disbursed') return { success: false, message: 'Only disbursed loans can receive payments' };

    const numAmt = Number(amount);
    if (isNaN(numAmt) || numAmt <= 0) return { success: false, message: 'Invalid payment amount' };

    const newRemaining = Math.max(0, loan.remainingBalance - numAmt);
    const isFullyPaid = newRemaining === 0;

    const updatedLoan = {
      ...loan,
      totalPaid: loan.totalPaid + numAmt,
      remainingBalance: newRemaining,
      status: (isFullyPaid ? 'repaid' : 'disbursed') as LoanApplication['status']
    };

    setLoans(prev => prev.map(l => (l.id === loanId ? updatedLoan : l)));
    updateDoc(doc(db, 'loans', loanId), {
      totalPaid: updatedLoan.totalPaid,
      remainingBalance: updatedLoan.remainingBalance,
      status: updatedLoan.status
    }).catch(err => {
      handleFirestoreError(err, OperationType.UPDATE, `loans/${loanId}`, null);
    });

    // Debit payment from borrower account if available
    const acc = accounts.find(a => a.id === loan.accountId);
    if (acc) {
      const newBal = acc.balance - numAmt;
      setAccounts(prev =>
        prev.map(a => (a.id === acc.id ? { ...a, balance: newBal, availableBalance: newBal - a.holdBalance } : a))
      );

      updateDoc(doc(db, 'accounts', acc.id), {
        balance: newBal,
        availableBalance: newBal - acc.holdBalance
      }).catch(err => {
        handleFirestoreError(err, OperationType.UPDATE, `accounts/${acc.id}`, null);
      });

      const tx: Transaction = {
        id: `tx-${Date.now()}`,
        referenceNumber: `TXN-REP-${Date.now().toString().slice(-6)}`,
        accountId: acc.id,
        accountNumber: acc.accountNumber,
        accountHolderName: acc.accountHolderName,
        counterpartyName: 'BanglaBank Loan Servicing Escrow',
        counterpartyBank: 'BanglaBank',
        type: 'loan_repayment',
        category: 'Debt Amortization',
        amount: numAmt,
        currency: acc.currency,
        direction: 'debit',
        timestamp: new Date().toISOString().replace('T', ' ').slice(0, 19),
        status: 'settled',
        riskScore: 1,
        fee: 0,
        memo: `Principal & interest payment for ${loan.loanNumber}`
      };
      setTransactions(prev => [tx, ...prev]);
      setDoc(doc(db, 'transactions', tx.id), tx).catch(err => {
        handleFirestoreError(err, OperationType.WRITE, `transactions/${tx.id}`, null);
      });
    }

    return { success: true };
  };

  const issueCard = (data: {
    accountId: string;
    cardholderName: string;
    tier: CardTier;
    dailyLimit: number;
  }): BankCard => {
    const acc = accounts.find(a => a.id === data.accountId);
    const randomSuffix = Math.floor(1000 + Math.random() * 9000).toString();
    const fullNumber = `4111 ${Math.floor(1000 + Math.random() * 9000)} ${Math.floor(1000 + Math.random() * 9000)} ${randomSuffix}`;

    const newCard: BankCard = {
      id: `crd-${Date.now().toString().slice(-4)}`,
      accountId: data.accountId,
      accountNumber: acc?.accountNumber || '4820-0000-0000',
      cardholderName: data.cardholderName.toUpperCase(),
      cardNumberMasked: `4111 •••• •••• ${randomSuffix}`,
      fullCardNumberVirtual: fullNumber,
      expMonth: '09',
      expYear: '30',
      cvv: Math.floor(100 + Math.random() * 900).toString(),
      pin: Math.floor(1000 + Math.random() * 9000).toString(),
      tier: data.tier,
      cardBrand: 'Visa',
      status: 'active',
      dailyLimit: data.dailyLimit,
      spentToday: 0,
      internationalAllowed: true,
      atmWithdrawalAllowed: true,
      onlineAllowed: true,
      contactlessAllowed: true,
      issuedDate: new Date().toISOString().slice(0, 10)
    };

    setCards(prev => [newCard, ...prev]);
    setDoc(doc(db, 'cards', newCard.id), newCard).catch(err => {
      handleFirestoreError(err, OperationType.WRITE, `cards/${newCard.id}`, null);
    });

    return newCard;
  };

  const toggleCardLock = (cardId: string) => {
    setCards(prev =>
      prev.map(c => {
        if (c.id === cardId) {
          const newStatus = c.status === 'active' ? 'locked' : 'active';
          updateDoc(doc(db, 'cards', cardId), { status: newStatus }).catch(err => {
            handleFirestoreError(err, OperationType.UPDATE, `cards/${cardId}`, null);
          });
          return { ...c, status: newStatus };
        }
        return c;
      })
    );
  };

  const updateCardSettings = (cardId: string, updates: Partial<BankCard>) => {
    setCards(prev =>
      prev.map(c => {
        if (c.id === cardId) {
          const updated = { ...c, ...updates };
          updateDoc(doc(db, 'cards', cardId), updates).catch(err => {
            handleFirestoreError(err, OperationType.UPDATE, `cards/${cardId}`, null);
          });
          return updated;
        }
        return c;
      })
    );
  };

  const resolveAmlAlert = (alertId: string, status: 'cleared' | 'escalated_sar' | 'account_frozen', notes: string) => {
    const targetAlert = amlAlerts.find(a => a.id === alertId);
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);

    setAmlAlerts(prev =>
      prev.map(a => {
        if (a.id === alertId) {
          const updated = {
            ...a,
            status,
            notes: notes ? `${a.notes || ''} [Compliance Action: ${status.toUpperCase()} - ${notes}]` : a.notes,
            actionTimestamp: nowStr
          };
          updateDoc(doc(db, 'aml_alerts', alertId), {
            status: updated.status,
            notes: updated.notes,
            actionTimestamp: nowStr
          }).catch(err => {
            handleFirestoreError(err, OperationType.UPDATE, `aml_alerts/${alertId}`, null);
          });
          return updated;
        }
        return a;
      })
    );

    // If freezing account
    if (status === 'account_frozen' && targetAlert) {
      toggleAccountStatus(targetAlert.accountId, 'frozen', `Compliance frozen by AML Alert ${alertId}`);
    }
  };

  const reconcileEodVault = (countedCash: number, auditor: string) => {
    const nowStr = new Date().toISOString().replace('T', ' ').slice(0, 19);
    const updated = {
      ...vault,
      vaultCashUSD: countedCash,
      dailyEodReconciled: true,
      lastAuditedAt: nowStr,
      auditorName: auditor
    };

    setVault(updated);
    setDoc(doc(db, 'vault', 'NYC-01'), updated).catch(err => {
      handleFirestoreError(err, OperationType.WRITE, 'vault/NYC-01', null);
    });
  };

  const resetDemoData = () => {
    setAccounts(INITIAL_ACCOUNTS);
    setTransactions(INITIAL_TRANSACTIONS);
    setLoans(INITIAL_LOANS);
    setCards(INITIAL_CARDS);
    setAmlAlerts(INITIAL_AML_ALERTS);
    setVault(INITIAL_BRANCH_VAULT);
    localStorage.clear();

    // Re-seed to Firestore
    try {
      const batch = writeBatch(db);
      INITIAL_ACCOUNTS.forEach(acc => batch.set(doc(db, 'accounts', acc.id), acc));
      INITIAL_TRANSACTIONS.forEach(tx => batch.set(doc(db, 'transactions', tx.id), tx));
      INITIAL_LOANS.forEach(ln => batch.set(doc(db, 'loans', ln.id), ln));
      INITIAL_CARDS.forEach(c => batch.set(doc(db, 'cards', c.id), c));
      INITIAL_AML_ALERTS.forEach(a => batch.set(doc(db, 'aml_alerts', a.id), a));
      batch.set(doc(db, 'vault', 'NYC-01'), INITIAL_BRANCH_VAULT);
      batch.commit().catch(e => console.warn('Reset batch error', e));
    } catch (e) {
      console.warn('Batch reset failed', e);
    }
  };

  return (
    <BankContext.Provider
      value={{
        accounts,
        transactions,
        loans,
        cards,
        amlAlerts,
        vault,
        exchangeRates,
        currentRole,
        setCurrentRole,
        activeCustomerAccountId,
        setActiveCustomerAccountId,
        selectedAccount,
        setSelectedAccount,
        isDbConnected,
        dbSyncStatus,
        createAccount,
        depositFunds,
        withdrawFunds,
        executeTransfer,
        toggleAccountStatus,
        updateAccountOverdraft,
        applyAccountHold,
        releaseAccountHold,
        submitLoanApplication,
        reviewLoan,
        disburseLoan,
        recordLoanPayment,
        issueCard,
        toggleCardLock,
        updateCardSettings,
        resolveAmlAlert,
        reconcileEodVault,
        resetDemoData
      }}
    >
      {children}
    </BankContext.Provider>
  );
};

export const useBank = () => {
  const context = useContext(BankContext);
  if (!context) {
    throw new Error('useBank must be used within a BankProvider');
  }
  return context;
};
