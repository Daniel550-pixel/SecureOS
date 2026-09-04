# SecureOS Telemetry Pipeline

## Runtime path

```text
Windows Host
    |
    v
PowerShell Agent
    |
    | HTTPS/HTTP POST /api/telemetry/ingest
    v
Telemetry Normalizer
    |
    +--> activeState.recent_events
    |
    +--> Persistent Event Ledger (JSONL)
    |       |
    |       +--> SHA-256 record hash
    |       +--> previous_hash chain
    |       +--> sequence number
    |
    v
Deterministic Baseline Comparison
    |
    v
Deterministic Trust Engine
    |
    +--> Trust Score
    +--> Risk Classification
    +--> Deviations
    |
    v
AI Analysis (advisory/read-only)
    |
    v
SecureOS UI
```

## Collector boundary

The PowerShell agent is a telemetry collector. It observes processes, critical services, established TCP connections, and the Windows hosts file hash. It does not execute remediation and cannot change the Trust Score.

## Persistent ledger

`src/engine/eventLedger.ts` stores append-only JSONL records under `data/event-ledger.jsonl` at runtime. Each record contains:

- sequence
- recorded timestamp
- record type
- host ID
- telemetry or trust snapshot data
- previous record hash
- SHA-256 record hash

The chain can be checked through:

- `GET /api/ledger`
- `GET /api/evidence/verify`
- `GET /api/trust/history`

The ledger is tamper-evident, not a substitute for a signed remote audit log. Runtime `data/` should be excluded from source control for production deployments.

## Trust authority

The Trust Engine remains authoritative. Gemini receives the deterministic score, deviations, and supporting telemetry as evidence. Gemini cannot alter or recalculate the score.

## Simulation vs live telemetry

Scenario fixtures remain available for demonstrations. Live PowerShell telemetry is distinguishable by `source: powershell_agent` and should be treated as observed endpoint data. Simulation fixtures are not cryptographic proof.
