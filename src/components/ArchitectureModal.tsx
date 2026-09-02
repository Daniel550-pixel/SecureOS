import React from 'react';
import { Layers, ArrowRight, CheckCircle2, Shield, X, Cpu, Database, BrainCircuit, Terminal } from 'lucide-react';

interface ArchitectureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ArchitectureModal: React.FC<ArchitectureModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/85 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-slate-900 border border-slate-700 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
        
        {/* Modal Header */}
        <div className="flex items-center justify-between p-5 border-b border-slate-800 bg-slate-950">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-100 font-mono">
                AI Studio Prototype → GitHub Production Architecture
              </h3>
              <p className="text-xs text-slate-400">
                Architectural blueprint reflecting the 6-module pipeline and production migration path.
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-6 text-xs text-slate-300">
          
          {/* ASCII Architecture Diagram */}
          <div>
            <h4 className="font-mono font-bold text-xs uppercase text-cyan-400 mb-2">
              System Dataflow Architecture
            </h4>
            <pre className="p-4 rounded-xl bg-slate-950 border border-slate-800 text-[11px] font-mono text-slate-300 overflow-x-auto leading-tight">
{`                 DIGITAL INTEGRITY MONITOR
                         │
                         ▼
                 ┌───────────────┐
                 │  AI STUDIO UI │
                 │  / Control UI │
                 └───────┬───────┘
                         │
                  User Intent / Query
                         │
                         ▼
                ┌──────────────────┐
                │   AI ANALYSIS    │
                │ Gemini Reasoning │
                └────────┬─────────┘
                         │
             ┌───────────┴───────────┐
             │                       │
             ▼                       ▼
     Evidence Context          Security Context
             │                       │
             └───────────┬───────────┘
                         ▼
              ┌─────────────────────┐
              │ DETERMINISTIC CORE  │
              │                     │
              │ Trust Score         │
              │ Baseline            │
              │ Rules               │
              │ Integrity State     │
              │ Risk Classification │
              └──────────┬──────────┘
                         │
                         ▼
                ┌─────────────────┐
                │ SECURITY STATE  │
                │                 │
                │ TRUST: 72.8%    │
                │ RISK: HIGH      │
                │ STATUS: ACTIVE  │
                └────────┬────────┘
                         │
             ┌───────────┼───────────┐
             ▼           ▼           ▼
          AI Report   Event Log   Alert State
             │           │           │
             └───────────┼───────────┘
                         ▼
                  Dashboard / API`}
            </pre>
          </div>

          {/* Module Transition Mapping Table */}
          <div>
            <h4 className="font-mono font-bold text-xs uppercase text-cyan-400 mb-2.5">
              AI Studio Prototype vs GitHub Production Mapping
            </h4>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="text-[11px] font-mono text-slate-400 uppercase bg-slate-950 border-b border-slate-800">
                  <tr>
                    <th className="p-3">Logical Module</th>
                    <th className="p-3">Google AI Studio Prototype</th>
                    <th className="p-3">Eventual GitHub Repository</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/80 font-mono">
                  <tr>
                    <td className="p-3 font-semibold text-cyan-300">01 TELEMETRY</td>
                    <td className="p-3 text-slate-300">Simulated Windows events, processes, services, FIM</td>
                    <td className="p-3 text-emerald-400">PowerShell Agent + Sysmon EDR Sensor</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-cyan-300">02 NORMALIZATION</td>
                    <td className="p-3 text-slate-300">In-memory parser to common event schema</td>
                    <td className="p-3 text-emerald-400">REST API Ingest + Kafka/Redis Event Queue</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-cyan-300">03 INTEGRITY ENGINE</td>
                    <td className="p-3 text-slate-300">Golden Baseline comparison engine</td>
                    <td className="p-3 text-emerald-400">PostgreSQL / SQLite Baseline Catalog Engine</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-cyan-300">04 TRUST ENGINE</td>
                    <td className="p-3 text-slate-300">Deterministic mathematical formula (100.0 - Σ)</td>
                    <td className="p-3 text-emerald-400">Compiled Rust / Go Deterministic Core daemon</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-cyan-300">05 AI ANALYSIS</td>
                    <td className="p-3 text-slate-300">Gemini 3.8 Flash server-side structured reasoning</td>
                    <td className="p-3 text-emerald-400">Microservice AI worker (Gemini API / Sovereign model)</td>
                  </tr>
                  <tr>
                    <td className="p-3 font-semibold text-cyan-300">06 RESPONSE / UI</td>
                    <td className="p-3 text-slate-300">SOC Dashboard + Action Handlers</td>
                    <td className="p-3 text-emerald-400">Production React Dashboard + Telegram Alert Bot</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
};
