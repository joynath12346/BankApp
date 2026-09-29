import React, { useState } from 'react';
import { useBank } from '../context/BankContext';
import { AmlAlert, AlertSeverity, AlertFlagType } from '../types/bank';
import {
  ShieldAlert,
  ShieldCheck,
  Lock,
  FileWarning,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  Search,
  ExternalLink,
  Flame,
  FileSpreadsheet
} from 'lucide-react';

export const RiskComplianceHub: React.FC = () => {
  const { amlAlerts, accounts, resolveAmlAlert, toggleAccountStatus } = useBank();
  const [selectedAlert, setSelectedAlert] = useState<AmlAlert | null>(null);
  const [complianceNotesInput, setComplianceNotesInput] = useState('');
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [actionNotice, setActionNotice] = useState<string | null>(null);

  const filteredAlerts = amlAlerts.filter(a => {
    const matchesSev = filterSeverity === 'all' || a.severity === filterSeverity;
    const matchesStat = filterStatus === 'all' || a.status === filterStatus;
    return matchesSev && matchesStat;
  });

  const pendingCount = amlAlerts.filter(a => a.status === 'investigating').length;
  const criticalCount = amlAlerts.filter(a => a.severity === 'critical' && a.status === 'investigating').length;
  const sarFiledCount = amlAlerts.filter(a => a.status === 'escalated_sar').length;

  const handleResolve = (alertId: string, resolution: 'cleared' | 'escalated_sar' | 'account_frozen') => {
    const notes = complianceNotesInput.trim() || (
      resolution === 'cleared'
        ? 'Verified legitimate commercial invoices and entity beneficial ownership.'
        : resolution === 'escalated_sar'
        ? 'FinCEN Suspicious Activity Report drafted and filed.'
        : 'Immediate preventative freeze enacted under BSA/AML Title 31.'
    );

    resolveAmlAlert(alertId, resolution, notes);
    setComplianceNotesInput('');
    setSelectedAlert(null);
    setActionNotice(`Compliance action committed: ${resolution.replace('_', ' ').toUpperCase()}`);
    setTimeout(() => setActionNotice(null), 3500);
  };

  const getSeverityBadge = (sev: AlertSeverity) => {
    switch (sev) {
      case 'critical':
        return <span className="text-rose-400 font-semibold flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> Critical Risk</span>;
      case 'high':
        return <span className="text-amber-400 font-semibold flex items-center gap-1"><AlertTriangle className="w-3.5 h-3.5" /> High Risk</span>;
      case 'medium':
        return <span className="text-yellow-400 font-medium">Medium</span>;
      case 'low':
        return <span className="text-blue-400 font-medium">Low (Informational)</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Officer Header Card with Generated Avatar */}
      <div className="relative overflow-hidden rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative w-14 h-14 rounded-full overflow-hidden border-2 border-amber-500/30 bg-slate-800 shrink-0">
              <img
                src="/src/assets/images/bank_compliance_avatar_1790706713883.jpg"
                alt="Risk and Compliance Officer"
                referrerPolicy="no-referrer"
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback container
                  (e.target as HTMLElement).style.display = 'none';
                }}
              />
            </div>
            <div>
              <div className="flex items-center gap-2 text-xs text-slate-400 mb-0.5">
                <span>FinCEN Bank Secrecy Act Compliance Officer</span>
                <span aria-hidden="true">·</span>
                <span>SAR Desk NY-01</span>
              </div>
              <h1 className="text-xl font-bold tracking-tight text-white">AML & Sanctions Surveillance Hub</h1>
              <p className="text-xs text-slate-400 mt-0.5">
                Continuous automated velocity analysis, structuring detection, and OFAC sanctions list screening.
              </p>
            </div>
          </div>

          {actionNotice && (
            <div className="px-3 py-1.5 rounded-lg bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-medium flex items-center gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>{actionNotice}</span>
            </div>
          )}
        </div>
      </div>

      {/* Surveillance Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800">
          <div className="text-[11px] text-slate-400">Pending Investigations</div>
          <div className="text-xl font-bold text-amber-400 font-mono tabular-nums mt-1">
            {pendingCount} Cases
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800">
          <div className="text-[11px] text-slate-400">Critical Priority Alerts</div>
          <div className="text-xl font-bold text-rose-400 font-mono tabular-nums mt-1">
            {criticalCount} Critical
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800">
          <div className="text-[11px] text-slate-400">Filed SAR Reports (YTD)</div>
          <div className="text-xl font-bold text-indigo-400 font-mono tabular-nums mt-1">
            {sarFiledCount} FinCEN Filings
          </div>
        </div>

        <div className="p-3.5 rounded-lg bg-slate-900/80 border border-slate-800">
          <div className="text-[11px] text-slate-400">OFAC SDN Screening</div>
          <div className="text-xl font-bold text-emerald-400 font-mono tabular-nums mt-1">
            100% Cleared
          </div>
        </div>
      </div>

      {/* Filter and Queue Header */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
        <div className="text-xs font-semibold text-slate-300 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-400" />
          <span>Active AML Flagged Incidents Queue</span>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={filterSeverity}
            onChange={e => setFilterSeverity(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
          </select>

          <select
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-1.5 text-xs text-slate-300 focus:outline-none cursor-pointer"
          >
            <option value="all">All Statuses</option>
            <option value="investigating">Investigating</option>
            <option value="cleared">Cleared</option>
            <option value="escalated_sar">SAR Filed</option>
            <option value="account_frozen">Account Frozen</option>
          </select>
        </div>
      </div>

      {/* AML Alerts List */}
      <div className="space-y-3">
        {filteredAlerts.length === 0 ? (
          <div className="p-8 rounded-xl bg-slate-900/40 border border-slate-800 text-center text-slate-400">
            <ShieldCheck className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
            <p className="text-sm font-medium">No alerts currently require compliance intervention.</p>
            <p className="text-xs text-slate-500 mt-1">All accounts are operating within standard parameters.</p>
          </div>
        ) : (
          filteredAlerts.map(alert => {
            const isSelected = selectedAlert?.id === alert.id;
            return (
              <div
                key={alert.id}
                className={`p-5 rounded-xl border transition-all ${
                  alert.status === 'investigating'
                    ? alert.severity === 'critical'
                      ? 'bg-rose-950/20 border-rose-500/40'
                      : 'bg-amber-950/20 border-amber-500/40'
                    : 'bg-slate-900/60 border-slate-800'
                }`}
              >
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-3 mb-3">
                  <div className="flex items-center gap-3">
                    {getSeverityBadge(alert.severity)}
                    <span className="text-xs text-slate-500 font-mono">Alert #{alert.id}</span>
                    <span className="text-xs text-slate-400">Flagged: {alert.flaggedAt}</span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-white tabular-nums">
                      {alert.currency} {alert.amount.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                    </span>
                    <span className={`text-[10px] uppercase font-semibold px-2 py-0.5 rounded ${
                      alert.status === 'investigating' ? 'bg-amber-500/20 text-amber-300' :
                      alert.status === 'cleared' ? 'bg-emerald-500/20 text-emerald-300' :
                      alert.status === 'escalated_sar' ? 'bg-purple-500/20 text-purple-300' :
                      'bg-rose-500/20 text-rose-300'
                    }`}>
                      {alert.status.replace('_', ' ')}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 mb-4">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="font-semibold text-white">{alert.customerName}</span>
                    <span className="font-mono text-slate-400">({alert.accountNumber})</span>
                    {alert.referenceNumber && (
                      <span className="font-mono text-[11px] text-blue-400">Ref: {alert.referenceNumber}</span>
                    )}
                  </div>
                  <p className="text-xs text-slate-300 leading-relaxed">{alert.description}</p>
                  {alert.notes && (
                    <div className="text-[11px] text-slate-400 p-2 rounded bg-slate-950/60 border border-slate-800/80">
                      <strong>Audit Trail:</strong> {alert.notes}
                    </div>
                  )}
                </div>

                {/* Action Form if Investigating */}
                {alert.status === 'investigating' && (
                  <div className="pt-3 border-t border-slate-800/80 flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
                    <input
                      type="text"
                      placeholder="Add compliance notes or rationale for decision..."
                      value={isSelected ? complianceNotesInput : ''}
                      onFocus={() => setSelectedAlert(alert)}
                      onChange={e => {
                        setSelectedAlert(alert);
                        setComplianceNotesInput(e.target.value);
                      }}
                      className="flex-1 bg-slate-950 border border-slate-800 rounded px-2.5 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-blue-500"
                    />

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => handleResolve(alert.id, 'cleared')}
                        className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-xs font-medium transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Clear Flag</span>
                      </button>

                      <button
                        onClick={() => handleResolve(alert.id, 'escalated_sar')}
                        className="px-2.5 py-1.5 bg-purple-600 hover:bg-purple-500 text-white rounded text-xs font-medium transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <FileWarning className="w-3.5 h-3.5" />
                        <span>File SAR</span>
                      </button>

                      <button
                        onClick={() => handleResolve(alert.id, 'account_frozen')}
                        className="px-2.5 py-1.5 bg-rose-600 hover:bg-rose-500 text-white rounded text-xs font-semibold transition-colors cursor-pointer flex items-center gap-1"
                      >
                        <Lock className="w-3.5 h-3.5" />
                        <span>Freeze Account</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* KYC Tier Overview Table */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl overflow-hidden mt-6">
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold text-white tracking-wide">Client KYC & CDD Registry</h2>
            <p className="text-xs text-slate-400">Customer Due Diligence (CDD) and beneficial ownership classification</p>
          </div>
          <span className="text-xs text-slate-500">USA PATRIOT Act Title III</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-950/70 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">Customer / Legal Entity</th>
                <th className="py-3 px-4">Account Number</th>
                <th className="py-3 px-4">KYC Tier Status</th>
                <th className="py-3 px-4">Jurisdiction & Domicile</th>
                <th className="py-3 px-4">Standing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {accounts.map(acc => (
                <tr key={acc.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3.5 px-4">
                    <div className="font-semibold text-white">{acc.accountHolderName}</div>
                    <div className="text-[11px] text-slate-400">{acc.accountHolderEmail}</div>
                  </td>
                  <td className="py-3.5 px-4 font-mono text-slate-300">
                    {acc.accountNumber}
                  </td>
                  <td className="py-3.5 px-4">
                    <div className="flex items-center gap-1.5">
                      <ShieldCheck className="w-3.5 h-3.5 text-blue-400" />
                      <span className="font-medium text-slate-200">Tier {acc.kycTier}</span>
                      <span className="text-[11px] text-slate-500">
                        ({acc.kycTier === 3 ? 'Institutional Ultimate Beneficial Owner' : acc.kycTier === 2 ? 'Enhanced Corporate CDD' : 'Basic Simplified KYC'})
                      </span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-slate-300">
                    United States (Fed District 2)
                  </td>
                  <td className="py-3.5 px-4">
                    <span className={`text-[11px] font-medium ${
                      acc.status === 'active' ? 'text-emerald-400' :
                      acc.status === 'frozen' ? 'text-rose-400 font-semibold' :
                      'text-amber-400'
                    }`}>
                      {acc.status.toUpperCase()}
                    </span>
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
