import React from 'react';
import {
  Shield,
  ShieldAlert,
  ShieldCheck,
  Terminal,
  Cpu,
  RefreshCw,
  Layers,
  Network,
  Activity,
  FileCheck2,
  Lock,
  Sparkles,
  Zap
} from 'lucide-react';
import { RiskClassification } from '../types/integrity';
import { SCENARIOS } from '../engine/scenarios';

export type SecureOsTab =
  | 'overview'
  | 'intelligence'
  | 'topology'
  | 'integrity'
  | 'telemetry'
  | 'audit'
  | 'simulation';

interface HeaderProps {
  currentScenarioId: string;
  onSelectScenario: (id: string) => void;
  riskClassification: RiskClassification;
  activeTab: SecureOsTab;
  onSelectTab: (tab: SecureOsTab) => void;
  onOpenAgentModal: () => void;
  onOpenArchitectureModal: () => void;
  isLoading: boolean;
  onRefresh: () => void;
}

const tabs: Array<{ id: SecureOsTab; label: string; icon: React.ElementType; active: string }> = [
  { id: 'overview', label: 'Overview', icon: Shield, active: 'border-cyan-400/30 bg-cyan-400/[0.08] text-cyan-200' },
  { id: 'integrity', label: 'Integrity', icon: FileCheck2, active: 'border-blue-400/30 bg-blue-400/[0.08] text-blue-200' },
  { id: 'telemetry', label: 'Telemetry', icon: Activity, active: 'border-slate-400/25 bg-white/[0.05] text-slate-100' },
  { id: 'topology', label: 'Topology', icon: Network, active: 'border-teal-400/30 bg-teal-400/[0.08] text-teal-200' },
  { id: 'intelligence', label: 'Intelligence', icon: Sparkles, active: 'border-purple-400/30 bg-purple-400/[0.08] text-purple-200' },
  { id: 'audit', label: 'Audit', icon: Lock, active: 'border-amber-400/30 bg-amber-400/[0.08] text-amber-200' },
  { id: 'simulation', label: 'Scenario Lab', icon: Zap, active: 'border-rose-400/30 bg-rose-400/[0.08] text-rose-200' }
];

export const Header: React.FC<HeaderProps> = ({
  currentScenarioId,
  onSelectScenario,
  riskClassification,
  activeTab,
  onSelectTab,
  onOpenAgentModal,
  onOpenArchitectureModal,
  isLoading,
  onRefresh
}) => {
  const isHealthy = riskClassification === 'LOW';
  const isCritical = riskClassification === 'CRITICAL';
  const isHigh = riskClassification === 'HIGH';
  const signalClass = isCritical ? 'text-rose-400 border-rose-400/25 bg-rose-500/[0.08]' : isHigh ? 'text-amber-300 border-amber-400/25 bg-amber-500/[0.08]' : 'text-cyan-300 border-cyan-400/20 bg-cyan-400/[0.06]';

  return (
    <header className="sticky top-0 z-40 border-b border-white/[0.06] bg-[#03070d]/82 backdrop-blur-2xl">
      <div className="max-w-[1500px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="min-h-[68px] py-3 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`w-10 h-10 shrink-0 rounded-xl border flex items-center justify-center shadow-2xl ${signalClass}`}>
              {isCritical ? <ShieldAlert className="w-5 h-5" /> : isHealthy ? <ShieldCheck className="w-5 h-5" /> : <Shield className="w-5 h-5" />}
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 font-mono text-[10px] uppercase tracking-[0.16em] text-cyan-300">
                <span className="relative flex h-1.5 w-1.5"><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-cyan-300 opacity-60" /><span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-cyan-300" /></span>
                SECUREOS
                <span className="text-slate-700">/</span>
                <span className="text-slate-500 tracking-[0.08em]">NODE SEC-HQ-01</span>
              </div>
              <div className="mt-0.5 flex items-center gap-2 min-w-0">
                <h1 className="truncate text-sm sm:text-[15px] font-semibold tracking-[-0.02em] text-slate-100">Digital Integrity Operating Environment</h1>
                <span className={`hidden sm:inline-flex px-2 py-0.5 rounded-full border font-mono text-[9px] uppercase ${signalClass}`}>{riskClassification}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            <label className="h-9 flex items-center gap-2 rounded-lg border border-white/[0.07] bg-white/[0.025] px-2.5 text-[10px] font-mono uppercase tracking-wide text-slate-500">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Scenario</span>
              <select value={currentScenarioId} onChange={(e) => onSelectScenario(e.target.value)} className="max-w-[190px] bg-transparent text-[11px] text-slate-200 outline-none cursor-pointer normal-case tracking-normal">
                {SCENARIOS.map((s) => <option key={s.id} value={s.id} className="bg-slate-950">{s.name}</option>)}
              </select>
            </label>
            <button onClick={onOpenAgentModal} className="h-9 px-3 inline-flex items-center gap-1.5 rounded-lg border border-white/[0.07] bg-white/[0.025] text-[11px] font-mono text-slate-300 hover:bg-white/[0.05] hover:border-cyan-400/20 transition-colors">
              <Terminal className="w-3.5 h-3.5 text-cyan-400" /><span>PS Agent</span>
            </button>
            <button onClick={onOpenArchitectureModal} className="h-9 px-3 inline-flex items-center gap-1.5 rounded-lg border border-cyan-400/15 bg-cyan-400/[0.05] text-[11px] font-mono text-cyan-200 hover:bg-cyan-400/[0.09] transition-colors">
              <Layers className="w-3.5 h-3.5" /><span>Architecture</span>
            </button>
            <button onClick={onRefresh} disabled={isLoading} title="Rescan integrity state" className="h-9 w-9 inline-flex items-center justify-center rounded-lg border border-white/[0.07] bg-white/[0.025] text-slate-400 hover:text-cyan-200 hover:border-cyan-400/20 transition-colors disabled:opacity-50">
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        <nav className="flex items-center gap-1 overflow-x-auto pb-2 font-mono">
          {tabs.map(({ id, label, icon: Icon, active }) => (
            <button key={id} onClick={() => onSelectTab(id)} className={`shrink-0 h-8 px-3 inline-flex items-center gap-1.5 rounded-lg border text-[10px] uppercase tracking-[0.04em] transition-all ${activeTab === id ? active : 'border-transparent text-slate-500 hover:text-slate-200 hover:bg-white/[0.03]'}`}>
              <Icon className="w-3.5 h-3.5" />
              <span>{label}</span>
            </button>
          ))}
        </nav>
      </div>
    </header>
  );
};
