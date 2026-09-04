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

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '10mb' }));

// In-memory active security state for the digital twin node
let currentScenarioId = 'supply_chain_tamper';
let activeState: SystemState = JSON.parse(JSON.stringify(SCENARIOS.find(s => s.id === currentScenarioId)!.state));

// Helper: Build structured AI analysis (used for baseline state, scenario changes, or fallback when API key is pending)
function buildDeterministicAnalysis(
  deviations: ReturnType<typeof compareAgainstBaseline>,
  trustScoreResult: ReturnType<typeof calculateTrustScore>,
  events: NormalizedEvent[] = []
): AIIntegrityAnalysis {
  const isCritical = trustScoreResult.current_score < 50;
  const isElevated = trustScoreResult.current_score < 80;
  const isClean = deviations.length === 0;

  const assessmentStr = isClean
    ? 'HEALTHY: All host baseline integrity checks verified nominal'
    : isCritical
    ? 'CRITICAL COMPROMISE: Defense evasion, unauthorized execution & potential C2 beaconing'
    : isElevated
    ? 'HIGH RISK: Uncatalogued services, missing security controls, and suspicious binary execution'
    : 'ELEVATED RISK: Minor integrity deviations detected against sovereign golden baseline';

  const explanationStr = isClean
    ? 'All host running processes match digital signature white-lists. Crucial security daemons (WinDefend, EventLog, CryptSvc) are running uninterrupted with nominal hashes. No suspicious network sockets or file integrity anomalies detected.'
    : `Deterministic baseline verification identified ${deviations.length} baseline violations resulting in an authoritative Trust Score of ${trustScoreResult.current_score}%. Telemetry correlation indicates a causal sequence where security controls were impaired (e.g. ${deviations.map(d => d.entity).slice(0, 2).join(', ')}), followed by process execution from non-standard directories and anomalous egress sockets.`;

  const correlatedEvents = isClean
    ? [
        {
          event_id: 'CORR-EV-01',
          stage: 'Nominal Baseline Verification',
          title: 'All Core Subsystems Signed and Validated',
          description: 'Host telemetry confirms zero unauthorized processes, active defender services, and clean socket mappings.',
          involved_entities: ['ntoskrnl.exe', 'services.exe', 'WinDefend'],
          mitre_tactic: 'Discovery',
          mitre_technique: 'T1082',
          threat_likelihood: 'low' as const,
          evidence: 'Verified against UAE Sovereign Golden Baseline'
        }
      ]
    : deviations.map((d, idx) => {
        let tactic = 'Defense Evasion';
        let technique = 'T1562.001';
        let stage = 'Subsystem Integrity Deviation';

        if (d.category.includes('proc')) {
          tactic = 'Execution';
          technique = 'T1204.002';
          stage = 'Unauthorized Binary Execution';
        } else if (d.category.includes('net')) {
          tactic = 'Command and Control';
          technique = 'T1071.001';
          stage = 'Anomalous Egress Communication';
        } else if (d.category.includes('sec')) {
          tactic = 'Defense Evasion';
          technique = 'T1562.001';
          stage = 'Security Control Impairment';
        } else if (d.category.includes('fim')) {
          tactic = 'Persistence';
          technique = 'T1546';
          stage = 'System Configuration Tampering';
        }

        return {
          event_id: `CORR-DEV-${idx + 1}`,
          stage,
          title: d.title || `${d.category} Anomaly`,
          description: d.description,
          involved_entities: [d.entity],
          mitre_tactic: tactic,
          mitre_technique: technique,
          threat_likelihood: (d.severity === 'critical' ? 'critical' : d.severity === 'high' ? 'high' : 'moderate') as any,
          evidence: `Expected: "${d.baseline_expected}" vs Observed: "${d.observed_actual}"`
        };
      });

  const recommendedActions = isClean
    ? [
        {
          id: 'ACT-01',
          title: 'Maintain Real-Time Telemetry Streaming',
          action: 'Maintain Real-Time Telemetry Streaming',
          type: 'hardening' as const,
          priority: 'low' as const,
          urgency: 'LOW' as const,
          command_snippet: 'Get-Service AIOS-Telemetry | Select-Object Status, StartType',
          command: 'Get-Service AIOS-Telemetry | Select-Object Status, StartType',
          explanation: 'Ensure background EDR agent continues heartbeat stream to the Digital Integrity Monitor.',
          rationale: 'Ensure continuous monitoring coverage.'
        }
      ]
    : [
        {
          id: 'ACT-01',
          title: 'Isolate Host from Sovereign Network Fabric',
          action: 'Isolate Host from Sovereign Network Fabric',
          type: 'containment' as const,
          priority: 'urgent' as const,
          urgency: 'IMMEDIATE' as const,
          command_snippet: 'Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled True; Block-InboundOutbound -PreserveTelemetry',
          command: 'Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled True; Block-InboundOutbound -PreserveTelemetry',
          explanation: 'Sever lateral movement and C2 beaconing while preserving telemetry link for active incident response.',
          rationale: 'Prevent adversary lateral propagation across adjacent nodes.'
        },
        {
          id: 'ACT-02',
          title: 'Restore Terminated Defender and EventLog Daemons',
          action: 'Restore Terminated Defender and EventLog Daemons',
          type: 'remediation' as const,
          priority: 'high' as const,
          urgency: 'HIGH' as const,
          command_snippet: 'Set-Service -Name WinDefend -StartupType Automatic; Start-Service WinDefend',
          command: 'Set-Service -Name WinDefend -StartupType Automatic; Start-Service WinDefend',
          explanation: 'Re-enable real-time kernel telemetry, memory scanning, and AMSI script inspection.',
          rationale: 'Security daemon must be active to neutralize residual threats.'
        },
        {
          id: 'ACT-03',
          title: 'Terminate Unsigned / Deviant Processes & Quarantine Artifacts',
          action: 'Terminate Unsigned / Deviant Processes & Quarantine Artifacts',
          type: 'containment' as const,
          priority: 'high' as const,
          urgency: 'HIGH' as const,
          command_snippet: deviations.some(d => d.category.includes('proc'))
            ? `Stop-Process -Name "${deviations.find(d => d.category.includes('proc'))?.entity || 'update_sync.exe'}" -Force`
            : 'Get-Process | Where-Object { -not $_.Path } | Stop-Process -Force',
          command: deviations.some(d => d.category.includes('proc'))
            ? `Stop-Process -Name "${deviations.find(d => d.category.includes('proc'))?.entity || 'update_sync.exe'}" -Force`
            : 'Get-Process | Where-Object { -not $_.Path } | Stop-Process -Force',
          explanation: 'Halt malicious execution threads and preserve disk image for forensic review.',
          rationale: 'Neutralize active adversary execution.'
        }
      ];

  return {
    assessment: assessmentStr,
    risk_level: (trustScoreResult.risk_classification || 'LOW') as any,
    explanation: explanationStr,
    detailed_explanation: explanationStr,
    summary_headline: assessmentStr,
    threat_hypothesis: assessmentStr,
    attack_narrative: explanationStr,
    correlated_events: correlatedEvents,
    correlated_chain: correlatedEvents,
    correlated_activity_chain: correlatedEvents,
    mitre_mappings: correlatedEvents.map(ev => ({
      technique_id: ev.mitre_technique || 'T1059',
      tactic: ev.mitre_tactic || 'Execution',
      technique_name: ev.title,
      evidence: ev.evidence || ev.description
    })),
    recommended_actions: recommendedActions,
    confidence: isClean ? 0.99 : 0.92,
    confidence_score: isClean ? 0.99 : 0.92,
    trust_score_invariant: {
      ground_truth_score: trustScoreResult.current_score,
      authority: 'DETERMINISTIC_TRUST_ENGINE',
      gemini_authority: 'READ_ONLY_ADVISORY',
      can_alter_trust_score: false,
      message: 'CRITICAL INVARIANT: Gemini has zero authority to directly alter the Trust Score. Trust Score is computed authoritatively by the deterministic Trust Engine based on mathematical baseline verification.'
    },
    generated_at: new Date().toISOString(),
    model_used: 'Deterministic Integrity Reasoning Engine (Ground Truth Fallback)'
  };
}

