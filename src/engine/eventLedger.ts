import { appendFileSync, existsSync, mkdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';
import { NormalizedEvent } from '../types/integrity';

export interface LedgerRecord {
  sequence: number;
  recorded_at: string;
  record_type: 'telemetry' | 'trust_snapshot' | 'scenario' | 'action';
  host_id: string;
  event?: NormalizedEvent;
  trust_score?: number;
  risk_classification?: string;
  formula_version?: string;
  metadata?: Record<string, unknown>;
  previous_hash: string;
  record_hash: string;
}

const DATA_DIR = path.join(process.cwd(), 'data');
const LEDGER_PATH = path.join(DATA_DIR, 'event-ledger.jsonl');
const GENESIS_HASH = '0'.repeat(64);

function ensureLedger(): void {
  if (!existsSync(DATA_DIR)) mkdirSync(DATA_DIR, { recursive: true });
  if (!existsSync(LEDGER_PATH)) appendFileSync(LEDGER_PATH, '', 'utf8');
}

function readRecords(): LedgerRecord[] {
  ensureLedger();
  const raw = readFileSync(LEDGER_PATH, 'utf8').trim();
  if (!raw) return [];
  return raw.split('\n').filter(Boolean).map((line, index) => {
    try {
      return JSON.parse(line) as LedgerRecord;
    } catch {
      throw new Error(`Ledger corruption: invalid JSON at line ${index + 1}`);
    }
  });
}

function canonicalize(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(canonicalize).join(',')}]`;
  const object = value as Record<string, unknown>;
  return `{${Object.keys(object).sort().map(key => `${JSON.stringify(key)}:${canonicalize(object[key])}`).join(',')}}`;
}

function hashRecord(record: Omit<LedgerRecord, 'record_hash'>): string {
  return createHash('sha256').update(canonicalize(record), 'utf8').digest('hex');
}

export function appendLedgerRecord(input: Omit<LedgerRecord, 'sequence' | 'recorded_at' | 'previous_hash' | 'record_hash'>): LedgerRecord {
  const records = readRecords();
  const previousHash = records.at(-1)?.record_hash || GENESIS_HASH;
  const unsigned: Omit<LedgerRecord, 'record_hash'> = {
    ...input,
    sequence: records.length + 1,
    recorded_at: new Date().toISOString(),
    previous_hash: previousHash,
  };
  const record: LedgerRecord = { ...unsigned, record_hash: hashRecord(unsigned) };
  appendFileSync(LEDGER_PATH, `${JSON.stringify(record)}\n`, 'utf8');
  return record;
}

export function appendTelemetry(event: NormalizedEvent, hostId: string, metadata?: Record<string, unknown>): LedgerRecord {
  return appendLedgerRecord({ record_type: 'telemetry', host_id: hostId, event, metadata });
}

export function appendTrustSnapshot(hostId: string, trustScore: number, riskClassification: string, formulaVersion: string, metadata?: Record<string, unknown>): LedgerRecord {
  return appendLedgerRecord({ record_type: 'trust_snapshot', host_id: hostId, trust_score: trustScore, risk_classification: riskClassification, formula_version: formulaVersion, metadata });
}

export function appendLifecycleRecord(recordType: 'scenario' | 'action', hostId: string, metadata?: Record<string, unknown>): LedgerRecord {
  return appendLedgerRecord({ record_type: recordType, host_id: hostId, metadata });
}

export function getLedger(limit = 100): LedgerRecord[] {
  return readRecords().slice(-Math.max(1, Math.min(limit, 1000))).reverse();
}

export function verifyLedger(): { valid: boolean; records: number; first_invalid_sequence?: number; error?: string } {
  try {
    const records = readRecords();
    let previousHash = GENESIS_HASH;
    for (const record of records) {
      const { record_hash, ...unsigned } = record;
      if (record.sequence < 1 || record.previous_hash !== previousHash || hashRecord(unsigned) !== record_hash) {
        return { valid: false, records: records.length, first_invalid_sequence: record.sequence, error: 'Hash-chain verification failed' };
      }
      previousHash = record_hash;
    }
    return { valid: true, records: records.length };
  } catch (error) {
    return { valid: false, records: 0, error: error instanceof Error ? error.message : 'Ledger verification failed' };
  }
}

/** Returns a logical ledger identifier; filesystem paths are never exposed through the API. */
export function getLedgerPath(): string {
  return 'data/event-ledger.jsonl';
}
