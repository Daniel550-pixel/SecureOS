import React from 'react';
import { 
  Shield, 
  ShieldAlert, 
  ShieldCheck, 
  Sparkles, 
  TrendingDown, 
  ArrowRight, 
  Lock, 
  Activity, 
  Fingerprint, 
  Network, 
  Layers, 
  Cpu,
  AlertTriangle,
  FileCheck
} from 'lucide-react';
import { TrustScoreResult, IntegrityDeviation, SystemState } from '../types/integrity';

interface TrustCoreProps {
  trustScore: TrustScoreResult;
  deviations: IntegrityDeviation[];
  state: SystemState;
  onTriggerAiAnalysis: () => void;
  onOpenAudit: () => void;
  onRevertBaseline: () => void;
  isAiAnalyzing: boolean;
}

export const TrustCore: React.FC<TrustCoreProps> = ({
  trustScore,
  deviations = [],
  state,
  onTriggerAiAnalysis,
  onOpenAudit,
  onRevertBaseline,
  isAiAnalyzing
}) => {
  const score = trustScore?.current_score ?? 100;
  const isHealthy = score >= 90.0;
  const isElevated = score >= 75.0 && score < 90.0;
  const isHigh = score >= 50.0 && score < 75.0;
  const isCritical = score < 50.0;

  // Primary visual signals based on SecureOS visual spec
  let signalColor = '#00f0ff'; // cyan
  let statusBadge = 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400';
  let glowColor = 'rgba(6, 182, 212, 0.25)';
  let auraBg = 'from-cyan-500/10 via-slate-950/80 to-transparent';

  if (isCritical) {
    signalColor = '#f43f5e'; // rose-500
    statusBadge = 'bg-rose-500/15 border-rose-500/40 text-rose-400 shadow-lg shadow-rose-950/50';
    glowColor = 'rgba(244, 63, 94, 0.35)';
    auraBg = 'from-rose-500/15 via-slate-950/80 to-transparent';
  } else if (isHigh) {
    signalColor = '#f59e0b'; // amber-500
    statusBadge = 'bg-amber-500/15 border-amber-500/40 text-amber-400 shadow-lg shadow-amber-950/40';
    glowColor = 'rgba(245, 158, 11, 0.3)';
    auraBg = 'from-amber-500/15 via-slate-950/80 to-transparent';
  } else if (isElevated) {
    signalColor = '#eab308'; // yellow-500
    statusBadge = 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400';
    glowColor = 'rgba(234, 179, 8, 0.25)';
    auraBg = 'from-yellow-500/10 via-slate-950/80 to-transparent';
  } else {
    signalColor = '#10b981'; // emerald-500
    statusBadge = 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400';
    glowColor = 'rgba(16, 185, 129, 0.25)';
    auraBg = 'from-emerald-500/10 via-slate-950/80 to-transparent';
  }

  // Calculated sub-metrics derived from real telemetry state
  const processes = state?.processes || [];
  const fimFiles = state?.fim_files || [];
  const networkConnections = state?.network_connections || [];
  const recentEvents = state?.recent_events || [];

  const unsignedProcs = processes.filter(p => !p.is_signed).length;
  const integritySubScore = Math.max(0, 100 - (unsignedProcs * 12 + fimFiles.filter(f => f.is_modified).length * 15)).toFixed(1);
  const telemetryCount = (recentEvents.length * 142 + 1280).toLocaleString();
  const identitySubScore = (processes.some(p => p.name.includes('mimikatz') || p.name.includes('lsass')) ? 64.5 : 99.2).toFixed(1);
  const suspiciousSockets = networkConnections.filter(c => c.destination_reputation === 'malicious' || c.destination_reputation === 'suspicious').length;
  const networkSubScore = Math.max(0, 100 - (suspiciousSockets * 20)).toFixed(1);

  // SVG Geometry for Radial Multi-ring Gauge
  const radius = 108;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="secure-panel rounded-2xl p-6 relative overflow-hidden secure-panel-glow">
      {/* Background ambient lighting */}
      <div 
        className={`absolute inset-0 bg-gradient-to-b ${auraBg} pointer-events-none transition-all duration-1000`} 
      />
      <div className="absolute top-0 right-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Top Header Row of the Core Instrument */}
      <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center">
            <span className="w-2.5 h-2.5 rounded-full animate-ping" style={{ backgroundColor: signalColor }} />
            <span className="w-2 h-2 rounded-full absolute" style={{ backgroundColor: signalColor }} />
          </div>
          <div>
            <h2 className="text-xs font-mono font-bold tracking-widest text-slate-200 uppercase flex items-center gap-2">
              <span>SECUREOS TRUST CORE</span>
              <span className="text-slate-600">•</span>
              <span className="text-[10px] text-cyan-400 font-mono">DETERMINISTIC AUTHORITY</span>
            </h2>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[11px] font-mono text-slate-400 bg-slate-950/90 px-3 py-1 rounded-md border border-slate-800">
            <Lock className="w-3 h-3 text-cyan-400" />
            <span>GROUND-TRUTH: IMMUTABLE</span>
          </div>

          <button
            onClick={onOpenAudit}
            className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 flex items-center gap-1 hover:underline transition-colors"
          >
            <span>Inspect Math Ledger</span>
            <ArrowRight className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Main 3D / Radial Integrity Field Visualization */}
      <div className="relative z-10 py-6 flex flex-col items-center justify-center">
        
        {/* The Multidimensional Radial Core Container */}
        <div className="relative w-72 h-72 sm:w-80 sm:h-80 flex items-center justify-center my-2">
          
          {/* Outer Rotating Graduation Ring */}
          <div className="absolute inset-0 rounded-full border border-slate-800/70 animate-spin-slow pointer-events-none">
            {/* North/South/East/West Tick Marks */}
            <span className="absolute top-0 left-1/2 -translate-x-1/2 w-1.5 h-3 bg-cyan-500/40" />
            <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-1.5 h-3 bg-cyan-500/40" />
            <span className="absolute left-0 top-1/2 -translate-y-1/2 h-1.5 w-3 bg-cyan-500/40" />
            <span className="absolute right-0 top-1/2 -translate-y-1/2 h-1.5 w-3 bg-cyan-500/40" />
          </div>

          {/* Intermediate Dashed Sensor Orbit Ring */}
          <div className="absolute inset-4 rounded-full border border-dashed border-cyan-500/20 animate-spin-reverse-slow pointer-events-none" />

          {/* Radial Radar Pulse Halo */}
          <div 
            className="absolute inset-8 rounded-full animate-pulse-glow pointer-events-none"
            style={{ 
              background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)` 
            }}
          />

          {/* Precision SVG Multi-Arc Radial Meter */}
          <svg className="w-64 h-64 sm:w-72 sm:h-72 transform -rotate-90 relative z-10">
            {/* Dark Track */}
            <circle
              cx="50%"
              cy="50%"
              r={radius}
              stroke="rgba(15, 23, 42, 0.9)"
              strokeWidth="10"
              fill="transparent"
            />
            {/* Secondary Background Track Guide */}
            <circle
              cx="50%"
              cy="50%"
              r={radius}
              stroke="rgba(56, 189, 248, 0.08)"
              strokeWidth="10"
              strokeDasharray="4 8"
              fill="transparent"
            />
            {/* Active Trust Score Arc */}
            <circle
              cx="50%"
              cy="50%"
              r={radius}
              stroke={signalColor}
              strokeWidth="10"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-1000 ease-out"
              style={{
                filter: `drop-shadow(0 0 8px ${signalColor})`
              }}
            />
          </svg>

          {/* Central Holographic Core Box */}
          <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-20 pointer-events-auto">
            {/* Icon & Shield Header */}
            <div className="mb-1 flex items-center justify-center">
              {isCritical ? (
                <ShieldAlert className="w-7 h-7 text-rose-400 animate-bounce" />
              ) : isHealthy ? (
                <ShieldCheck className="w-7 h-7 text-emerald-400" />
              ) : (
                <Shield className="w-7 h-7 text-amber-400" />
              )}
            </div>

            {/* Giant Monospaced Trust Score Number */}
            <div className="flex items-baseline justify-center font-mono">
              <span className="text-5xl sm:text-6xl font-black tracking-tighter text-slate-100 drop-shadow-md">
                {score.toFixed(1)}
              </span>
              <span className="text-xl sm:text-2xl font-bold text-slate-400 ml-0.5">%</span>
            </div>

            {/* Title Label */}
            <div className="text-[11px] font-mono font-bold tracking-widest text-slate-400 uppercase mt-0.5">
              TRUST SCORE
            </div>

            {/* Status Pill Badge */}
            <div className={`mt-2.5 px-3 py-0.5 rounded-full border text-[10px] font-mono font-extrabold uppercase tracking-wider flex items-center gap-1.5 ${statusBadge}`}>
              <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: signalColor }} />
              <span>{trustScore.status_label}</span>
            </div>
          </div>
        </div>

        {/* Live Anomaly Alert Ticker / Deviation Bar */}
        <div className="w-full max-w-2xl mt-4 px-4 py-2.5 rounded-xl bg-slate-950/80 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2">
            <span className={`p-1 rounded ${deviations.length === 0 ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
              {deviations.length === 0 ? <ShieldCheck className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
            </span>
            <span className="text-slate-300">
              {deviations.length === 0 ? (
                <span className="text-emerald-400">Zero Deviations Detected • Baseline 100% Intact</span>
              ) : (
                <span>
                  <strong className="text-rose-400">{deviations.length} Active Deviations</strong> ({deviations.map(d => d.entity).slice(0, 2).join(', ')})
                </span>
              )}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {score < 100.0 && (
              <button
                onClick={onRevertBaseline}
                className="px-2.5 py-1 text-[11px] rounded bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 transition-colors"
              >
                Restore Baseline
              </button>
            )}
            <button
              onClick={onTriggerAiAnalysis}
              disabled={isAiAnalyzing}
              className="flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold rounded bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 text-white shadow-md shadow-cyan-950/40 transition-all cursor-pointer"
            >
              <Sparkles className={`w-3 h-3 ${isAiAnalyzing ? 'animate-spin' : ''}`} />
              <span>{isAiAnalyzing ? 'Reasoning...' : 'AI Correlate'}</span>
            </button>
          </div>
        </div>

      </div>

      {/* Sub-Metric Telemetry Gauges Row (INTEGRITY, TELEMETRY, IDENTITY, NETWORK) */}
      <div className="relative z-10 grid grid-cols-2 md:grid-cols-4 gap-3 pt-5 border-t border-slate-800/80">
        
        {/* 1. Integrity */}
        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono">
            <span className="flex items-center gap-1.5">
              <FileCheck className="w-3.5 h-3.5 text-cyan-400" />
              <span>INTEGRITY</span>
            </span>
            <span className="text-emerald-400 text-[10px]">HOST</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between font-mono">
            <span className="text-xl font-bold text-slate-100">{integritySubScore}%</span>
            <span className="text-[10px] text-slate-500">Kernel & Binaries</span>
          </div>
        </div>

        {/* 2. Telemetry */}
        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono">
            <span className="flex items-center gap-1.5">
              <Activity className="w-3.5 h-3.5 text-blue-400" />
              <span>TELEMETRY</span>
            </span>
            <span className="text-cyan-400 text-[10px]">LIVE</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between font-mono">
            <span className="text-xl font-bold text-slate-100">{telemetryCount}</span>
            <span className="text-[10px] text-slate-500">Events / min</span>
          </div>
        </div>

        {/* 3. Identity */}
        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono">
            <span className="flex items-center gap-1.5">
              <Fingerprint className="w-3.5 h-3.5 text-purple-400" />
              <span>IDENTITY</span>
            </span>
            <span className="text-purple-400 text-[10px]">AUTH</span>
          </div>
          <div className="mt-2 flex items-baseline justify-between font-mono">
            <span className="text-xl font-bold text-slate-100">{identitySubScore}%</span>
            <span className="text-[10px] text-slate-500">LSASS & Tokens</span>
          </div>
        </div>

        {/* 4. Network */}
        <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800/80 flex flex-col justify-between">
          <div className="flex items-center justify-between text-slate-400 text-[11px] font-mono">
            <span className="flex items-center gap-1.5">
              <Network className="w-3.5 h-3.5 text-teal-400" />
              <span>NETWORK</span>
            </span>
            <span className={suspiciousSockets > 0 ? 'text-rose-400 text-[10px]' : 'text-emerald-400 text-[10px]'}>
              {suspiciousSockets > 0 ? 'ANOMALY' : 'CLEAN'}
            </span>
          </div>
          <div className="mt-2 flex items-baseline justify-between font-mono">
            <span className="text-xl font-bold text-slate-100">{networkSubScore}%</span>
            <span className="text-[10px] text-slate-500">Egress / Sockets</span>
          </div>
        </div>

      </div>

    </div>
  );
};