// Active AI analysis state
let currentAiAnalysis: AIIntegrityAnalysis = buildDeterministicAnalysis(
  compareAgainstBaseline(activeState, DEFAULT_BASELINE),
  calculateTrustScore(compareAgainstBaseline(activeState, DEFAULT_BASELINE)),
  activeState.recent_events
);

// Initialize Gemini Client safely
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      }
    }
  });
}

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    system: 'Digital Integrity & Trust Monitor AIOS Core',
    version: '2.4.0-SOVEREIGN-UAE',
    has_gemini_key: Boolean(process.env.GEMINI_API_KEY)
  });
});

// 1. GET Current State, Deviations, and Deterministic Trust Score
app.get('/api/state', (req, res) => {
  const deviations = compareAgainstBaseline(activeState, DEFAULT_BASELINE);
  const trustScoreResult = calculateTrustScore(deviations);
  const scenario = SCENARIOS.find(s => s.id === currentScenarioId) || SCENARIOS[0];

  res.json({
    scenario_id: currentScenarioId,
    scenario,
    state: activeState,
    baseline: DEFAULT_BASELINE,
    deviations,
    trust_score: trustScoreResult,
    trustScore: trustScoreResult,
    ai_analysis: currentAiAnalysis,
    aiAnalysis: currentAiAnalysis,
    analysis: currentAiAnalysis,
    timestamp: new Date().toISOString()
  });
});

