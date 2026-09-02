import React, { useState } from 'react';
import { BrainCircuit, Sparkles, AlertCircle, ShieldAlert, Terminal, Copy, Check, ArrowRight, CornerDownLeft, Info, HelpCircle } from 'lucide-react';
import { AIIntegrityAnalysis, TrustScoreResult, IntegrityDeviation } from '../types/integrity';

interface AiAnalysisCardProps {
  analysis: AIIntegrityAnalysis | null;
  trustScore: TrustScoreResult;
  deviations: IntegrityDeviation[];
  isLoading: boolean;
  onRunAnalysis: (customQuery?: string) => void;
  onExecuteRemediation: (actionType: string, targetEntity: string) => void;
}

export const AiAnalysisCard: React.FC<AiAnalysisCardProps> = ({
  analysis,
  trustScore,
  deviations,
  isLoading,
  onRunAnalysis,
  onExecuteRemediation
}) => {
  const [customPrompt, setCustomPrompt] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSubmitCustom = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customPrompt.trim() || isLoading) return;
    onRunAnalysis(customPrompt);
  };

  const getAssessmentBadge = (assessment: string) => {
    switch (assessment) {
      case 'critical_compromise':
        return 'bg-rose-500/20 border-rose-500/40 text-rose-300';
      case 'high_risk':
        return 'bg-amber-500/20 border-amber-500/40 text-amber-300';
      case 'elevated_risk':
        return 'bg-yellow-500/20 border-yellow-500/40 text-yellow-300';
      default:
        return 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300';
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
      
      {/* Header with Invariant Badge */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 pb-4 border-b border-slate-800 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/30 text-purple-400">
            <BrainCircuit className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xs font-mono font-bold tracking-widest text-slate-300 uppercase">
                Module 05 • AI Analysis & Security Reasoning
              </h2>
              <span className="text-[10px] px-2 py-0.5 rounded bg-purple-950/60 border border-purple-800/60 text-purple-300 font-mono">
                GEMINI 3.8 FLASH
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Correlates telemetry anomalies, maps attack chains, and formulates response recommendations.
            </p>
          </div>
        </div>

        {/* Deterministic Score Invariant Pill */}
        <div className="flex items-center gap-2 bg-slate-950 px-3 py-1.5 rounded-lg border border-slate-800 text-xs font-mono">
          <span className="text-slate-400">Ground-Truth Score:</span>
          <span className="text-cyan-400 font-bold">{trustScore.current_score.toFixed(1)}%</span>
          <span className="text-slate-600">|</span>
          <span className="text-[10px] text-slate-400">Deterministic Invariant</span>
        </div>
      </div>

      {/* Main Analysis Body */}
      {isLoading ? (
        <div className="py-16 flex flex-col items-center justify-center text-center space-y-4">
          <div className="relative">
            <div className="w-12 h-12 rounded-full border-2 border-purple-500/30 border-t-purple-400 animate-spin" />
            <Sparkles className="w-5 h-5 text-purple-400 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          </div>
          <div>
            <p className="text-sm font-semibold text-slate-200">
              Gemini Correlating Evidence & Evaluating Deviations...
            </p>
            <p className="text-xs text-slate-400 font-mono mt-1">
              Analyzing {deviations.length} baseline anomalies against MITRE ATT&CK taxonomy
            </p>
          </div>
        </div>
      ) : analysis ? (
        <div className="space-y-6">
          
          {/* Executive Headline & Summary */}
          <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800">
            <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
              <span className={`px-2.5 py-0.5 rounded-full border text-[11px] font-mono font-bold uppercase ${getAssessmentBadge(analysis.assessment)}`}>
                {analysis.assessment.replace(/_/g, ' ')}
              </span>
              <div className="text-xs font-mono text-slate-400 flex items-center gap-1.5">
                <span>Model Confidence:</span>
                <span className="text-purple-400 font-bold">{(analysis.confidence * 100).toFixed(0)}%</span>
              </div>
            </div>

            <h3 className="text-base font-bold text-slate-100 mb-2">
              {analysis.summary_headline}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed">
              {analysis.detailed_explanation}
            </p>
          </div>

          {/* Adversary Attack Narrative */}
          {analysis.attack_narrative && (
            <div className="p-4 rounded-xl bg-slate-950/40 border border-slate-800">
              <h4 className="text-xs font-mono font-bold uppercase text-slate-400 mb-2 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
                <span>Adversary Attack Narrative / Threat Hypothesis</span>
              </h4>
              <p className="text-xs text-slate-300 leading-relaxed">
                {analysis.attack_narrative}
              </p>
            </div>
          )}

          {/* MITRE ATT&CK Correlation Chain */}
          {analysis.correlated_chain && analysis.correlated_chain.length > 0 && (
            <div>
              <h4 className="text-xs font-mono font-bold uppercase text-slate-400 mb-2.5 flex items-center gap-1.5">
                <span>Correlated Attack Chain (MITRE ATT&CK)</span>
              </h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {analysis.correlated_chain.map((chain, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-slate-950/90 border border-slate-800 flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <span className="text-[11px] font-mono font-bold text-cyan-300">
                          {chain.tactic}
                        </span>
                        <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                          {chain.technique}
                        </span>
                      </div>
                      <p className="text-xs text-slate-300">
                        {chain.description}
                      </p>
                    </div>

                    <div className="mt-2 pt-2 border-t border-slate-800/80 flex items-center justify-between text-[11px] font-mono">
                      <span className="text-slate-400 truncate max-w-[160px]">
                        {chain.involved_entities.join(', ')}
                      </span>
                      <span className={`px-1.5 py-0.2 rounded font-bold uppercase text-[10px] ${
                        chain.threat_likelihood === 'critical'
                          ? 'text-rose-400'
                          : chain.threat_likelihood === 'high'
                          ? 'text-amber-400'
                          : 'text-yellow-400'
                      }`}>
                        {chain.threat_likelihood}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recommended Containment & Remediation Actions */}
          {analysis.recommended_actions && analysis.recommended_actions.length > 0 && (
            <div>
              <h4 className="text-xs font-mono font-bold uppercase text-slate-400 mb-2.5 flex items-center gap-1.5">
                <Terminal className="w-3.5 h-3.5 text-cyan-400" />
                <span>Recommended Response & Containment Protocol</span>
              </h4>

              <div className="space-y-2.5">
                {analysis.recommended_actions.map((act) => (
                  <div
                    key={act.id}
                    className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-3"
                  >
                    <div className="space-y-1 flex-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[10px] font-mono px-2 py-0.5 rounded uppercase font-bold ${
                          act.priority === 'urgent'
                            ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            : act.priority === 'high'
                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                            : 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                        }`}>
                          {act.priority}
                        </span>
                        <span className="text-xs font-bold text-slate-200">{act.title}</span>
                      </div>
                      <p className="text-xs text-slate-400">{act.explanation}</p>

                      {act.command_snippet && (
                        <div className="mt-2 p-2 rounded bg-slate-900 border border-slate-800 font-mono text-[11px] text-cyan-300 flex items-center justify-between gap-2 overflow-x-auto">
                          <code className="truncate">{act.command_snippet}</code>
                          <button
                            onClick={() => handleCopy(act.command_snippet!, act.id)}
                            className="p-1 text-slate-400 hover:text-slate-200 flex-shrink-0"
                            title="Copy Command"
                          >
                            {copiedId === act.id ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="flex-shrink-0">
                      <button
                        onClick={() => onExecuteRemediation(act.type, act.title)}
                        className="px-3 py-1.5 text-xs font-mono font-medium rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors cursor-pointer"
                      >
                        Apply Fix
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      ) : (
        <div className="py-8 text-center bg-slate-950/40 rounded-xl border border-slate-800/80">
          <BrainCircuit className="w-8 h-8 text-slate-600 mx-auto mb-2" />
          <p className="text-xs text-slate-400 font-mono">
            Click 'Run AI Analysis' to invoke Gemini reasoning over the active security context.
          </p>
        </div>
      )}

      {/* Interactive AI Query Form */}
      <div className="mt-6 pt-4 border-t border-slate-800">
        <form onSubmit={handleSubmitCustom} className="flex gap-2">
          <input
            type="text"
            value={customPrompt}
            onChange={(e) => setCustomPrompt(e.target.value)}
            placeholder="Ask Gemini: 'Explain the likely relationship between these events' or 'Generate SOC report'..."
            className="flex-1 bg-slate-950 text-xs text-slate-200 border border-slate-800 rounded-lg px-3.5 py-2 focus:outline-none focus:border-purple-500 font-mono"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !customPrompt.trim()}
            className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:bg-slate-800 disabled:text-slate-600 text-xs font-mono font-bold text-white rounded-lg transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <span>Query AI</span>
            <CornerDownLeft className="w-3.5 h-3.5" />
          </button>
        </form>
      </div>

    </div>
  );
};
