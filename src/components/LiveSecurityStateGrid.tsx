import React from 'react';
import { 
  Activity, 
  Terminal, 
  Globe, 
  FileCode2, 
  ShieldCheck, 
  ShieldAlert, 
  Cpu, 
  Server,
  ArrowUpRight
} from 'lucide-react';
import { SystemState } from '../types/integrity';
import { SecureOsTab } from './Header';

interface LiveSecurityStateGridProps {
  state: SystemState;
  onNavigateTab: (tab: SecureOsTab) => void;
}

export const LiveSecurityStateGrid: React.FC<LiveSecurityStateGridProps> = ({
  state,
  onNavigateTab
}) => {
  const stoppedServices = state.services.filter(s => s.status !== s.expected_status);
  const unsignedProcs = state.processes.filter(p => !p.is_signed);
  const modifiedFiles = state.fim_files.filter(f => f.is_modified);
  const badSockets = state.network_connections.filter(c => c.destination_reputation === 'malicious' || c.destination_reputation === 'suspicious');

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 font-mono">
      
      {/* 1. Services Subsystem */}
      <div 
        onClick={() => onNavigateTab('integrity')}
        className="secure-panel rounded-xl p-4 cursor-pointer hover:border-cyan-500/40 transition-all group"
      >
        <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-900">
          <span className="flex items-center gap-1.5">
            <Server className="w-3.5 h-3.5 text-cyan-400" />
            <span>SERVICES SUBSYSTEM</span>
          </span>
          <ArrowUpRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-cyan-400 transition-colors" />
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <span className="text-2xl font-bold text-slate-100">{state.services.length}</span>
          <span className={`text-xs px-2 py-0.5 rounded font-bold ${
            stoppedServices.length > 0 ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
          }`}>
            {stoppedServices.length > 0 ? `${stoppedServices.length} STOPPED` : 'ALL RUNNING'}
          </span>
        </div>
        <div className="mt-2 text-[11px] text-slate-400 truncate">
          {stoppedServices.length > 0 ? `Tampered: ${stoppedServices.map(s => s.name).join(', ')}` : 'Defender, EventLog, WinRM verified'}
        </div>
      </div>

      {/* 2. Process Engine */}
      <div 
        onClick={() => onNavigateTab('topology')}
        className="secure-panel rounded-xl p-4 cursor-pointer hover:border-cyan-500/40 transition-all group"
      >
        <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-900">
          <span className="flex items-center gap-1.5">
            <Terminal className="w-3.5 h-3.5 text-blue-400" />
            <span>PROCESS MONITOR</span>
          </span>
          <ArrowUpRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-blue-400 transition-colors" />
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <span className="text-2xl font-bold text-slate-100">{state.processes.length}</span>
          <span className={`text-xs px-2 py-0.5 rounded font-bold ${
            unsignedProcs.length > 0 ? 'bg-amber-500/20 text-amber-400' : 'bg-emerald-500/20 text-emerald-400'
          }`}>
            {unsignedProcs.length > 0 ? `${unsignedProcs.length} UNSIGNED` : '100% SIGNED'}
          </span>
        </div>
        <div className="mt-2 text-[11px] text-slate-400 truncate">
          {unsignedProcs.length > 0 ? `Unsigned binary: ${unsignedProcs[0].name}` : 'Code integrity signatures valid'}
        </div>
      </div>

      {/* 3. Network Sockets */}
      <div 
        onClick={() => onNavigateTab('topology')}
        className="secure-panel rounded-xl p-4 cursor-pointer hover:border-cyan-500/40 transition-all group"
      >
        <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-900">
          <span className="flex items-center gap-1.5">
            <Globe className="w-3.5 h-3.5 text-teal-400" />
            <span>SOCKET REPUTATION</span>
          </span>
          <ArrowUpRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-teal-400 transition-colors" />
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <span className="text-2xl font-bold text-slate-100">{state.network_connections.length}</span>
          <span className={`text-xs px-2 py-0.5 rounded font-bold ${
            badSockets.length > 0 ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
          }`}>
            {badSockets.length > 0 ? `${badSockets.length} SUSPICIOUS` : 'CLEAN EGRESS'}
          </span>
        </div>
        <div className="mt-2 text-[11px] text-slate-400 truncate">
          {badSockets.length > 0 ? `Anomalous IP: ${badSockets[0].destination_ip}` : 'No known C2 or malicious IPs'}
        </div>
      </div>

      {/* 4. File Integrity (FIM) */}
      <div 
        onClick={() => onNavigateTab('integrity')}
        className="secure-panel rounded-xl p-4 cursor-pointer hover:border-cyan-500/40 transition-all group"
      >
        <div className="flex items-center justify-between text-xs text-slate-400 pb-2 border-b border-slate-900">
          <span className="flex items-center gap-1.5">
            <FileCode2 className="w-3.5 h-3.5 text-purple-400" />
            <span>FILE INTEGRITY (FIM)</span>
          </span>
          <ArrowUpRight className="w-3.5 h-3.5 text-slate-600 group-hover:text-purple-400 transition-colors" />
        </div>
        <div className="mt-3 flex items-baseline justify-between">
          <span className="text-2xl font-bold text-slate-100">{state.fim_files.length}</span>
          <span className={`text-xs px-2 py-0.5 rounded font-bold ${
            modifiedFiles.length > 0 ? 'bg-rose-500/20 text-rose-400' : 'bg-emerald-500/20 text-emerald-400'
          }`}>
            {modifiedFiles.length > 0 ? `${modifiedFiles.length} MODIFIED` : 'HASH MATCH'}
          </span>
        </div>
        <div className="mt-2 text-[11px] text-slate-400 truncate">
          {modifiedFiles.length > 0 ? `Altered: ${modifiedFiles[0].path.split('\\').pop()}` : 'System32 core libraries intact'}
        </div>
      </div>

    </div>
  );
};