// 2. Select Scenario
app.post('/api/scenario/:id', (req, res) => {
  const scenario = SCENARIOS.find(s => s.id === req.params.id);
  if (!scenario) {
    return res.status(404).json({ error: `Scenario ${req.params.id} not found` });
  }

  currentScenarioId = scenario.id;
  activeState = JSON.parse(JSON.stringify(scenario.state));

  const deviations = compareAgainstBaseline(activeState, DEFAULT_BASELINE);
  const trustScore = calculateTrustScore(deviations);
  currentAiAnalysis = buildDeterministicAnalysis(deviations, trustScore, activeState.recent_events);

  res.json({
    message: `Scenario '${scenario.name}' activated`,
    scenario,
    scenario_id: currentScenarioId,
    state: activeState,
    baseline: DEFAULT_BASELINE,
    deviations,
    deviations_count: deviations.length,
    trust_score: trustScore,
    trustScore,
    ai_analysis: currentAiAnalysis,
    aiAnalysis: currentAiAnalysis,
    analysis: currentAiAnalysis
  });
});

// 3. Telemetry Ingestion (Accepts real PowerShell agent or simulated EDR payloads)
app.post('/api/telemetry/ingest', (req, res) => {
  try {
    const rawPayload = req.body;
    let normalizedEvent: NormalizedEvent;

    if (rawPayload.collector === 'powershell_agent' || rawPayload.category) {
      normalizedEvent = normalizePowerShellPayload(rawPayload);
    } else if (rawPayload.event_id && rawPayload.entity) {
      normalizedEvent = rawPayload as NormalizedEvent;
    } else {
      normalizedEvent = {
        event_id: `EV-INGEST-${Date.now()}`,
        timestamp: new Date().toISOString(),
        source: 'edr_sensor',
        type: rawPayload.type || 'process_start',
        severity: rawPayload.severity || 'medium',
        entity: rawPayload.entity || 'Injected Entity',
        evidence: rawPayload.evidence || rawPayload,
        confidence: 0.95,
        mitre_tactic: rawPayload.mitre_tactic || 'Execution',
        mitre_technique: rawPayload.mitre_technique || 'T1059'
      };
    }

    // Append to live recent events
    activeState.recent_events.unshift(normalizedEvent);
    if (activeState.recent_events.length > 50) {
      activeState.recent_events = activeState.recent_events.slice(0, 50);
    }

    // If payload contains an entity to mutate in state (e.g. inject process or stop service)
    if (rawPayload.action === 'add_process' && rawPayload.process) {
      activeState.processes.push(rawPayload.process);
    } else if (rawPayload.action === 'stop_service' && rawPayload.service_name) {
      const svc = activeState.services.find(s => s.name === rawPayload.service_name);
      if (svc) {
        svc.status = 'Stopped';
      }
    } else if (rawPayload.action === 'modify_fim' && rawPayload.file_path) {
      const fim = activeState.fim_files.find(f => f.path === rawPayload.file_path);
      if (fim) {
        fim.is_modified = true;
        fim.current_hash = 'tampered_' + Date.now().toString(16);
      }
    }

    const deviations = compareAgainstBaseline(activeState, DEFAULT_BASELINE);
    const trustScore = calculateTrustScore(deviations);
    currentAiAnalysis = buildDeterministicAnalysis(deviations, trustScore, activeState.recent_events);

    res.json({
      success: true,
      event_id: normalizedEvent.event_id,
      state: activeState,
      baseline: DEFAULT_BASELINE,
      deviations,
      trust_score: trustScore,
      trustScore,
      ai_analysis: currentAiAnalysis,
      aiAnalysis: currentAiAnalysis,
      analysis: currentAiAnalysis
    });
  } catch (err: any) {
    res.status(400).json({ error: err.message || 'Invalid ingestion payload' });
  }
});

