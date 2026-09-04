import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

import { DEFAULT_BASELINE, compareAgainstBaseline } from './src/engine/baseline.ts';
import { calculateTrustScore } from './src/engine/trustEngine.ts';
import { SCENARIOS } from './src/engine/scenarios.ts';
import { SystemState, NormalizedEvent, AIIntegrityAnalysis } from './src/types/integrity.ts';
import { normalizePowerShellPayload } from './src/engine/telemetryNormalizer.ts';
import { appendTelemetry, appendTrustSnapshot, appendLifecycleRecord, getLedger, verifyLedger, getLedgerPath } from './src/engine/eventLedger.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = 3000;
app.use(express.json({ limit: '10mb' }));

let currentScenarioId = 'supply_chain_tamper';
let activeState: SystemState = JSON.parse(JSON.stringify(SCENARIOS.find(s => s.id === currentScenarioId)!.state));

function buildDeterministicAnalysis(deviations: ReturnType<typeof compareAgainstBaseline>, trustScoreResult: ReturnType<typeof calculateTrustScore>, events: NormalizedEvent[] = []): AIIntegrityAnalysis {
  const isCritical = trustScoreResult.current_score < 50;
  const isElevated = trustScoreResult.current_score < 80;
  const isClean = deviations.length === 0;
  const assessment = isClean ? 'HEALTHY: All host baseline integrity checks verified nominal' : isCritical ? 'CRITICAL COMPROMISE: Defense evasion, unauthorized execution & potential C2 beaconing' : isElevated ? 'HIGH RISK: Uncatalogued services, missing security controls, and suspicious binary execution' : 'ELEVATED RISK: Minor integrity deviations detected against sovereign golden baseline';
  const explanation = isClean ? 'All host running processes match digital signature white-lists. Crucial security daemons are running with nominal hashes. No suspicious network sockets or file integrity anomalies detected.' : `Deterministic baseline verification identified ${deviations.length} baseline violations resulting in an authoritative Trust Score of ${trustScoreResult.current_score}%. Telemetry correlation indicates a causal sequence across ${deviations.map(d => d.entity).slice(0, 3).join(', ')}.`;
  const correlated = deviations.map((d, idx) => ({
    event_id: `CORR-DEV-${idx + 1}`,
    stage: d.category.includes('net') ? 'Anomalous Egress Communication' : d.category.includes('sec') ? 'Security Control Impairment' : d.category.includes('proc') ? 'Unauthorized Binary Execution' : 'Subsystem Integrity Deviation',
    title: d.title || `${d.category} anomaly`, description: d.description, involved_entities: [d.entity],
    mitre_tactic: d.category.includes('net') ? 'Command and Control' : d.category.includes('proc') ? 'Execution' : 'Defense Evasion',
    mitre_technique: d.category.includes('net') ? 'T1071.001' : d.category.includes('proc') ? 'T1204.002' : 'T1562.001',
    threat_likelihood: (d.severity === 'critical' ? 'critical' : d.severity === 'high' ? 'high' : 'moderate') as any,
    evidence: `Expected: "${d.baseline_expected}" vs Observed: "${d.observed_actual}"`
  }));
  if (isClean) correlated.push({ event_id: 'CORR-EV-01', stage: 'Nominal Baseline Verification', title: 'All Core Subsystems Signed and Validated', description: 'Host telemetry confirms zero unauthorized baseline deviations.', involved_entities: ['ntoskrnl.exe', 'services.exe', 'WinDefend'], mitre_tactic: 'Discovery', mitre_technique: 'T1082', threat_likelihood: 'low' as const, evidence: 'Verified against deterministic baseline' });
  const recommended = isClean ? [{ id: 'ACT-01', title: 'Maintain Real-Time Telemetry Streaming', action: 'Maintain Real-Time Telemetry Streaming', type: 'hardening' as const, priority: 'low' as const, urgency: 'LOW' as const, command_snippet: 'Get-Service AIOS-Telemetry | Select-Object Status, StartType', command: 'Get-Service AIOS-Telemetry | Select-Object Status, StartType', explanation: 'Ensure continuous telemetry coverage.', rationale: 'Maintain monitoring coverage.' }] : [{ id: 'ACT-01', title: 'Isolate Host from Sovereign Network Fabric', action: 'Isolate Host from Sovereign Network Fabric', type: 'containment' as const, priority: 'urgent' as const, urgency: 'IMMEDIATE' as const, command_snippet: 'Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled True', command: 'Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled True', explanation: 'Contain lateral movement and suspicious egress while preserving telemetry.', rationale: 'Reduce active attack surface.' }, { id: 'ACT-02', title: 'Restore Critical Security Services', action: 'Restore Critical Security Services', type: 'remediation' as const, priority: 'high' as const, urgency: 'HIGH' as const, command_snippet: 'Set-Service -Name WinDefend -StartupType Automatic; Start-Service WinDefend', command: 'Set-Service -Name WinDefend -StartupType Automatic; Start-Service WinDefend', explanation: 'Restore endpoint security controls.', rationale: 'Re-enable defensive telemetry.' }];
  return {
    assessment, risk_level: trustScoreResult.risk_classification, explanation, detailed_explanation: explanation, summary_headline: assessment, threat_hypothesis: assessment, attack_narrative: explanation,
    correlated_events: correlated, correlated_chain: correlated, correlated_activity_chain: correlated,
    mitre_mappings: correlated.map(ev => ({ technique_id: ev.mitre_technique || 'T1059', tactic: ev.mitre_tactic || 'Execution', technique_name: ev.title, evidence: ev.evidence || ev.description })),
    recommended_actions: recommended, confidence: isClean ? 0.99 : 0.92, confidence_score: isClean ? 0.99 : 0.92,
    trust_score_invariant: { ground_truth_score: trustScoreResult.current_score, authority: 'DETERMINISTIC_TRUST_ENGINE', gemini_authority: 'READ_ONLY_ADVISORY', can_alter_trust_score: false, message: 'CRITICAL INVARIANT: Gemini has zero authority to alter the Trust Score. The deterministic Trust Engine is authoritative.' },
    generated_at: new Date().toISOString(), model_used: 'Deterministic Integrity Reasoning Engine (Ground Truth Fallback)'
  };
}

