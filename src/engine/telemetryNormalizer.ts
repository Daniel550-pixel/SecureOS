/**
 * Module 02 — Event Normalization Engine
 * Converts trusted, validated telemetry into the canonical NormalizedEvent schema.
 */

import { NormalizedEvent, EventSource, EventType, SeverityLevel } from '../types/integrity';

export interface RawWindowsEvent {
  EventID: number;
  TimeCreated: string;
  ProviderName: string;
  Computer: string;
  Data: Record<string, any>;
}

export interface RawPowerShellTelemetry {
  timestamp?: string;
  collector: string;
  category: 'process' | 'service' | 'net_conn' | 'fim' | 'auth';
  host_id?: string;
  payload: Record<string, any>;
}

const PS_CATEGORIES = new Set(['process', 'service', 'net_conn', 'fim', 'auth']);
const SOURCES = new Set(['windows_eventlog', 'sysmon', 'edr_sensor', 'powershell_agent']);
const SEVERITIES = new Set(['info', 'low', 'medium', 'high', 'critical']);

function assertObject(value: unknown, name: string): asserts value is Record<string, any> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(`${name} must be an object`);
}

function assertBoundedString(value: unknown, name: string, max = 512): void {
  if (typeof value !== 'string' || value.length === 0 || value.length > max) throw new Error(`${name} must be a non-empty string <= ${max} characters`);
}

export function validatePowerShellPayload(input: unknown): asserts input is RawPowerShellTelemetry {
  assertObject(input, 'telemetry payload');
  if (input.collector !== 'powershell_agent') throw new Error('unsupported collector');
  if (!PS_CATEGORIES.has(input.category)) throw new Error('unsupported telemetry category');
  if (input.host_id !== undefined) assertBoundedString(input.host_id, 'host_id', 128);
  if (input.timestamp !== undefined) {
    assertBoundedString(input.timestamp, 'timestamp', 64);
    if (Number.isNaN(Date.parse(input.timestamp))) throw new Error('invalid telemetry timestamp');
  }
  assertObject(input.payload, 'payload');
}

export function validateNormalizedEvent(input: unknown): asserts input is NormalizedEvent {
  assertObject(input, 'normalized event');
  assertBoundedString(input.event_id, 'event_id', 128);
  assertBoundedString(input.timestamp, 'timestamp', 64);
  if (Number.isNaN(Date.parse(input.timestamp))) throw new Error('invalid event timestamp');
  if (!SOURCES.has(input.source)) throw new Error('unsupported event source');
  if (!SEVERITIES.has(input.severity)) throw new Error('unsupported severity');
  assertBoundedString(input.entity, 'entity', 1024);
  if (typeof input.confidence !== 'number' || input.confidence < 0 || input.confidence > 1) throw new Error('confidence must be between 0 and 1');
  assertObject(input.evidence, 'evidence');
}