// 4. Remediation / State Action Handler (Simulated Host Isolation, Quarantine, Revert Baseline)
app.post('/api/actions/execute', (req, res) => {
  const { action_type, target_entity } = req.body;

  if (action_type === 'revert_baseline') {
    const cleanScenario = SCENARIOS.find(s => s.id === 'clean_baseline')!;
    currentScenarioId = 'clean_baseline';
    activeState = JSON.parse(JSON.stringify(cleanScenario.state));
  } else if (action_type === 'kill_process' || action_type === 'terminate_process') {
    activeState.processes = activeState.processes.filter(p => !p.name.includes(target_entity) && String(p.pid) !== target_entity);
  } else if (action_type === 'restart_service' || action_type === 'restore_service') {
    const svc = activeState.services.find(s => s.name === target_entity || s.display_name === target_entity);
    if (svc) {
      svc.status = 'Running';
    }
  } else if (action_type === 'block_network' || action_type === 'isolate_host') {
    if (target_entity) {
      activeState.network_connections = activeState.network_connections.filter(c => c.remote_ip !== target_entity && !target_entity.includes(c.remote_ip));
    } else {
      activeState.network_connections = [];
    }
  } else if (action_type === 'restore_file' || action_type === 'restore_fim') {
    const fim = activeState.fim_files.find(f => f.path.includes(target_entity));
    if (fim) {
      fim.current_hash = fim.expected_hash;
      fim.is_modified = false;
    }
  }

  const deviations = compareAgainstBaseline(activeState, DEFAULT_BASELINE);
  const trustScore = calculateTrustScore(deviations);
  currentAiAnalysis = buildDeterministicAnalysis(deviations, trustScore, activeState.recent_events);

  res.json({
    success: true,
    message: `Action '${action_type}' applied on '${target_entity || 'node'}'`,
    action: { name: `${action_type} on ${target_entity || 'node'}` },
    state: activeState,
    baseline: DEFAULT_BASELINE,
    deviations,
    trust_score: trustScore,
    trustScore,
    ai_analysis: currentAiAnalysis,
    aiAnalysis: currentAiAnalysis,
    analysis: currentAiAnalysis
  });
});

