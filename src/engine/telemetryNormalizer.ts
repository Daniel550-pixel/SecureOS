/**
 * Module 02 — Event Normalization Engine
 * Ingests heterogeneous telemetry from Windows Event Logs, Sysmon, EDR, and PowerShell
 * and transforms into the canonical NormalizedEvent schema.
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
  payload: Record<string, any>;
}

/**
 * Normalizes Windows Event Log entries (e.g. Security 4688, System 7045, Sysmon 1/3/11)
 */
export function normalizeWindowsEvent(raw: RawWindowsEvent): NormalizedEvent {
  const eventId = String(raw.EventID);
  const time = raw.TimeCreated || new Date().toISOString();
  let type: EventType = 'process_start';
  let severity: SeverityLevel = 'info';
  let entity = raw.Computer || 'Host-01';
  let mitreTactic = 'Execution';
  let mitreTechnique = 'T1059';

  switch (raw.EventID) {
    case 1: // Sysmon: Process Creation
    case 4688: // Security: Process Creation
      type = 'process_start';
      entity = `${raw.Data.NewProcessName || raw.Data.Image || 'process.exe'} [PID: ${raw.Data.ProcessId || 'N/A'}]`;
      severity = (raw.Data.CommandLine && raw.Data.CommandLine.includes('-enc')) ? 'high' : 'info';
      mitreTactic = 'Execution';
      mitreTechnique = 'T1059.001';
      break;

    case 3: // Sysmon: Network Connection
    case 5156: // Windows Filtering Platform Connection
      type = 'network_connect';
      entity = `${raw.Data.Image || 'network'} -> ${raw.Data.DestinationIp || 'remote'}:${raw.Data.DestinationPort || '0'}`;
      severity = [4444, 1337, 8888].includes(Number(raw.Data.DestinationPort)) ? 'high' : 'low';
      mitreTactic = 'Command and Control';
      mitreTechnique = 'T1071';
      break;

    case 11: // Sysmon: File Created / Modified
      type = 'file_modify';
      entity = raw.Data.TargetFilename || 'C:\\Windows\\System32\\file.dll';
      severity = entity.toLowerCase().includes('system32') ? 'high' : 'low';
      mitreTactic = 'Persistence';
      mitreTechnique = 'T1574';
      break;

    case 7045: // System: Service Installed
      type = 'service_change';
      entity = `Service: ${raw.Data.ServiceName || 'NewService'}`;
      severity = 'medium';
      mitreTactic = 'Persistence';
      mitreTechnique = 'T1543.003';
      break;

    case 4625: // Security: Failed Logon
      type = 'auth_failure';
      entity = `User: ${raw.Data.TargetUserName || 'Unknown'}`;
      severity = 'medium';
      mitreTactic = 'Credential Access';
      mitreTechnique = 'T1110';
      break;

    case 4672: // Security: Special Privileges Assigned
      type = 'privilege_escalation';
      entity = `Account: ${raw.Data.SubjectUserName || 'Administrator'}`;
      severity = 'high';
      mitreTactic = 'Privilege Escalation';
      mitreTechnique = 'T1134';
      break;

    default:
      type = 'security_control_tamper';
      severity = 'low';
      entity = `Event_${raw.EventID}`;
      break;
  }

  return {
    event_id: `EV-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
    timestamp: time,
    source: raw.ProviderName.includes('Sysmon') ? 'sysmon' : 'windows_eventlog',
    type,
    severity,
    entity,
    evidence: raw.Data,
    confidence: 0.98,
    mitre_tactic: mitreTactic,
    mitre_technique: mitreTechnique,
    raw_payload: raw
  };
}

/**
 * Normalizes live payload sent by PowerShell collector agent
 */
export function normalizePowerShellPayload(ps: RawPowerShellTelemetry): NormalizedEvent {
  const timestamp = ps.timestamp || new Date().toISOString();
  let type: EventType = 'process_start';
  let severity: SeverityLevel = 'info';
  let entity = 'System';
  let mitreTactic = 'Discovery';
  let mitreTechnique = 'T1082';

  if (ps.category === 'process') {
    type = 'process_start';
    entity = `${ps.payload.Name || 'process'} [PID: ${ps.payload.Id || '0'}]`;
    severity = ps.payload.IsSigned === false ? 'medium' : 'info';
    mitreTactic = 'Execution';
    mitreTechnique = 'T1204';
  } else if (ps.category === 'service') {
    type = 'service_change';
    entity = `Service ${ps.payload.Name || 'svc'} (${ps.payload.Status})`;
    severity = (ps.payload.Name === 'WinDefend' && ps.payload.Status !== 'Running') ? 'critical' : 'low';
    mitreTactic = 'Defense Evasion';
    mitreTechnique = 'T1562.001';
  } else if (ps.category === 'net_conn') {
    type = 'network_connect';
    entity = `${ps.payload.OwningProcess || 'pid'} -> ${ps.payload.RemoteAddress}:${ps.payload.RemotePort}`;
    severity = 'low';
    mitreTactic = 'Command and Control';
    mitreTechnique = 'T1071';
  } else if (ps.category === 'fim') {
    type = 'file_modify';
    entity = ps.payload.Path || 'System File';
    severity = ps.payload.IsModified ? 'high' : 'info';
    mitreTactic = 'Persistence';
    mitreTechnique = 'T1574';
  }

  return {
    event_id: `EV-PS-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    timestamp,
    source: 'powershell_agent',
    type,
    severity,
    entity,
    evidence: ps.payload,
    confidence: 1.0,
    mitre_tactic: mitreTactic,
    mitre_technique: mitreTechnique,
    raw_payload: ps
  };
}