/** Normalizes Windows Event Log / Sysmon records. */
export function normalizeWindowsEvent(raw: RawWindowsEvent): NormalizedEvent {
  assertObject(raw, 'windows event');
  if (!Number.isInteger(raw.EventID) || raw.EventID < 0 || raw.EventID > 65535) throw new Error('invalid Windows EventID');
  assertBoundedString(raw.ProviderName, 'ProviderName', 256);
  assertBoundedString(raw.Computer, 'Computer', 256);
  assertObject(raw.Data, 'Data');

  const eventId = String(raw.EventID);
  const time = raw.TimeCreated || new Date().toISOString();
  let type: EventType = 'process_start';
  let severity: SeverityLevel = 'info';
  let entity = raw.Computer || 'Host-01';
  let mitreTactic = 'Execution';
  let mitreTechnique = 'T1059';

  switch (raw.EventID) {
    case 1: case 4688: type = 'process_start'; entity = `${raw.Data.NewProcessName || raw.Data.Image || 'process.exe'} [PID: ${raw.Data.ProcessId || 'N/A'}]`; severity = raw.Data.CommandLine?.includes('-enc') ? 'high' : 'info'; mitreTactic = 'Execution'; mitreTechnique = 'T1059.001'; break;
    case 3: case 5156: type = 'network_connect'; entity = `${raw.Data.Image || 'network'} -> ${raw.Data.DestinationIp || 'remote'}:${raw.Data.DestinationPort || '0'}`; severity = [4444, 1337, 8888, 6667, 9001].includes(Number(raw.Data.DestinationPort)) ? 'high' : 'low'; mitreTactic = 'Command and Control'; mitreTechnique = 'T1071'; break;
    case 11: type = 'file_modify'; entity = raw.Data.TargetFilename || 'C:\\Windows\\System32\\file.dll'; severity = entity.toLowerCase().includes('system32') ? 'high' : 'low'; mitreTactic = 'Persistence'; mitreTechnique = 'T1574'; break;
    case 7045: type = 'service_change'; entity = `Service: ${raw.Data.ServiceName || 'NewService'}`; severity = 'medium'; mitreTactic = 'Persistence'; mitreTechnique = 'T1543.003'; break;
    case 4625: type = 'auth_failure'; entity = `User: ${raw.Data.TargetUserName || 'Unknown'}`; severity = 'medium'; mitreTactic = 'Credential Access'; mitreTechnique = 'T1110'; break;
    case 4672: type = 'privilege_escalation'; entity = `Account: ${raw.Data.SubjectUserName || 'Administrator'}`; severity = 'high'; mitreTactic = 'Privilege Escalation'; mitreTechnique = 'T1134'; break;
    default: type = 'security_control_tamper'; severity = 'low'; entity = `Event_${eventId}`;
  }

  const normalized: NormalizedEvent = { event_id: `EV-${Date.now()}-${Math.floor(Math.random() * 10000)}`, timestamp: time, source: raw.ProviderName.includes('Sysmon') ? 'sysmon' : 'windows_eventlog', type, severity, entity, evidence: raw.Data, confidence: 0.98, mitre_tactic: mitreTactic, mitre_technique: mitreTechnique, raw_payload: raw };
  validateNormalizedEvent(normalized);
  return normalized;
}

/** Normalizes live PowerShell collector telemetry after strict validation. */
export function normalizePowerShellPayload(ps: RawPowerShellTelemetry): NormalizedEvent {
  validatePowerShellPayload(ps);
  const timestamp = ps.timestamp || new Date().toISOString();
  let type: EventType = 'process_start';
  let severity: SeverityLevel = 'info';
  let entity = 'System';
  let mitreTactic = 'Discovery';
  let mitreTechnique = 'T1082';

  if (ps.category === 'process') {
    type = 'process_start'; entity = `${ps.payload.Name || 'process'} [PID: ${ps.payload.Id || '0'}]`; severity = ps.payload.IsSigned === false ? 'medium' : 'info'; mitreTactic = 'Execution'; mitreTechnique = 'T1204';
  } else if (ps.category === 'service') {
    type = 'service_change'; entity = `Service ${ps.payload.Name || 'svc'} (${ps.payload.Status})`; severity = ps.payload.Name === 'WinDefend' && ps.payload.Status !== 'Running' ? 'critical' : 'low'; mitreTactic = 'Defense Evasion'; mitreTechnique = 'T1562.001';
  } else if (ps.category === 'net_conn') {
    type = 'network_connect'; entity = `${ps.payload.OwningProcess || 'pid'} -> ${ps.payload.RemoteAddress}:${ps.payload.RemotePort}`; severity = [4444, 1337, 8888, 6667, 9001].includes(Number(ps.payload.RemotePort)) ? 'high' : 'low'; mitreTactic = 'Command and Control'; mitreTechnique = 'T1071';
  } else if (ps.category === 'fim') {
    type = 'file_modify'; entity = ps.payload.Path || 'System File'; severity = ps.payload.IsModified ? 'high' : 'info'; mitreTactic = 'Persistence'; mitreTechnique = 'T1574';
  } else if (ps.category === 'auth') {
    type = 'auth_failure'; entity = `User: ${ps.payload.UserName || ps.payload.TargetUserName || 'Unknown'}`; severity = 'medium'; mitreTactic = 'Credential Access'; mitreTechnique = 'T1110';
  }

  const normalized: NormalizedEvent = { event_id: `EV-PS-${Date.now()}-${Math.floor(Math.random() * 1000)}`, timestamp, source: 'powershell_agent', type, severity, entity, evidence: ps.payload, confidence: 1.0, mitre_tactic: mitreTactic, mitre_technique: mitreTechnique, raw_payload: ps };
  validateNormalizedEvent(normalized);
  return normalized;
}
