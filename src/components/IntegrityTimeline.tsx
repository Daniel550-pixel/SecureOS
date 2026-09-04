import React from 'react';
import { Clock, TrendingDown, ShieldAlert, CheckCircle2 } from 'lucide-react';

interface IntegrityTimelineProps {
  currentScore: number;
}

export const IntegrityTimeline: React.FC<IntegrityTimelineProps> = ({ currentScore = 100 }) => {
  const safeCurrentScore = typeof currentScore === 'number' ? currentScore : 100;
  // Keyframe events leading up to current state
  const timelineEvents = [
    { time: '08:00:00', score: 100.0, event: 'Baseline Verified', type: 'healthy', note: 'All services, hashes, and sockets matched Golden Baseline.' },
    { time: '08:42:15', score: 94.2, event: 'Service Stopped', type: 'deviated', note: 'WinDefend service transitioned from Running to Stopped.' },
    { time: '09:15:30', score: 87.6, event: 'Unsigned Binary Executed', type: 'deviated', note: 'win_updater.exe spawned in C:\\Users\\Administrator\\AppData.' },
    { time: '09:28:44', score: safeCurrentScore, event: 'Outbound C2 Established', type: 'critical', note: 'TCP socket opened to suspicious external IP 185.220.101.45:4444.' },
  ];

  return (
    <div className="secure-panel rounded-2xl p-5 relative overflow-hidden">
      <div className="flex items-center justify-between pb-3 mb-4 border-b border-slate-800">
        <h3 className="text-xs font-mono font-bold tracking-widest text-slate-200 uppercase flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          <span>INTEGRITY TIME DEGRADATION CURVE</span>
          <span className="text-slate-600">•</span>
          <span className="text-[10px] text-cyan-400 font-mono">CHRONOLOGICAL ATTACK LINE</span>
        </h3>
        <span className="text-[11px] font-mono text-slate-400">
          DELTA: -{(100 - safeCurrentScore).toFixed(1)}% OVER 1H 28M
        </span>
      </div>

      {/* Visual Timeline Stepper */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {timelineEvents.map((evt, idx) => {
          const isCurrent = idx === timelineEvents.length - 1;
          return (
            <div 
              key={idx}
              className={`p-3.5 rounded-xl border font-mono text-xs relative ${
                isCurrent 
                  ? 'bg-slate-950/90 border-cyan-500/50 shadow-md shadow-cyan-950/40' 
                  : 'bg-slate-950/60 border-slate-800/80'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] text-slate-500 pb-1 mb-1 border-b border-slate-900">
                <span>{evt.time}</span>
                <span className={`font-bold ${
                  (evt.score ?? 100) >= 95 ? 'text-emerald-400' :
                  (evt.score ?? 100) >= 85 ? 'text-amber-400' :
                  'text-rose-400'
                }`}>
                  {(evt.score ?? 100).toFixed(1)}%
                </span>
              </div>

              <div className="font-bold text-slate-200 mt-1 flex items-center gap-1.5">
                {evt.type === 'healthy' ? (
                  <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                ) : (
                  <ShieldAlert className="w-3 h-3 text-rose-400" />
                )}
                <span className="truncate">{evt.event}</span>
              </div>

              <p className="text-[10px] text-slate-400 mt-1 leading-snug">
                {evt.note}
              </p>

              {isCurrent && (
                <div className="mt-2 text-[9px] font-bold text-cyan-400 uppercase tracking-wider">
                  ● CURRENT STATE
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
