# SecureOS Telemetry Pipeline

## Runtime contract

```text
Windows Host
  -> PowerShell Collector
  -> POST /api/telemetry/ingest
  -> Event Normalization
  -> Persistent Hash-Chained Ledger
  -> Deterministic Baseline Comparison
  -> Deterministic Trust Engine
  -> AI Advisory Layer
  -> SecureOS UI
```

## Authority boundary

The PowerShell agent is a collector. It does not execute remediation and it does not calculate or modify the Trust Score.

The deterministic Trust Engine is authoritative. Gemini is read-only and receives ground-truth score/deviation context for correlation and explanation.

## High-signal collection

The collector intentionally avoids writing every process and connection to the ledger on every interval. It reports:

- unsigned or non-standard process executions
- changes to critical service state
- connections to explicitly suspicious ports
- changes to the Windows hosts-file SHA-256 observation

This reduces ledger amplification while preserving security-relevant evidence.

## Ledger integrity

Each record contains:

- monotonically increasing sequence
- UTC recording timestamp
- previous record hash
- SHA-256 record hash
- record type
- host identity
- telemetry/trust/lifecycle metadata

`GET /api/evidence/verify` verifies the complete hash chain from the genesis value.

## API

- `GET /api/health` — service health and ledger status
- `GET /api/state` — current deterministic state
- `POST /api/telemetry/ingest` — normalized telemetry ingestion
- `GET /api/ledger?limit=100` — recent ledger records
- `GET /api/trust/history?limit=200` — historical Trust Score snapshots
- `GET /api/evidence/verify` — hash-chain verification
- `GET /api/powershell-agent/script` — generated collector script

## Operating modes

**Simulation mode:** predefined scenario fixtures provide deterministic demonstrations.

**Live mode:** the PowerShell collector sends observations from a Windows host. Live telemetry must remain visibly distinguishable from simulation fixtures in any production dashboard.

## CI verification

`.github/workflows/secureos-ci.yml` runs TypeScript verification and the production build on pushes and pull requests targeting `main`.
