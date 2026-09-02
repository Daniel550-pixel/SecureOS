/**
 * Module 04 — Deterministic Trust Engine
 * Calculates mathematical Trust Score (0.0 - 100.0) based on deterministic integrity rules.
 * GEMINI AI DOES NOT GENERATE THIS SCORE; THE DETERMINISTIC SECURITY CORE OWNS IT.
 */

import { IntegrityDeviation, TrustDeduction, TrustScoreResult, RiskClassification } from '../types/integrity';

export const TRUST_FORMULA_VERSION = 'v2.4.0-DETERMINISTIC';

// Base Rule Book definitions
interface RuleMetadata {
  rule_id: string;
  name: string;
  base_penalty: number;
  mitre_ref: string;
}

const RULE_BOOK: Record<string, RuleMetadata> = {
  unsigned_process: {
    rule_id: 'R-PROC-001',
    name: 'Unsigned Executable in Memory',
    base_penalty: 4.5,
    mitre_ref: 'T1036 (Masquerading) / T1204 (User Execution)'
  },
  suspicious_parent_child: {
    rule_id: 'R-PROC-002',
    name: 'Abnormal Parent-Child Process Spawn',
    base_penalty: 8.5,
    mitre_ref: 'T1059 (Command & Scripting Interpreter)'
  },
  unknown_service: {
    rule_id: 'R-SVC-001',
    name: 'Uncatalogued Background Service',
    base_penalty: 4.0,
    mitre_ref: 'T1543.003 (Create or Modify System Process: Windows Service)'
  },
  security_control_tamper: {
    rule_id: 'R-SEC-001',
    name: 'Security Subsystem or EDR Disabled',
    base_penalty: 14.0,
    mitre_ref: 'T1562.001 (Impair Defenses: Disable or Modify Tools)'
  },
  modified_system_file: {
    rule_id: 'R-FIM-001',
    name: 'System File Integrity / Driver Alteration',
    base_penalty: 9.0,
    mitre_ref: 'T1005 (Data from Local System) / T1574 (Hijack Execution Flow)'
  },
  unexpected_network: {
    rule_id: 'R-NET-001',
    name: 'Anomalous External Network Connection',
    base_penalty: 4.0,
    mitre_ref: 'T1071 (Application Layer Protocol: C2)'
  },
  privilege_escalation: {
    rule_id: 'R-AUTH-001',
    name: 'Unverified Token Privilege Elevation',
    base_penalty: 6.5,
    mitre_ref: 'T1134 (Access Token Manipulation)'
  },
  unauthorized_persistence: {
    rule_id: 'R-PERS-001',
    name: 'Registry RunKey / Scheduled Task Persistence',
    base_penalty: 7.0,
    mitre_ref: 'T1547 (Boot or Logon Autostart Execution)'
  }
};

/**
 * Calculates the deterministic trust score.
 * Starts at 100.0 and applies mathematically audited deductions.
 */
export function calculateTrustScore(deviations: IntegrityDeviation[]): TrustScoreResult {
  const BASELINE_SCORE = 100.0;
  let totalDeductions = 0;
  const deductionBreakdown: TrustDeduction[] = [];

  for (const dev of deviations) {
    const rule = RULE_BOOK[dev.category] || {
      rule_id: 'R-GEN-999',
      name: 'Generic Anomaly',
      base_penalty: dev.deduction_weight || 3.0,
      mitre_ref: 'Unknown'
    };

    // Severity multiplier
    let severityMultiplier = 1.0;
    if (dev.severity === 'critical') severityMultiplier = 1.5;
    else if (dev.severity === 'high') severityMultiplier = 1.25;
    else if (dev.severity === 'medium') severityMultiplier = 1.0;
    else if (dev.severity === 'low') severityMultiplier = 0.6;
    else if (dev.severity === 'info') severityMultiplier = 0.2;

    const rawPenalty = dev.deduction_weight || rule.base_penalty;
    const effectiveDeduction = Number((rawPenalty * severityMultiplier).toFixed(2));
    totalDeductions += effectiveDeduction;

    deductionBreakdown.push({
      rule_id: rule.rule_id,
      category: dev.category,
      title: dev.title,
      entity: dev.entity,
      raw_penalty: rawPenalty,
      confidence_multiplier: severityMultiplier,
      effective_deduction: effectiveDeduction,
      reason: dev.description,
      mitre_reference: rule.mitre_ref
    });
  }

  // Calculate final score bounded between 0.0 and 100.0
  const calculatedScore = Math.max(0, Math.min(100, BASELINE_SCORE - totalDeductions));
  const currentScore = Number(calculatedScore.toFixed(1));

  // Risk Classification brackets
  let riskClassification: RiskClassification = 'LOW';
  let statusLabel: 'HEALTHY' | 'ELEVATED RISK' | 'HIGH RISK' | 'CRITICAL COMPROMISE' = 'HEALTHY';

  if (currentScore >= 90.0) {
    riskClassification = 'LOW';
    statusLabel = 'HEALTHY';
  } else if (currentScore >= 75.0) {
    riskClassification = 'ELEVATED';
    statusLabel = 'ELEVATED RISK';
  } else if (currentScore >= 50.0) {
    riskClassification = 'HIGH';
    statusLabel = 'HIGH RISK';
  } else {
    riskClassification = 'CRITICAL';
    statusLabel = 'CRITICAL COMPROMISE';
  }

  return {
    baseline_score: BASELINE_SCORE,
    current_score: currentScore,
    risk_classification: riskClassification,
    status_label: statusLabel,
    total_deductions: Number(totalDeductions.toFixed(1)),
    deviations_count: deviations.length,
    deduction_breakdown: deductionBreakdown,
    calculated_at: new Date().toISOString(),
    formula_version: TRUST_FORMULA_VERSION
  };
}
