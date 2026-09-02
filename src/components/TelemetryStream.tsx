import React, { useState } from 'react';
import { Activity, Search, Filter, ShieldAlert, Code2, Check, Copy, Terminal, Radio } from 'lucide-react';
import { NormalizedEvent } from '../types/integrity';

interface TelemetryStreamProps {
  events: NormalizedEvent[];
}

export const TelemetryStream: React.FC<TelemetryStreamProps> = ({ events }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');
  const [selectedEvent, setSelectedEvent] = useState<NormalizedEvent | null>(null);
  const [copied, setCopied] = useState(false);

  const filteredEvents = events.filter((ev) => {
    const matchesSearch = 
      ev.entity.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ev.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (ev.mitre_tactic && ev.mitre_tactic.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (ev.mitre_technique && ev.mitre_technique.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesSeverity = selectedSeverity === 'all' || ev.severity === selectedSeverity;
    return matchesSearch && matchesSeverity;
  });

  const handleCopyJson = (obj: any) => {
    navigator.clipboard.writeText(JSON.stringify(obj, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-blue-500/10 border border-blue-500/30 text-blue-400">
            <Activity className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xs font-mono font-bold tracking-widest text-slate-300 uppercase flex items-center gap-2">
              <span>Module 02 • Normalized Event Stream</span>
              <span className="flex items-center gap-1 text-[10px] text-emerald-400 font-mono">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                LIVE INGESTION
              </span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              All heterogeneous sources (Windows Events, Sysmon, PowerShell, EDR) normalized into common schema.
            </p>
          </div>
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2 flex-wrap">
          <div className="relative">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filter events..."
              className="bg-slate-950 text-xs text-slate-200 pl-8 pr-3 py-1.5 rounded-lg border border-slate-800 focus:outline-none focus:border-cyan-500 font-mono w-44"
            />
          </div>

          <select
            value={selectedSeverity}
            onChange={(e) => setSelectedSeverity(e.target.value)}
            className="bg-slate-950 text-xs text-slate-200 px-2.5 py-1.5 rounded-lg border border-slate-800 focus:outline-none focus:border-cyan-500 font-mono cursor-pointer"
          >
            <option value="all">All Severities</option>
            <option value="critical">Critical</option>
            <option value="high">High</option>
            <option value="medium">Medium</option>
            <option value="low">Low</option>
            <option value="info">Info</option>
          </select>
        </div>
      </div>

      {/* Events Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-xs">
          <thead className="text-[11px] font-mono text-slate-400 uppercase bg-slate-950 border-b border-slate-800">
            <tr>
              <th className="p-3">Timestamp</th>
              <th className="p-3">Severity</th>
              <th className="p-3">Source</th>
              <th className="p-3">Event Type</th>
              <th className="p-3">Target Entity</th>
              <th className="p-3">MITRE ATT&CK</th>
              <th className="p-3">Inspector</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80 font-mono">
            {filteredEvents.map((ev) => (
              <tr
                key={ev.event_id}
                onClick={() => setSelectedEvent(ev)}
                className="hover:bg-slate-950/60 cursor-pointer transition-colors"
              >
                <td className="p-3 text-slate-400 text-[11px]">
                  {new Date(ev.timestamp).toLocaleTimeString()}
                </td>
                <td className="p-3">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                    ev.severity === 'critical'
                      ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                      : ev.severity === 'high'
                      ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                      : ev.severity === 'medium'
                      ? 'bg-yellow-500/20 text-yellow-400 border border-yellow-500/30'
                      : 'bg-slate-800 text-slate-400'
                  }`}>
                    {ev.severity}
                  </span>
                </td>
                <td className="p-3 text-cyan-400 text-[11px]">{ev.source}</td>
                <td className="p-3 font-semibold text-slate-200">{ev.type}</td>
                <td className="p-3 text-slate-300 truncate max-w-xs">{ev.entity}</td>
                <td className="p-3 text-[11px]">
                  {ev.mitre_tactic ? (
                    <span className="text-purple-300">
                      {ev.mitre_tactic} <span className="text-slate-500">({ev.mitre_technique})</span>
                    </span>
                  ) : (
                    <span className="text-slate-600">-</span>
                  )}
                </td>
                <td className="p-3">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedEvent(ev);
                    }}
                    className="text-[11px] text-cyan-400 hover:text-cyan-300 flex items-center gap-1 underline"
                  >
                    <Code2 className="w-3 h-3" /> JSON Schema
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Raw vs Normalized Event JSON Modal */}
      {selectedEvent && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-3xl max-h-[85vh] flex flex-col shadow-2xl overflow-hidden">
            
            <div className="flex items-center justify-between p-4 border-b border-slate-800 bg-slate-950">
              <div className="flex items-center gap-2">
                <Code2 className="w-5 h-5 text-cyan-400" />
                <h3 className="text-sm font-bold text-slate-200 font-mono">
                  Event Schema Inspector • {selectedEvent.event_id}
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleCopyJson(selectedEvent)}
                  className="flex items-center gap-1 px-2.5 py-1 text-xs font-mono rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copied ? 'Copied' : 'Copy JSON'}</span>
                </button>
                <button
                  onClick={() => setSelectedEvent(null)}
                  className="px-2.5 py-1 text-xs font-mono rounded bg-slate-800 hover:bg-slate-700 text-slate-300 transition-colors"
                >
                  Close
                </button>
              </div>
            </div>

            <div className="p-4 overflow-y-auto font-mono text-xs text-cyan-300 bg-slate-950/90 space-y-4">
              <div>
                <span className="text-slate-400 block text-[11px] mb-1">// Normalized Canonical Schema (Used by Trust Engine & AI)</span>
                <pre className="p-3 rounded-lg bg-slate-900 border border-slate-800 overflow-x-auto text-slate-200">
                  {JSON.stringify(selectedEvent, null, 2)}
                </pre>
              </div>

              {selectedEvent.raw_payload && (
                <div>
                  <span className="text-slate-400 block text-[11px] mb-1">// Raw Original Ingested Payload</span>
                  <pre className="p-3 rounded-lg bg-slate-900 border border-slate-800 overflow-x-auto text-slate-400">
                    {JSON.stringify(selectedEvent.raw_payload, null, 2)}
                  </pre>
                </div>
              )}
            </div>

          </div>
        </div>
      )}

    </div>
  );
};
