import React, { useState } from 'react';
import { useBank } from '../context/BankContext';
import { LoanApplication, LoanType, BankAccount } from '../types/bank';
import {
  FileCheck2,
  DollarSign,
  TrendingUp,
  Percent,
  Calculator,
  CheckCircle,
  XCircle,
  ArrowRight,
  ShieldCheck,
  Building,
  UserCheck,
  Layers
} from 'lucide-react';

export const LoanManagement: React.FC = () => {
  const { accounts, loans, submitLoanApplication, reviewLoan, disburseLoan, recordLoanPayment } = useBank();

  // Calculator State
  const [selectedAccountId, setSelectedAccountId] = useState(accounts[0]?.id || '');
  const [loanType, setLoanType] = useState<LoanType>('commercial_term');
  const [requestedAmount, setRequestedAmount] = useState<number>(250000);
  const [termMonths, setTermMonths] = useState<number>(36);
  const [interestRate, setInterestRate] = useState<number>(6.5);
  const [creditScore, setCreditScore] = useState<number>(760);
  const [dtiRatio, setDtiRatio] = useState<number>(26.5);
  const [collateralDesc, setCollateralDesc] = useState('Commercial Equipment Fleet & Corporate Guarantee');
  const [collateralValue, setCollateralValue] = useState<number>(350000);
  const [purpose, setPurpose] = useState('Expansion of warehouse logistics fulfillment facility');
  const [actionSuccessMessage, setActionSuccessMessage] = useState<string | null>(null);

  // Active review modal / selection
  const [selectedLoan, setSelectedLoan] = useState<LoanApplication | null>(null);
  const [paymentAmountInput, setPaymentAmountInput] = useState<string>('');

  // Underwriting Math
  const r = interestRate / 100 / 12;
  const n = termMonths;
  const monthlyPayment = (requestedAmount * (r * Math.pow(1 + r, n))) / (Math.pow(1 + r, n) - 1);
  const totalRepayment = monthlyPayment * n;
  const totalInterest = totalRepayment - requestedAmount;
  const ltv = collateralValue ? Math.round((requestedAmount / collateralValue) * 100) : 0;

  // Selected account holder
  const currentApplicantAccount = accounts.find(a => a.id === selectedAccountId);

  const handleApplyLoan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentApplicantAccount) return;

    submitLoanApplication({
      applicantName: currentApplicantAccount.accountHolderName,
      applicantEmail: currentApplicantAccount.accountHolderEmail,
      accountId: currentApplicantAccount.id,
      loanType,
      requestedAmount,
      termMonths,
      interestRate,
      creditScore,
      dtiRatio,
      collateralDescription: collateralDesc,
      collateralValue,
      purpose
    });

    setActionSuccessMessage(`Loan application registered for ${currentApplicantAccount.accountHolderName}. Placed in underwriting queue.`);
    setTimeout(() => setActionSuccessMessage(null), 4000);
  };

  const handleApprove = (loanId: string) => {
    reviewLoan(loanId, 'approved', 'Underwriting guidelines met. LTV & DTI cleared.');
    setActionSuccessMessage('Facility approved. Ready for capital disbursement.');
    setTimeout(() => setActionSuccessMessage(null), 3000);
  };

  const handleReject = (loanId: string) => {
    reviewLoan(loanId, 'rejected', 'Exceeds branch risk limits.');
    setActionSuccessMessage('Facility marked rejected.');
    setTimeout(() => setActionSuccessMessage(null), 3000);
  };

  const handleDisburse = (loanId: string) => {
    const res = disburseLoan(loanId);
    if (res.success) {
      setActionSuccessMessage('Funds disbursed successfully to borrower deposit account.');
    } else {
      alert(res.message);
    }
    setTimeout(() => setActionSuccessMessage(null), 3000);
  };

  const handleMakePayment = (loanId: string) => {
    const amt = parseFloat(paymentAmountInput);
    if (!isNaN(amt) && amt > 0) {
      const res = recordLoanPayment(loanId, amt);
      if (res.success) {
        setPaymentAmountInput('');
        setActionSuccessMessage(`Payment of BDT ${amt.toLocaleString('en-BD')} recorded.`);
      }
    }
    setTimeout(() => setActionSuccessMessage(null), 3000);
  };

  const totalOutstanding = loans
    .filter(l => l.status === 'disbursed')
    .reduce((s, l) => s + l.remainingBalance, 0);

  const formatLoanType = (t: LoanType) => {
    switch (t) {
      case 'commercial_term': return 'Commercial Term Facility';
      case 'fixed_mortgage': return 'Fixed Real Estate Mortgage';
      case 'working_capital': return 'Working Capital Line';
      case 'auto_credit': return 'Automotive / Equipment Credit';
      case 'unsecured_revolving': return 'Unsecured Revolving Facility';
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs text-slate-400 mb-1">
            <span>Corporate & Consumer Credit Underwriting</span>
            <span aria-hidden="true">·</span>
            <span>Commercial Lending Desk</span>
          </div>
          <h1 className="text-xl font-bold tracking-tight text-white">Credit Facilities & Amortization</h1>
        </div>

        {actionSuccessMessage && (
          <div className="px-3.5 py-2 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-emerald-400" />
            <span>{actionSuccessMessage}</span>
          </div>
        )}
      </div>

      {/* Credit Overview Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800">
          <div className="text-[11px] text-slate-400">Total Outstanding Principal</div>
          <div className="text-xl font-bold text-white font-mono tabular-nums mt-1">
            BDT {totalOutstanding.toLocaleString('en-BD', { minimumFractionDigits: 2 })}
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800">
          <div className="text-[11px] text-slate-400">Underwriting Queue</div>
          <div className="text-xl font-bold text-indigo-400 font-mono tabular-nums mt-1">
            {loans.filter(l => l.status === 'submitted' || l.status === 'under_review').length} Files
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800">
          <div className="text-[11px] text-slate-400">Avg Portfolio APR</div>
          <div className="text-xl font-bold text-slate-200 font-mono tabular-nums mt-1">
            6.42%
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800">
          <div className="text-[11px] text-slate-400">30+ Day Delinquency</div>
          <div className="text-xl font-bold text-emerald-400 font-mono tabular-nums mt-1">
            0.00%
          </div>
        </div>
      </div>

      {/* Underwriting Calculator & Application Form */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-6">
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-slate-800">
          <Calculator className="w-5 h-5 text-blue-400" />
          <h2 className="text-sm font-semibold text-white">Underwriting Calculator & Credit Origination</h2>
        </div>

        <form onSubmit={handleApplyLoan} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Borrower Account</label>
              <select
                value={selectedAccountId}
                onChange={e => setSelectedAccountId(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                {accounts.map(acc => (
                  <option key={acc.id} value={acc.id}>
                    {acc.accountHolderName} ({acc.accountNumber})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Facility Type</label>
              <select
                value={loanType}
                onChange={e => setLoanType(e.target.value as LoanType)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              >
                <option value="commercial_term">Commercial Term Facility</option>
                <option value="fixed_mortgage">Fixed Real Estate Mortgage</option>
                <option value="working_capital">Working Capital Line</option>
                <option value="auto_credit">Equipment / Fleet Credit</option>
                <option value="unsecured_revolving">Unsecured Revolving Facility</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Principal Amount (BDT)</label>
              <input
                type="number"
                step="1000"
                min="5000"
                max="10000000"
                value={requestedAmount}
                onChange={e => setRequestedAmount(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Term (Months)</label>
              <select
                value={termMonths}
                onChange={e => setTermMonths(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
              >
                <option value="12">12 Months (1 Year)</option>
                <option value="24">24 Months (2 Years)</option>
                <option value="36">36 Months (3 Years)</option>
                <option value="48">48 Months (4 Years)</option>
                <option value="60">60 Months (5 Years)</option>
                <option value="120">120 Months (10 Years)</option>
                <option value="360">360 Months (30 Years)</option>
              </select>
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Interest Rate (% APR)</label>
              <input
                type="number"
                step="0.05"
                min="1"
                max="25"
                value={interestRate}
                onChange={e => setInterestRate(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">FICO / Credit Rating</label>
              <input
                type="number"
                min="400"
                max="850"
                value={creditScore}
                onChange={e => setCreditScore(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Debt-To-Income (DTI %)</label>
              <input
                type="number"
                step="0.1"
                min="5"
                max="80"
                value={dtiRatio}
                onChange={e => setDtiRatio(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Collateral Guarantee & Description</label>
              <input
                type="text"
                value={collateralDesc}
                onChange={e => setCollateralDesc(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] text-slate-400 mb-1">Appraised Collateral Value (BDT)</label>
              <input
                type="number"
                step="1000"
                value={collateralValue}
                onChange={e => setCollateralValue(Number(e.target.value))}
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500 font-mono"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] text-slate-400 mb-1">Use of Capital / Business Purpose</label>
            <input
              type="text"
              value={purpose}
              onChange={e => setPurpose(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-blue-500"
            />
          </div>

          {/* Real-time Math Summary Box */}
          <div className="p-4 rounded-lg bg-slate-950 border border-blue-500/20 grid grid-cols-2 sm:grid-cols-4 gap-4 text-xs">
            <div>
              <div className="text-slate-400 text-[11px]">Monthly Amortization:</div>
              <div className="text-lg font-bold text-emerald-400 font-mono tabular-nums">
                BDT {monthlyPayment.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            <div>
              <div className="text-slate-400 text-[11px]">Total Interest Paid:</div>
              <div className="text-base font-bold text-slate-200 font-mono tabular-nums">
                BDT {totalInterest.toLocaleString('en-BD', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              </div>
            </div>

            <div>
              <div className="text-slate-400 text-[11px]">Loan-to-Value (LTV):</div>
              <div className={`text-base font-bold font-mono ${ltv > 80 ? 'text-amber-400' : 'text-slate-200'}`}>
                {ltv}% {ltv > 80 ? '(High Risk)' : '(Nominal)'}
              </div>
            </div>

            <div className="flex items-center justify-end">
              <button
                type="submit"
                className="w-full py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-xs font-semibold shadow-sm transition-colors cursor-pointer"
              >
                Submit Application
              </button>
            </div>
          </div>
        </form>
      </div>

      {/* Loan Facilities Portfolio Queue */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-white tracking-wide">Underwriting Queue & Active Credit Book</h2>
          <span className="text-xs text-slate-500">{loans.length} Facilities Monitored</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Loan Reference</th>
                <th className="py-3 px-4">Borrower Entity</th>
                <th className="py-3 px-4">Facility Type</th>
                <th className="py-3 px-4 text-right">Principal</th>
                <th className="py-3 px-4 text-right">Rate & Term</th>
                <th className="py-3 px-4 text-right">Remaining Bal</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4 text-right">Underwriting Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {loans.map(loan => (
                <tr key={loan.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 px-4 font-mono text-[11px] text-slate-200">
                    <div className="font-semibold text-white">{loan.loanNumber}</div>
                    <div className="text-[10px] text-slate-500">Created: {loan.createdAt}</div>
                  </td>

                  <td className="py-3.5 px-4">
                    <div className="font-medium text-white">{loan.applicantName}</div>
                    <div className="text-[11px] text-slate-400 truncate max-w-xs">{loan.purpose}</div>
                    <div className="text-[10px] text-slate-500 font-mono">FICO: {loan.creditScore} · DTI: {loan.dtiRatio}%</div>
                  </td>

                  <td className="py-3.5 px-4">
                    <span className="text-slate-300 font-medium">{formatLoanType(loan.loanType)}</span>
                  </td>

                  <td className="py-3.5 px-4 text-right font-mono font-medium text-white tabular-nums">
                    BDT {loan.requestedAmount.toLocaleString('en-BD')}
                  </td>

                  <td className="py-3.5 px-4 text-right font-mono text-slate-300 tabular-nums">
                    <div>{loan.interestRate}% APR</div>
                    <div className="text-[10px] text-slate-500">{loan.termMonths} mos (BDT {loan.monthlyPayment.toFixed(2)}/mo)</div>
                  </td>

                  <td className="py-3.5 px-4 text-right font-mono font-medium tabular-nums">
                    <span className={loan.remainingBalance > 0 ? 'text-amber-400' : 'text-emerald-400'}>
                      BDT {loan.remainingBalance.toLocaleString('en-BD', { minimumFractionDigits: 2 })}
                    </span>
                    {loan.totalPaid > 0 && (
                      <div className="text-[10px] text-slate-500">Paid: BDT {loan.totalPaid.toLocaleString('en-BD')}</div>
                    )}
                  </td>

                  <td className="py-3.5 px-4">
                    {loan.status === 'submitted' && (
                      <span className="text-blue-400 font-medium flex items-center gap-1">
                        <Layers className="w-3.5 h-3.5" /> Submitted
                      </span>
                    )}
                    {loan.status === 'under_review' && (
                      <span className="text-amber-400 font-medium flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5" /> Under Review
                      </span>
                    )}
                    {loan.status === 'approved' && (
                      <span className="text-indigo-400 font-medium flex items-center gap-1">
                        <CheckCircle className="w-3.5 h-3.5" /> Approved
                      </span>
                    )}
                    {loan.status === 'disbursed' && (
                      <span className="text-emerald-400 font-medium flex items-center gap-1">
                        <DollarSign className="w-3.5 h-3.5" /> Disbursed & Active
                      </span>
                    )}
                    {loan.status === 'repaid' && (
                      <span className="text-slate-400 font-medium">Repaid in Full</span>
                    )}
                    {loan.status === 'rejected' && (
                      <span className="text-rose-400 font-medium flex items-center gap-1">
                        <XCircle className="w-3.5 h-3.5" /> Rejected
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      {/* Underwriting approval buttons */}
                      {(loan.status === 'submitted' || loan.status === 'under_review') && (
                        <>
                          <button
                            onClick={() => handleApprove(loan.id)}
                            className="px-2 py-1 bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-400 border border-emerald-500/30 rounded text-[11px] font-medium cursor-pointer"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReject(loan.id)}
                            className="px-2 py-1 bg-rose-600/20 hover:bg-rose-600/30 text-rose-400 border border-rose-500/30 rounded text-[11px] font-medium cursor-pointer"
                          >
                            Reject
                          </button>
                        </>
                      )}

                      {/* Disburse capital button */}
                      {loan.status === 'approved' && (
                        <button
                          onClick={() => handleDisburse(loan.id)}
                          className="px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white rounded text-[11px] font-semibold flex items-center gap-1 cursor-pointer shadow-sm"
                        >
                          <DollarSign className="w-3 h-3" />
                          <span>Disburse</span>
                        </button>
                      )}

                      {/* Make payment button */}
                      {loan.status === 'disbursed' && (
                        <div className="flex items-center gap-1">
                          <input
                            type="number"
                            placeholder="Amount"
                            className="w-20 bg-slate-950 border border-slate-800 rounded px-1.5 py-1 text-[11px] text-white focus:outline-none font-mono"
                            value={selectedLoan?.id === loan.id ? paymentAmountInput : ''}
                            onFocus={() => setSelectedLoan(loan)}
                            onChange={e => {
                              setSelectedLoan(loan);
                              setPaymentAmountInput(e.target.value);
                            }}
                          />
                          <button
                            onClick={() => handleMakePayment(loan.id)}
                            className="px-2 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded text-[11px] font-medium cursor-pointer"
                          >
                            Pay
                          </button>
                        </div>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
