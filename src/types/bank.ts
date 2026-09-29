export type AccountType =
  | 'checking'
  | 'savings'
  | 'business_checking'
  | 'money_market'
  | 'treasury_escrow';

export type AccountStatus = 'active' | 'frozen' | 'dormant' | 'restricted';

export type Currency = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'CAD';

export interface BankAccount {
  id: string;
  accountNumber: string;
  routingNumber: string;
  swiftBic: string;
  accountHolderName: string;
  accountHolderEmail: string;
  accountHolderPhone: string;
  companyName?: string;
  type: AccountType;
  currency: Currency;
  balance: number;
  availableBalance: number;
  holdBalance: number;
  overdraftLimit: number;
  status: AccountStatus;
  kycTier: 1 | 2 | 3;
  openedDate: string;
  branchCode: string;
  interestRateAnnual: number;
  notes?: string;
}

export type TransactionType =
  | 'deposit'
  | 'withdrawal'
  | 'internal_transfer'
  | 'wire_clearing'
  | 'ach_debit'
  | 'card_pos'
  | 'loan_disbursement'
  | 'loan_repayment'
  | 'interest_credit'
  | 'fx_exchange';

export type TransactionStatus = 'settled' | 'pending' | 'flagged' | 'reversed';

export interface Transaction {
  id: string;
  referenceNumber: string;
  accountId: string;
  accountNumber: string;
  accountHolderName: string;
  targetAccountId?: string;
  targetAccountNumber?: string;
  counterpartyName: string;
  counterpartyBank?: string;
  type: TransactionType;
  category: string;
  amount: number;
  currency: Currency;
  direction: 'credit' | 'debit';
  timestamp: string;
  status: TransactionStatus;
  riskScore: number; // 0 - 100
  amlNotes?: string;
  fee: number;
  memo?: string;
}

export type LoanType =
  | 'commercial_term'
  | 'fixed_mortgage'
  | 'working_capital'
  | 'auto_credit'
  | 'unsecured_revolving';

export type LoanStatus = 'submitted' | 'under_review' | 'approved' | 'disbursed' | 'rejected' | 'repaid';

export interface LoanApplication {
  id: string;
  loanNumber: string;
  applicantName: string;
  applicantEmail: string;
  accountId: string;
  accountNumber: string;
  loanType: LoanType;
  requestedAmount: number;
  approvedAmount?: number;
  termMonths: number;
  interestRate: number;
  monthlyPayment: number;
  creditScore: number;
  dtiRatio: number; // Debt to income %
  collateralDescription?: string;
  collateralValue?: number;
  status: LoanStatus;
  createdAt: string;
  approvedAt?: string;
  disbursedAt?: string;
  reviewedBy?: string;
  notes?: string;
  purpose: string;
  totalPaid: number;
  remainingBalance: number;
}

export type CardTier = 'platinum_standard' | 'business_gold' | 'executive_black';
export type CardStatus = 'active' | 'locked' | 'cancelled';

export interface BankCard {
  id: string;
  accountId: string;
  accountNumber: string;
  cardholderName: string;
  cardNumberMasked: string;
  fullCardNumberVirtual: string;
  expMonth: string;
  expYear: string;
  cvv: string;
  pin: string;
  tier: CardTier;
  cardBrand: 'Visa' | 'Mastercard';
  status: CardStatus;
  dailyLimit: number;
  spentToday: number;
  internationalAllowed: boolean;
  atmWithdrawalAllowed: boolean;
  onlineAllowed: boolean;
  contactlessAllowed: boolean;
  issuedDate: string;
}

export type AlertSeverity = 'critical' | 'high' | 'medium' | 'low';
export type AlertFlagType =
  | 'structuring_detection'
  | 'unusual_velocity'
  | 'high_value_wire'
  | 'sanction_list_match'
  | 'rapid_movement'
  | 'cross_border_anomaly';

export interface AmlAlert {
  id: string;
  transactionId?: string;
  referenceNumber?: string;
  accountId: string;
  accountNumber: string;
  customerName: string;
  severity: AlertSeverity;
  flagType: AlertFlagType;
  description: string;
  amount: number;
  currency: Currency;
  flaggedAt: string;
  status: 'investigating' | 'cleared' | 'escalated_sar' | 'account_frozen';
  assignedTo?: string;
  notes?: string;
  actionTimestamp?: string;
}

export interface BranchVaultState {
  branchName: string;
  branchCode: string;
  vaultCashUSD: number;
  tellerDrawersCashUSD: number;
  reserveRequirementRatio: number; // e.g. 0.10 (10%)
  centralBankDepositUSD: number;
  lastAuditedAt: string;
  dailyEodReconciled: boolean;
  auditorName: string;
  notes?: string;
}

export interface ExchangeRate {
  code: Currency;
  name: string;
  symbol: string;
  rateToUSD: number; // 1 unit in USD
  buyRate: number;
  sellRate: number;
  change24h: number;
}

export type UserRole =
  | 'director'      // Branch Director & Executive
  | 'teller'        // Head Teller & Operations
  | 'compliance'    // AML & Risk Compliance Officer
  | 'client';       // Customer Self-Service Experience
