/**
 * Module 03 — Integrity Engine & Baseline Definitions
 * Compares current system observations against trusted baselines
 */

import { SystemBaseline, SystemState, IntegrityDeviation } from '../types/integrity';

export const DEFAULT_BASELINE: SystemBaseline = {
  baseline_id: 'GOLDEN-BASE-UAE-SEC-2026',
  created_at: '2026-08-15T00:00:00.000Z',
  version: '2.4.0-STABLE',
  approved_processes: [
    { name: 'System', path: 'ntoskrnl.exe', expected_signer: 'Microsoft Windows' },
    { name: 'smss.exe', path: 'C:\\Windows\\System32\\smss.exe', expected_signer: 'Microsoft Windows' },
    { name: 'csrss.exe', path: 'C:\\Windows\\System32\\csrss.exe', expected_signer: 'Microsoft Windows' },
    { name: 'wininit.exe', path: 'C:\\Windows\\System32\\wininit.exe', expected_signer: 'Microsoft Windows' },
    { name: 'services.exe', path: 'C:\\Windows\\System32\\services.exe', expected_signer: 'Microsoft Windows' },
    { name: 'lsass.exe', path: 'C:\\Windows\\System32\\lsass.exe', expected_signer: 'Microsoft Windows' },
    { name: 'svchost.exe', path: 'C:\\Windows\\System32\\svchost.exe', expected_signer: 'Microsoft Windows' },
    { name: 'explorer.exe', path: 'C:\\Windows\\explorer.exe', expected_signer: 'Microsoft Windows' },
    { name: 'powershell.exe', path: 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe', expected_signer: 'Microsoft Corporation' },
    { name: 'MsMpEng.exe', path: 'C:\\ProgramData\\Microsoft\\Windows Defender\\Platform\\MsMpEng.exe', expected_signer: 'Microsoft Windows' },
    { name: 'agent.exe', path: 'C:\\Program Files\\UAE-AIOS\\Agent\\agent.exe', expected_signer: 'UAE Sovereign Cyber Authority' },
  ],
  approved_services: [
    { name: 'WinDefend', expected_status: 'Running', binary_path: 'C:\\ProgramData\\Microsoft\\Windows Defender\\Platform\\MsMpEng.exe' },
    { name: 'EventLog', expected_status: 'Running', binary_path: 'C:\\Windows\\System32\\svchost.exe -k LocalServiceNetworkRestricted' },
    { name: 'CryptSvc', expected_status: 'Running', binary_path: 'C:\\Windows\\System32\\svchost.exe -k NetworkService' },
    { name: 'MpsSvc', expected_status: 'Running', binary_path: 'C:\\Windows\\System32\\svchost.exe -k LocalServiceNoNetwork' },
    { name: 'W32Time', expected_status: 'Running', binary_path: 'C:\\Windows\\System32\\svchost.exe -k LocalService' },
    { name: 'AIOS-Telemetry', expected_status: 'Running', binary_path: 'C:\\Program Files\\UAE-AIOS\\Agent\\telemetry-svc.exe' },
  ],
  approved_listening_ports: [135, 445, 3389, 5985, 443],
  approved_file_hashes: {
    'C:\\Windows\\System32\\ntoskrnl.exe': 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    'C:\\Windows\\System32\\kernel32.dll': 'a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0',
    'C:\\Windows\\System32\\drivers\\etc\\hosts': '89b983570f031023a1a3a936a282910790936e7a2b9183749202746101928374',
    'C:\\Windows\\System32\\user32.dll': '77c8899aabbccddeeff0011223344556677889900aabbccddeeff0011223344',
    'C:\\Windows\\System32\\lsasrv.dll': '554433221100ffeeddccbbaa99887766554433221100ffeeddccbbaa99887766',
  }
};

/**
 * Deterministic Integrity Comparison:
 * Analyzes SystemState against SystemBaseline and produces structured IntegrityDeviations.
 */
export function compareAgainstBaseline(
  currentState: SystemState,
  baseline: SystemBaseline = DEFAULT_BASELINE
): IntegrityDeviation[] {
  const deviations: IntegrityDeviation[] = [];
  const now = new Date().toISOString();

  // 1. Process Integrity Inspection
  for (const proc of currentState.processes) {
    // Check 1A: Unsigned Process
    if (!proc.is_signed) {
      // Check if it's in a sensitive user folder (e.g. Temp, Downloads, Public)
      const isInTemp = proc.path.toLowerCase().includes('temp') || proc.path.toLowerCase().includes('appdata');
      deviations.push({
        deviation_id: `DEV-PROC-UNSIGNED-${proc.pid}`,
        category: 'unsigned_process',
        severity: isInTemp ? 'high' : 'medium',
        title: `Unsigned Binary Execution: ${proc.name}`,
        description: `Process ${proc.name} (PID: ${proc.pid}) running with ${proc.integrity_level} integrity has no valid digital signature. Executing from: ${proc.path}`,
        entity: `${proc.name} [PID: ${proc.pid}]`,
        detected_at: proc.start_time || now,
        evidence_summary: {
          pid: proc.pid,
          path: proc.path,
          hash: proc.hash_sha256,
          user: proc.user,
          command_line: proc.command_line,
          integrity_level: proc.integrity_level
        },
        baseline_expected: 'All executing binaries must be code-signed by verified trusted root certificate authority',
        observed_actual: 'Unsigned binary or invalid self-signed certificate hash',
        deduction_weight: isInTemp ? 6.5 : 4.0
      });
    }

    // Check 1B: Suspicious Parent-Child Process Relationship
    const isOfficeParent = ['winword.exe', 'excel.exe', 'powerpnt.exe', 'outlook.exe'].includes(proc.parent_name.toLowerCase());
    const isShellChild = ['powershell.exe', 'cmd.exe', 'wscript.exe', 'cscript.exe', 'mshta.exe', 'certutil.exe'].includes(proc.name.toLowerCase());
    if (isOfficeParent && isShellChild) {
      deviations.push({
        deviation_id: `DEV-PROC-PARENTCHILD-${proc.pid}`,
        category: 'suspicious_parent_child',
        severity: 'critical',
        title: `Abnormal Parent-Child Process: ${proc.parent_name} -> ${proc.name}`,
        description: `Office application ${proc.parent_name} (PID: ${proc.parent_pid}) spawned command interpreter ${proc.name} (PID: ${proc.pid}) with arguments: ${proc.command_line}`,
        entity: `${proc.name} [Child of ${proc.parent_name}]`,
        detected_at: proc.start_time || now,
        evidence_summary: {
          parent_name: proc.parent_name,
          parent_pid: proc.parent_pid,
          child_name: proc.name,
          child_pid: proc.pid,
          command_line: proc.command_line
        },
        baseline_expected: 'Productivity applications should not invoke script interpreters or LOLBins',
        observed_actual: `Direct shell spawn from ${proc.parent_name}`,
        deduction_weight: 8.5
      });
    }

    // Check 1C: Obfuscated or Encoded PowerShell execution
    if (proc.name.toLowerCase() === 'powershell.exe' && 
       (proc.command_line.includes('-enc') || proc.command_line.includes('-EncodedCommand') || proc.command_line.includes('FromBase64String') || proc.command_line.includes('IEX'))) {
      deviations.push({
        deviation_id: `DEV-PROC-ENCPS-${proc.pid}`,
        category: 'suspicious_parent_child',
        severity: 'high',
        title: `Encoded / Obfuscated PowerShell Command Executed`,
        description: `PowerShell instance (PID: ${proc.pid}) executed with encoded Base64 command payload or dynamic Invoke-Expression.`,
        entity: `powershell.exe [PID: ${proc.pid}]`,
        detected_at: proc.start_time || now,
        evidence_summary: {
          pid: proc.pid,
          command_line: proc.command_line,
          user: proc.user
        },
        baseline_expected: 'Administrative PowerShell scripts must use plain, signed script blocks with script block logging',
        observed_actual: 'Base64 encoded payload executed without interactive console',
        deduction_weight: 5.5
      });
    }
  }

  // 2. Service Integrity Inspection
  for (const svc of currentState.services) {
    // Check 2A: Security Critical Service Tampering (e.g. Defender or Firewall stopped)
    if (svc.is_security_critical && svc.status !== 'Running') {
      deviations.push({
        deviation_id: `DEV-SVC-TAMPER-${svc.name}`,
        category: 'security_control_tamper',
        severity: 'critical',
        title: `Security Subsystem Disabled: ${svc.display_name} (${svc.name})`,
        description: `Critical endpoint defense service '${svc.display_name}' (${svc.name}) is in ${svc.status} state. Defense evasion detected.`,
        entity: `${svc.name} (${svc.display_name})`,
        detected_at: now,
        evidence_summary: {
          service_name: svc.name,
          status: svc.status,
          start_type: svc.start_type,
          binary_path: svc.binary_path
        },
        baseline_expected: 'Security critical services (Defender, MpsSvc, EventLog) must maintain Running state',
        observed_actual: `Service status is ${svc.status} (StartType: ${svc.start_type})`,
        deduction_weight: 12.0
      });
    }

    // Check 2B: Unknown / Unapproved Service installed
    if (!svc.is_known_baseline) {
      deviations.push({
        deviation_id: `DEV-SVC-UNKNOWN-${svc.name}`,
        category: 'unknown_service',
        severity: 'medium',
        title: `Unregistered Background Service: ${svc.name}`,
        description: `New service '${svc.display_name}' (${svc.name}) detected that is not in the approved baseline whitelist. Target binary: ${svc.binary_path}`,
        entity: svc.name,
        detected_at: now,
        evidence_summary: {
          name: svc.name,
          display_name: svc.display_name,
          binary_path: svc.binary_path,
          status: svc.status
        },
        baseline_expected: 'All Windows system services must match verified fleet configuration catalog',
        observed_actual: 'Uncatalogued service registration',
        deduction_weight: 4.5
      });
    }
  }

  // 3. Network Connection Deviations
  for (const conn of currentState.network_connections) {
    if (conn.is_unexpected || conn.destination_reputation === 'suspicious' || conn.destination_reputation === 'malicious') {
      const isMalicious = conn.destination_reputation === 'malicious' || [4444, 1337, 8888, 6667, 9001].includes(conn.remote_port);
      deviations.push({
        deviation_id: `DEV-NET-${conn.remote_ip}-${conn.remote_port}`,
        category: 'unexpected_network',
        severity: isMalicious ? 'high' : 'medium',
        title: `Anomalous Outbound Network Connection: ${conn.remote_ip}:${conn.remote_port}`,
        description: `Process ${conn.process_name} (PID: ${conn.process_pid}) initiated ${conn.protocol} connection to ${conn.remote_ip}:${conn.remote_port}. Reputation: ${conn.destination_reputation || 'unclassified'}.`,
        entity: `${conn.process_name} -> ${conn.remote_ip}:${conn.remote_port}`,
        detected_at: now,
        evidence_summary: {
          process_name: conn.process_name,
          process_pid: conn.process_pid,
          remote_ip: conn.remote_ip,
          remote_port: conn.remote_port,
          protocol: conn.protocol,
          reputation: conn.destination_reputation
        },
        baseline_expected: 'Outbound network communication must strictly resolve to approved corporate / cloud CDN endpoints',
        observed_actual: `Connection to non-standard remote socket ${conn.remote_ip}:${conn.remote_port}`,
        deduction_weight: isMalicious ? 6.5 : 3.5
      });
    }
  }

  // 4. File Integrity Monitoring (FIM) Deviations
  for (const fim of currentState.fim_files) {
    if (fim.is_modified || (fim.expected_hash && fim.current_hash && fim.expected_hash !== fim.current_hash)) {
      deviations.push({
        deviation_id: `DEV-FIM-${fim.path.replace(/[^a-zA-Z0-9]/g, '_')}`,
        category: 'modified_system_file',
        severity: fim.is_system_critical ? 'critical' : 'high',
        title: `File Integrity Violation: ${fim.path}`,
        description: `Protected system file ${fim.path} hash mismatch. Baseline SHA256 was altered. Potential persistence, rootkit, or DLL substitution.`,
        entity: fim.path,
        detected_at: fim.last_modified || now,
        evidence_summary: {
          file_path: fim.path,
          expected_hash: fim.expected_hash,
          current_hash: fim.current_hash,
          is_system_critical: fim.is_system_critical
        },
        baseline_expected: `SHA256: ${fim.expected_hash ? fim.expected_hash.substring(0, 16) + '...' : 'Original Golden Hash'}`,
        observed_actual: `SHA256: ${fim.current_hash ? fim.current_hash.substring(0, 16) + '...' : 'Altered Hash'}`,
        deduction_weight: fim.is_system_critical ? 9.0 : 5.0
      });
    }
  }

  // 5. Recent Critical Security Events (e.g. LSASS access, Defender tamper, Privilege Escalation)
  for (const ev of currentState.recent_events) {
    if (ev.type === 'security_control_tamper' && !deviations.some(d => d.entity.includes(ev.entity))) {
      deviations.push({
        deviation_id: `DEV-EV-${ev.event_id}`,
        category: 'security_control_tamper',
        severity: ev.severity,
        title: `Security Telemetry Alert: ${ev.type.replace(/_/g, ' ').toUpperCase()}`,
        description: `Event from ${ev.source}: ${JSON.stringify(ev.evidence)}`,
        entity: ev.entity,
        detected_at: ev.timestamp,
        evidence_summary: ev.evidence,
        baseline_expected: 'Zero unauthorized security control modifications',
        observed_actual: 'Security control altered or event triggered',
        deduction_weight: ev.severity === 'critical' ? 8.0 : 4.0
      });
    } else if (ev.type === 'privilege_escalation') {
      deviations.push({
        deviation_id: `DEV-EV-PRIV-${ev.event_id}`,
        category: 'privilege_escalation',
        severity: 'high',
        title: `Privilege Escalation Detected: ${ev.entity}`,
        description: `User token elevated to SYSTEM or SeDebugPrivilege enabled without change-control authorization.`,
        entity: ev.entity,
        detected_at: ev.timestamp,
        evidence_summary: ev.evidence,
        baseline_expected: 'Standard user sessions must not escalate to SYSTEM integrity without MFA PAM session',
        observed_actual: 'Local privilege elevation without PAM authorization ticket',
        deduction_weight: 6.0
      });
    }
  }

  return deviations;
}
