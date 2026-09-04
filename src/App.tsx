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
import { CheckCircle2, AlertCircle } from 'lucide-react';

type ApiStateEnvelope = {
  state?: SystemState;
  baseline?: SystemBaseline;
  deviations?: IntegrityDeviation[];
  trustScore?: TrustScoreResult;
  trust_score?: TrustScoreResult;
  aiAnalysis?: AIIntegrityAnalysis;
  ai_analysis?: AIIntegrityAnalysis;
  analysis?: AIIntegrityAnalysis;
  scenario_id?: string;
};

const normalizeEnvelope = (data: ApiStateEnvelope) => ({
  state: data.state ?? null,
  baseline: data.baseline ?? null,
  deviations: data.deviations ?? [],
  trustScore: data.trustScore ?? data.trust_score ?? null,
  aiAnalysis: data.aiAnalysis ?? data.ai_analysis ?? data.analysis ?? null,
  scenarioId: data.scenario_id
});

export default function App() {
  const [state, setState] = useState<SystemState | null>(null);
  const [baseline, setBaseline] = useState<SystemBaseline | null>(null);
  const [deviations, setDeviations] = useState<IntegrityDeviation[]>([]);
  const [trustScore, setTrustScore] = useState<TrustScoreResult | null>(null);
  const [aiAnalysis, setAiAnalysis] = useState<AIIntegrityAnalysis | null>(null);
  const [currentScenarioId, setCurrentScenarioId] = useState<string>('supply_chain_tamper');
  const [activeTab, setActiveTab] = useState<SecureOsTab>('overview');
  const [isLoading, setIsLoading] = useState(false);
  const [isAiAnalyzing, setIsAiAnalyzing] = useState(false);
  const [toastMessage, setToastMessage] = useState<{ text: string; type: 'success' | 'info' | 'error' } | null>(null);
  const [isAgentModalOpen, setIsAgentModalOpen] = useState(false);
  const [isArchitectureModalOpen, setIsArchitectureModalOpen] = useState(false);

  const showToast = useCallback((text: string, type: 'success' | 'info' | 'error' = 'success') => {
    setToastMessage({ text, type });
    window.setTimeout(() => setToastMessage(null), 4000);
  }, []);

  const applyEnvelope = useCallback((payload: ApiStateEnvelope) => {
    const normalized = normalizeEnvelope(payload);
    if (normalized.state) setState(normalized.state);
    if (normalized.baseline) setBaseline(normalized.baseline);
    setDeviations(normalized.deviations);
    if (normalized.trustScore) setTrustScore(normalized.trustScore);
    setAiAnalysis(normalized.aiAnalysis);
    if (normalized.scenarioId) setCurrentScenarioId(normalized.scenarioId);
  }, []);

  const fetchState = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await fetch('/api/state');
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      applyEnvelope(await res.json());
    } catch (err) {
      console.error('Failed to fetch state:', err);
      showToast('SecureOS core sync failed', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [applyEnvelope, showToast]);

  useEffect(() => {
    fetchState();
  }, [fetchState]);

  const handleSelectScenario = async (scenarioId: string) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/scenario/${scenarioId}`, { method: 'POST' });
      if (!res.ok) throw new Error('Failed to set scenario');
      const data = await res.json();
      applyEnvelope(data);
      setCurrentScenarioId(scenarioId);
      showToast(`Scenario activated: ${data.scenario?.name ?? scenarioId}`);
    } catch (err) {
      console.error('Scenario error:', err);
      showToast('Scenario activation failed', 'error');
    } finally {
      setIsLoading(false);
    }
  };

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
      setAiAnalysis(data.analysis ?? data.aiAnalysis ?? data.ai_analysis ?? null);
      setActiveTab('intelligence');
      showToast('AI reasoning synthesized over deterministic evidence', 'info');
    } catch (err: any) {
      console.error('AI analysis error:', err);
      showToast(`AI analysis failed: ${err?.message ?? 'unknown error'}`, 'error');
    } finally {
      setIsAiAnalyzing(false);
    }
  };

  const handleExecuteRemediation = async (actionType: string, targetEntity: string) => {
    try {
      const res = await fetch('/api/actions/execute', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action_type: actionType.toLowerCase(), target_entity: targetEntity })
      });
      if (!res.ok) throw new Error('Remediation action failed');
      const data = await res.json();
      applyEnvelope(data);
      showToast(`Remediation executed: ${data.action?.name ?? actionType}`);
    } catch (err) {
      console.error('Remediation error:', err);
      showToast('Remediation execution failed', 'error');
    }
  };

  const handleInjectTelemetry = async (payload: unknown) => {
    try {
      const res = await fetch('/api/telemetry/ingest', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error('Ingestion failed');
      applyEnvelope(await res.json());
      showToast('Telemetry normalized into active security state');
    } catch (err) {
      console.error('Ingestion error:', err);
      showToast('Telemetry ingestion failed', 'error');
    }
  };

  if (!state || !trustScore || !baseline) {
    return (
      <div className="secure-shell min-h-screen flex items-center justify-center p-4">
        <div className="secure-boot-card">
          <div className="secure-boot-orbit" />
          <p className="secure-kicker">SECUREOS // DIGITAL INTEGRITY ARBITER</p>
          <h1>Establishing ground truth.</h1>
          <p>Synchronizing deterministic trust core, baseline state and telemetry pipeline.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="secure-shell min-h-screen text-slate-100 flex flex-col selection:bg-cyan-500/30 selection:text-cyan-100">
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

      <main className="relative z-10 flex-1 max-w-[1500px] w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        {toastMessage && (
          <div className={`secure-toast ${toastMessage.type}`}>
            <div className="flex items-center gap-2">
              {toastMessage.type === 'error' ? <AlertCircle className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
              <span>{toastMessage.text}</span>
            </div>
            <button onClick={() => setToastMessage(null)}>Dismiss</button>
          </div>
        )}

        {activeTab === 'overview' && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <section className="secure-section-heading">
              <div>
                <p className="secure-kicker">COMMAND CENTER / LIVE NODE</p>
                <h2>Digital integrity state</h2>
              </div>
              <div className="secure-authority-chip">DETERMINISTIC AUTHORITY · AI READ-ONLY</div>
            </section>
            <TrustCore trustScore={trustScore} deviations={deviations} state={state} onTriggerAiAnalysis={() => handleTriggerAiAnalysis()} onOpenAudit={() => setActiveTab('audit')} onRevertBaseline={() => handleSelectScenario('clean_baseline')} isAiAnalyzing={isAiAnalyzing} />
            <LiveSecurityStateGrid state={state} onNavigateTab={setActiveTab} />
            <IntegrityTimeline currentScore={trustScore.current_score} />
            <SecurityTopology state={state} />
            <ModulePipelineOverview state={state} deviations={deviations} trustScore={trustScore} aiAnalysis={aiAnalysis} activeModuleTab="ai" onSelectModuleTab={(tab) => {
              if (tab === 'ai') setActiveTab('intelligence');
              else if (tab === 'integrity') setActiveTab('integrity');
              else if (tab === 'trust') setActiveTab('audit');
              else if (tab === 'telemetry') setActiveTab('telemetry');
              else if (tab === 'simulation') setActiveTab('simulation');
            }} />
          </div>
        )}

        {activeTab === 'intelligence' && <IntelligenceWorkstation analysis={aiAnalysis} trustScore={trustScore} deviations={deviations} state={state} isLoading={isAiAnalyzing} onRefreshAnalysis={() => handleTriggerAiAnalysis()} onExecuteRemediation={(cmd) => {
          if (cmd.includes('Restart-Service') || cmd.includes('WinDefend')) handleExecuteRemediation('restart_service', 'WinDefend');
          else if (cmd.includes('Stop-Process') || cmd.includes('win_updater.exe')) handleExecuteRemediation('terminate_process', 'win_updater.exe');
          else handleExecuteRemediation('revert_baseline', 'host');
        }} onCustomPrompt={(prompt) => handleTriggerAiAnalysis(prompt)} />}

        {activeTab === 'topology' && <div className="space-y-6"><SecurityTopology state={state} /><LiveSecurityStateGrid state={state} onNavigateTab={setActiveTab} /></div>}
        {activeTab === 'integrity' && <IntegrityDiffMatrix state={state} baseline={baseline} deviations={deviations} onRemediateEntity={handleExecuteRemediation} />}
        {activeTab === 'telemetry' && <TelemetryStream events={state.recent_events} />}
        {activeTab === 'audit' && <TrustScoreAuditTable trustScore={trustScore} />}
        {activeTab === 'simulation' && <ScenarioSimulator currentScenarioId={currentScenarioId} onSelectScenario={handleSelectScenario} onInjectEvent={handleInjectTelemetry} isLoading={isLoading} />}
      </main>

      <footer className="relative z-10 border-t border-white/[0.06] bg-[#03070d]/80 py-5 px-4 mt-12 text-[11px] text-slate-500 font-mono backdrop-blur-xl">
        <div className="max-w-[1500px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <span><strong className="text-slate-300">SECUREOS</strong> / Deterministic Digital Integrity Arbiter</span>
          <span>SIMULATION FIXTURES ARE NOT CRYPTOGRAPHIC PROOF · TRUST CORE v2.4</span>
        </div>
      </footer>

      <PowerShellAgentModal isOpen={isAgentModalOpen} onClose={() => setIsAgentModalOpen(false)} />
      <ArchitectureModal isOpen={isArchitectureModalOpen} onClose={() => setIsArchitectureModalOpen(false)} />
    </div>
  );
}