function currentEvaluation() {
  const deviations = compareAgainstBaseline(activeState, DEFAULT_BASELINE);
  const trustScore = calculateTrustScore(deviations);
  return { deviations, trustScore };
}

let currentAiAnalysis: AIIntegrityAnalysis;
{
  const { deviations, trustScore } = currentEvaluation();
  currentAiAnalysis = buildDeterministicAnalysis(deviations, trustScore, activeState.recent_events);
  appendTrustSnapshot(activeState.host_id, trustScore.current_score, trustScore.risk_classification, trustScore.formula_version, { source: 'server_start', scenario_id: currentScenarioId });
}

function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({ apiKey, httpOptions: { headers: { 'User-Agent': 'aistudio-build' } } });
}

function stateEnvelope() {
  const { deviations, trustScore } = currentEvaluation();
  return { scenario_id: currentScenarioId, scenario: SCENARIOS.find(s => s.id === currentScenarioId) || SCENARIOS[0], state: activeState, baseline: DEFAULT_BASELINE, deviations, trust_score: trustScore, trustScore, ai_analysis: currentAiAnalysis, aiAnalysis: currentAiAnalysis, analysis: currentAiAnalysis, timestamp: new Date().toISOString() };
}

app.get('/api/health', (_req, res) => res.json({ status: 'ok', system: 'Digital Integrity & Trust Monitor AIOS Core', version: '2.5.0-PERSISTENT-LEDGER', has_gemini_key: Boolean(process.env.GEMINI_API_KEY), ledger: verifyLedger() }));
app.get('/api/state', (_req, res) => res.json(stateEnvelope()));
app.get('/api/ledger', (req, res) => { const limit = Number(req.query.limit || 100); res.json({ success: true, verification: verifyLedger(), records: getLedger(limit), ledger_path: getLedgerPath() }); });
app.get('/api/trust/history', (req, res) => { const limit = Math.min(1000, Math.max(1, Number(req.query.limit || 200))); res.json({ success: true, records: getLedger(limit).filter(record => record.record_type === 'trust_snapshot'), verification: verifyLedger() }); });
app.get('/api/evidence/verify', (_req, res) => res.json({ success: true, ...verifyLedger() }));

