import React, { useState, useEffect, useCallback } from 'react';
import { Header, SecureOsTab } from './components/Header';
import { TrustCore } from './components/TrustCore';
import { SecurityTopology } from './components/SecurityTopology';
import { IntelligenceWorkstation } from './components/IntelligenceWorkstation';
import { IntegrityTimeline } from './components/IntegrityTimeline';
import { LiveSecurityStateGrid } from './components/LiveSecurityStateGrid';
import { IntegrityDiffMatrix } from './components/IntegrityDiffMatrix';
import { TrustScoreAuditTable } from './components/TrustScoreAuditTable';
import { TelemetryStream } from './components/TelemetryStream';
import { ScenarioSimulator } from './components/ScenarioSimulator';
import { ModulePipelineOverview } from './components/ModulePipelineOverview';
import { PowerShellAgentModal } from './components/PowerShellAgentModal';
import { ArchitectureModal } from './components/ArchitectureModal';
import { SystemState, SystemBaseline, IntegrityDeviation, TrustScoreResult, AIIntegrityAnalysis } from './types/integrity';
import { CheckCircle2, AlertCircle, Shield, BrainCircuit, Activity, Lock, Layers } from 'lucide-react';

export default function App() {
  const [state, setState] = useState<SystemState | null>(null);
  const [baseline, setBaseline] = useState<SystemBaseline | null>(null);
  const [deviations, setDeviations] = useState<IntegrityDeviation[]>([]);
  const [trustScore, setTrustScore] = useState<TrustScoreResult | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIIntegrityAnalysis | null>(null);

  const [currentScenarioId, setCurrentScenarioId] = useState<string>('supply_chain_tamper');
  const [activeTab, setActiveTab] = useState<SecureOsTab>('overview');
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
      setActiveTab('intelligence');
      showToast('Gemini Security Reasoning synthesized', 'info');
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
      <div className="min-h-screen bg-[#030712] flex flex-col items-center justify-center p-4 bg-secure-grid">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-14 h-14 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin" />
          <div className="text-center font-mono">
            <p className="text-sm font-bold text-slate-200 uppercase tracking-widest flex items-center gap-2 justify-center">
              <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
              <span>SECUREOS • DIGITAL INTEGRITY ARBITER</span>
            </p>
            <p className="text-xs text-slate-400 mt-1">Bootstrapping Deterministic Trust Core & Telemetry Pipeline...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030712] text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-200 bg-secure-grid">
      
      {/* 1. SecureOS Command Header */}
      <Header
        currentScenarioId={currentScenarioId}
        onSelectScenario={handleSelectScenario}
        riskClassification={trustScore.risk_classification}
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenAgentModal={() => setIsAgentModalOpen(true)}
        onOpenArchitectureModal={() => setIsArchitectureModalOpen(true)}
        isLoading={isLoading}
        onRefresh={fetchState}
      />

      {/* Main Operating Workspace */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        
        {/* Toast Alert Notification */}
        {toastMessage && (
          <div className={`p-3.5 rounded-xl border font-mono text-xs flex items-center justify-between shadow-xl transition-all animate-fade-in ${
            toastMessage.type === 'error'
              ? 'bg-rose-950/90 border-rose-800 text-rose-200'
              : toastMessage.type === 'info'
              ? 'bg-purple-950/90 border-purple-800 text-purple-200'
              : 'bg-cyan-950/90 border-cyan-800 text-cyan-200'
          }`}>
            <div className="flex items-center gap-2">
              {toastMessage.type === 'error' ? (
                <AlertCircle className="w-4 h-4 text-rose-400" />
              ) : (
                <CheckCircle2 className="w-4 h-4 text-cyan-400" />
              )}
              <span>{toastMessage.text}</span>
            </div>
            <button
              onClick={() => setToastMessage(null)}
              className="text-[10px] text-slate-400 hover:text-slate-200 uppercase ml-3 cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {/* View Router */}

        {/* VIEW 1: COMMAND CENTER (Primary Digital Integrity Operating Environment) */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            {/* The 3D Radial Trust Core Centerpiece */}
            <TrustCore
              trustScore={trustScore}
              deviations={deviations}
              state={state}
              onTriggerAiAnalysis={() => handleTriggerAiAnalysis()}
              onOpenAudit={() => setActiveTab('audit')}
              onRevertBaseline={() => handleSelectScenario('clean_baseline')}
              isAiAnalyzing={isAiAnalyzing}
            />

            {/* Subsystem Metric Live Summary Cards */}
            <LiveSecurityStateGrid
              state={state}
              onNavigateTab={(tab) => setActiveTab(tab)}
            />

            {/* Time Degradation Chronological Attack Curve */}
            <IntegrityTimeline currentScore={trustScore.current_score} />

            {/* Interactive Security Topology Graph Preview */}
            <SecurityTopology state={state} />

            {/* 6-Module Architectural Pipeline */}
            <ModulePipelineOverview
              state={state}
              deviations={deviations}
              trustScore={trustScore}
              aiAnalysis={aiAnalysis}
              activeModuleTab="ai"
              onSelectModuleTab={(tab) => {
                if (tab === 'ai') setActiveTab('intelligence');
                else if (tab === 'integrity') setActiveTab('integrity');
                else if (tab === 'trust') setActiveTab('audit');
                else if (tab === 'telemetry') setActiveTab('telemetry');
                else if (tab === 'simulation') setActiveTab('simulation');
              }}
            />
          </div>
        )}

        {/* VIEW 2: DEDICATED AI INTELLIGENCE WORKSTATION */}
        {activeTab === 'intelligence' && (
          <div className="animate-in fade-in duration-300">
            <IntelligenceWorkstation
              analysis={aiAnalysis}
              trustScore={trustScore}
              deviations={deviations}
              state={state}
              isLoading={isAiAnalyzing}
              onRefreshAnalysis={() => handleTriggerAiAnalysis()}
              onExecuteRemediation={(cmd) => {
                showToast(`Executing remediation command: ${cmd}`);
                if (cmd.includes('Restart-Service') || cmd.includes('WinDefend')) {
                  handleExecuteRemediation('START_SERVICE', 'WinDefend');
                } else if (cmd.includes('Stop-Process') || cmd.includes('win_updater.exe')) {
                  handleExecuteRemediation('TERMINATE_PROCESS', 'win_updater.exe');
                } else {
                  handleSelectScenario('clean_baseline');
                }
              }}
              onCustomPrompt={(prompt) => handleTriggerAiAnalysis(prompt)}
            />
          </div>
        )}

        {/* VIEW 3: INTERACTIVE TOPOLOGY GRAPH */}
        {activeTab === 'topology' && (
          <div className="animate-in fade-in duration-300 space-y-6">
            <SecurityTopology state={state} />
            <LiveSecurityStateGrid state={state} onNavigateTab={setActiveTab} />
          </div>
        )}

        {/* VIEW 4: BASELINE DIFF MATRIX */}
        {activeTab === 'integrity' && (
          <div className="animate-in fade-in duration-300">
            <IntegrityDiffMatrix
              state={state}
              baseline={baseline}
              deviations={deviations}
              onRemediateEntity={handleExecuteRemediation}
            />
          </div>
        )}

        {/* VIEW 5: TELEMETRY NORMALIZATION STREAM */}
        {activeTab === 'telemetry' && (
          <div className="animate-in fade-in duration-300">
            <TelemetryStream events={state.recent_events} />
          </div>
        )}

        {/* VIEW 6: DETERMINISTIC MATHEMATICAL PROOF & AUDIT */}
        {activeTab === 'audit' && (
          <div className="animate-in fade-in duration-300 space-y-6">
            <TrustScoreAuditTable trustScore={trustScore} />
          </div>
        )}

        {/* VIEW 7: SCENARIO LAB & INGESTION DECK */}
        {activeTab === 'simulation' && (
          <div className="animate-in fade-in duration-300">
            <ScenarioSimulator
              currentScenarioId={currentScenarioId}
              onSelectScenario={handleSelectScenario}
              onInjectEvent={handleInjectTelemetry}
              isLoading={isLoading}
            />
          </div>
        )}

      </main>

      {/* Footer */}
      <footer className="border-t border-cyan-500/10 bg-slate-950/90 py-6 px-4 mt-12 text-xs text-slate-500 font-mono">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span className="font-bold text-slate-300">SECUREOS</span>
            <span className="text-slate-700">|</span>
            <span className="text-slate-400">Deterministic Digital Integrity Arbiter</span>
          </div>
          <div className="text-slate-500 text-[11px]">
            Sovereign UAE Specification • AI Reasoning upon Verified Ground-Truth
          </div>
        </div>
      </footer>

      {/* PowerShell Collector Agent Modal */}
      <PowerShellAgentModal
        isOpen={isAgentModalOpen}
        onClose={() => setIsAgentModalOpen(false)}
      />

      {/* GitHub Architecture Blueprint Modal */}
      <ArchitectureModal
        isOpen={isArchitectureModalOpen}
        onClose={() => setIsArchitectureModalOpen(false)}
      />

    </div>
  );
}
