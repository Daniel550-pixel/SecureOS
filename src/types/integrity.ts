/**
 * Digital Integrity & Trust Monitor Type Definitions
 * Normalized Event Schema, Telemetry, Baseline, Trust Engine & AI Analysis
 */

export type SeverityLevel = 'info' | 'low' | 'medium' | 'high' | 'critical';

export type EventSource = 
  | 'windows_eventlog' 
  | 'sysmon' 
  | 'powershell_agent' 
  | 'edr_sensor' 
  | 'fim_driver' 
  | 'network_flow'
  | 'auth_subsystem';

export type EventType =
  | 'process_start'
  | 'process_terminate'
  | 'service_change'
  | 'network_connect'
  | 'file_modify'
  | 'file_create'
  | 'registry_modify'
  | 'auth_failure'
  | 'auth_success'
  | 'privilege_escalation'
  | 'security_control_tamper';

export interface NormalizedEvent {
  event_id: string;
  timestamp: string;
  source: EventSource;
  type: EventType;
  severity: SeverityLevel;
  entity: string; // e.g., "powershell.exe [PID: 4892]", "WinDefend", "198.51.100.23:4444"
  evidence: Record<string, any>;
  confidence: number; // 0.0 to 1.0
  mitre_tactic?: string;
  mitre_technique?: string;
  raw_payload?: Record<string, any>;
}

export interface ProcessEntity {
  pid: number;
  name: string;
  path: string;
  command_line: string;
  hash_sha256: string;
  is_signed: boolean;
  signer?: string;
  parent_name: string;
  parent_pid: number;
  user: string;
  integrity_level: 'System' | 'High' | 'Medium' | 'Low';
  start_time: string;
}

export interface ServiceEntity {
  name: string;
  display_name: string;
  status: 'Running' | 'Stopped' | 'Paused';
  start_type: 'Automatic' | 'Manual' | 'Disabled';
  binary_path: string;
  is_security_critical: boolean;
  is_known_baseline: boolean;
}

export interface NetworkConnectionEntity {
  protocol: 'TCP' | 'UDP';
  local_ip: string;
  local_port: number;
  remote_ip: string;
  remote_port: number;
  state: 'ESTABLISHED' | 'LISTENING' | 'TIME_WAIT' | 'SYN_SENT';
  process_name: string;
  process_pid: number;
  is_unexpected: boolean;
  destination_reputation?: 'benign' | 'unknown' | 'suspicious' | 'malicious';
}

export interface FileIntegrityEntity {
  path: string;
  expected_hash: string;
  current_hash: string;
  is_modified: boolean;
  last_modified: string;
  is_system_critical: boolean;
}

export interface SystemState {
  host_id: string;
  hostname: string;
  os_version: string;
  snapshot_timestamp: string;
  processes: ProcessEntity[];
  services: ServiceEntity[];
  network_connections: NetworkConnectionEntity[];
  fim_files: FileIntegrityEntity[];
  recent_events: NormalizedEvent[];
}

export interface SystemBaseline {
  baseline_id: string;
  created_at: string;
  version: string;
  approved_processes: {
    name: string;
    path: string;
    expected_signer: string;
  }[];
  approved_services: {
    name: string;
    expected_status: 'Running' | 'Stopped';
    binary_path: string;
  }[];
  approved_listening_ports: number[];
  approved_file_hashes: Record<string, string>; // path -> SHA256
}

export type DeviationCategory = 
  | 'unsigned_process'
  | 'suspicious_parent_child'
  | 'unknown_service'
  | 'security_control_tamper'
  | 'modified_system_file'
  | 'unexpected_network'
  | 'privilege_escalation'
  | 'unauthorized_persistence';

export interface IntegrityDeviation {
  deviation_id: string;
  category: DeviationCategory;
  severity: SeverityLevel;
  title: string;
  description: string;
  entity: string;
  detected_at: string;
  evidence_summary: Record<string, any>;
  baseline_expected: string;
  observed_actual: string;
  deduction_weight: number; // base penalty point
}

export interface TrustDeduction {
  rule_id: string;
  category: DeviationCategory;
  title: string;
  entity: string;
  raw_penalty: number;
  confidence_multiplier: number;
  effective_deduction: number;
  reason: string;
  mitre_reference?: string;
}

export type RiskClassification = 'LOW' | 'ELEVATED' | 'HIGH' | 'CRITICAL';

export interface TrustScoreResult {
  baseline_score: number; // 100.0
  current_score: number; // e.g. 72.8
  risk_classification: RiskClassification;
  status_label: 'HEALTHY' | 'ELEVATED RISK' | 'HIGH RISK' | 'CRITICAL COMPROMISE';
  total_deductions: number;
  deviations_count: number;
  deduction_breakdown: TrustDeduction[];
  calculated_at: string;
  formula_version: string;
}

export interface AICorrelatedAttack {
  tactic: string;
  technique: string;
  description: string;
  involved_entities: string[];
  threat_likelihood: 'low' | 'moderate' | 'high' | 'critical';
}

export interface AIRecommendedAction {
  id: string;
  title: string;
  type: 'containment' | 'investigation' | 'remediation' | 'hardening';
  priority: 'urgent' | 'high' | 'medium' | 'low';
  command_snippet?: string;
  explanation: string;
}

export interface AIIntegrityAnalysis {
  assessment: 'healthy' | 'elevated_risk' | 'high_risk' | 'critical_compromise';
  summary_headline: string;
  detailed_explanation: string;
  confidence: number;
  correlated_chain: AICorrelatedAttack[];
  attack_narrative: string;
  recommended_actions: AIRecommendedAction[];
  generated_at: string;
  model_used: string;
}

export interface SecurityAlert {
  alert_id: string;
  timestamp: string;
  title: string;
  severity: SeverityLevel;
  trust_score_at_alert: number;
  deviations_summary: string[];
  status: 'active' | 'acknowledged' | 'remediated';
}

export interface ScenarioPreset {
  id: string;
  name: string;
  badge: string;
  description: string;
  expected_trust_score: number;
  expected_risk: RiskClassification;
  state: SystemState;
  events: NormalizedEvent[];
}
