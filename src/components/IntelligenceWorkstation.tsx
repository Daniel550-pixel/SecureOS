import React, { useState } from 'react';
import { 
  Sparkles, 
  Terminal, 
  ShieldAlert, 
  ShieldCheck, 
  Layers, 
  CheckCircle2, 
  Copy, 
  Play, 
  CornerDownRight, 
  Check, 
  BrainCircuit, 
  Cpu, 
  FileText,
  AlertTriangle,
  Lock,
  Zap,
  RotateCcw
} from 'lucide-react';
import { AIIntegrityAnalysis, TrustScoreResult, SystemState, IntegrityDeviation } from '../types/integrity';

interface IntelligenceWorkstationProps {
  analysis: AIIntegrityAnalysis | null;
  trustScore: TrustScoreResult;
  deviations: IntegrityDeviation[];
  state: SystemState;
  isLoading: boolean;
  onRefreshAnalysis: () => void;
  onExecuteRemediation?: (cmd: string) => void;
  onCustomPrompt?: (prompt: string) => void;
}

export const IntelligenceWorkstation: React.FC<IntelligenceWorkstationProps> = ({
  analysis,
  trustScore,
  deviations,
  state,
  isLoading,
  onRefreshAnalysis,
  onExecuteRemediation,
  onCustomPrompt
}) => {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [customQuery, setCustomQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'attack_chain' | 'mitre' | 'remediation'>('attack_chain');

  const copyToClipboard = (text: string, idx: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const handleCustomSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customQuery.trim() || !onCustomPrompt) return;
    onCustomPrompt(customQuery);
    setCustomQuery('');
  };

  return (
    <div className="space-y-6">
      
      {/* Top Banner: Strict Architectural Separation */}
      <div className="p-4 rounded-xl bg-slate-950/90 border border-slate-800 flex flex-wrap items-center justify-between gap-4 font-mono text-xs">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-100">SECUREOS INTELLIGENCE WORKSTATION</span>
              <span className="text-slate-600">•</span>
              <span className="text-[10px] text-purple-400 font-mono">GEMINI REASONING CORE</span>
            </div>
            <p className="text-slate-400 text-[11px] mt-0.5">
              Architectural Invariant: <span className="text-cyan-400 font-bold">Deterministic Engine = Authority</span> &bull; <span className="text-purple-400 font-bold">AI = Reasoning & Correlation Layer</span>.
            </p>
          </div>
        </div>

        <button
          onClick={onRefreshAnalysis}
          disabled={isLoading}
          className="flex items-center gap-2 px-3.5 py-1.5 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-mono font-bold text-xs shadow-lg shadow-purple-950/50 transition-all cursor-pointer disabled:opacity-50"
        >
          <Sparkles className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>{isLoading ? 'Synthesizing Telemetry...' : 'Synthesize New Assessment'}</span>
        </button>
      </div>

      {/* Main Split Grid: Deterministic Facts vs AI Reasoning */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column (4 cols): Ground Truth Facts & Invariants */}
        <div className="lg:col-span-4 space-y-4">
          <div className="secure-panel rounded-2xl p-5 relative overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <span className="text-xs font-mono font-bold tracking-widest text-slate-300 uppercase flex items-center gap-2">
                <Lock className="w-3.5 h-3.5 text-cyan-400" />
                <span>DETERMINISTIC GROUND TRUTH</span>
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-400 border border-cyan-800">
                AUDITABLE
              </span>
            </div>

            <div className="mt-4 space-y-3 font-mono text-xs">
              <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800/80 flex items-center justify-between">
                <span className="text-slate-400">Deterministic Score</span>
                <span className={`font-bold text-sm ${(trustScore?.current_score ?? 100) >= 90 ? 'text-emerald-400' : 'text-amber-400'}`}>
                  {(trustScore?.current_score ?? 100).toFixed(1)}%
                </span>
              </div>

              <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800/80 flex items-center justify-between">
                <span className="text-slate-400">Total Deductions</span>
                <span className="text-rose-400 font-bold">-{(trustScore?.total_deductions ?? (trustScore as any)?.total_deduction ?? 0).toFixed(1)} pts</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800/80 flex items-center justify-between">
                <span className="text-slate-400">Active Deviations</span>
                <span className="text-slate-200 font-bold">{(deviations || []).length} items</span>
              </div>

              <div className="p-3 rounded-lg bg-slate-950/80 border border-slate-800/80 flex items-center justify-between">
                <span className="text-slate-400">Host Platform</span>
                <span className="text-slate-200">Windows Server 2022</span>
              </div>
            </div>

            {/* List of active deviations */}
            <div className="mt-4 pt-3 border-t border-slate-800/80">
              <span className="text-[10px] font-mono font-bold text-slate-500 uppercase tracking-wider block mb-2">
                DETECTED BASELINE VIOLATIONS
              </span>
              <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
                {(!deviations || deviations.length === 0) ? (
                  <div className="p-2 rounded bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-mono">
                    ✓ Clean baseline. Zero deviations detected.
                  </div>
                ) : (
                  deviations.map((dev: any, i) => (
                    <div key={i} className="p-2.5 rounded bg-slate-950/90 border border-slate-800 font-mono text-[11px]">
                      <div className="flex items-center justify-between text-rose-400 font-bold">
                        <span>{dev.entity || dev.title || 'Deviation'}</span>
                        <span>-{(dev.deduction_weight ?? dev.weight ?? 0).toFixed(1)}</span>
                      </div>
                      <div className="text-slate-400 text-[10px] mt-0.5">{dev.description || dev.reason || dev.title}</div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Quick AI Query Terminal */}
          <div className="secure-panel rounded-2xl p-4">
            <span className="text-xs font-mono font-bold text-slate-300 uppercase flex items-center gap-2 mb-2">
              <Terminal className="w-3.5 h-3.5 text-purple-400" />
              <span>QUERY INTELLIGENCE ENGINE</span>
            </span>
            <form onSubmit={handleCustomSubmit} className="space-y-2">
              <input
                type="text"
                value={customQuery}
                onChange={(e) => setCustomQuery(e.target.value)}
                placeholder="Ask e.g. 'Is win_updater.exe malicious?'"
                className="w-full bg-slate-950 border border-slate-800 rounded-lg px-3 py-2 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-purple-500"
              />
              <button
                type="submit"
                disabled={!customQuery.trim() || isLoading}
                className="w-full py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 text-purple-300 font-mono text-xs border border-purple-900/50 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
              >
                <span>Submit Query</span>
                <CornerDownRight className="w-3 h-3" />
              </button>
            </form>
          </div>
        </div>

        {/* Right Column (8 cols): AI Synthesis, Attack Chain, Mitre, Remediation */}
        <div className="lg:col-span-8 space-y-4">
          
          {analysis ? (
            <div className="secure-panel rounded-2xl p-6 relative">
              
              {/* Analysis Header */}
              <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-purple-400 uppercase tracking-wider">
                      AI REASONING VERDICT
                    </span>
                    <span className="text-slate-600">•</span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      (analysis.risk_level === 'CRITICAL' || analysis.assessment?.toLowerCase().includes('critical')) ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40' :
                      (analysis.risk_level === 'HIGH' || analysis.assessment?.toLowerCase().includes('high')) ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40' :
                      'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                    }`}>
                      {analysis.risk_level || (analysis.assessment?.includes('CRITICAL') ? 'CRITICAL' : analysis.assessment?.includes('HIGH') ? 'HIGH' : 'ELEVATED')} RISK
                    </span>
                  </div>
                  <h4 className="text-sm font-bold text-slate-100 mt-1 font-mono">
                    {analysis.assessment || analysis.threat_hypothesis || analysis.summary_headline}
                  </h4>
                </div>

                <div className="flex items-center gap-3 font-mono text-xs">
                  <div className="px-2 py-1 rounded bg-slate-900 border border-slate-800 text-slate-400 text-[11px] flex items-center gap-1.5">
                    <Lock className="w-3 h-3 text-cyan-400" />
                    <span>Score Authority: <strong className="text-cyan-400">Read-Only</strong></span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="text-slate-500">Confidence:</span>
                    <span className="text-cyan-400 font-bold">
                      {Math.round(((typeof analysis.confidence === 'number' ? analysis.confidence : analysis.confidence_score || 0.94)) * 100)}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Invariant Architectural Guarantee Box */}
              {analysis.trust_score_invariant && (
                <div className="mt-3 px-3 py-2 rounded-lg bg-cyan-950/30 border border-cyan-500/20 flex items-center justify-between font-mono text-[11px]">
                  <div className="flex items-center gap-2 text-cyan-300">
                    <ShieldCheck className="w-4 h-4 text-cyan-400 flex-shrink-0" />
                    <span>{analysis.trust_score_invariant.message || 'Gemini authority is strictly read-only; Trust Score cannot be altered by AI.'}</span>
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-900/60 text-cyan-300 border border-cyan-700/50 flex-shrink-0">
                    SCORE: {analysis.trust_score_invariant.ground_truth_score ?? trustScore.current_score}% LOCKED
                  </span>
                </div>
              )}

              {/* Comprehensive Summary Narrative / Explanation */}
              <div className="my-4 p-4 rounded-xl bg-slate-950/80 border border-slate-900 text-xs text-slate-300 leading-relaxed font-mono">
                <p className="font-bold text-slate-200 mb-1 flex items-center gap-1.5 text-[11px] text-purple-300">
                  <FileText className="w-3.5 h-3.5" />
                  <span>Causal Relationship & Deviation Explanation</span>
                </p>
                {analysis.explanation || analysis.executive_summary || analysis.detailed_explanation || analysis.attack_narrative}
              </div>

              {/* Sub-tabs: Attack Chain vs MITRE vs Actionable Protocols */}
              <div className="flex items-center gap-2 border-b border-slate-800 pb-2 mb-4 font-mono text-xs">
                <button
                  onClick={() => setActiveTab('attack_chain')}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    activeTab === 'attack_chain' 
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Correlated Events ({(analysis.correlated_events || analysis.correlated_activity_chain || analysis.correlated_chain || []).length})
                </button>
                <button
                  onClick={() => setActiveTab('mitre')}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    activeTab === 'mitre' 
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  MITRE ATT&CK Matrix ({(analysis.mitre_mappings || []).length})
                </button>
                <button
                  onClick={() => setActiveTab('remediation')}
                  className={`px-3 py-1 rounded-md transition-colors ${
                    activeTab === 'remediation' 
                      ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40' 
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Recommended Actions ({(analysis.recommended_actions || []).length})
                </button>
              </div>

              {/* Tab 1: Correlated Attack Chain */}
              {activeTab === 'attack_chain' && (
                <div className="space-y-3 font-mono text-xs">
                  {(analysis.correlated_events || analysis.correlated_activity_chain || analysis.correlated_chain || []).map((step: any, idx: number) => (
                    <div 
                      key={idx}
                      className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800 flex items-start gap-3"
                    >
                      <div className="w-6 h-6 rounded-full bg-purple-950/80 border border-purple-500/40 text-purple-300 flex items-center justify-center font-bold text-xs flex-shrink-0 mt-0.5">
                        {idx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-100">{step.stage || step.title || step.tactic}</span>
                          <span className="text-[10px] text-slate-500">{step.timestamp || step.mitre_technique || step.technique}</span>
                        </div>
                        {step.title && step.stage && step.title !== step.stage && (
                          <div className="text-[11px] font-bold text-purple-300/90 mt-0.5">{step.title}</div>
                        )}
                        <p className="text-slate-400 mt-1">{step.description}</p>
                        {step.involved_entities && step.involved_entities.length > 0 && (
                          <div className="mt-2 flex flex-wrap gap-1 items-center">
                            <span className="text-[10px] text-slate-500">Involved Entities:</span>
                            {step.involved_entities.map((ent: string, eIdx: number) => (
                              <span key={eIdx} className="text-[10px] px-1.5 py-0.5 rounded bg-slate-900 text-cyan-300 border border-slate-800">
                                {ent}
                              </span>
                            ))}
                          </div>
                        )}
                        {(step.evidence || step.mitre_tactic) && (
                          <div className="mt-2 text-[11px] text-cyan-400/80 bg-slate-900/60 px-2.5 py-1 rounded border border-slate-800/60 flex items-center justify-between flex-wrap gap-2">
                            <span>Evidence: <span className="text-slate-300">{step.evidence || 'Baseline deviation & socket correlation'}</span></span>
                            {step.mitre_tactic && (
                              <span className="text-[10px] text-purple-400 font-mono">Tactic: {step.mitre_tactic}</span>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab 2: MITRE ATT&CK Mappings */}
              {activeTab === 'mitre' && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 font-mono text-xs">
                  {(analysis.mitre_mappings || []).map((m, idx) => (
                    <div key={idx} className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800">
                      <div className="flex items-center justify-between pb-1 mb-1 border-b border-slate-900">
                        <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-400 font-bold text-[10px]">
                          {m.technique_id}
                        </span>
                        <span className="text-[10px] text-slate-400">{m.tactic}</span>
                      </div>
                      <div className="font-bold text-slate-200 mt-1">{m.technique_name}</div>
                      <p className="text-[11px] text-slate-400 mt-1">{m.evidence}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Tab 3: Actionable Remediation Protocols */}
              {activeTab === 'remediation' && (
                <div className="space-y-3 font-mono text-xs">
                  {(analysis.recommended_actions || []).map((act: any, idx: number) => {
                    const cmd = act.command_snippet || act.command;
                    return (
                      <div key={idx} className="p-3.5 rounded-xl bg-slate-950/90 border border-slate-800">
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-slate-100 flex items-center gap-2">
                            <Zap className="w-3.5 h-3.5 text-amber-400" />
                            <span>{act.title || act.action}</span>
                          </span>
                          <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                            (act.priority === 'urgent' || act.urgency === 'IMMEDIATE') ? 'bg-rose-500/20 text-rose-400' : 'bg-amber-500/20 text-amber-400'
                          }`}>
                            {act.urgency || act.priority || 'HIGH'}
                          </span>
                        </div>

                        <p className="text-slate-400 mt-1 text-[11px]">{act.explanation || act.rationale}</p>

                        {cmd && (
                          <div className="mt-2 flex items-center justify-between bg-slate-900/90 p-2 rounded-lg border border-slate-800">
                            <code className="text-cyan-300 text-[11px] truncate mr-2">{cmd}</code>
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <button
                                onClick={() => copyToClipboard(cmd, idx)}
                                className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
                                title="Copy Command"
                              >
                                {copiedIndex === idx ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                              </button>
                              {onExecuteRemediation && (
                                <button
                                  onClick={() => onExecuteRemediation(cmd)}
                                  className="px-2 py-0.5 rounded bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-bold transition-colors"
                                >
                                  Execute
                                </button>
                              )}
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}

            </div>
          ) : (
            <div className="secure-panel rounded-2xl p-12 text-center flex flex-col items-center justify-center">
              <Sparkles className="w-10 h-10 text-purple-400/50 mb-3 animate-pulse" />
              <h4 className="text-sm font-mono font-bold text-slate-200">
                AI Reasoning Assessment Ready
              </h4>
              <p className="text-xs text-slate-400 max-w-md mt-1 font-mono">
                Trigger Gemini reasoning to correlate baseline deviations, process signatures, and network sockets into a structured threat hypothesis.
              </p>
              <button
                onClick={onRefreshAnalysis}
                disabled={isLoading}
                className="mt-4 px-4 py-2 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-mono font-bold text-xs shadow-lg shadow-purple-950/50 transition-all cursor-pointer"
              >
                {isLoading ? 'Synthesizing...' : 'Generate AI Assessment'}
              </button>
            </div>
          )}

        </div>

      </div>

    </div>
  );
};