app.post('/api/scenario/:id', (req, res) => {
  const scenario = SCENARIOS.find(s => s.id === req.params.id);
  if (!scenario) return res.status(404).json({ error: `Scenario ${req.params.id} not found` });
  currentScenarioId = scenario.id;
  activeState = JSON.parse(JSON.stringify(scenario.state));
  const { deviations, trustScore } = currentEvaluation();
  currentAiAnalysis = buildDeterministicAnalysis(deviations, trustScore, activeState.recent_events);
  appendLifecycleRecord('scenario', activeState.host_id, { scenario_id: currentScenarioId, scenario_name: scenario.name });
  appendTrustSnapshot(activeState.host_id, trustScore.current_score, trustScore.risk_classification, trustScore.formula_version, { source: 'scenario_change', scenario_id: currentScenarioId });
  res.json({ message: `Scenario '${scenario.name}' activated`, ...stateEnvelope() });
});

app.post('/api/telemetry/ingest', (req, res) => {
  try {
    const rawPayload = req.body || {};
    let normalizedEvent: NormalizedEvent;
    if (rawPayload.collector === 'powershell_agent' || rawPayload.category) normalizedEvent = normalizePowerShellPayload(rawPayload);
    else if (rawPayload.event_id && rawPayload.entity) normalizedEvent = rawPayload as NormalizedEvent;
    else normalizedEvent = { event_id: `EV-INGEST-${Date.now()}`, timestamp: new Date().toISOString(), source: 'edr_sensor', type: rawPayload.type || 'process_start', severity: rawPayload.severity || 'medium', entity: rawPayload.entity || 'Injected Entity', evidence: rawPayload.evidence || rawPayload, confidence: 0.95, mitre_tactic: rawPayload.mitre_tactic || 'Execution', mitre_technique: rawPayload.mitre_technique || 'T1059' };
    activeState.recent_events.unshift(normalizedEvent);
    activeState.recent_events = activeState.recent_events.slice(0, 50);
    if (rawPayload.action === 'add_process' && rawPayload.process) activeState.processes.push(rawPayload.process);
    else if (rawPayload.action === 'stop_service' && rawPayload.service_name) { const svc = activeState.services.find(s => s.name === rawPayload.service_name); if (svc) svc.status = 'Stopped'; }
    else if (rawPayload.action === 'modify_fim' && rawPayload.file_path) { const fim = activeState.fim_files.find(f => f.path === rawPayload.file_path); if (fim) { fim.is_modified = true; fim.current_hash = `tampered_${Date.now().toString(16)}`; } }
    const { deviations, trustScore } = currentEvaluation();
    currentAiAnalysis = buildDeterministicAnalysis(deviations, trustScore, activeState.recent_events);
    appendTelemetry(normalizedEvent, rawPayload.host_id || activeState.host_id, { scenario_id: currentScenarioId, transport: 'http' });
    const snapshot = appendTrustSnapshot(activeState.host_id, trustScore.current_score, trustScore.risk_classification, trustScore.formula_version, { source: 'telemetry_ingest', event_id: normalizedEvent.event_id });
    res.json({ success: true, event_id: normalizedEvent.event_id, ledger_sequence: snapshot.sequence, ...stateEnvelope() });
  } catch (err: any) { res.status(400).json({ error: err?.message || 'Invalid ingestion payload' }); }
});

app.post('/api/actions/execute', (req, res) => {
  const { action_type, target_entity } = req.body || {};
  if (action_type === 'revert_baseline') { const clean = SCENARIOS.find(s => s.id === 'clean_baseline')!; currentScenarioId = clean.id; activeState = JSON.parse(JSON.stringify(clean.state)); }
  else if (action_type === 'kill_process' || action_type === 'terminate_process') activeState.processes = activeState.processes.filter(p => !p.name.includes(target_entity || '') && String(p.pid) !== String(target_entity || ''));
  else if (action_type === 'restart_service' || action_type === 'restore_service') { const svc = activeState.services.find(s => s.name === target_entity || s.display_name === target_entity); if (svc) svc.status = 'Running'; }
  else if (action_type === 'block_network' || action_type === 'isolate_host') activeState.network_connections = target_entity ? activeState.network_connections.filter(c => c.remote_ip !== target_entity && !target_entity.includes(c.remote_ip)) : [];
  else if (action_type === 'restore_file' || action_type === 'restore_fim') { const fim = activeState.fim_files.find(f => f.path.includes(target_entity || '')); if (fim) { fim.current_hash = fim.expected_hash; fim.is_modified = false; } }
  const { deviations, trustScore } = currentEvaluation();
  currentAiAnalysis = buildDeterministicAnalysis(deviations, trustScore, activeState.recent_events);
  appendLifecycleRecord('action', activeState.host_id, { action_type, target_entity, scenario_id: currentScenarioId });
  appendTrustSnapshot(activeState.host_id, trustScore.current_score, trustScore.risk_classification, trustScore.formula_version, { source: 'action', action_type, target_entity });
  res.json({ success: true, message: `Action '${action_type}' applied on '${target_entity || 'node'}'`, action: { name: `${action_type} on ${target_entity || 'node'}` }, ...stateEnvelope() });
});

