import React, { useState, useEffect, useCallback } from 'react';
import { Header } from './components/Header';
import { TrustGaugeCard } from './components/TrustGaugeCard';
import { ModulePipelineOverview } from './components/ModulePipelineOverview';
import { AiAnalysisCard } from './components/AiAnalysisCard';
import { IntegrityDiffMatrix } from './components/IntegrityDiffMatrix';
import { TrustScoreAuditTable } from './components/TrustScoreAuditTable';
import { TelemetryStream } from './components/TelemetryStream';
import { ScenarioSimulator } from './components/ScenarioSimulator';
import { PowerShellAgentModal } from './components/PowerShellAgentModal';
import { ArchitectureModal } from './components/ArchitectureModal';
import { SystemState, SystemBaseline, IntegrityDeviation, TrustScoreResult, AIIntegrityAnalysis } from './types/integrity';
import { BrainCircuit, GitCompare, Calculator, Activity, Radio, Shield, CheckCircle2, AlertCircle } from 'lucide-react';

export default function App() {
  const [state, setState] = useState<SystemState | null>(null);
  const [baseline, setBaseline] = useState<SystemBaseline | null>(null);
  const [deviations, setDeviations] = useState<IntegrityDeviation[]>([]);
  const [trustScore, setTrustScore] = useState<TrustScoreResult | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIIntegrityAnalysis | null>(null);

  const [currentScenarioId, setCurrentScenarioId] = useState<string>('supply_chain_tamper');
  const [activeModuleTab, setActiveModuleTab] = useState<string>('ai');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState<boolean>(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);

  const [isAgentModalOpen, setIsAgentModalOpen] = useState<boolean>(false);
  const [isArchitectureModalOpen, setIsArchitectureModalOpen] = useState<boolean>(false);

  const showToast = (text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    setTimeout(() => setToastMessage(null), 4000);
  };

  // 1. Fetch live system state from backend API
  const fetchState = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/state');
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      const data = await res.json();
      setState(data.state);
      setBaseline(data.baseline);
      setDeviations(data.deviations);
      setTrustScore(data.trustScore);
      setAiAnalysis(data.aiAnalysis);
    } catch (err: any) {
      console.error('Failed to fetch state:', err);
      showToast('Error syncing with backend API', 'error');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initial load
  useEffect(() => {
    fetchState();
  }, [fetchState]);

  // 2. Scenario Switcher
  const handleSelectScenario = async (scenarioId: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/scenario/${scenarioId}`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to set scenario');
      const data = await res.json();
      setState(data.state);
      setBaseline(data.baseline);
      setDeviations(data.deviations);
      setTrustScore(data.trustScore);
      setAiAnalysis(data.aiAnalysis);
      setCurrentScenarioId(scenarioId);
      showToast(`Activated Scenario: ${data.scenario.name}`);
    } catch (err: any) {
      console.error('Scenario error:', err);
      showToast('Failed to switch scenario', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  // 3. Trigger Gemini AI Security Reasoning
  const handleTriggerAiAnalysis = async (customQuery?: string) => {
    setIsAiAnalyzing(true);
    try {
      const res = await fetch('/api/gemini/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ custom_query: customQuery })
      });
      if (!res.ok) throw new Error('AI analysis failed');
      const data = await res.json();
      setAiAnalysis(data.analysis);
      setActiveModuleTab('ai');
      showToast('Gemini Security Reasoning assessment updated', 'info');
    } catch (err: any) {
      console.error('AI analysis error:', err);
      showToast('Gemini analysis failed: ' + (err.message || 'unknown error'), 'error');
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  // 4. Execute Containment / Remediation Action
  const handleExecuteRemediation = async (actionType: string, targetEntity: string) => {
    try {
      const res = await fetch('/api/actions/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action_type: actionType, target_entity: targetEntity })
      });
      if (!res.ok) throw new Error('Remediation action failed');
      const data = await res.json();
      setState(data.state);
      setBaseline(data.baseline);
      setDeviations(data.deviations);
      setTrustScore(data.trustScore);
      setAiAnalysis(data.aiAnalysis);
      showToast(`Remediation executed: ${data.action.name}`);
    } catch (err: any) {
      console.error('Remediation error:', err);
      showToast('Failed to execute remediation', 'error');
    }
  };

  // 5. Inject Telemetry Event
  const handleInjectTelemetry = async (payload: any) => {
    try {
      const res = await fetch('/api/telemetry/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Ingestion failed');
      const data = await res.json();
      setState(data.state);
      setBaseline(data.baseline);
      setDeviations(data.deviations);
      setTrustScore(data.trustScore);
      setAiAnalysis(data.aiAnalysis);
      showToast('Injected event successfully normalized into state');
    } catch (err: any) {
      console.error('Ingestion error:', err);
      showToast('Failed to ingest event', 'error');
    }
  };

  if (!state || !trustScore || !baseline) {
    return (
      <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-12 h-12 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin" />
          <div className="text-center font-mono">
            <p className="text-sm font-bold text-slate-200 uppercase tracking-widest">
              JARVIS • AIOS Digital Integrity Monitor
            </p>
            <p className="text-xs text-slate-400 mt-1">Initializing Deterministic Core Engine...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200">
      
      {/* 1. Header */}
      <Header
        currentScenarioId={currentScenarioId}
        onSelectScenario={handleSelectScenario}
        riskClassification={trustScore.risk_classification}
        onOpenAgentModal={() => setIsAgentModalOpen(true)}
        onOpenArchitectureModal={() => setIsArchitectureModalOpen(true)}
        isLoading={isLoading}
        onRefresh={fetchState}
      />

      {/* Main Workspace Layout */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Toast Alert Notification */}
        {toastMessage && (
          <div className={`p-3.5 rounded-xl border font-mono text-xs flex items-center justify-between shadow-lg transition-all animate-fade-in ${
            toastMessage.type === 'error'
              ? 'bg-rose-950/90 border-rose-800 text-rose-200'
              : toastMessage.type === 'info'
              ? 'bg-blue-950/90 border-blue-800 text-blue-200'
              : 'bg-emerald-950/90 border-emerald-800 text-emerald-200'
          }`}>
            <div className="flex items-center gap-2">
              {toastMessage.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-400" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              )}
              <span>{toastMessage.text}</span>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-[10px] text-slate-400 hover:text-slate-200 uppercase ml-3"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* 2. Top Banner: Central Digital Integrity Trust Gauge Card */}
        <TrustGaugeCard
          trustScore={trustScore}
          deviations={deviations}
          onTriggerAiAnalysis={() => handleTriggerAiAnalysis()}
          onOpenAuditDrawer={() => setActiveModuleTab('trust')}
          onRevertBaseline={() => handleSelectScenario('clean_baseline')}
          isAiAnalyzing={isAiAnalyzing}
        />

        {/* 3. Six Core Modules Pipeline Overview */}
        <ModulePipelineOverview
          state={state}
          deviations={deviations}
          trustScore={trustScore}
          aiAnalysis={aiAnalysis}
          activeModuleTab={activeModuleTab}
          onSelectModuleTab={(tab) => setActiveModuleTab(tab)}
        />

        {/* 4. Module Workstation Tabs */}
        <div className="space-y-4">
          
          {/* Workstation Tab Bar */}
          <div className="flex items-center border-b border-slate-800 space-x-2 overflow-x-auto pb-1">
            <button
              onClick={() => setActiveModuleTab('ai')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono font-bold rounded-t-lg transition-colors cursor-pointer border-b-2 ${
                activeModuleTab === 'ai'
                  ? 'border-purple-400 text-purple-300 bg-slate-900'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <BrainCircuit className="w-4 h-4" />
              <span>05 • Gemini Security Reasoning</span>
            </button>

            <button
              onClick={() => setActiveModuleTab('integrity')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono font-bold rounded-t-lg transition-colors cursor-pointer border-b-2 ${
                activeModuleTab === 'integrity'
                  ? 'border-amber-400 text-amber-300 bg-slate-900'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <GitCompare className="w-4 h-4" />
              <span>03 • Baseline Diff Matrix ({deviations.length})</span>
            </button>

            <button
              onClick={() => setActiveModuleTab('trust')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono font-bold rounded-t-lg transition-colors cursor-pointer border-b-2 ${
                activeModuleTab === 'trust'
                  ? 'border-cyan-400 text-cyan-300 bg-slate-900'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Calculator className="w-4 h-4" />
              <span>04 • Trust Score Math Audit</span>
            </button>

            <button
              onClick={() => setActiveModuleTab('telemetry')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono font-bold rounded-t-lg transition-colors cursor-pointer border-b-2 ${
                activeModuleTab === 'telemetry'
                  ? 'border-blue-400 text-blue-300 bg-slate-900'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Activity className="w-4 h-4" />
              <span>02 • Normalized Events ({state.recent_events.length})</span>
            </button>

            <button
              onClick={() => setActiveModuleTab('simulation')}
              className={`flex items-center gap-2 px-4 py-2.5 text-xs font-mono font-bold rounded-t-lg transition-colors cursor-pointer border-b-2 ${
                activeModuleTab === 'simulation'
                  ? 'border-rose-400 text-rose-300 bg-slate-900'
                  : 'border-transparent text-slate-400 hover:text-slate-200'
              }`}
            >
              <Radio className="w-4 h-4" />
              <span>01 • Simulation & Ingestion Deck</span>
            </button>
          </div>

          {/* Render Active Tab Component */}
          {activeModuleTab === 'ai' && (
            <AiAnalysisCard
              analysis={aiAnalysis}
              trustScore={trustScore}
              deviations={deviations}
              isLoading={isAiAnalyzing}
              onRunAnalysis={handleTriggerAiAnalysis}
              onExecuteRemediation={handleExecuteRemediation}
            />
          )}

          {activeModuleTab === 'integrity' && (
            <IntegrityDiffMatrix
              state={state}
              baseline={baseline}
              deviations={deviations}
              onRemediateEntity={handleExecuteRemediation}
            />
          )}

          {activeModuleTab === 'trust' && (
            <TrustScoreAuditTable trustScore={trustScore} />
          )}

          {activeModuleTab === 'telemetry' && (
            <TelemetryStream events={state.recent_events} />
          )}

          {activeModuleTab === 'simulation' && (
            <ScenarioSimulator
              currentScenarioId={currentScenarioId}
              onSelectScenario={handleSelectScenario}
              onInjectEvent={handleInjectTelemetry}
              isLoading={isLoading}
            />
          )}

        </div>

      </main>

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-6 px-4 mt-12 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-500" />
            <span>JARVIS • AIOS Digital Integrity & Trust Monitor</span>
            <span className="text-slate-700">|</span>
            <span className="text-slate-400">Deterministic Security Layer</span>
          </div>
          <div className="text-slate-400">
            UAE Sovereign Specification • AI Reasoning on Ground Truth
          </div>
        </div>
      </footer>

      {/* Modals */}
      <PowerShellAgentModal
        isOpen={isAgentModalOpen}
        onClose={() => setIsAgentModalOpen(false)}
      />

      <ArchitectureModal
        isOpen={isArchitectureModalOpen}
        onClose={() => setIsArchitectureModalOpen(false)}
      />

    </div>
  );
}
