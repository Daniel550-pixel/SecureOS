import React from 'react';
import { Calculator, Shield, AlertTriangle, CheckCircle2, Lock, ArrowDown } from 'lucide-react';
import { TrustScoreResult } from '../types/integrity';

interface TrustScoreAuditTableProps {
  trustScore: TrustScoreResult;
}

export const TrustScoreAuditTable: React.FC<TrustScoreAuditTableProps> = ({ trustScore }) => {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Calculator className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xs font-mono font-bold tracking-widest text-slate-300 uppercase flex items-center gap-2">
              <span>Deterministic Trust Score Audit & Formula</span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-cyan-400 font-mono">
                {trustScore.formula_version}
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Mathematical deduction breakdown based on formal security rules.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-mono">
          <Lock className="w-3.5 h-3.5 text-cyan-400" />
          <span className="text-slate-300">Auditable Proof Record</span>
        </div>
      </div>

      {/* Deduction Ledger */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="text-[11px] font-mono text-slate-400 uppercase bg-slate-950 border-b border-slate-800">
            <tr>
              <th className="p-3">Rule ID</th>
              <th className="p-3">Violation Category</th>
              <th className="p-3">Affected Entity</th>
              <th className="p-3">MITRE Ref</th>
              <th className="p-3 text-right">Base Weight</th>
              <th className="p-3 text-right">Multiplier</th>
              <th className="p-3 text-right">Effective Deduction</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 font-mono">
            {/* Baseline Starting Point Row */}
            <tr className="bg-slate-950/60 font-semibold text-slate-200">
              <td className="p-3 text-emerald-400">BASE-100</td>
              <td className="p-3">GOLDEN BASELINE TRUST</td>
              <td className="p-3 text-slate-400">Target Operational Parameter</td>
              <td className="p-3 text-slate-500">N/A</td>
              <td className="p-3 text-right">100.0</td>
              <td className="p-3 text-right">1.0x</td>
              <td className="p-3 text-right text-emerald-400">+100.0</td>
            </tr>

            {/* Deductions */}
            {trustScore.deduction_breakdown.map((item, idx) => (
              <tr key={idx} className="hover:bg-slate-950/40 text-slate-300">
                <td className="p-3 text-cyan-400">{item.rule_id}</td>
                <td className="p-3 font-semibold text-slate-200">{item.title}</td>
                <td className="p-3 text-slate-400">{item.entity}</td>
                <td className="p-3 text-[10px] text-slate-400">{item.mitre_reference || 'T1059'}</td>
                <td className="p-3 text-right">-{item.raw_penalty.toFixed(1)}</td>
                <td className="p-3 text-right text-slate-400">{item.confidence_multiplier.toFixed(2)}x</td>
                <td className="p-3 text-right text-rose-400 font-bold">
                  -{item.effective_deduction.toFixed(1)}
                </td>
              </tr>
            ))}

            {/* Final Total Calculation Footer */}
            <tr className="bg-slate-950 font-bold text-sm border-t-2 border-slate-700">
              <td colSpan={6} className="p-3 text-right text-slate-300 uppercase tracking-wider font-mono">
                Final Deterministic Trust Score:
              </td>
              <td className="p-3 text-right text-cyan-400 font-mono text-base">
                {trustScore.current_score.toFixed(1)}%
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Principle Disclaimer Box */}
      <div className="mt-5 p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 flex items-start gap-3">
        <Lock className="w-4 h-4 text-cyan-400 flex-shrink-0 mt-0.5" />
        <div className="text-xs text-slate-400 space-y-1">
          <p className="font-semibold text-slate-200">
            Architectural Guarantee (AI vs Deterministic Separation):
          </p>
          <p>
            The Trust Score calculation is strictly deterministic, executing mathematical rules against observable differences between live telemetry and the baseline catalog. Gemini AI receives this score and evidence as input context to formulate explanations, but <strong className="text-cyan-300">cannot alter or hallucinate the numerical score</strong>.
          </p>
        </div>
      </div>

    </div>
  );
};
