import React, { useState } from 'react';
import { Terminal, Copy, Check, Download, ExternalLink, ShieldCheck, X } from 'lucide-react';

interface PowerShellAgentModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PowerShellAgentModal: React.FC<PowerShellAgentModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const scriptSnippet = `# ==============================================================================
# UAE AIOS DIGITAL INTEGRITY MONITOR — POWERSHELL TELEMETRY AGENT v2.4
# Streams live process, service, and FIM hash telemetry to the AIOS Core
# ==============================================================================

[Net.ServicePointManager]::SecurityProtocol = [Net.SecurityProtocolType]::Tls12
$IngestUrl = "$([System.Environment]::GetEnvironmentVariable('AIOS_CORE_URL') ?? (Get-Location).Path)/api/telemetry/ingest"

Write-Host "[+] AIOS Integrity Agent started for host: $env:COMPUTERNAME" -ForegroundColor Cyan

# 1. Audit Running Processes
Get-Process | ForEach-Object {
    $path = ""; $signed = $false
    try { $path = $_.Path } catch {}
    if ($path -and (Test-Path $path)) {
        $sig = Get-AuthenticodeSignature -FilePath $path -ErrorAction SilentlyContinue
        $signed = ($sig.Status -eq 'Valid')
    }
    $body = @{
        collector = "powershell_agent"
        category  = "process"
        payload   = @{ Id = $_.Id; Name = $_.ProcessName; Path = $path; IsSigned = $signed }
    } | ConvertTo-Json
    Invoke-RestMethod -Uri $IngestUrl -Method Post -Body $body -ContentType "application/json"
}

# 2. Audit Security Services (WinDefend, EventLog, CryptSvc)
@('WinDefend', 'EventLog', 'CryptSvc', 'MpsSvc') | ForEach-Object {
    $svc = Get-Service -Name $_ -ErrorAction SilentlyContinue
    if ($svc) {
        $body = @{
            collector = "powershell_agent"
            category  = "service"
            payload   = @{ Name = $svc.Name; Status = $svc.Status.ToString() }
        } | ConvertTo-Json
        Invoke-RestMethod -Uri $IngestUrl -Method Post -Body $body -ContentType "application/json"
    }
}
`;

  const handleCopy = () => {
    navigator.clipboard.writeText(scriptSnippet);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 font-mono">
                PowerShell Telemetry Collection Agent (Module 01)
              </h3>
              <p className="text-xs text-slate-400">
                Deployable script for live Windows host telemetry collection into the AIOS Core API.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copied ? 'Copied Script' : 'Copy Script'}</span>
            </button>
            <a
              href="/api/powershell-agent/script"
              download="AIOS-Integrity-Agent.ps1"
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-mono rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white transition-colors"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download .ps1</span>
            </a>
            <button
              onClick={onClose}
              className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-4 font-mono text-xs">
          <div className="p-3.5 rounded-xl bg-cyan-950/30 border border-cyan-800/40 text-cyan-300">
            <p className="font-bold mb-1">Target GitHub Architecture Flow:</p>
            <p className="text-[11px] text-slate-300">
              PowerShell Agent (Host) → REST API (<code className="text-cyan-200">/api/telemetry/ingest</code>) → Event Normalizer → Deterministic Trust Engine → Gemini Security Reasoning → Real-Time SOC Dashboard & Telegram Alerts
            </p>
          </div>

          <div>
            <span className="text-slate-400 text-[11px] block mb-1">
              # PowerShell Agent Source Code (AIOS-Integrity-Agent.ps1)
            </span>
            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-slate-200 overflow-x-auto leading-relaxed text-[11px]">
              {scriptSnippet}
            </pre>
          </div>
        </div>

      </div>
    </div>
  );
};
