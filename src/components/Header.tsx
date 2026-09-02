import React from 'react';
import { Shield, ShieldAlert, ShieldCheck, Terminal, Cpu, RefreshCw, Layers, Database } from 'lucide-react';
import { RiskClassification } from '../types/integrity';
import { SCENARIOS } from '../engine/scenarios';

interface HeaderProps {
  currentScenarioId: string;
  onSelectScenario: (id: string) => void;
  riskClassification: RiskClassification;
  onOpenAgentModal: () => void;
  onOpenArchitectureModal: () => void;
  isLoading: boolean;
  onRefresh: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  currentScenarioId,
  onSelectScenario,
  riskClassification,
  onOpenAgentModal,
  onOpenArchitectureModal,
  isLoading,
  onRefresh
}) => {
  const isHealthy = riskClassification === 'LOW';
  const isCritical = riskClassification === 'CRITICAL';
  const isHigh = riskClassification === 'HIGH';

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-40 px-4 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        
        {/* Brand & Node Identity */}
        <div className="flex items-center gap-3.5">
          <div className={`p-2.5 rounded-xl border flex items-center justify-center transition-colors ${
            isCritical
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
              : isHigh
              ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
          }`}>
            {isCritical ? (
              <ShieldAlert className="w-6 h-6 animate-pulse" />
            ) : isHealthy ? (
              <ShieldCheck className="w-6 h-6" />
            ) : (
              <Shield className="w-6 h-6" />
            )}
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold tracking-wider uppercase text-cyan-400 font-mono">
                JARVIS • AIOS UAE
              </span>
              <span className="text-slate-600">•</span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-slate-300 font-mono">
                SEC-HQ-NODE-DXB
              </span>
            </div>
            <h1 className="text-lg font-bold text-slate-100 flex items-center gap-2">
              Digital Integrity & Trust Monitor
              <span className="text-xs font-normal px-2 py-0.5 rounded bg-cyan-950/60 border border-cyan-800/60 text-cyan-300 font-mono">
                ARCHITECTURAL PROTOTYPE
              </span>
            </h1>
          </div>
        </div>

        {/* Scenario Presets & Quick Actions */}
        <div className="flex items-center flex-wrap gap-2.5">
          {/* Scenario Selector */}
          <div className="flex items-center bg-slate-950 border border-slate-800 rounded-lg p-1">
            <span className="text-[11px] font-mono uppercase text-slate-400 px-2 flex items-center gap-1">
              <Cpu className="w-3.5 h-3.5 text-cyan-400" /> Scenario:
            </span>
            <select
              value={currentScenarioId}
              onChange={(e) => onSelectScenario(e.target.value)}
              className="bg-slate-900 text-xs text-slate-200 border border-slate-700 rounded px-2.5 py-1.5 focus:outline-none focus:border-cyan-500 font-medium cursor-pointer"
            >
              {SCENARIOS.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name} ({s.badge})
                </option>
              ))}
            </select>
          </div>

          {/* PowerShell Agent Script Button */}
          <button
            onClick={onOpenAgentModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded-lg bg-slate-800 hover:bg-slate-700 border border-slate-700 text-slate-200 transition-colors"
            title="View ready-to-run PowerShell Agent collection script"
          >
            <Terminal className="w-3.5 h-3.5 text-cyan-400" />
            <span>PowerShell Agent</span>
          </button>

          {/* Architecture Mapping Button */}
          <button
            onClick={onOpenArchitectureModal}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono font-medium rounded-lg bg-cyan-950/40 hover:bg-cyan-900/40 border border-cyan-800/60 text-cyan-200 transition-colors"
            title="View 6-Module Architecture & GitHub Target Mapping"
          >
            <Layers className="w-3.5 h-3.5 text-cyan-400" />
            <span>GitHub Blueprint</span>
          </button>

          {/* Refresh Button */}
          <button
            onClick={onRefresh}
            disabled={isLoading}
            className="p-2 text-slate-400 hover:text-slate-200 bg-slate-800/80 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors"
            title="Rescan Integrity State"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-cyan-400' : ''}`} />
          </button>
        </div>

      </div>
    </header>
  );
};
