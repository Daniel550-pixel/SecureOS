import React, { useState } from 'react';
import { 
  Network, 
  Cpu, 
  FileCode2, 
  ShieldAlert, 
  ShieldCheck, 
  Globe, 
  Activity, 
  Terminal, 
  AlertCircle,
  Eye,
  CheckCircle2,
  XCircle,
  Lock
} from 'lucide-react';
import { SystemState } from '../types/integrity';

interface SecurityTopologyProps {
  state: SystemState;
}

interface TopologyNode {
  id: string;
  label: string;
  category: 'core' | 'process' | 'network' | 'file' | 'service';
  status: 'healthy' | 'deviated' | 'critical';
  details: {
    type: string;
    value: string;
    extra?: string;
    risk?: string;
  };
  x: number; // percentage
  y: number; // percentage
}

export const SecurityTopology: React.FC<SecurityTopologyProps> = ({ state }) => {
  const [selectedNode, setSelectedNode] = useState<TopologyNode | null>(null);
  const [filterAnomaliesOnly, setFilterAnomaliesOnly] = useState(false);

  // Build real live nodes from current system state
  const nodes: TopologyNode[] = [
    // Center Core
    {
      id: 'core-aios',
      label: 'SECUREOS CORE',
      category: 'core',
      status: 'healthy',
      details: {
        type: 'Kernel Engine',
        value: 'Deterministic Integrity Arbiter',
        extra: 'Sovereign UAE Host Agent v1.0.4',
        risk: '0.0 (Authority)'
      },
      x: 50,
      y: 50
    },
    // Services
    ...state.services.map((s, idx) => {
      const isDeviated = s.status !== s.expected_status;
      const angle = (idx / Math.max(state.services.length, 1)) * 1.5 - 0.75;
      return {
        id: `svc-${s.name}`,
        label: s.name,
        category: 'service' as const,
        status: isDeviated ? ('critical' as const) : ('healthy' as const),
        details: {
          type: 'System Service',
          value: `Status: ${s.status} (Expected: ${s.expected_status})`,
          extra: `Account: ${s.account}`,
          risk: isDeviated ? 'High (Tampered/Stopped)' : 'None'
        },
        x: 20 + idx * 18,
        y: 18
      };
    }),
    // Processes
    ...state.processes.map((p, idx) => {
      const isUnsigned = !p.is_signed;
      const isMalicious = p.name.includes('mimikatz') || p.name.includes('updater') || p.name.includes('nc.exe');
      return {
        id: `proc-${p.pid}`,
        label: `${p.name} [PID ${p.pid}]`,
        category: 'process' as const,
        status: isMalicious ? ('critical' as const) : isUnsigned ? ('deviated' as const) : ('healthy' as const),
        details: {
          type: 'Process Binary',
          value: p.path,
          extra: `Signer: ${p.signer || 'UNSIGNED'} | Memory: ${p.memory_mb} MB`,
          risk: isMalicious ? 'Severe (Signature & Path Anomaly)' : isUnsigned ? 'Medium (Unverified Signer)' : 'None'
        },
        x: 15 + (idx % 4) * 22,
        y: 82
      };
    }),
    // Network Sockets
    ...state.network_connections.map((c, idx) => {
      const isBad = c.destination_reputation === 'malicious' || c.destination_reputation === 'suspicious';
      return {
        id: `net-${c.id}`,
        label: `${c.protocol} :${c.destination_port}`,
        category: 'network' as const,
        status: isBad ? ('critical' as const) : ('healthy' as const),
        details: {
          type: 'Socket Connection',
          value: `${c.source_ip}:${c.source_port} -> ${c.destination_ip}:${c.destination_port}`,
          extra: `Process: ${c.process_name} | Geo: ${c.geo_destination || 'Unknown'}`,
          risk: isBad ? `Critical (${c.destination_reputation.toUpperCase()})` : 'Clean'
        },
        x: 82,
        y: 35 + idx * 28
      };
    }),
    // Files / FIM
    ...state.fim_files.map((f, idx) => {
      return {
        id: `fim-${f.path.replace(/[^a-zA-Z0-9]/g, '_')}`,
        label: f.path.split(/[\\/]/).pop() || f.path,
        category: 'file' as const,
        status: f.is_modified ? ('critical' as const) : ('healthy' as const),
        details: {
          type: 'File Integrity Monitor',
          value: f.path,
          extra: `Hash: ${f.current_hash.slice(0, 16)}... | Modified: ${f.is_modified ? 'YES (Tampered)' : 'NO (Intact)'}`,
          risk: f.is_modified ? 'Critical (Unauthorized Hash Mutation)' : 'None'
        },
        x: 18,
        y: 45 + idx * 22
      };
    })
  ];

  const displayedNodes = filterAnomaliesOnly 
    ? nodes.filter(n => n.status !== 'healthy' || n.category === 'core')
    : nodes;

  return (
    <div className="secure-panel rounded-2xl p-6 relative overflow-hidden">
      {/* Topology Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-slate-800/80">
        <div>
          <h3 className="text-xs font-mono font-bold tracking-widest text-slate-200 uppercase flex items-center gap-2">
            <Network className="w-4 h-4 text-cyan-400" />
            <span>INTERACTIVE SECURITY TOPOLOGY</span>
            <span className="text-slate-600">•</span>
            <span className="text-[10px] text-cyan-400 font-mono">LIVE GRAPH MAPPING</span>
          </h3>
          <p className="text-xs text-slate-400 mt-1">
            Real-time entity relationship graph connecting services, processes, FIM hashes, and network sockets to SecureOS Core.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => setFilterAnomaliesOnly(!filterAnomaliesOnly)}
            className={`px-3 py-1 text-xs font-mono rounded-lg border transition-all ${
              filterAnomaliesOnly 
                ? 'bg-rose-500/20 border-rose-500/50 text-rose-300' 
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {filterAnomaliesOnly ? '● Anomalies Only' : 'Show All Entities'}
          </button>
        </div>
      </div>

      {/* Interactive Topology Graph Canvas */}
      <div className="relative w-full h-[420px] my-4 rounded-xl bg-slate-950/90 border border-slate-900 bg-secure-grid overflow-hidden">
        {/* Ambient Radar Sweep */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-20">
          <div className="w-[380px] h-[380px] rounded-full border border-cyan-500/30" />
          <div className="w-[240px] h-[240px] rounded-full border border-cyan-500/20 absolute" />
          <div className="w-[100px] h-[100px] rounded-full border border-cyan-500/10 absolute" />
        </div>

        {/* SVG Connection Lines */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          {displayedNodes.map(node => {
            if (node.category === 'core') return null;
            const isAnomaly = node.status !== 'healthy';
            return (
              <line
                key={`line-${node.id}`}
                x1="50%"
                y1="50%"
                x2={`${node.x}%`}
                y2={`${node.y}%`}
                stroke={isAnomaly ? 'rgba(244, 63, 94, 0.45)' : 'rgba(56, 189, 248, 0.2)'}
                strokeWidth={isAnomaly ? 1.5 : 1}
                strokeDasharray={isAnomaly ? '3 3' : 'none'}
              />
            );
          })}
        </svg>

        {/* Render Graph Nodes */}
        {displayedNodes.map(node => {
          const isCore = node.category === 'core';
          const isCritical = node.status === 'critical';
          const isDeviated = node.status === 'deviated';
          const isSelected = selectedNode?.id === node.id;

          let badgeBg = 'bg-slate-900/90 border-slate-700 text-slate-300';
          let pulseClass = '';

          if (isCore) {
            badgeBg = 'bg-cyan-950/90 border-cyan-400 text-cyan-300 shadow-lg shadow-cyan-950/80';
          } else if (isCritical) {
            badgeBg = 'bg-rose-950/90 border-rose-500 text-rose-300 shadow-lg shadow-rose-950/80 animate-pulse';
            pulseClass = 'ring-2 ring-rose-500/50';
          } else if (isDeviated) {
            badgeBg = 'bg-amber-950/90 border-amber-500 text-amber-300';
            pulseClass = 'ring-1 ring-amber-500/50';
          }

          return (
            <div
              key={node.id}
              onClick={() => setSelectedNode(node)}
              className={`absolute transform -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 z-10 ${pulseClass}`}
              style={{ left: `${node.x}%`, top: `${node.y}%` }}
            >
              <div 
                className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[11px] font-mono whitespace-nowrap ${badgeBg} ${
                  isSelected ? 'ring-2 ring-cyan-400 scale-110' : 'hover:scale-105'
                }`}
              >
                {isCore && <Cpu className="w-3.5 h-3.5 text-cyan-400 animate-spin-slow" />}
                {node.category === 'service' && <Activity className="w-3 h-3 text-cyan-400" />}
                {node.category === 'process' && <Terminal className="w-3 h-3 text-blue-400" />}
                {node.category === 'network' && <Globe className="w-3 h-3 text-teal-400" />}
                {node.category === 'file' && <FileCode2 className="w-3 h-3 text-purple-400" />}
                
                <span className="font-semibold">{node.label}</span>

                {isCritical && <ShieldAlert className="w-3 h-3 text-rose-400" />}
              </div>
            </div>
          );
        })}
      </div>

      {/* Entity Inspector Drawer / Details */}
      {selectedNode && (
        <div className="p-4 rounded-xl bg-slate-950/90 border border-cyan-500/30 font-mono text-xs animate-in fade-in slide-in-from-bottom-2 duration-200">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Eye className="w-4 h-4 text-cyan-400" />
              <span className="font-bold text-slate-100">{selectedNode.label}</span>
              <span className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold ${
                selectedNode.status === 'critical' ? 'bg-rose-500/20 text-rose-400' :
                selectedNode.status === 'deviated' ? 'bg-amber-500/20 text-amber-400' :
                'bg-emerald-500/20 text-emerald-400'
              }`}>
                {selectedNode.status}
              </span>
            </div>
            <button 
              onClick={() => setSelectedNode(null)}
              className="text-slate-500 hover:text-slate-300 text-xs"
            >
              ✕ Close
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-slate-300">
            <div>
              <span className="text-slate-500 block text-[10px]">CATEGORY / TYPE</span>
              <span className="text-cyan-300">{selectedNode.details.type}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">SPECIFICATION / PATH</span>
              <span className="truncate block" title={selectedNode.details.value}>{selectedNode.details.value}</span>
            </div>
            <div>
              <span className="text-slate-500 block text-[10px]">ASSESSED RISK</span>
              <span className={selectedNode.status !== 'healthy' ? 'text-rose-400 font-bold' : 'text-emerald-400'}>
                {selectedNode.details.risk}
              </span>
            </div>
          </div>
          {selectedNode.details.extra && (
            <div className="mt-2 pt-2 border-t border-slate-900 text-slate-400 text-[11px]">
              {selectedNode.details.extra}
            </div>
          )}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 pt-3 text-[11px] font-mono text-slate-400">
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500" />
          <span>Baseline Verified</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-amber-500" />
          <span>Deviated / Unsigned</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-rose-500" />
          <span>Critical Anomaly</span>
        </span>
        <span className="text-slate-600">|</span>
        <span className="text-slate-500">Click any entity node to inspect runtime metadata.</span>
      </div>
    </div>
  );
};
