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

  res.json({
    scenario_id: currentScenarioId,
    state: activeState,
    baseline: DEFAULT_BASELINE,
    deviations,
    trust_score: trustScoreResult,
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

  res.json({
    message: `Scenario '${scenario.name}' activated`,
    scenario_id: currentScenarioId,
    deviations_count: deviations.length,
    trust_score: trustScore
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

    res.json({
      success: true,
      event_id: normalizedEvent.event_id,
      trust_score: trustScore
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
    return res.json({
      success: true,
      message: 'System state successfully restored to Golden Baseline Catalog',
      trust_score: calculateTrustScore(compareAgainstBaseline(activeState, DEFAULT_BASELINE))
    });
  }

  if (action_type === 'kill_process') {
    activeState.processes = activeState.processes.filter(p => !p.name.includes(target_entity) && String(p.pid) !== target_entity);
  } else if (action_type === 'restart_service') {
    const svc = activeState.services.find(s => s.name === target_entity || s.display_name === target_entity);
    if (svc) {
      svc.status = 'Running';
    }
  } else if (action_type === 'block_network') {
    activeState.network_connections = activeState.network_connections.filter(c => c.remote_ip !== target_entity && !target_entity.includes(c.remote_ip));
  } else if (action_type === 'restore_file') {
    const fim = activeState.fim_files.find(f => f.path === target_entity);
    if (fim) {
      fim.current_hash = fim.expected_hash;
      fim.is_modified = false;
    }
  }

  const deviations = compareAgainstBaseline(activeState, DEFAULT_BASELINE);
  const trustScore = calculateTrustScore(deviations);

  res.json({
    success: true,
    message: `Action '${action_type}' applied on '${target_entity}'`,
    trust_score: trustScore
  });
});

// 5. Module 05 — AI Analysis (Gemini Reasoning)
// Receives Evidence + Deterministic Trust Score + Deviations -> Produces Structured Attack Chain Correlation & Guidance
app.post('/api/gemini/analyze', async (req, res) => {
  try {
    const deviations = compareAgainstBaseline(activeState, DEFAULT_BASELINE);
    const trustScoreResult = calculateTrustScore(deviations);
    const clientPrompt = req.body.custom_query || 'Analyze current integrity deviations, correlate attack progression, and recommend containment steps.';

    const ai = getGeminiClient();

    if (!ai) {
      // High quality deterministic fallback when API key is pending
      const isCritical = trustScoreResult.current_score < 50;
      const isElevated = trustScoreResult.current_score < 80;

      const fallbackAnalysis: AIIntegrityAnalysis = {
        assessment: isCritical ? 'critical_compromise' : (isElevated ? 'high_risk' : 'elevated_risk'),
        summary_headline: isCritical
          ? 'Multistage Defense Evasion and Execution Chain Correlated'
          : 'Isolated Digital Integrity Deviations Detected Across Host Subsystems',
        detailed_explanation: `Deterministic security engine calculated an Integrity Trust Score of ${trustScoreResult.current_score}% with ${deviations.length} distinct baseline violations. The observed deviations demonstrate tampering with security services and unauthorized binary or network activity.`,
        confidence: 0.92,
        attack_narrative: `Initial deviation originated from process execution violating golden whitelists. Subsequent subsystem telemetry indicates defense evasion (status modifications to security daemons) and outbound non-standard socket handshakes.`,
        correlated_chain: deviations.map((d, idx) => ({
          tactic: d.category.replace(/_/g, ' ').toUpperCase(),
          technique: `TECH-${1000 + idx}`,
          description: d.description,
          involved_entities: [d.entity],
          threat_likelihood: d.severity === 'critical' ? 'critical' : 'high'
        })),
        recommended_actions: [
          {
            id: 'ACT-01',
            title: 'Isolate Host from UAE Sovereign Network Fabric',
            type: 'containment',
            priority: 'urgent',
            command_snippet: 'Set-NetFirewallProfile -Profile Domain,Public,Private -Enabled True; Block-InboundOutbound',
            explanation: 'Sever lateral movement vectors while preserving forensic telemetry connection to AIOS monitor.'
          },
          {
            id: 'ACT-02',
            title: 'Restore Defender Subsystem & Quarantine Unsigned Artifacts',
            type: 'remediation',
            priority: 'high',
            command_snippet: 'Start-Service WinDefend; Remove-Item -Path $SuspiciousPath -Force',
            explanation: 'Re-enable real-time telemetry inspection and remove staging artifacts.'
          },
          {
            id: 'ACT-03',
            title: 'Audit Parent Process Tree and Memory Dumps',
            type: 'investigation',
            priority: 'medium',
            command_snippet: 'Get-Process | Select-Object Id, Name, Path, Company | Export-Clixml forensic.xml',
            explanation: 'Capture volatile process memory before host reboot or restoration to Golden Baseline.'
          }
        ],
        generated_at: new Date().toISOString(),
        model_used: 'Deterministic Reasoning Engine (Fallback Mode)'
      };

      return res.json(fallbackAnalysis);
    }

    const systemInstruction = `You are the AI Reasoning Engine for the Digital Integrity / Trust Monitor (UAE Sovereign AIOS).
CRITICAL INVARIANT:
- The Deterministic Trust Engine has already calculated the GROUND TRUTH Trust Score: ${trustScoreResult.current_score} / 100.0 (${trustScoreResult.status_label}).
- You MUST NOT alter, override, or invent your own score.
- Your task is to provide structured intelligence: explain the likely relationship between these events, identify the threat narrative / MITRE ATT&CK progression, estimate confidence, and output actionable containment commands.`;

    const promptPayload = `CURRENT DETERMINISTIC SECURITY STATE:
- Host: ${activeState.hostname} (${activeState.os_version})
- Trust Score: ${trustScoreResult.current_score}%
- Risk Classification: ${trustScoreResult.risk_classification}
- Total Deviations: ${deviations.length}

DEVIATIONS DETECTED:
${JSON.stringify(deviations, null, 2)}

RECENT NORMALIZED TELEMETRY:
${JSON.stringify(activeState.recent_events.slice(0, 8), null, 2)}

USER QUERY:
${clientPrompt}

Provide a structured, rigorous JSON security assessment.`;

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
              description: "Overall classification: 'healthy', 'elevated_risk', 'high_risk', or 'critical_compromise'"
            },
            summary_headline: {
              type: Type.STRING,
              description: "Short, punchy executive headline of the findings"
            },
            detailed_explanation: {
              type: Type.STRING,
              description: "Comprehensive evidence-backed analysis explaining event correlation"
            },
            confidence: {
              type: Type.NUMBER,
              description: "Confidence in threat hypothesis between 0.0 and 1.0"
            },
            attack_narrative: {
              type: Type.STRING,
              description: "Step-by-step kill chain narrative reconstructing adversary actions"
            },
            correlated_chain: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  tactic: { type: Type.STRING },
                  technique: { type: Type.STRING },
                  description: { type: Type.STRING },
                  involved_entities: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING }
                  },
                  threat_likelihood: {
                    type: Type.STRING,
                    description: "'low', 'moderate', 'high', or 'critical'"
                  }
                },
                required: ["tactic", "technique", "description", "involved_entities", "threat_likelihood"]
              }
            },
            recommended_actions: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  type: { type: Type.STRING, description: "'containment', 'investigation', 'remediation', or 'hardening'" },
                  priority: { type: Type.STRING, description: "'urgent', 'high', 'medium', or 'low'" },
                  command_snippet: { type: Type.STRING },
                  explanation: { type: Type.STRING }
                },
                required: ["id", "title", "type", "priority", "explanation"]
              }
            }
          },
          required: [
            "assessment",
            "summary_headline",
            "detailed_explanation",
            "confidence",
            "attack_narrative",
            "correlated_chain",
            "recommended_actions"
          ]
        }
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    const result: AIIntegrityAnalysis = {
      ...parsed,
      generated_at: new Date().toISOString(),
      model_used: 'gemini-3.8-flash'
    };

    res.json(result);
  } catch (err: any) {
    console.error('Gemini Analysis Error:', err);
    res.status(500).json({ error: err.message || 'AI Reasoning invocation failed' });
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
