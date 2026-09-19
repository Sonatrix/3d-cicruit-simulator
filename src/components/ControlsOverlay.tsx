import React from 'react';
import {
  Zap,
  Gauge,
  Activity,
  Flame,
  Play,
  Pause,
  RotateCcw,
  Compass,
  Layers,
  HelpCircle,
  Eye,
  Sliders,
  Volume2,
  VolumeX,
  Radio,
} from 'lucide-react';
import { CircuitState, PresetScenario } from '../types';
import { circuitAudio } from '../utils/audioFeedback';

interface ControlsOverlayProps {
  circuitState: CircuitState;
  onChangeState: (updater: (prev: CircuitState) => CircuitState) => void;
  onResetCamera: () => void;
  autoRotate: boolean;
  onToggleAutoRotate: () => void;
  onOpenGuide: () => void;
}

const PRESET_SCENARIOS: PresetScenario[] = [
  {
    id: 'default',
    name: 'Standard Baseline',
    description: 'Balanced 5V source with 10Ω load (0.50A current)',
    voltage: 5,
    resistance: 10,
    badge: 'Default',
  },
  {
    id: 'high-current',
    name: 'Low R (Max Current)',
    description: 'Very low 1Ω resistance creating rapid current rush (5.00A)',
    voltage: 5,
    resistance: 1,
    badge: 'Fast Flow',
  },
  {
    id: 'high-resistance',
    name: 'High R (Thermal Glow)',
    description: '100Ω maximum resistance with bright thermal incandescence',
    voltage: 12,
    resistance: 100,
    badge: 'Hot Resistor',
  },
  {
    id: 'micro-current',
    name: 'Low Voltage / High R',
    description: '1V with 80Ω resistance showing slow drift velocity (12.5mA)',
    voltage: 1,
    resistance: 80,
    badge: 'Slow Drift',
  },
  {
    id: 'logic-3v3',
    name: '3.3V Logic Circuit',
    description: 'Typical embedded logic level at 33Ω (0.10A)',
    voltage: 3.3,
    resistance: 33,
    badge: '3.3V Logic',
  },
];

