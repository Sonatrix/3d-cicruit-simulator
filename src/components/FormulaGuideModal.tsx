import React from 'react';
import { X, Zap, Flame, Gauge, ArrowRight, BookOpen, Binary } from 'lucide-react';
import { CircuitState } from '../types';
import { getResistorBands } from '../utils/resistorBands';
import {
  formatVoltage,
  formatResistance,
  formatCurrent,
  formatPower,
} from '../utils/unitFormatting';

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

  const { voltage, resistance, current, power, unitNotation } = circuitState;
  const bands = getResistorBands(resistance);

  const voltFmt = formatVoltage(voltage, unitNotation);
  const resFmt = formatResistance(resistance, unitNotation);
  const curFmt = formatCurrent(current, unitNotation);
  const pwrFmt = formatPower(power, unitNotation);

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
                Understanding Voltage, Resistance, Current, Power & Unit Systems
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
          <div className="flex items-center justify-between text-xs font-semibold text-cyan-400 uppercase tracking-wider mb-2">
            <span>Active Circuit Calculation</span>
            <span className="text-[10px] text-slate-400 font-mono normal-case">
              System: <strong className={unitNotation === 'engineering' ? 'text-emerald-400' : 'text-blue-400'}>{unitNotation === 'engineering' ? 'Engineering (SI Multipliers)' : 'Standard (Base SI)'}</strong>
            </span>
          </div>
          <div className="flex flex-wrap items-center justify-center gap-3 py-1 text-base sm:text-lg font-mono font-semibold">
            <div className="flex items-center gap-1.5 bg-blue-500/10 px-3 py-1.5 rounded-lg border border-blue-500/30 text-blue-300">
              <Gauge className="h-4 w-4" /> V = {voltFmt.full}
            </div>
            <span className="text-slate-500">÷</span>
            <div className="flex items-center gap-1.5 bg-amber-500/10 px-3 py-1.5 rounded-lg border border-amber-500/30 text-amber-300">
              <Flame className="h-4 w-4" /> R = {resFmt.full}
            </div>
            <span className="text-slate-500">=</span>
            <div className="flex items-center gap-1.5 bg-cyan-500/10 px-3 py-1.5 rounded-lg border border-cyan-500/40 text-cyan-200">
              <Zap className="h-4 w-4" /> I = {curFmt.full}
            </div>
          </div>

          {/* Real-time Power relation */}
          <div className="border-t border-slate-800/80 mt-2.5 pt-2.5 flex flex-wrap items-center justify-center gap-2 sm:gap-3 text-xs sm:text-sm font-mono">
            <span className="text-xs text-slate-400 font-sans font-semibold">Power Dissipation (P = V · I):</span>
            <span className="text-blue-300 font-bold">{voltFmt.full}</span>
            <span className="text-slate-500 font-bold">×</span>
            <span className="text-cyan-300 font-bold">{curFmt.full}</span>
            <span className="text-slate-500 font-bold">=</span>
            <span className="text-emerald-300 font-bold bg-emerald-500/15 border border-emerald-500/30 px-2 py-0.5 rounded">
              P = {pwrFmt.full}
            </span>
          </div>
        </div>

        {/* Unit Systems Breakdown: Standard vs Engineering */}
        <div className="rounded-xl border border-slate-800 bg-slate-950/50 p-4 mb-5">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-200 mb-2.5">
            <Binary className="h-4 w-4 text-emerald-400" />
            Standard Units vs. Engineering Notation & Multipliers
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
            <div className="rounded-lg border border-blue-500/20 bg-blue-950/20 p-3">
              <div className="flex items-center justify-between text-blue-300 font-semibold mb-1">
                <span>Standard SI Base Units</span>
                <span className="text-[10px] font-mono bg-blue-500/20 px-1.5 py-0.5 rounded">V, A, Ω, W</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Represents quantities strictly in primary SI base units without prefixes. Perfect for raw physics derivations and mathematical dimensional analysis (e.g., <code className="text-blue-200">0.00106 A</code>, <code className="text-blue-200">4700 Ω</code>).
              </p>
            </div>

            <div className="rounded-lg border border-emerald-500/20 bg-emerald-950/20 p-3">
              <div className="flex items-center justify-between text-emerald-300 font-semibold mb-1">
                <span>Engineering Multipliers</span>
                <span className="text-[10px] font-mono bg-emerald-500/20 px-1.5 py-0.5 rounded">mV, mA, kΩ, mW</span>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                Applies standard metric prefix multipliers in powers of <code className="text-emerald-300">10³</code> (<span className="text-emerald-300">µ</span>, <span className="text-emerald-300">m</span>, <span className="text-emerald-300">k</span>, <span className="text-emerald-300">M</span>). Keeps numbers readable and practical for real schematic designs (e.g., <code className="text-emerald-200">1.06 mA</code>, <code className="text-emerald-200">4.70 kΩ</code>).
              </p>
            </div>
          </div>
        </div>

        {/* Core Principles Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          {/* Voltage */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
            <div className="flex items-center gap-1.5 text-blue-400 font-semibold text-xs mb-1">
              <span className="inline-block h-2 w-2 rounded-full bg-blue-400" />
              Voltage (V)
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Electrical potential difference driving charge carriers through the closed loop.
            </p>
          </div>

          {/* Resistance */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
            <div className="flex items-center gap-1.5 text-amber-400 font-semibold text-xs mb-1">
              <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
              Resistance (R)
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Impedance to electron drift, converting electrical energy into thermal heat.
            </p>
          </div>

          {/* Current */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
            <div className="flex items-center gap-1.5 text-cyan-400 font-semibold text-xs mb-1">
              <span className="inline-block h-2 w-2 rounded-full bg-cyan-400" />
              Current (I)
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Rate of charge flow (I = V / R) governing electron drift velocity.
            </p>
          </div>

          {/* Power */}
          <div className="rounded-xl border border-slate-800 bg-slate-950/40 p-3">
            <div className="flex items-center gap-1.5 text-emerald-400 font-semibold text-xs mb-1">
              <span className="inline-block h-2 w-2 rounded-full bg-emerald-400" />
              Power (P)
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed">
              Rate of energy transfer (P = V · I = I²·R = V²/R) dissipated in Joules/second.
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
                displays active LED indicators corresponding to voltage level, with positive
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
                  className="h-4 w-3 rounded-xs shadow-xs border border-slate-700/50"
                  style={{ backgroundColor: color }}
                  title={`Band ${idx + 1}`}
                />
              )
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