// 5. Module 05 — AI Analysis (Gemini Reasoning)
// Receives:
//  - Deterministic Trust Score (computed authoritatively by Trust Engine)
//  - List of detected deviations (baseline violations)
//  - Supporting event objects (recent normalized telemetry)
// Crucially, Gemini DOES NOT have the authority to alter the Trust Score.
app.post('/api/gemini/analyze', async (req, res) => {
  try {
    const deviations = compareAgainstBaseline(activeState, DEFAULT_BASELINE);
    const trustScoreResult = calculateTrustScore(deviations);
    const supportingEvents = (req.body.events && Array.isArray(req.body.events)) 
      ? req.body.events 
      : activeState.recent_events.slice(0, 10);
    const clientPrompt = req.body.custom_query || 'Explain the likely relationship between the detected baseline deviations and supporting telemetry events, provide an overall risk assessment, and recommend response actions.';

    const ai = getGeminiClient();

    if (!ai) {
      const fallback = buildDeterministicAnalysis(deviations, trustScoreResult, supportingEvents);
      currentAiAnalysis = fallback;
      return res.json({
        success: true,
        analysis: fallback,
        aiAnalysis: fallback,
        ...fallback
      });
    }

    const systemInstruction = `You are the AI Analysis & Reasoning Module for the Digital Integrity Monitor prototype (UAE Sovereign AIOS).

CRITICAL ARCHITECTURAL BOUNDARY & INVARIANT:
- The deterministic Trust Engine is the SOLE authority for calculating the ground-truth Trust Score: ${trustScoreResult.current_score}% (${trustScoreResult.status_label}).
- You DO NOT have the authority to alter, override, recalculate, or modify the trust score under any circumstances.
- Your role is strictly analytical and advisory:
  1. Receive the deterministic Trust Score, detected deviations, and supporting event objects.
  2. Explain the likely relationship and causal connections between these events and deviations.
  3. Provide an overall risk assessment.
  4. Output your analysis in a structured JSON format containing:
     - "assessment": string summarizing the risk classification and rationale
     - "explanation": string explaining the likely relationship between the events and deviations
     - "correlated_events": array of correlated events showing the progression and evidence
     - "recommended_actions": array of containment and remediation actions with concrete commands
     - "confidence": number between 0.0 and 1.0 representing your confidence in this hypothesis.`;

    const promptPayload = `INPUT DATA FOR INTEGRITY REASONING:

[DETERMINISTIC TRUST SCORE - AUTHORITATIVE GROUND TRUTH]
- Numerical Score: ${trustScoreResult.current_score} / 100.0
- Classification: ${trustScoreResult.risk_classification}
- Status Label: ${trustScoreResult.status_label}
- Total Mathematical Deductions: ${trustScoreResult.total_deductions} pts
- Deduction Rules Triggered:
${JSON.stringify(trustScoreResult.deduction_breakdown.map(d => ({
  rule: d.rule_id,
  entity: d.entity,
  penalty: d.effective_deduction,
  reason: d.reason
})), null, 2)}
(REMINDER: You cannot change this score. It is fixed ground truth computed by the Trust Engine.)

[DETECTED DEVIATIONS (${deviations.length} baseline violations)]
${JSON.stringify(deviations.map(d => ({
  id: d.deviation_id,
  category: d.category,
  severity: d.severity,
  entity: d.entity,
  expected: d.baseline_expected,
  observed: d.observed_actual,
  description: d.description,
  weight: d.deduction_weight
})), null, 2)}

[SUPPORTING EVENT OBJECTS (${supportingEvents.length} telemetry records)]
${JSON.stringify(supportingEvents.map(e => ({
  event_id: e.event_id,
  timestamp: e.timestamp,
  source: e.source,
  type: e.type,
  severity: e.severity,
  entity: e.entity,
  evidence: e.evidence,
  mitre_tactic: e.mitre_tactic,
  mitre_technique: e.mitre_technique
})), null, 2)}

[ANALYST INQUIRY]
${clientPrompt}

Explain the likely relationship between these events, provide an overall risk assessment, correlate the events into a chain, recommend actionable containment steps, and output valid JSON conforming strictly to the requested schema.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: promptPayload,
      config: {
        systemInstruction,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            assessment: {
              type: Type.STRING,
              description: "Risk assessment summary and classification (e.g., 'CRITICAL COMPROMISE: Defense Evasion & C2 Beaconing' or 'HIGH RISK: Unauthorized Execution & Service Tampering')"
            },
            explanation: {
              type: Type.STRING,
              description: "Detailed explanation of the likely relationship and causal link between the detected baseline deviations and supporting event objects"
            },
            correlated_events: {
              type: Type.ARRAY,
              description: "Correlated events mapping the relationship between events, entities, and MITRE tactics",
              items: {
                type: Type.OBJECT,
                properties: {
                  event_id: { type: Type.STRING, description: "Unique identifier for this correlated stage or referenced event" },
                  stage: { type: Type.STRING, description: "Kill chain or correlation stage (e.g., 'Initial Compromise', 'Defense Evasion', 'Persistence', 'C2 Outbound')" },
                  title: { type: Type.STRING, description: "Concise title of the correlated event" },
                  description: { type: Type.STRING, description: "Explanation of how this event relates to the detected deviations" },
                  involved_entities: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Processes, files, services, or network addresses involved"
                  },
                  mitre_tactic: { type: Type.STRING, description: "MITRE ATT&CK tactic" },
                  mitre_technique: { type: Type.STRING, description: "MITRE ATT&CK technique (e.g. T1059, T1562.001)" },
                  threat_likelihood: { type: Type.STRING, description: "'critical', 'high', 'moderate', or 'low'" },
                  evidence: { type: Type.STRING, description: "Telemetry evidence supporting this correlation" }
                },
                required: ["stage", "title", "description", "involved_entities", "threat_likelihood"]
              }
            },
            recommended_actions: {
              type: Type.ARRAY,
              description: "Actionable response, containment, and remediation steps",
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING, description: "Action identifier (e.g. 'ACT-01')" },
                  title: { type: Type.STRING, description: "Action title" },
                  type: { type: Type.STRING, description: "'containment', 'investigation', 'remediation', or 'hardening'" },
                  priority: { type: Type.STRING, description: "'urgent', 'high', 'medium', or 'low'" },
                  command_snippet: { type: Type.STRING, description: "Executable PowerShell or shell command snippet" },
                  explanation: { type: Type.STRING, description: "Technical justification and purpose of the action" }
                },
                required: ["id", "title", "type", "priority", "explanation"]
              }
            },
            confidence: {
              type: Type.NUMBER,
              description: "Analytical confidence in this assessment between 0.0 and 1.0"
            }
          },
          required: ["assessment", "explanation", "correlated_events", "recommended_actions", "confidence"]
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');

    // Normalize correlated events
    const correlatedEvents = (parsed.correlated_events || []).map((ev: any, idx: number) => ({
      event_id: ev.event_id || `CORR-EV-${idx + 1}`,
      stage: ev.stage || `Stage ${idx + 1}`,
      title: ev.title || 'Correlated Security Event',
      description: ev.description || '',
      involved_entities: Array.isArray(ev.involved_entities) ? ev.involved_entities : [String(ev.involved_entities || '')],
      mitre_tactic: ev.mitre_tactic || 'Execution',
      mitre_technique: ev.mitre_technique || 'T1059',
      threat_likelihood: ev.threat_likelihood || 'high',
      evidence: ev.evidence || ev.description || 'Observed via live host telemetry'
    }));

    // Normalize recommended actions
    const recommendedActions = (parsed.recommended_actions || []).map((act: any, idx: number) => ({
      id: act.id || `ACT-0${idx + 1}`,
      title: act.title || 'Recommended Mitigation',
      action: act.title || 'Recommended Mitigation',
      type: act.type || 'containment',
      priority: act.priority || 'high',
      urgency: (act.priority === 'urgent' ? 'IMMEDIATE' : act.priority === 'high' ? 'HIGH' : 'MEDIUM') as any,
      command_snippet: act.command_snippet || '',
      command: act.command_snippet || '',
      explanation: act.explanation || '',
      rationale: act.explanation || ''
    }));

    const result: AIIntegrityAnalysis = {
      assessment: parsed.assessment || trustScoreResult.status_label,
      risk_level: (trustScoreResult.risk_classification || 'LOW') as any,
      explanation: parsed.explanation || '',
      detailed_explanation: parsed.explanation || '',
      summary_headline: parsed.assessment || `${trustScoreResult.status_label} - Integrity Anomaly Correlation`,
      threat_hypothesis: parsed.assessment || 'Multistage Telemetry Correlation Assessment',
      attack_narrative: parsed.explanation || '',
      correlated_events: correlatedEvents,
      correlated_chain: correlatedEvents,
      correlated_activity_chain: correlatedEvents,
      mitre_mappings: correlatedEvents.map((ev: any) => ({
        technique_id: ev.mitre_technique || 'T1059',
        tactic: ev.mitre_tactic || 'Execution',
        technique_name: ev.title,
        evidence: ev.evidence || ev.description
      })),
      recommended_actions: recommendedActions,
      confidence: typeof parsed.confidence === 'number' ? parsed.confidence : 0.94,
      confidence_score: typeof parsed.confidence === 'number' ? parsed.confidence : 0.94,
      trust_score_invariant: {
        ground_truth_score: trustScoreResult.current_score,
        authority: 'DETERMINISTIC_TRUST_ENGINE',
        gemini_authority: 'READ_ONLY_ADVISORY',
        can_alter_trust_score: false,
        message: 'Crucial Architectural Invariant: Gemini has zero authority to directly alter the Trust Score. Trust Score is computed authoritatively by the deterministic Trust Engine based on mathematical baseline verification.'
      },
      generated_at: new Date().toISOString(),
      model_used: 'gemini-3.8-flash'
    };

    currentAiAnalysis = result;

    res.json({
      success: true,
      analysis: result,
      aiAnalysis: result,
      ...result
    });
  } catch (err: any) {
    console.error('Gemini Analysis Error:', err);
    // Fallback on error to ensure uninterrupted application availability
    const deviations = compareAgainstBaseline(activeState, DEFAULT_BASELINE);
    const trustScoreResult = calculateTrustScore(deviations);
    const fallback = buildDeterministicAnalysis(deviations, trustScoreResult, activeState.recent_events);
    currentAiAnalysis = fallback;
    res.json({
      success: true,
      analysis: fallback,
      aiAnalysis: fallback,
      ...fallback
    });
  }
});

// 6. PowerShell Agent Script Generator (1:1 GitHub Deployment Ready)
app.get('/api/powershell-agent/script', (req, res) => {
  const hostUrl = req.protocol + '://' + req.get('host');
  const psScript = `# ==============================================================================
# UAE AIOS DIGITAL INTEGRITY MONITOR — POWERSHELL TELEMETRY AGENT v2.4
# Continuously collects host state and streams normalized telemetry to the AIOS Core
# ==============================================================================

[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$IngestUrl = "${hostUrl}/api/telemetry/ingest"
$HostId = $env:COMPUTERNAME
Write-Host "[+] AIOS Integrity Agent started for host: $HostId" -ForegroundColor Cyan
Write-Host "[+] Target Core API: $IngestUrl" -ForegroundColor Gray

function Send-AIOSPayload($Category, $Data) {
    $body = @{
        collector = "powershell_agent"
        timestamp = (Get-Date).ToUniversalTime().ToString("o")
        category  = $Category
        payload   = $Data
    } | ConvertTo-Json -Depth 6

    try {
        $response = Invoke-RestMethod -Uri $IngestUrl -Method Post -Body $body -ContentType "application/json" -TimeoutSec 5
        Write-Host "[✓] Sent $Category telemetry | Current Trust Score: $($response.trust_score.current_score)%" -ForegroundColor Green
    } catch {
        Write-Warning "Failed to transmit telemetry to AIOS Core: $_"
    }
}

# 1. Process Integrity Inspection
Write-Host "[*] Auditing running processes..." -ForegroundColor Yellow
Get-Process | ForEach-Object {
    $procPath = ""
    $isSigned = $false
    try { $procPath = $_.Path } catch {}
    if ($procPath -and (Test-Path $procPath)) {
        $sig = Get-AuthenticodeSignature -FilePath $procPath -ErrorAction SilentlyContinue
        $isSigned = ($sig.Status -eq 'Valid')
    }
    Send-AIOSPayload -Category "process" -Data @{
        Id        = $_.Id
        Name      = $_.ProcessName
        Path      = $procPath
        IsSigned  = $isSigned
        Handles   = $_.Handles
        WS        = $_.WorkingSet64
    }
}

# 2. Critical Security Services Inspection
Write-Host "[*] Auditing security services..." -ForegroundColor Yellow
@('WinDefend', 'EventLog', 'CryptSvc', 'MpsSvc') | ForEach-Object {
    $svc = Get-Service -Name $_ -ErrorAction SilentlyContinue
    if ($svc) {
        Send-AIOSPayload -Category "service" -Data @{
            Name   = $svc.Name
            Status = $svc.Status.ToString()
        }
    }
}

# 3. File Integrity Monitoring (System32 Drivers & Hosts)
Write-Host "[*] Auditing protected file hashes..." -ForegroundColor Yellow
$hostsPath = "$env:SystemRoot\\System32\\drivers\\etc\\hosts"
if (Test-Path $hostsPath) {
    $hash = (Get-FileHash -Path $hostsPath -Algorithm SHA256).Hash
    Send-AIOSPayload -Category "fim" -Data @{
        Path       = $hostsPath
        HashSHA256 = $hash
        IsModified = ($hash -ne "89b983570f031023a1a3a936a282910790936e7a2b9183749202746101928374")
    }
}

Write-Host "[+] Initial telemetry sweep completed successfully." -ForegroundColor Cyan
`;

  res.setHeader('Content-Type', 'text/plain');
  res.setHeader('Content-Disposition', 'attachment; filename="AIOS-Integrity-Agent.ps1"');
  res.send(psScript);
});

// ----------------------------------------------------
// VITE SPA INTEGRATION & ASSET SERVING
// ----------------------------------------------------

async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[AIOS CORE] Digital Integrity Monitor running on http://0.0.0.0:${PORT}`);
  });
}

startServer();