export default function ControlsOverlay({
  circuitState,
  onChangeState,
  onResetCamera,
  autoRotate,
  onToggleAutoRotate,
  onOpenGuide,
}: ControlsOverlayProps) {
  const { voltage, resistance, current, power, flowDirection, isPaused, speedScale } = circuitState;

  // Format current nicely (either Amps or mA if < 0.1A)
  const currentFormatted =
    current < 0.1 ? `${(current * 1000).toFixed(1)} mA` : `${current.toFixed(3)} A`;

  const handleVoltageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    onChangeState((prev) => {
      const v = Math.max(1, Math.min(12, val));
      const r = prev.resistance;
      const i = v / r;
      return {
        ...prev,
        voltage: Number(v.toFixed(1)),
        current: i,
        power: v * i,
      };
    });
  };

  const handleResistanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    onChangeState((prev) => {
      const r = Math.max(1, Math.min(100, val));
      const v = prev.voltage;
      const i = v / r;
      return {
        ...prev,
        resistance: Math.round(r),
        current: i,
        power: v * i,
      };
    });
  };

  const applyPreset = (preset: PresetScenario) => {
    onChangeState((prev) => {
      const i = preset.voltage / preset.resistance;
      return {
        ...prev,
        voltage: preset.voltage,
        resistance: preset.resistance,
        current: i,
        power: preset.voltage * i,
      };
    });
  };

  return (
    <div className="pointer-events-none absolute inset-0 flex flex-col justify-between p-4 sm:p-6 select-none">
      {/* --- TOP HEADER & LIVE READOUTS BAR --- */}
      <div className="flex flex-col gap-3">
        {/* App Title & Quick Utility Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="pointer-events-auto flex items-center gap-2.5 rounded-xl border border-slate-700/60 bg-slate-900/90 px-3.5 py-2 backdrop-blur-md shadow-lg shadow-black/40">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
              <Zap className="h-4 w-4 fill-cyan-400/40" />
            </div>
            <div>
              <h1 className="text-sm font-semibold tracking-tight text-white flex items-center gap-1.5">
                Ohm's Law 3D Simulation
                <span className="rounded bg-cyan-500/10 px-1.5 py-0.5 text-[10px] font-mono text-cyan-300 border border-cyan-500/20">
                  V = I · R
                </span>
              </h1>
              <p className="text-[11px] text-slate-400">
                Dynamic 3D Electron Flow & Circuit Analysis
              </p>
            </div>
          </div>

          {/* Quick Scene View Controls */}
          <div className="pointer-events-auto flex items-center gap-1.5 rounded-xl border border-slate-700/60 bg-slate-900/90 p-1 backdrop-blur-md shadow-lg shadow-black/40">
            <button
              id="btn-orbit-reset"
              onClick={onResetCamera}
              title="Reset 3D Camera View"
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
              <span className="hidden sm:inline">Reset View</span>
            </button>

            <div className="h-4 w-px bg-slate-800" />

            <button
              id="btn-auto-rotate"
              onClick={onToggleAutoRotate}
              title="Toggle Auto Rotation"
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                autoRotate
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Compass className={`h-3.5 w-3.5 ${autoRotate ? 'animate-spin' : 'text-slate-400'}`} />
              <span className="hidden sm:inline">Auto-Orbit</span>
            </button>

            <div className="h-4 w-px bg-slate-800" />

            {/* Audio Feedback Toggle */}
            <button
              id="btn-toggle-audio"
              onClick={() => {
                circuitAudio.init();
                onChangeState((prev) => ({ ...prev, audioEnabled: !prev.audioEnabled }));
              }}
              title={circuitState.audioEnabled ? 'Mute Circuit Audio Feedback' : 'Enable Reactive Electrical Hum & Static'}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                circuitState.audioEnabled && !isPaused
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              {circuitState.audioEnabled && !isPaused ? (
                <>
                  <Volume2 className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
                  <span className="hidden sm:inline">
                    Hum (~{Math.round(50 + Math.min(1.0, current / 10.0) * 45)}Hz)
                  </span>
                </>
              ) : (
                <>
                  <VolumeX className="h-3.5 w-3.5 text-slate-500" />
                  <span className="hidden sm:inline">Audio Muted</span>
                </>
              )}
            </button>

            <div className="h-4 w-px bg-slate-800" />

            <button
              id="btn-open-guide"
              onClick={onOpenGuide}
              title="Ohm's Law Physics Guide"
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <HelpCircle className="h-3.5 w-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Formula Guide</span>
            </button>
          </div>
        </div>

        {/* Live Metrics Grid Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 max-w-4xl">
          {/* Voltage Card */}
          <div
            id="metric-voltage-card"
            className="pointer-events-auto rounded-xl border border-blue-500/30 bg-slate-900/90 p-3 backdrop-blur-md shadow-md shadow-black/30 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-xs text-blue-400 mb-1">
              <span className="font-mono font-semibold tracking-wider flex items-center gap-1">
                <Gauge className="h-3.5 w-3.5 text-blue-400" /> VOLTAGE (V)
              </span>
              <span className="text-[10px] text-blue-300/70 font-mono">1V - 12V</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold tracking-tight text-white font-mono">
                {voltage.toFixed(1)}
              </span>
              <span className="text-xs font-bold text-blue-400">Volts</span>
            </div>
            <div className="mt-2 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-500 transition-all duration-150"
                style={{ width: `${((voltage - 1) / 11) * 100}%` }}
              />
            </div>
          </div>

          {/* Resistance Card */}
          <div
            id="metric-resistance-card"
            className="pointer-events-auto rounded-xl border border-amber-500/30 bg-slate-900/90 p-3 backdrop-blur-md shadow-md shadow-black/30 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-xs text-amber-400 mb-1">
              <span className="font-mono font-semibold tracking-wider flex items-center gap-1">
                <Flame className="h-3.5 w-3.5 text-amber-400" /> RESISTANCE (R)
              </span>
              <span className="text-[10px] text-amber-300/70 font-mono">1Ω - 100Ω</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold tracking-tight text-white font-mono">
                {resistance}
              </span>
              <span className="text-xs font-bold text-amber-400">Ohms (Ω)</span>
            </div>
            <div className="mt-2 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
              <div
                className="h-full bg-amber-500 transition-all duration-150"
                style={{ width: `${((resistance - 1) / 99) * 100}%` }}
              />
            </div>
          </div>

          {/* Current (I = V / R) Card */}
          <div
            id="metric-current-card"
            className="pointer-events-auto rounded-xl border border-cyan-500/40 bg-slate-900/90 p-3 backdrop-blur-md shadow-md shadow-black/30 ring-1 ring-cyan-500/20 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-xs text-cyan-400 mb-1">
              <span className="font-mono font-semibold tracking-wider flex items-center gap-1">
                <Activity className="h-3.5 w-3.5 text-cyan-400" /> CURRENT (I)
              </span>
              <span className="text-[10px] text-cyan-300/70 font-mono">I = V / R</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold tracking-tight text-cyan-200 font-mono">
                {currentFormatted}
              </span>
            </div>
            <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-slate-400 truncate">
              <span>Drift: {Math.max(1, Math.round(current * 100))}%</span>
              <span className="flex items-center gap-1 text-cyan-300">
                <Radio className={`h-2.5 w-2.5 ${circuitState.audioEnabled && !isPaused ? 'animate-pulse text-cyan-400' : 'text-slate-600'}`} />
                {circuitState.audioEnabled && !isPaused
                  ? `~${Math.round(50 + Math.min(1.0, current / 10.0) * 45)}Hz`
                  : 'Muted'}
              </span>
            </div>
          </div>

          {/* Power (P = V * I) Card */}
          <div
            id="metric-power-card"
            className="pointer-events-auto rounded-xl border border-emerald-500/30 bg-slate-900/90 p-3 backdrop-blur-md shadow-md shadow-black/30 flex flex-col justify-between"
          >
            <div className="flex items-center justify-between text-xs text-emerald-400 mb-1">
              <span className="font-mono font-semibold tracking-wider flex items-center gap-1">
                <Zap className="h-3.5 w-3.5 text-emerald-400" /> POWER (P)
              </span>
              <span className="text-[10px] text-emerald-300/70 font-mono">P = V · I</span>
            </div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-2xl font-bold tracking-tight text-white font-mono">
                {power < 1 ? `${(power * 1000).toFixed(1)} mW` : `${power.toFixed(2)} W`}
              </span>
            </div>
            <div className="mt-2 text-[10px] font-mono text-slate-400 truncate">
              Joule Heat: {power > 5 ? 'High dissipation' : 'Normal dissipation'}
            </div>
          </div>
        </div>
      </div>

      {/* --- BOTTOM CONTROLS DOCK --- */}
      <div className="pointer-events-auto mt-auto flex flex-col gap-3 max-w-4xl mx-auto w-full">
        {/* Preset chips row */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          <span className="text-[11px] font-medium text-slate-400 whitespace-nowrap pl-1 pr-1 flex items-center gap-1">
            <Sliders className="h-3 w-3 text-cyan-400" /> Scenarios:
          </span>
          {PRESET_SCENARIOS.map((preset) => {
            const isMatch = voltage === preset.voltage && resistance === preset.resistance;
            return (
              <button
                key={preset.id}
                id={`btn-preset-${preset.id}`}
                onClick={() => applyPreset(preset)}
                title={preset.description}
                className={`whitespace-nowrap rounded-lg px-2.5 py-1 text-[11px] font-medium transition-all ${
                  isMatch
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                    : 'bg-slate-900/80 text-slate-300 border border-slate-700/60 hover:bg-slate-800 hover:text-white'
                }`}
              >
                {preset.name}
              </button>
            );
          })}
        </div>

        {/* Main interactive Control Panel */}
        <div className="rounded-2xl border border-slate-700/70 bg-slate-900/95 p-4 sm:p-5 backdrop-blur-xl shadow-2xl shadow-black/60">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
            {/* VOLTAGE SLIDER */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="voltage-slider"
                  className="text-xs font-semibold text-slate-200 flex items-center gap-1.5"
                >
                  <span className="inline-block h-2 w-2 rounded-full bg-blue-400" />
                  Battery Voltage (V)
                </label>
                <div className="flex items-center gap-1">
                  <span className="font-mono text-sm font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                    {voltage.toFixed(1)} V
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[11px] font-mono text-slate-500">1V</span>
                <input
                  id="voltage-slider"
                  type="range"
                  min="1"
                  max="12"
                  step="0.5"
                  value={voltage}
                  onChange={handleVoltageChange}
                  className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-800 accent-blue-500 transition-all focus:outline-none"
                />
                <span className="text-[11px] font-mono text-slate-500">12V</span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Low EMF</span>
                <span>Automotive 12V</span>
              </div>
            </div>

            {/* RESISTANCE SLIDER */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="resistance-slider"
                  className="text-xs font-semibold text-slate-200 flex items-center gap-1.5"
                >
                  <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
                  Resistor Value (R)
                </label>
                <div className="flex items-center gap-1">
                  <span className="font-mono text-sm font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    {resistance} Ω
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[11px] font-mono text-slate-500">1Ω</span>
                <input
                  id="resistance-slider"
                  type="range"
                  min="1"
                  max="100"
                  step="1"
                  value={resistance}
                  onChange={handleResistanceChange}
                  className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-800 accent-amber-500 transition-all focus:outline-none"
                />
                <span className="text-[11px] font-mono text-slate-500">100Ω</span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>Free Flow (Low R)</span>
                <span>High Impedance (Thermal Glow)</span>
              </div>
            </div>
          </div>

          {/* Sub-controls bar: Flow Direction, Play/Pause, Speed multiplier */}
          <div className="mt-4 pt-3 border-t border-slate-800/80 flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Flow Direction Toggle */}
            <div className="flex items-center gap-2">
              <span className="text-slate-400 font-medium">Flow View:</span>
              <div className="flex items-center rounded-lg bg-slate-950 p-0.5 border border-slate-800">
                <button
                  id="btn-flow-electron"
                  onClick={() =>
                    onChangeState((prev) => ({ ...prev, flowDirection: 'electron' }))
                  }
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                    flowDirection === 'electron'
                      ? 'bg-cyan-500/20 text-cyan-300 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Electrons (- to +)
                </button>
                <button
                  id="btn-flow-conventional"
                  onClick={() =>
                    onChangeState((prev) => ({ ...prev, flowDirection: 'conventional' }))
                  }
                  className={`rounded-md px-2.5 py-1 text-xs font-medium transition-all ${
                    flowDirection === 'conventional'
                      ? 'bg-amber-500/20 text-amber-300 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  Conventional (+ to -)
                </button>
              </div>
            </div>

            {/* Animation speed & Play/Pause */}
            <div className="flex items-center gap-3 ml-auto">
              <button
                id="btn-play-pause"
                onClick={() => onChangeState((prev) => ({ ...prev, isPaused: !prev.isPaused }))}
                className="flex items-center gap-1.5 rounded-lg bg-slate-800 px-3 py-1.5 font-medium text-slate-200 hover:bg-slate-700 hover:text-white transition-colors"
              >
                {isPaused ? (
                  <>
                    <Play className="h-3.5 w-3.5 fill-current text-emerald-400" />
                    <span>Resume</span>
                  </>
                ) : (
                  <>
                    <Pause className="h-3.5 w-3.5 fill-current text-amber-400" />
                    <span>Pause Flow</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-1.5 text-slate-400">
                <span className="text-[11px]">Speed:</span>
                {[1, 2].map((multiplier) => (
                  <button
                    key={multiplier}
                    id={`btn-speed-${multiplier}x`}
                    onClick={() =>
                      onChangeState((prev) => ({ ...prev, speedScale: multiplier }))
                    }
                    className={`rounded px-1.5 py-0.5 text-[11px] font-mono transition-colors ${
                      speedScale === multiplier
                        ? 'bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30'
                        : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    {multiplier}x
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
