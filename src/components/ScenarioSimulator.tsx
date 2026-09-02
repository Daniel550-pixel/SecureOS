import React, { useState } from 'react';
import { Play, Flame, ShieldCheck, Skull, KeyRound, PlusCircle, Radio, Sparkles } from 'lucide-react';
import { SCENARIOS } from '../engine/scenarios';

interface ScenarioSimulatorProps {
  currentScenarioId: string;
  onSelectScenario: (id: string) => void;
  onInjectEvent: (payload: any) => void;
  isLoading: boolean;
}

export const ScenarioSimulator: React.FC<ScenarioSimulatorProps> = ({
  currentScenarioId,
  onSelectScenario,
  onInjectEvent,
  isLoading
}) => {
  const [customEntity, setCustomEntity] = useState('');
  const [customType, setCustomType] = useState('unsigned_process');

  const handleCustomInject = (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEntity.trim()) return;

    if (customType === 'unsigned_process') {
      onInjectEvent({
        action: 'add_process',
        type: 'process_start',
        severity: 'high',
        entity: `${customEntity} [PID: ${Math.floor(Math.random() * 5000 + 3000)}]`,
        process: {
          pid: Math.floor(Math.random() * 5000 + 3000),
          name: customEntity,
          path: `C:\\Users\\Guest\\AppData\\Local\\Temp\\${customEntity}`,
          command_line: `${customEntity} --injected`,
          hash_sha256: 'deadbeef' + Date.now().toString(16),
          is_signed: false,
          signer: 'Unsigned',
          parent_name: 'cmd.exe',
          parent_pid: 1400,
          user: 'SEC-HQ\\Guest_User',
          integrity_level: 'High',
          start_time: new Date().toISOString()
        }
      });
    } else if (customType === 'stop_service') {
      onInjectEvent({
        action: 'stop_service',
        service_name: customEntity,
        type: 'service_change',
        severity: 'critical',
        entity: `Service ${customEntity} (Stopped)`
      });
    } else if (customType === 'modify_fim') {
      onInjectEvent({
        action: 'modify_fim',
        file_path: customEntity,
        type: 'file_modify',
        severity: 'critical',
        entity: customEntity
      });
    }

    setCustomEntity('');
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800 mb-5">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 text-amber-400">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xs font-mono font-bold tracking-widest text-slate-300 uppercase">
              Simulation Deck • Attack Vectors & Baseline Scenarios
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              Inject telemetry events or switch scenarios to evaluate real-time deterministic scoring and AI reasoning.
            </p>
          </div>
        </div>
      </div>

      {/* Preset Scenario Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
        {SCENARIOS.map((sc) => {
          const isSelected = currentScenarioId === sc.id;
          let icon = Flame;
          if (sc.id === 'clean_baseline') icon = ShieldCheck;
          if (sc.id === 'ransomware_c2_chain') icon = Skull;
          if (sc.id === 'cred_dumping_lateral') icon = KeyRound;
          const Icon = icon;

          return (
            <button
              key={sc.id}
              disabled={isLoading}
              onClick={() => onSelectScenario(sc.id)}
              className={`p-4 rounded-xl border text-left flex flex-col justify-between transition-all cursor-pointer ${
                isSelected
                  ? 'bg-slate-800 border-cyan-500 shadow-md shadow-cyan-950/30 ring-1 ring-cyan-500'
                  : 'bg-slate-950/70 border-slate-800/80 hover:bg-slate-800/50 hover:border-slate-700'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <Icon className={`w-4 h-4 ${isSelected ? 'text-cyan-400' : 'text-slate-400'}`} />
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                    sc.expected_risk === 'LOW'
                      ? 'bg-emerald-500/20 text-emerald-400'
                      : sc.expected_risk === 'HIGH'
                      ? 'bg-amber-500/20 text-amber-400'
                      : 'bg-rose-500/20 text-rose-400'
                  }`}>
                    {sc.expected_trust_score}%
                  </span>
                </div>
                <h3 className="text-xs font-bold text-slate-200 font-mono mb-1">{sc.name}</h3>
                <p className="text-[11px] text-slate-400 line-clamp-2">{sc.description}</p>
              </div>

              <div className="mt-3 pt-2 border-t border-slate-800 flex items-center justify-between text-[10px] font-mono">
                <span className="text-slate-400">Target Risk:</span>
                <span className="font-bold text-slate-200">{sc.expected_risk}</span>
              </div>
            </button>
          );
        })}
      </div>

      {/* Custom Event Injection Console */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
        <h3 className="text-xs font-mono font-bold uppercase text-slate-300 mb-2 flex items-center gap-1.5">
          <PlusCircle className="w-3.5 h-3.5 text-cyan-400" />
          <span>Live Ingestion Injector (Simulate PowerShell / EDR Event)</span>
        </h3>

        <form onSubmit={handleCustomInject} className="flex flex-col sm:flex-row gap-2 mt-2">
          <select
            value={customType}
            onChange={(e) => setCustomType(e.target.value)}
            className="bg-slate-900 text-xs text-slate-200 px-3 py-2 rounded-lg border border-slate-800 focus:outline-none focus:border-cyan-500 font-mono"
          >
            <option value="unsigned_process">Inject Unsigned Binary</option>
            <option value="stop_service">Tamper Security Service (Stop WinDefend)</option>
            <option value="modify_fim">Trigger FIM Hash Mismatch</option>
          </select>

          <input
            type="text"
            value={customEntity}
            onChange={(e) => setCustomEntity(e.target.value)}
            placeholder={
              customType === 'unsigned_process'
                ? 'Binary name (e.g. payload_rev.exe)'
                : customType === 'stop_service'
                ? 'Service name (e.g. WinDefend)'
                : 'Protected path (e.g. C:\\Windows\\System32\\drivers\\etc\\hosts)'
            }
            className="flex-1 bg-slate-900 text-xs text-slate-200 px-3.5 py-2 rounded-lg border border-slate-800 focus:outline-none focus:border-cyan-500 font-mono"
          />

          <button
            type="submit"
            disabled={!customEntity.trim() || isLoading}
            className="px-4 py-2 bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:text-slate-600 text-xs font-mono font-bold text-white rounded-lg transition-colors cursor-pointer"
          >
            Inject Telemetry
          </button>
        </form>
      </div>

    </div>
  );
};
