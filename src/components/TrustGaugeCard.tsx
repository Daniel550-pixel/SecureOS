import React from 'react';
import { Shield, AlertTriangle, CheckCircle2, AlertOctagon, TrendingDown, ArrowRight, Lock, Sparkles } from 'lucide-react';
import { TrustScoreResult, IntegrityDeviation } from '../types/integrity';

interface TrustGaugeCardProps {
  trustScore: TrustScoreResult;
  deviations: IntegrityDeviation[];
  onTriggerAiAnalysis: () => void;
  onOpenAuditDrawer: () => void;
  onRevertBaseline: () => void;
  isAiAnalyzing: boolean;
}

export const TrustGaugeCard: React.FC<TrustGaugeCardProps> = ({
  trustScore,
  deviations,
  onTriggerAiAnalysis,
  onOpenAuditDrawer,
  onRevertBaseline,
  isAiAnalyzing
}) => {
  const score = trustScore.current_score;
  const isHealthy = score >= 90.0;
  const isElevated = score >= 75.0 && score < 90.0;
  const isHigh = score >= 50.0 && score < 75.0;
  const isCritical = score < 50.0;

  // Theme color variables
  let badgeColor = 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
  let gaugeColor = '#10b981'; // emerald-500
  let ringBg = 'from-emerald-500/20 via-slate-900 to-slate-950';

  if (isCritical) {
    badgeColor = 'bg-rose-500/15 border-rose-500/40 text-rose-400';
    gaugeColor = '#f43f5e'; // rose-500
    ringBg = 'from-rose-500/25 via-slate-900 to-slate-950';
  } else if (isHigh) {
    badgeColor = 'bg-amber-500/15 border-amber-500/40 text-amber-400';
    gaugeColor = '#f59e0b'; // amber-500
    ringBg = 'from-amber-500/25 via-slate-900 to-slate-950';
  } else if (isElevated) {
    badgeColor = 'bg-yellow-500/15 border-yellow-500/40 text-yellow-400';
    gaugeColor = '#eab308'; // yellow-500
    ringBg = 'from-yellow-500/20 via-slate-900 to-slate-950';
  }

  // Circular progress calculation
  const radius = 88;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 relative overflow-hidden shadow-xl shadow-black/40">
      {/* Subtle ambient gradient backplate */}
      <div className={`absolute top-0 right-0 w-96 h-96 bg-gradient-to-br ${ringBg} rounded-full blur-3xl -z-0 opacity-40 pointer-events-none`} />

      <div className="relative z-10">
        {/* Card Header */}
        <div className="flex items-center justify-between pb-4 border-b border-slate-800/80 mb-6">
          <div className="flex items-center gap-2">
            <span className="h-2 w-2 rounded-full bg-cyan-400 animate-pulse" />
            <h2 className="text-xs font-mono font-bold tracking-widest text-slate-300 uppercase">
              Module 04 • Digital Integrity & Trust State
            </h2>
          </div>
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 bg-slate-950/80 px-2.5 py-1 rounded-md border border-slate-800">
            <Lock className="w-3 h-3 text-cyan-400" />
            <span>Deterministic Core • v2.4</span>
          </div>
        </div>

        {/* Main Score Display & Meter Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          
          {/* Gauge & Main Percentage */}
          <div className="lg:col-span-5 flex flex-col items-center justify-center p-4 bg-slate-950/60 rounded-xl border border-slate-800/80">
            <div className="relative flex items-center justify-center">
              {/* SVG Radial Gauge */}
              <svg className="w-52 h-52 transform -rotate-90">
                <circle
                  cx="104"
                  cy="104"
                  r={radius}
                  stroke="#1e293b"
                  strokeWidth="12"
                  fill="transparent"
                />
                <circle
                  cx="104"
                  cy="104"
                  r={radius}
                  stroke={gaugeColor}
                  strokeWidth="12"
                  strokeDasharray={circumference}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  fill="transparent"
                  className="transition-all duration-1000 ease-out"
                />
              </svg>

              {/* Central Text Value */}
              <div className="absolute flex flex-col items-center text-center">
                <span className="text-4xl font-extrabold font-mono text-slate-100 tracking-tight">
                  {score.toFixed(1)}%
                </span>
                <span className="text-xs font-bold tracking-widest text-slate-400 uppercase font-mono mt-0.5">
                  TRUST SCORE
                </span>
                <div className={`mt-2 px-2.5 py-0.5 rounded-full border text-[11px] font-mono font-bold uppercase ${badgeColor}`}>
                  {trustScore.status_label}
                </div>
              </div>
            </div>

            {/* Baseline and delta footer */}
            <div className="w-full mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between text-xs font-mono">
              <span className="text-slate-400">Baseline Target:</span>
              <span className="text-slate-200 font-bold">100.0%</span>
            </div>
            <div className="w-full flex items-center justify-between text-xs font-mono mt-1">
              <span className="text-slate-400">Active Deductions:</span>
              <span className="text-rose-400 font-bold flex items-center gap-0.5">
                <TrendingDown className="w-3.5 h-3.5" /> -{trustScore.total_deductions} pts
              </span>
            </div>
          </div>

          {/* Deviations Summary & AI Analysis Prompt Trigger */}
          <div className="lg:col-span-7 flex flex-col justify-between h-full space-y-4">
            
            {/* Deviation Highlights */}
            <div>
              <div className="flex items-center justify-between mb-2.5">
                <div className="flex items-center gap-2">
                  <span className={`p-1 rounded ${isHealthy ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                    {isHealthy ? <CheckCircle2 className="w-4 h-4" /> : <AlertTriangle className="w-4 h-4" />}
                  </span>
                  <h3 className="text-sm font-semibold text-slate-200">
                    {deviations.length === 0
                      ? 'Zero Deviations Detected'
                      : `${deviations.length} significant deviation${deviations.length > 1 ? 's' : ''} detected`}
                  </h3>
                </div>

                <button
                  onClick={onOpenAuditDrawer}
                  className="text-xs text-cyan-400 hover:text-cyan-300 font-mono hover:underline flex items-center gap-1"
                >
                  Inspect Math Formula <ArrowRight className="w-3 h-3" />
                </button>
              </div>

              {/* Deviation Bullet Points */}
              <div className="space-y-2">
                {deviations.length === 0 ? (
                  <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-900/30 text-xs text-emerald-300 font-mono">
                    ✓ All kernel drivers, system processes, and network sockets match Verified UAE Baseline Catalog.
                  </div>
                ) : (
                  deviations.slice(0, 3).map((dev) => (
                    <div
                      key={dev.deviation_id}
                      className="flex items-start gap-2.5 p-2.5 rounded-lg bg-slate-950/80 border border-slate-800 text-xs text-slate-300"
                    >
                      <span className={`w-2 h-2 rounded-full mt-1.5 flex-shrink-0 ${
                        dev.severity === 'critical'
                          ? 'bg-rose-500'
                          : dev.severity === 'high'
                          ? 'bg-amber-500'
                          : 'bg-yellow-500'
                      }`} />
                      <div className="flex-1">
                        <div className="flex items-center justify-between">
                          <span className="font-semibold text-slate-100">{dev.title}</span>
                          <span className="text-[10px] font-mono text-rose-400 font-bold">
                            -{dev.deduction_weight} pts
                          </span>
                        </div>
                        <p className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                          {dev.description}
                        </p>
                      </div>
                    </div>
                  ))
                )}
                {deviations.length > 3 && (
                  <p className="text-[11px] font-mono text-slate-400 text-right">
                    + {deviations.length - 3} more baseline deviations registered
                  </p>
                )}
              </div>
            </div>

            {/* Quick Action Footer Bar */}
            <div className="pt-4 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3">
              <div className="text-[11px] text-slate-400 flex items-center gap-1.5 font-mono">
                <span className="text-slate-500">Security Rule:</span>
                <span>Deterministic scoring owns ground-truth</span>
              </div>

              <div className="flex items-center gap-2">
                {score < 100.0 && (
                  <button
                    onClick={onRevertBaseline}
                    className="px-3 py-1.5 text-xs font-mono rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition-colors"
                  >
                    Restore Baseline
                  </button>
                )}
                <button
                  onClick={onTriggerAiAnalysis}
                  disabled={isAiAnalyzing}
                  className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-mono font-bold rounded-lg bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-md shadow-cyan-950/40 transition-all cursor-pointer"
                >
                  <Sparkles className={`w-3.5 h-3.5 ${isAiAnalyzing ? 'animate-spin' : ''}`} />
                  <span>{isAiAnalyzing ? 'Gemini Reasoning...' : 'Run AI Analysis'}</span>
                </button>
              </div>
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};
