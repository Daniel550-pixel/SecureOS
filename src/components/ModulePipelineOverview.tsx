import React from 'react';
import { Activity, GitCompare, CheckCircle2, ShieldAlert, BrainCircuit, MonitorDot, ArrowRight } from 'lucide-react';
import { SystemState, IntegrityDeviation, TrustScoreResult, AIIntegrityAnalysis } from '../types/integrity';

interface ModulePipelineOverviewProps {
  state: SystemState;
  deviations: IntegrityDeviation[];
  trustScore: TrustScoreResult;
  aiAnalysis: AIIntegrityAnalysis | null;
  activeModuleTab: string;
  onSelectModuleTab: (tab: string) => void;
}

export const ModulePipelineOverview: React.FC<ModulePipelineOverviewProps> = ({
  state,
  deviations,
  trustScore,
  aiAnalysis,
  activeModuleTab,
  onSelectModuleTab
}) => {
  const modules = [
    {
      id: 'telemetry',
      step: '01',
      name: 'TELEMETRY',
      description: 'Host & kernel telemetry capture',
      countLabel: `${state.processes.length + state.services.length + state.network_connections.length} records`,
      icon: Activity,
      color: 'text-cyan-400',
      borderColor: 'hover:border-cyan-500/50',
      activeBorder: 'border-cyan-500 bg-cyan-950/20'
    },
    {
      id: 'normalization',
      step: '02',
      name: 'NORMALIZATION',
      description: 'Canonical event schema parsing',
      countLabel: `${state.recent_events.length} events`,
      icon: CheckCircle2,
      color: 'text-blue-400',
      borderColor: 'hover:border-blue-500/50',
      activeBorder: 'border-blue-500 bg-blue-950/20'
    },
    {
      id: 'integrity',
      step: '03',
      name: 'INTEGRITY ENGINE',
      description: 'Golden baseline diffing',
      countLabel: `${deviations.length} deviations`,
      icon: GitCompare,
      color: 'text-amber-400',
      borderColor: 'hover:border-amber-500/50',
      activeBorder: 'border-amber-500 bg-amber-950/20'
    },
    {
      id: 'trust',
      step: '04',
      name: 'TRUST ENGINE',
      description: 'Deterministic mathematical scoring',
      countLabel: `${trustScore.current_score.toFixed(1)}% score`,
      icon: ShieldAlert,
      color: trustScore.current_score >= 90 ? 'text-emerald-400' : 'text-rose-400',
      borderColor: 'hover:border-rose-500/50',
      activeBorder: 'border-rose-500 bg-rose-950/20'
    },
    {
      id: 'ai',
      step: '05',
      name: 'AI ANALYSIS',
      description: 'Gemini security reasoning',
      countLabel: aiAnalysis ? `${(aiAnalysis.confidence * 100).toFixed(0)}% conf` : 'Ready',
      icon: BrainCircuit,
      color: 'text-purple-400',
      borderColor: 'hover:border-purple-500/50',
      activeBorder: 'border-purple-500 bg-purple-950/20'
    },
    {
      id: 'response',
      step: '06',
      name: 'RESPONSE',
      description: 'Visualization, containment, alerts',
      countLabel: 'Active SOC',
      icon: MonitorDot,
      color: 'text-teal-400',
      borderColor: 'hover:border-teal-500/50',
      activeBorder: 'border-teal-500 bg-teal-950/20'
    }
  ];

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-lg">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-4 pb-3 border-b border-slate-800">
        <div>
          <h2 className="text-xs font-mono font-bold tracking-widest text-slate-300 uppercase flex items-center gap-2">
            <span>Six Core Architecture Modules</span>
            <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-400">
              PIPELINE WORKFLOW
            </span>
          </h2>
          <p className="text-xs text-slate-400 mt-0.5">
            End-to-end data flow from raw host telemetry through deterministic evaluation to AI correlation.
          </p>
        </div>
        <div className="text-[11px] font-mono text-cyan-400 flex items-center gap-1">
          <span>Click any module to inspect</span>
        </div>
      </div>

      {/* Responsive Horizontal / Grid Stepper */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3">
        {modules.map((m, index) => {
          const Icon = m.icon;
          const isSelected = activeModuleTab === m.id;

          return (
            <button
              key={m.id}
              onClick={() => onSelectModuleTab(m.id)}
              className={`flex flex-col text-left p-3 rounded-xl border transition-all relative ${
                isSelected
                  ? `${m.activeBorder} shadow-md`
                  : 'bg-slate-950/60 border-slate-800/80 hover:bg-slate-800/40 ' + m.borderColor
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] font-mono font-extrabold text-slate-500">
                  {m.step}
                </span>
                <Icon className={`w-4 h-4 ${m.color}`} />
              </div>

              <span className="text-xs font-bold font-mono text-slate-200 uppercase truncate">
                {m.name}
              </span>
              <span className="text-[11px] text-slate-400 line-clamp-1 mt-0.5">
                {m.description}
              </span>

              <div className="mt-2.5 pt-2 border-t border-slate-800/60 flex items-center justify-between">
                <span className="text-[10px] font-mono font-semibold text-slate-300">
                  {m.countLabel}
                </span>
                {index < modules.length - 1 && (
                  <ArrowRight className="w-3 h-3 text-slate-600 hidden lg:block -mr-1" />
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};
