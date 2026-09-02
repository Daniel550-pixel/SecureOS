import React, { useState } from 'react';
import { GitCompare, CheckCircle2, XCircle, AlertTriangle, ShieldCheck, ShieldAlert, FileCode, Network, Server, Cpu } from 'lucide-react';
import { SystemState, SystemBaseline, IntegrityDeviation } from '../types/integrity';

interface IntegrityDiffMatrixProps {
  state: SystemState;
  baseline: SystemBaseline;
  deviations: IntegrityDeviation[];
  onRemediateEntity: (actionType: string, targetEntity: string) => void;
}

export const IntegrityDiffMatrix: React.FC<IntegrityDiffMatrixProps> = ({
  state,
  baseline,
  deviations,
  onRemediateEntity
}) => {
  const [subTab, setSubTab] = useState<'deviations' | 'processes' | 'services' | 'network' | 'fim'>('deviations');

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800 mb-5">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-400">
              <GitCompare className="w-4 h-4" />
            </span>
            <h2 className="text-xs font-mono font-bold tracking-widest text-slate-300 uppercase">
              Module 03 • Integrity Engine — Baseline vs Live State Matrix
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-0.5">
            Answering: <strong className="text-slate-200">What changed?</strong> Deterministic diff against Golden Baseline <span className="font-mono text-cyan-400">[{baseline.baseline_id}]</span>
          </p>
        </div>

        {/* Sub-tab Switcher */}
        <div className="flex items-center bg-slate-950 p-1 rounded-lg border border-slate-800 flex-wrap gap-1">
          <button
            onClick={() => setSubTab('deviations')}
            className={`px-3 py-1 text-xs font-mono rounded-md transition-colors ${
              subTab === 'deviations' ? 'bg-slate-800 text-cyan-300 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Deviations ({deviations.length})
          </button>
          <button
            onClick={() => setSubTab('processes')}
            className={`px-3 py-1 text-xs font-mono rounded-md transition-colors ${
              subTab === 'processes' ? 'bg-slate-800 text-cyan-300 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Processes ({state.processes.length})
          </button>
          <button
            onClick={() => setSubTab('services')}
            className={`px-3 py-1 text-xs font-mono rounded-md transition-colors ${
              subTab === 'services' ? 'bg-slate-800 text-cyan-300 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Services ({state.services.length})
          </button>
          <button
            onClick={() => setSubTab('network')}
            className={`px-3 py-1 text-xs font-mono rounded-md transition-colors ${
              subTab === 'network' ? 'bg-slate-800 text-cyan-300 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Sockets ({state.network_connections.length})
          </button>
          <button
            onClick={() => setSubTab('fim')}
            className={`px-3 py-1 text-xs font-mono rounded-md transition-colors ${
              subTab === 'fim' ? 'bg-slate-800 text-cyan-300 font-bold' : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            FIM ({state.fim_files.length})
          </button>
        </div>
      </div>

      {/* 1. Classified Deviations Tab */}
      {subTab === 'deviations' && (
        <div className="space-y-3">
          {deviations.length === 0 ? (
            <div className="p-8 text-center bg-slate-950/60 rounded-xl border border-emerald-900/30">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <p className="text-sm font-semibold text-emerald-300">
                Host is in 100% Alignment with Trusted Baseline Catalog
              </p>
              <p className="text-xs text-slate-400 font-mono mt-1">
                Zero unsigned binaries, unregistered services, or modified system files detected.
              </p>
            </div>
          ) : (
            deviations.map((dev) => (
              <div
                key={dev.deviation_id}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 hover:border-slate-700 transition-colors"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2.5">
                  <div className="flex items-center gap-2">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                      dev.severity === 'critical'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : dev.severity === 'high'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                    }`}>
                      {dev.severity}
                    </span>
                    <span className="text-xs font-mono text-cyan-400 font-bold">{dev.deviation_id}</span>
                    <span className="text-slate-600">•</span>
                    <span className="text-xs font-semibold text-slate-200">{dev.title}</span>
                  </div>

                  <span className="text-xs font-mono text-rose-400 font-bold bg-rose-950/40 px-2 py-0.5 rounded border border-rose-900/40">
                    Penalty: -{dev.deduction_weight} pts
                  </span>
                </div>

                <p className="text-xs text-slate-300 mb-3">
                  {dev.description}
                </p>

                {/* Diff Comparison Box */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs font-mono p-3 rounded-lg bg-slate-900/90 border border-slate-800">
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase text-emerald-400 font-bold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" /> Baseline Expected:
                    </span>
                    <p className="text-slate-300 text-[11px]">{dev.baseline_expected}</p>
                  </div>
                  <div className="space-y-1">
                    <span className="text-[10px] uppercase text-rose-400 font-bold flex items-center gap-1">
                      <XCircle className="w-3 h-3" /> Observed Actual:
                    </span>
                    <p className="text-slate-300 text-[11px]">{dev.observed_actual}</p>
                  </div>
                </div>

                {/* Remediation Shortcut */}
                <div className="mt-3 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-mono text-[11px]">Entity: {dev.entity}</span>
                  <button
                    onClick={() => {
                      if (dev.category === 'unsigned_process' || dev.category === 'suspicious_parent_child') {
                        onRemediateEntity('kill_process', dev.entity);
                      } else if (dev.category === 'security_control_tamper') {
                        onRemediateEntity('restart_service', 'WinDefend');
                      } else if (dev.category === 'modified_system_file') {
                        onRemediateEntity('restore_file', dev.entity);
                      } else if (dev.category === 'unexpected_network') {
                        onRemediateEntity('block_network', dev.entity);
                      }
                    }}
                    className="px-2.5 py-1 text-[11px] font-mono rounded bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition-colors"
                  >
                    Quick Remediate
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* 2. Processes Tab */}
      {subTab === 'processes' && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] font-mono text-slate-400 uppercase bg-slate-950 border-b border-slate-800">
              <tr>
                <th className="p-3">PID</th>
                <th className="p-3">Process Name</th>
                <th className="p-3">Integrity</th>
                <th className="p-3">Signature Status</th>
                <th className="p-3">Parent Process</th>
                <th className="p-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-mono">
              {state.processes.map((proc) => (
                <tr key={proc.pid} className="hover:bg-slate-950/40">
                  <td className="p-3 text-cyan-400">{proc.pid}</td>
                  <td className="p-3 font-semibold text-slate-200">
                    {proc.name}
                    <div className="text-[10px] text-slate-500 font-normal truncate max-w-xs">{proc.path}</div>
                  </td>
                  <td className="p-3 text-slate-300">{proc.integrity_level}</td>
                  <td className="p-3">
                    {proc.is_signed ? (
                      <span className="inline-flex items-center gap-1 text-emerald-400 text-[11px]">
                        <ShieldCheck className="w-3.5 h-3.5" /> Valid ({proc.signer})
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-rose-400 text-[11px] bg-rose-950/30 px-2 py-0.5 rounded border border-rose-900/40">
                        <ShieldAlert className="w-3.5 h-3.5" /> Unsigned / Invalid
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-slate-400">{proc.parent_name || 'SystemRoot'}</td>
                  <td className="p-3">
                    {!proc.is_signed && (
                      <button
                        onClick={() => onRemediateEntity('kill_process', proc.name)}
                        className="text-[10px] text-rose-400 hover:text-rose-300 underline"
                      >
                        Kill Process
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 3. Services Tab */}
      {subTab === 'services' && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] font-mono text-slate-400 uppercase bg-slate-950 border-b border-slate-800">
              <tr>
                <th className="p-3">Service Name</th>
                <th className="p-3">Display Name</th>
                <th className="p-3">Status</th>
                <th className="p-3">Baseline Classification</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-mono">
              {state.services.map((svc) => (
                <tr key={svc.name} className="hover:bg-slate-950/40">
                  <td className="p-3 font-semibold text-slate-200">{svc.name}</td>
                  <td className="p-3 text-slate-300">{svc.display_name}</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[11px] ${
                      svc.status === 'Running'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/10 text-rose-400 border border-rose-500/30'
                    }`}>
                      {svc.status}
                    </span>
                  </td>
                  <td className="p-3">
                    {svc.is_known_baseline ? (
                      <span className="text-slate-400 text-[11px]">Approved Golden Catalog</span>
                    ) : (
                      <span className="text-amber-400 text-[11px] font-bold">Uncatalogued / Unknown</span>
                    )}
                  </td>
                  <td className="p-3">
                    {svc.status !== 'Running' && svc.is_security_critical && (
                      <button
                        onClick={() => onRemediateEntity('restart_service', svc.name)}
                        className="text-[10px] text-cyan-400 hover:text-cyan-300 underline"
                      >
                        Restart Service
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 4. Network Connections Tab */}
      {subTab === 'network' && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] font-mono text-slate-400 uppercase bg-slate-950 border-b border-slate-800">
              <tr>
                <th className="p-3">Protocol</th>
                <th className="p-3">Local Endpoint</th>
                <th className="p-3">Remote Endpoint</th>
                <th className="p-3">Owning Process</th>
                <th className="p-3">Reputation</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-mono">
              {state.network_connections.map((conn, idx) => (
                <tr key={idx} className="hover:bg-slate-950/40">
                  <td className="p-3 text-cyan-400">{conn.protocol}</td>
                  <td className="p-3 text-slate-300">{conn.local_ip}:{conn.local_port}</td>
                  <td className="p-3 font-semibold text-slate-200">
                    {conn.remote_ip}:{conn.remote_port}
                  </td>
                  <td className="p-3 text-slate-300">{conn.process_name} (PID: {conn.process_pid})</td>
                  <td className="p-3">
                    <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                      conn.destination_reputation === 'malicious'
                        ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                        : conn.destination_reputation === 'suspicious'
                        ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                        : 'bg-emerald-500/10 text-emerald-400'
                    }`}>
                      {conn.destination_reputation || 'Benign'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* 5. FIM Files Tab */}
      {subTab === 'fim' && (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="text-[11px] font-mono text-slate-400 uppercase bg-slate-950 border-b border-slate-800">
              <tr>
                <th className="p-3">File Path</th>
                <th className="p-3">Expected SHA256</th>
                <th className="p-3">Current Hash</th>
                <th className="p-3">Integrity State</th>
                <th className="p-3">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/80 font-mono">
              {state.fim_files.map((fim) => (
                <tr key={fim.path} className="hover:bg-slate-950/40">
                  <td className="p-3 font-semibold text-slate-200">{fim.path}</td>
                  <td className="p-3 text-slate-400 text-[10px]">{fim.expected_hash.substring(0, 16)}...</td>
                  <td className="p-3 text-slate-400 text-[10px]">{fim.current_hash.substring(0, 16)}...</td>
                  <td className="p-3">
                    {fim.is_modified ? (
                      <span className="text-rose-400 font-bold text-[11px] bg-rose-950/40 px-2 py-0.5 rounded border border-rose-900/40">
                        TAMPERED / MISMATCH
                      </span>
                    ) : (
                      <span className="text-emerald-400 text-[11px]">
                        VERIFIED HASH
                      </span>
                    )}
                  </td>
                  <td className="p-3">
                    {fim.is_modified && (
                      <button
                        onClick={() => onRemediateEntity('restore_file', fim.path)}
                        className="text-[10px] text-cyan-400 hover:text-cyan-300 underline"
                      >
                        Restore Golden Hash
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

    </div>
  );
};