app.post('/api/gemini/analyze', async (req, res) => {
  const { deviations, trustScore } = currentEvaluation();
  const events = Array.isArray(req.body?.events) ? req.body.events : activeState.recent_events.slice(0, 10);
  const customQuery = req.body?.custom_query || 'Explain the relationship between detected deviations and telemetry events and recommend response actions.';
  const ai = getGeminiClient();
  if (!ai) { const fallback = buildDeterministicAnalysis(deviations, trustScore, events); currentAiAnalysis = fallback; return res.json({ success: true, analysis: fallback, aiAnalysis: fallback, ...fallback }); }
  try {
    const prompt = `You are the read-only AI Analysis Module for SecureOS. The deterministic Trust Engine is authoritative and immutable.\n\nGROUND TRUTH SCORE: ${trustScore.current_score}/100 (${trustScore.risk_classification})\nDEVIATIONS:\n${JSON.stringify(deviations, null, 2)}\nEVENTS:\n${JSON.stringify(events, null, 2)}\nINQUIRY:\n${customQuery}\n\nReturn JSON with assessment, explanation, correlated_events, recommended_actions and confidence. Never alter or reinterpret the numeric trust score.`;
    const response = await ai.models.generateContent({ model: 'gemini-3.8-flash', contents: prompt, config: { responseMimeType: 'application/json', responseSchema: { type: Type.OBJECT, properties: { assessment: { type: Type.STRING }, explanation: { type: Type.STRING }, correlated_events: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { event_id: { type: Type.STRING }, stage: { type: Type.STRING }, title: { type: Type.STRING }, description: { type: Type.STRING }, involved_entities: { type: Type.ARRAY, items: { type: Type.STRING } }, mitre_tactic: { type: Type.STRING }, mitre_technique: { type: Type.STRING }, threat_likelihood: { type: Type.STRING }, evidence: { type: Type.STRING } }, required: ['stage', 'title', 'description', 'involved_entities', 'threat_likelihood'] } }, recommended_actions: { type: Type.ARRAY, items: { type: Type.OBJECT, properties: { id: { type: Type.STRING }, title: { type: Type.STRING }, type: { type: Type.STRING }, priority: { type: Type.STRING }, command_snippet: { type: Type.STRING }, explanation: { type: Type.STRING } }, required: ['id', 'title', 'type', 'priority', 'explanation'] } }, confidence: { type: Type.NUMBER } }, required: ['assessment', 'explanation', 'correlated_events', 'recommended_actions', 'confidence'] } } });
    const parsed = JSON.parse(response.text || '{}');
    const correlated = (parsed.correlated_events || []).map((ev: any, i: number) => ({ event_id: ev.event_id || `CORR-EV-${i + 1}`, stage: ev.stage || `Stage ${i + 1}`, title: ev.title || 'Correlated Security Event', description: ev.description || '', involved_entities: Array.isArray(ev.involved_entities) ? ev.involved_entities : [], mitre_tactic: ev.mitre_tactic || 'Execution', mitre_technique: ev.mitre_technique || 'T1059', threat_likelihood: ev.threat_likelihood || 'moderate', evidence: ev.evidence || ev.description || 'Observed via telemetry' }));
    const actions = (parsed.recommended_actions || []).map((act: any, i: number) => ({ id: act.id || `ACT-${String(i + 1).padStart(2, '0')}`, title: act.title || 'Recommended Mitigation', action: act.title || 'Recommended Mitigation', type: act.type || 'investigation', priority: act.priority || 'medium', urgency: act.priority === 'urgent' ? 'IMMEDIATE' : act.priority === 'high' ? 'HIGH' : 'MEDIUM', command_snippet: act.command_snippet || '', command: act.command_snippet || '', explanation: act.explanation || '', rationale: act.explanation || '' }));
    currentAiAnalysis = { assessment: parsed.assessment || trustScore.status_label, risk_level: trustScore.risk_classification, explanation: parsed.explanation || '', detailed_explanation: parsed.explanation || '', summary_headline: parsed.assessment || trustScore.status_label, threat_hypothesis: parsed.assessment || 'Telemetry correlation', attack_narrative: parsed.explanation || '', correlated_events: correlated, correlated_chain: correlated, correlated_activity_chain: correlated, mitre_mappings: correlated.map((ev: any) => ({ technique_id: ev.mitre_technique || 'T1059', tactic: ev.mitre_tactic || 'Execution', technique_name: ev.title, evidence: ev.evidence || ev.description })), recommended_actions: actions, confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.9, confidence_score: typeof parsed.confidence === 'number' ? parsed.confidence : 0.9, trust_score_invariant: { ground_truth_score: trustScore.current_score, authority: 'DETERMINISTIC_TRUST_ENGINE', gemini_authority: 'READ_ONLY_ADVISORY', can_alter_trust_score: false, message: 'Gemini is advisory only; Trust Engine remains authoritative.' }, generated_at: new Date().toISOString(), model_used: 'gemini-3.8-flash' };
    res.json({ success: true, analysis: currentAiAnalysis, aiAnalysis: currentAiAnalysis, ...currentAiAnalysis });
  } catch (err) { const fallback = buildDeterministicAnalysis(deviations, trustScore, events); currentAiAnalysis = fallback; res.json({ success: true, analysis: fallback, aiAnalysis: fallback, ...fallback }); }
});

