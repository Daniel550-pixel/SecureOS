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

  return (
    <header className="border-b border-cyan-500/15 bg-slate-950/90 backdrop-blur-md sticky top-0 z-40 px-4 lg:px-8 py-2.5">
      <div className="max-w-7xl mx-auto flex flex-col gap-3">
        
        {/* Top Control Bar: Brand Identity & Fast Actions */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
          
          {/* Brand & Node Identity */}
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-xl border flex items-center justify-center transition-all ${
              isCritical
                ? 'bg-rose-500/15 border-rose-500/40 text-rose-400 shadow-lg shadow-rose-950/50'
                : isHigh
                ? 'bg-amber-500/15 border-amber-500/40 text-amber-400 shadow-lg shadow-amber-950/40'
                : 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400 shadow-lg shadow-cyan-950/30'
            }`}>
              {isCritical ? (
                <ShieldAlert className="w-5 h-5 animate-pulse" />
              ) : isHealthy ? (
                <ShieldCheck className="w-5 h-5" />
              ) : (
                <Shield className="w-5 h-5" />
              )}
            </div>

            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-black tracking-widest uppercase text-cyan-400 font-mono flex items-center gap-1.5">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400 animate-ping" />
                  SECUREOS
                </span>
                <span className="text-slate-600">•</span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-slate-900 border border-slate-800 text-slate-300 font-mono">
                  NODE: SEC-HQ-01
                </span>
                <span className="text-[10px] text-emerald-400 font-mono hidden sm:inline">
                  ● ACTIVE ARBITER
                </span>
              </div>
              <h1 className="text-sm sm:text-base font-bold text-slate-100 flex items-center gap-2 font-mono">
                Digital Integrity & Trust Operating Environment
              </h1>
            </div>
          </div>

          {/* Scenario Selector & Modal Triggers */}
          <div className="flex items-center flex-wrap gap-2">
            {/* Scenario Selector */}
            <div className="flex items-center bg-slate-900/90 border border-slate-800 rounded-lg px-2 py-1">
              <span className="text-[10px] font-mono uppercase text-slate-400 mr-1.5 flex items-center gap-1">
                <Cpu className="w-3 h-3 text-cyan-400" /> Scenario:
              </span>
              <select
                value={currentScenarioId}
                onChange={(e) => onSelectScenario(e.target.value)}
                className="bg-slate-950 text-xs text-slate-200 border border-slate-800 rounded px-2 py-1 focus:outline-none focus:border-cyan-500 font-mono cursor-pointer"
              >
                {SCENARIOS.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.name} ({s.badge})
                  </option>
                ))}
              </select>
            </div>

            {/* PowerShell Script Agent */}
            <button
              onClick={onOpenAgentModal}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-mono rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-slate-300 transition-colors cursor-pointer"
              title="View ready-to-run PowerShell Agent collection script"
            >
              <Terminal className="w-3 h-3 text-cyan-400" />
              <span>PS Agent</span>
            </button>

            {/* GitHub Blueprint */}
            <button
              onClick={onOpenArchitectureModal}
              className="flex items-center gap-1 px-2.5 py-1 text-xs font-mono rounded-lg bg-cyan-950/40 hover:bg-cyan-900/40 border border-cyan-800/60 text-cyan-300 transition-colors cursor-pointer"
              title="View Architecture Blueprint"
            >
              <Layers className="w-3 h-3 text-cyan-400" />
              <span>Blueprint</span>
            </button>

            {/* Refresh State */}
            <button
              onClick={onRefresh}
              disabled={isLoading}
              className="p-1.5 text-slate-400 hover:text-slate-200 bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors cursor-pointer"
              title="Rescan Integrity State"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
            </button>
          </div>

        </div>

        {/* Bottom Navigation Strip */}
        <nav className="flex items-center gap-1 overflow-x-auto pb-1 text-xs font-mono border-t border-slate-900/80 pt-2">
          <button
            onClick={() => onSelectTab('overview')}
            className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'overview'
                ? 'bg-cyan-500/15 border border-cyan-500/40 text-cyan-300 font-bold shadow-sm shadow-cyan-950/50'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Shield className="w-3.5 h-3.5" />
            <span>Command Center</span>
          </button>

          <button
            onClick={() => onSelectTab('intelligence')}
            className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'intelligence'
                ? 'bg-purple-500/20 border border-purple-500/50 text-purple-300 font-bold shadow-sm shadow-purple-950/50'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5 text-purple-400" />
            <span>Intelligence Workstation</span>
          </button>

          <button
            onClick={() => onSelectTab('topology')}
            className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'topology'
                ? 'bg-teal-500/15 border border-teal-500/40 text-teal-300 font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Network className="w-3.5 h-3.5" />
            <span>Topology Graph</span>
          </button>

          <button
            onClick={() => onSelectTab('integrity')}
            className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'integrity'
                ? 'bg-blue-500/15 border border-blue-500/40 text-blue-300 font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <FileCheck2 className="w-3.5 h-3.5" />
            <span>Integrity Diff Matrix</span>
          </button>

          <button
            onClick={() => onSelectTab('telemetry')}
            className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'telemetry'
                ? 'bg-slate-800 border border-slate-700 text-slate-200 font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Telemetry Stream</span>
          </button>

          <button
            onClick={() => onSelectTab('audit')}
            className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'audit'
                ? 'bg-amber-500/15 border border-amber-500/40 text-amber-300 font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Lock className="w-3.5 h-3.5" />
            <span>Deterministic Math Proof</span>
          </button>

          <button
            onClick={() => onSelectTab('simulation')}
            className={`px-3 py-1 rounded-md transition-all flex items-center gap-1.5 whitespace-nowrap cursor-pointer ${
              activeTab === 'simulation'
                ? 'bg-rose-500/15 border border-rose-500/40 text-rose-300 font-bold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900'
            }`}
          >
            <Zap className="w-3.5 h-3.5" />
            <span>Scenario Lab</span>
          </button>
        </nav>

      </div>
    </header>
  );
};

