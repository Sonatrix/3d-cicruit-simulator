import React from 'react';
import { X, Zap, Flame, Gauge, ArrowRight, BookOpen } from 'lucide-react';
import { CircuitState } from '../types';
import { getResistorBands } from '../utils/resistorBands';

interface FormulaGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
  circuitState: CircuitState;
}

export default function FormulaGuideModal({
  isOpen,
  onClose,
  circuitState,
}: FormulaGuideModalProps) {
  if (!isOpen) return null;

  const { voltage, resistance, current, power } = circuitState;
  const bands = getResistorBands(resistance);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in">
      <div
        id="formula-guide-modal"
        className="relative w-full max-w-2xl rounded-2xl border border-slate-700 bg-slate-900 p-6 shadow-2xl text-slate-200 max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4 mb-5">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <BookOpen className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Ohm's Law & Circuit Physics
              </h2>
              <p className="text-xs text-slate-400">
                Understanding Voltage, Resistance, Current, and Power
              </p>
            </div>
          </div>
          <button
            id="btn-close-guide"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Live Calculation Formula Card */}
        <div className="rounded-xl border border-cyan-500/30 bg-slate-950/60 p-4 mb-5">
          <div className="text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-2">
            Active Circuit Calculation
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 py-2 text-base sm:text-lg font-mono font-semibold">
            <div className="flex items-center gap-1.5 bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/30 text-blue-300">
              <Gauge className="h-4 w-4" /> V = {voltage.toFixed(1)} V
            </div>
            <span className="text-slate-500">÷</span>
            <div className="flex items-center gap-1.5 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/30 text-amber-300">
              <Flame className="h-4 w-4" /> R = {resistance} Ω
            </div>
            <span className="text-slate-500">=</span>
            <div className="flex items-center gap-1.5 bg-cyan-500/10 px-3 py-1.5 rounded-lg border border-cyan-500/40 text-cyan-200">
              <Zap className="h-4 w-4" /> I = {current.toFixed(3)} A
            </div>
          </div>
        </div>

        {/* Core Principles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          {/* Voltage */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
            <div className="flex items-center gap-2 text-blue-400 font-semibold text-sm mb-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-blue-400" />
              Voltage (V)
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Electrical pressure or potential difference created by the battery. It drives
              electrons through the circuit from negative to positive terminals.
            </p>
          </div>

          {/* Resistance */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
            <div className="flex items-center gap-2 text-amber-400 font-semibold text-sm mb-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
              Resistance (R)
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              Opposition to electron flow caused by collisions inside the resistor lattice. High
              resistance dissipates energy as thermal glow and heat.
            </p>
          </div>

          {/* Current */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4">
            <div className="flex items-center gap-2 text-cyan-400 font-semibold text-sm mb-1.5">
              <span className="inline-block h-2 w-2 rounded-full bg-cyan-400" />
              Current (I)
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              The rate of charge flow through a cross-section of wire (1 Ampere = 1 Coulomb per
              second). Directly proportional to V and inversely proportional to R.
            </p>
          </div>
        </div>

        {/* 3D Visual Cues Explanation */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-4 mb-5">
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-300 mb-3">
            What You See in the 3D View
          </h3>
          <ul className="space-y-2 text-xs text-slate-400">
            <li className="flex items-start gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-cyan-400 mt-1.5 shrink-0" />
              <span>
                <strong className="text-slate-200">Particle Drift Speed:</strong> The glowing
                spheres represent charge carriers. As calculated current (I) increases, the drift
                speed scales up proportionally.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-amber-400 mt-1.5 shrink-0" />
              <span>
                <strong className="text-slate-200">Resistor Thermal Glow:</strong> As resistance (R)
                increases, the 3D resistor shifts in emission and color intensity from cool ceramic
                to incandescent thermal orange-red with rising heat particles.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-blue-400 mt-1.5 shrink-0" />
              <span>
                <strong className="text-slate-200">Battery Level & Polarity:</strong> The battery
                displays active LED indicators corresponding to the 1V - 12V setting, with positive
                brass terminal (+) on the right and negative base (-) on the left.
              </span>
            </li>
            <li className="flex items-start gap-2">
              <div className="h-1.5 w-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" />
              <span>
                <strong className="text-slate-200">Reactive Audio Feedback:</strong> Dynamic
                electrical hum and static sizzle that reacts in real-time. Volume and hum frequency
                scale upwards as Current (I) increases.
              </span>
            </li>
          </ul>
        </div>

        {/* Color Bands Info */}
        <div className="flex items-center justify-between rounded-xl border border-slate-800 bg-slate-950/40 p-3.5 text-xs text-slate-400">
          <div>
            Current Resistor Color Bands: <strong className="text-slate-200">{bands.displayValue}</strong>
          </div>
          <div className="flex items-center gap-1.5">
            {[bands.band1Color, bands.band2Color, bands.multiplierColor, bands.toleranceColor].map(
              (color, idx) => (
                <div
                  key={idx}
                  className="h-4 w-2.5 rounded-sm border border-slate-700 shadow-sm"
                  style={{ backgroundColor: color }}
                />
              )
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="mt-6 flex justify-end">
          <button
            id="btn-got-it-guide"
            onClick={onClose}
            className="rounded-xl bg-cyan-500 px-4 py-2 text-xs font-semibold text-slate-950 hover:bg-cyan-400 transition-colors"
          >
            Close Guide
          </button>
        </div>
      </div>
    </div>
  );
}