app.get('/api/powershell-agent/script', (req, res) => {
  const hostUrl = req.protocol + '://' + req.get('host');
  const psScript = `# SecureOS Digital Integrity Monitor — generated collector\n# Collector only. It never changes the Trust Score and never executes remediation.\n$IngestUrl = "${hostUrl}/api/telemetry/ingest"\n$HostId = $env:COMPUTERNAME\n$Timer = New-Object System.Timers.Timer\n$Timer.Interval = 15000\n$Timer.AutoReset = $true\nfunction Send-SecureOSPayload($Category, $Data) {\n  $body = @{ collector='powershell_agent'; host_id=$HostId; timestamp=(Get-Date).ToUniversalTime().ToString('o'); category=$Category; payload=$Data } | ConvertTo-Json -Depth 8 -Compress\n  try { Invoke-RestMethod -Uri $IngestUrl -Method Post -Body $body -ContentType 'application/json' -TimeoutSec 8 | Out-Null } catch { Write-Warning "SecureOS telemetry failed: $_" }\n}\nfunction Collect {\n  Get-Process | Select-Object -First 150 | ForEach-Object { $p=''; $signed=$false; try{$p=$_.Path}catch{}; if($p -and (Test-Path $p)){try{$signed=((Get-AuthenticodeSignature $p).Status -eq 'Valid')}catch{}}; Send-SecureOSPayload 'process' @{Id=$_.Id;Name=$_.ProcessName;Path=$p;IsSigned=$signed} }\n  @('WinDefend','EventLog','CryptSvc','MpsSvc') | ForEach-Object { $s=Get-Service $_; if($s){Send-SecureOSPayload 'service' @{Name=$s.Name;Status=$s.Status.ToString()} } }\n  Get-NetTCPConnection -State Established | Select-Object -First 100 | ForEach-Object { Send-SecureOSPayload 'net_conn' @{OwningProcess=$_.OwningProcess;LocalAddress=$_.LocalAddress;LocalPort=$_.LocalPort;RemoteAddress=$_.RemoteAddress;RemotePort=$_.RemotePort;State=$_.State.ToString()} }\n}\nCollect\n$Timer.add_Elapsed({ Collect })\n$Timer.Start()\ntry { while($Timer.Enabled){Start-Sleep -Seconds 1} } finally {$Timer.Stop();$Timer.Dispose()}\n`;
  res.setHeader('Content-Type', 'text/plain'); res.setHeader('Content-Disposition', 'attachment; filename="SecureOS-Agent.ps1"'); res.send(psScript);
});

async function startServer() {
  if (process.env.NODE_ENV !== 'production') { const vite = await createViteServer({ server: { middlewareMode: true }, appType: 'spa' }); app.use(vite.middlewares); }
  else { const distPath = path.join(process.cwd(), 'dist'); app.use(express.static(distPath)); app.get('*', (_req, res) => res.sendFile(path.join(distPath, 'index.html'))); }
  app.listen(PORT, '0.0.0.0', () => console.log(`[SECUREOS CORE] running on http://0.0.0.0:${PORT}`));
}
startServer();
