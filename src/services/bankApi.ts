import { BankAccount, BankCard, BranchVaultState, ExchangeRate, LoanApplication, AmlAlert, Transaction } from '../types/bank';

const API_BASE_URL = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1').replace(/\/$/, '');

function camelize(value: unknown): any {
  if (Array.isArray(value)) return value.map(camelize);
  if (!value || typeof value !== 'object') return value;
  return Object.fromEntries(Object.entries(value as Record<string, unknown>).map(([key, item]) => [
    key.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase()),
    camelize(item)
  ]));
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = localStorage.getItem('aegis_api_token');
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {})
    }
  });
  if (!response.ok) throw new Error(`Bank API request failed (${response.status})`);
  const payload = await response.json();
  return camelize(payload) as T;
}

function results<T>(payload: T[] | { results?: T[] }): T[] {
  return Array.isArray(payload) ? payload : payload.results || [];
}

function normalizeTransaction(item: any): Transaction {
  return { ...item, accountId: item.accountId || item.sourceAccount, accountNumber: item.accountNumber || item.sourceAccountNumber, accountHolderName: item.accountHolderName || item.sourceHolderName, referenceNumber: item.referenceNumber || item.referenceNumber, type: item.type || item.transactionType };
}

function normalizeLoan(item: any): LoanApplication {
  return { ...item, accountId: item.accountId || item.account, accountNumber: item.accountNumber || item.applicantAccountNumber };
}

function normalizeCard(item: any): BankCard {
  return { ...item, accountId: item.accountId || item.account, accountNumber: item.accountNumber || item.linkedAccountNumber };
}

function normalizeAlert(item: any): AmlAlert {
  return { ...item, accountId: item.accountId || item.account };
}

export async function loadBankSnapshot() {
  const [accounts, transactions, loans, cards, amlAlerts, vault, exchangeRates] = await Promise.all([
    request<BankAccount[] | { results: BankAccount[] }>('/accounts/'),
    request<Transaction[] | { results: Transaction[] }>('/transactions/'),
    request<LoanApplication[] | { results: LoanApplication[] }>('/loans/'),
    request<BankCard[] | { results: BankCard[] }>('/cards/'),
    request<AmlAlert[] | { results: AmlAlert[] }>('/aml-alerts/'),
    request<BranchVaultState>('/vault/'),
    request<ExchangeRate[] | { results: ExchangeRate[] }>('/exchange-rates/')
  ]);
  return {
    accounts: results(accounts),
    transactions: results(transactions).map(normalizeTransaction),
    loans: results(loans).map(normalizeLoan),
    cards: results(cards).map(normalizeCard),
    amlAlerts: results(amlAlerts).map(normalizeAlert),
    vault,
    exchangeRates: results(exchangeRates)
  };
}

export { API_BASE_URL };
