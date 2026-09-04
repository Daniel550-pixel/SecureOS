import React, { useEffect, useState } from 'react';
import { Clock, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface TrustHistoryRecord {
  sequence: number;
  recorded_at: string;
  trust_score?: number;
  risk_classification?: string;
  metadata?: Record<string, unknown>;
}

interface IntegrityTimelineProps { currentScore: number; }

export const IntegrityTimeline: React.FC<IntegrityTimelineProps> = ({ currentScore = 100 }) => {
  const safeCurrentScore = typeof currentScore === 'number' ? currentScore : 100;
  const [history, setHistory] = useState<TrustHistoryRecord[]>([]);

  useEffect(() => {
    let active = true;
    fetch('/api/trust/history?limit=8')
      .then(res => res.ok ? res.json() : Promise.reject(new Error('history unavailable')))
      .then(data => { if (active) setHistory(Array.isArray(data.records) ? data.records.reverse() : []); })
      .catch(() => { if (active) setHistory([]); });
    return () => { active = false; };
  }, [safeCurrentScore]);

  const timelineEvents = history.length > 0
    ? history.map(record => ({
        time: new Date(record.recorded_at).toLocaleTimeString([], { hour12: false }),
        score: typeof record.trust_score === 'number' ? record.trust_score : safeCurrentScore,
        event: String(record.metadata?.source || 'Trust Snapshot').replace(/_/g, ' '),
        type: record.risk_classification === 'CRITICAL' ? 'critical' : record.risk_classification === 'HIGH' ? 'deviated' : 'healthy',
        note: `Ledger sequence #${record.sequence} · ${record.risk_classification || 'UNKNOWN'} · hash-chained.`
      }))
    : [{ time: new Date().toLocaleTimeString([], { hour12: false }), score: safeCurrentScore, event: 'Current Trust Snapshot', type: safeCurrentScore < 50 ? 'critical' : safeCurrentScore < 90 ? 'deviated' : 'healthy', note: 'Waiting for persistent ledger history.' }];

  return (
    <div className="secure-panel rounded-2xl p-5 relative overflow-hidden">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
        <h3 className="text-xs font-mono font-bold tracking-widest text-slate-200 uppercase flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>INTEGRITY TRUST HISTORY</span>
          <span className="text-slate-600">•</span>
          <span className="text-[10px] text-cyan-400 font-mono">PERSISTENT LEDGER</span>
        </h3>
        <span className="text-[11px] font-mono text-slate-400">DELTA: {safeCurrentScore >= 100 ? '0.0' : `-${(100 - safeCurrentScore).toFixed(1)}`}%</span>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {timelineEvents.slice(-4).map((evt, idx, visible) => {
          const isCurrent = idx === visible.length - 1;
          return (
            <div key={`${evt.time}-${idx}`} className={`p-3.5 rounded-xl border font-mono text-xs relative ${isCurrent ? 'bg-slate-950/90 border-cyan-500/50 shadow-md shadow-cyan-950/40' : 'bg-slate-950/60 border-slate-800/80'}`}>
              <div className="flex items-center justify-between text-[11px] text-slate-500 pb-1 mb-1 border-b border-slate-900"><span>{evt.time}</span><span className={`font-bold ${evt.score >= 95 ? 'text-emerald-400' : evt.score >= 85 ? 'text-amber-400' : 'text-rose-400'}`}>{evt.score.toFixed(1)}%</span></div>
              <div className="font-bold text-slate-200 mt-1 flex items-center gap-1.5">{evt.type === 'healthy' ? <CheckCircle2 className="w-3 h-3 text-emerald-400" /> : <ShieldAlert className="w-3 h-3 text-rose-400" />}<span className="truncate capitalize">{evt.event}</span></div>
              <p className="text-[10px] text-slate-400 mt-1 leading-snug">{evt.note}</p>
              {isCurrent && <div className="mt-2 text-[9px] font-bold text-cyan-400 uppercase tracking-wider">● CURRENT STATE</div>}
            </div>
          );
        })}
      </div>
    </div>
  );
};
