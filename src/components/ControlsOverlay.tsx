import React, { useState, useEffect, useRef } from 'react';
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
  EyeOff,
  Sliders,
  Volume2,
  VolumeX,
  Radio,
  Binary,
  X,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Maximize2,
  Minimize2,
  Lightbulb,
} from 'lucide-react';
import { CircuitState, PresetScenario, UnitNotation } from '../types';
import { circuitAudio } from '../utils/audioFeedback';
import OscilloscopeView from './OscilloscopeView';
import {
  formatVoltage,
  formatResistance,
  formatCurrent,
  formatPower,
} from '../utils/unitFormatting';

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
    description: 'Balanced 5V source with 10Ω load (500 mA / 2.50 W)',
    voltage: 5,
    resistance: 10,
    badge: 'Default',
  },
  {
    id: 'pullup-4k7',
    name: '4.7 kΩ Pull-Up',
    description: 'Classic microcontroller pull-up resistor with micro-current (1.06 mA)',
    voltage: 5,
    resistance: 4700,
    badge: '4.7 kΩ High-Z',
  },
  {
    id: 'led-limiter',
    name: '1.0 kΩ LED Limiter',
    description: '3.3V logic circuit with 1 kΩ current limiting resistor (3.30 mA)',
    voltage: 3.3,
    resistance: 1000,
    badge: '1 kΩ Logic',
  },
  {
    id: 'subvolt-sensor',
    name: '250 mV Millivolt Sensor',
    description: 'Low-EMF thermocouple / bridge sensor signal (25.0 mA)',
    voltage: 0.25,
    resistance: 10,
    badge: '250 mV Sensor',
  },
  {
    id: 'high-current',
    name: 'Low R (Max Current)',
    description: 'Very low 1Ω resistance creating rapid current rush (5.00 A)',
    voltage: 5,
    resistance: 1,
    badge: 'Fast Flow',
  },
  {
    id: 'high-resistance',
    name: '100Ω Incandescent',
    description: '12V maximum standard resistance with thermal glow (120 mA, 1.44 W)',
    voltage: 12,
    resistance: 100,
    badge: 'Hot Resistor',
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
  const {
    voltage,
    resistance,
    current,
    power,
    flowDirection,
    unitNotation,
    isPaused,
    speedScale,
    showPowerEquation,
    showMetricsHUD,
    showOscilloscope,
    showPresets,
    show3DLabels,
    showParticles,
    showFieldEffects,
    showWireArrows,
    showLedBulb,
    ledBulbColor,
  } = circuitState;

  const [showComponentsMenu, setShowComponentsMenu] = useState<boolean>(false);
  const [controlsCollapsed, setControlsCollapsed] = useState<boolean>(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close components menu when clicking outside
  useEffect(() => {
    const handlePointerDownOutside = (e: MouseEvent) => {
      if (
        showComponentsMenu &&
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        !(e.target as HTMLElement).closest('#btn-toggle-components-menu')
      ) {
        setShowComponentsMenu(false);
      }
    };
    document.addEventListener('mousedown', handlePointerDownOutside);
    return () => document.removeEventListener('mousedown', handlePointerDownOutside);
  }, [showComponentsMenu]);

  const visibleComponentsCount = [
    showPowerEquation,
    showMetricsHUD,
    showOscilloscope,
    showPresets,
    show3DLabels,
    showParticles,
    showFieldEffects,
    showWireArrows,
    showLedBulb,
  ].filter(Boolean).length;

  const handleShowAllComponents = () => {
    onChangeState((prev) => ({
      ...prev,
      showPowerEquation: true,
      showMetricsHUD: true,
      showOscilloscope: true,
      showPresets: true,
      show3DLabels: true,
      showParticles: true,
      showFieldEffects: true,
      showWireArrows: true,
      showLedBulb: true,
    }));
  };

  const handleZenMode = () => {
    onChangeState((prev) => ({
      ...prev,
      showPowerEquation: false,
      showMetricsHUD: false,
      showOscilloscope: false,
      showPresets: false,
    }));
  };

  // Range multipliers to handle a wide range of values gracefully
  const [resMultiplier, setResMultiplier] = useState<1 | 10 | 100>(() => {
    if (resistance > 1000) return 100;
    if (resistance > 100) return 10;
    return 1;
  });

  const [voltageRange, setVoltageRange] = useState<'low' | 'std' | 'high'>(() => {
    if (voltage < 1.0) return 'low';
    if (voltage > 12.0) return 'high';
    return 'std';
  });

  // Keep slider range in sync if resistance or voltage shifts externally via presets
  useEffect(() => {
    if (resistance > 1000 && resMultiplier !== 100) {
      setResMultiplier(100);
    } else if (resistance > 100 && resistance <= 1000 && resMultiplier === 1) {
      setResMultiplier(10);
    }
  }, [resistance]);

  useEffect(() => {
    if (voltage < 1.0 && voltageRange !== 'low') {
      setVoltageRange('low');
    } else if (voltage > 12.0 && voltageRange !== 'high') {
      setVoltageRange('high');
    }
  }, [voltage]);

  // Formatted quantities using selected notation
  const voltFmt = formatVoltage(voltage, unitNotation);
  const resFmt = formatResistance(resistance, unitNotation);
  const curFmt = formatCurrent(current, unitNotation);
  const pwrFmt = formatPower(power, unitNotation);

  const powerPercent = Math.min(100, Math.max(2, Math.round((power / 25) * 100)));
  const isHighPower = power > 10;
  const isMediumPower = power > 2;

  // Voltage slider configuration based on range
  const vMin = voltageRange === 'low' ? 0.1 : voltageRange === 'high' ? 5 : 1;
  const vMax = voltageRange === 'low' ? 2.0 : voltageRange === 'high' ? 24 : 12;
  const vStep = voltageRange === 'low' ? 0.05 : voltageRange === 'high' ? 0.5 : 0.5;

  // Resistance slider configuration based on multiplier
  const rMin = resMultiplier === 1 ? 1 : resMultiplier === 10 ? 10 : 100;
  const rMax = resMultiplier === 1 ? 100 : resMultiplier === 10 ? 1000 : 10000;
  const rStep = resMultiplier === 1 ? 1 : resMultiplier === 10 ? 10 : 100;

  const handleVoltageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    onChangeState((prev) => {
      const v = Math.max(vMin, Math.min(vMax, val));
      const r = prev.resistance;
      const i = v / r;
      return {
        ...prev,
        voltage: Number(v.toFixed(2)),
        current: i,
        power: v * i,
      };
    });
  };

  const handleResistanceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    onChangeState((prev) => {
      const r = Math.max(rMin, Math.min(rMax, val));
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

  const handleSelectResMultiplier = (mult: 1 | 10 | 100) => {
    setResMultiplier(mult);
    const newMin = mult === 1 ? 1 : mult === 10 ? 10 : 100;
    const newMax = mult === 1 ? 100 : mult === 10 ? 1000 : 10000;

    // Clamp current resistance if it falls outside the new range
    if (resistance < newMin || resistance > newMax) {
      const clampedR = Math.max(newMin, Math.min(newMax, resistance * (mult / resMultiplier)));
      onChangeState((prev) => {
        const i = prev.voltage / clampedR;
        return {
          ...prev,
          resistance: Math.round(clampedR),
          current: i,
          power: prev.voltage * i,
        };
      });
    }
  };

  const handleSelectVoltageRange = (range: 'low' | 'std' | 'high') => {
    setVoltageRange(range);
    const targetMin = range === 'low' ? 0.1 : range === 'high' ? 5 : 1;
    const targetMax = range === 'low' ? 2.0 : range === 'high' ? 24 : 12;

    if (voltage < targetMin || voltage > targetMax) {
      const clampedV = range === 'low' ? 0.5 : range === 'high' ? 18 : 5;
      onChangeState((prev) => {
        const i = clampedV / prev.resistance;
        return {
          ...prev,
          voltage: clampedV,
          current: i,
          power: clampedV * i,
        };
      });
    }
  };

  const applyPreset = (preset: PresetScenario) => {
    if (preset.resistance > 1000) {
      setResMultiplier(100);
    } else if (preset.resistance > 100) {
      setResMultiplier(10);
    } else {
      setResMultiplier(1);
    }

    if (preset.voltage < 1.0) {
      setVoltageRange('low');
    } else if (preset.voltage > 12.0) {
      setVoltageRange('high');
    } else {
      setVoltageRange('std');
    }

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
    <div className="pointer-events-none fixed inset-0 flex flex-col justify-between p-3 sm:p-5 z-20 select-none">
      {/* --- TOP BAR & LIVE METRICS HUD --- */}
      <div className="flex flex-col gap-2.5 max-w-4xl mx-auto w-full">
        {/* Navigation & Utilities Header */}
        <div className="pointer-events-auto flex flex-wrap items-center justify-between gap-2.5 rounded-2xl border border-slate-700/70 bg-slate-900/90 p-2.5 sm:px-4 backdrop-blur-xl shadow-xl shadow-black/40">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 shadow-inner">
              <Zap className="h-5 w-5 fill-current" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold tracking-tight text-white flex items-center gap-2">
                Ohm's Law 3D
                <span className="rounded-full bg-cyan-500/20 px-2 py-0.5 text-[10px] font-mono font-semibold text-cyan-300 border border-cyan-500/30 hidden xs:inline-block">
                  V = I · R
                </span>
              </h1>
              <p className="text-[11px] text-slate-400 hidden sm:block">
                Interactive electromagnetic circuit simulator & live physics engine
              </p>
            </div>
          </div>

          {/* Quick HUD controls */}
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* UNIT SYSTEM TOGGLE: Standard (V, A, Ω) vs Engineering (mV, mA, kΩ) */}
            <div
              id="unit-system-toggle"
              className="flex items-center rounded-lg bg-slate-950/90 p-0.5 border border-slate-800 shadow-inner"
              title="Toggle between Standard SI base units (V, A, Ω) and Engineering notation (mV, mA, kΩ) to handle wide value ranges gracefully"
            >
              <button
                id="btn-unit-standard"
                onClick={() => onChangeState((prev) => ({ ...prev, unitNotation: 'standard' }))}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-mono font-medium transition-all ${
                  unitNotation === 'standard'
                    ? 'bg-blue-500/25 text-blue-300 border border-blue-500/40 shadow-xs font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    unitNotation === 'standard' ? 'bg-blue-400' : 'bg-slate-600'
                  }`}
                />
                <span>Standard</span>
                <span className="hidden md:inline text-[10px] text-slate-400 font-normal">
                  (V, A, Ω)
                </span>
              </button>
              <button
                id="btn-unit-engineering"
                onClick={() => onChangeState((prev) => ({ ...prev, unitNotation: 'engineering' }))}
                className={`flex items-center gap-1.5 rounded-md px-2.5 py-1 text-xs font-mono font-medium transition-all ${
                  unitNotation === 'engineering'
                    ? 'bg-emerald-500/25 text-emerald-300 border border-emerald-500/40 shadow-xs font-semibold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    unitNotation === 'engineering' ? 'bg-emerald-400' : 'bg-slate-600'
                  }`}
                />
                <span>Engineering</span>
                <span className="hidden md:inline text-[10px] text-slate-400 font-normal">
                  (mV, mA, kΩ)
                </span>
              </button>
            </div>

            <div className="h-4 w-px bg-slate-800 hidden sm:block" />

            {/* Camera Reset */}
            <button
              id="btn-reset-camera"
              onClick={onResetCamera}
              title="Reset 3D Camera View"
              className="flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <RotateCcw className="h-3.5 w-3.5 text-slate-400" />
              <span className="hidden md:inline">Reset View</span>
            </button>

            {/* Auto-Rotation */}
            <button
              id="btn-toggle-autorotate"
              onClick={onToggleAutoRotate}
              title="Toggle Auto Rotation"
              className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${
                autoRotate
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-300 hover:bg-slate-800 hover:text-white'
              }`}
            >
              <Compass className={`h-3.5 w-3.5 ${autoRotate ? 'animate-spin' : 'text-slate-400'}`} />
              <span className="hidden md:inline">Orbit</span>
            </button>

            {/* Audio Feedback Toggle */}
            <button
              id="btn-toggle-audio"
              onClick={() => {
                circuitAudio.init();
                onChangeState((prev) => ({ ...prev, audioEnabled: !prev.audioEnabled }));
              }}
              title={circuitState.audioEnabled ? 'Mute Circuit Audio Feedback' : 'Enable Reactive Electrical Hum & Static'}
              className={`flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-medium transition-colors ${
                circuitState.audioEnabled && !isPaused
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              {circuitState.audioEnabled && !isPaused ? (
                <>
                  <Volume2 className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
                  <span className="hidden lg:inline text-[11px] font-mono">
                    ~{Math.round(50 + Math.min(1.0, current / 10.0) * 45)}Hz
                  </span>
                </>
              ) : (
                <>
                  <VolumeX className="h-3.5 w-3.5 text-slate-500" />
                </>
              )}
            </button>

            {/* Oscilloscope View Toggle */}
            <button
              id="btn-toggle-oscilloscope"
              onClick={() =>
                onChangeState((prev) => ({ ...prev, showOscilloscope: !prev.showOscilloscope }))
              }
              title={showOscilloscope ? 'Hide Oscilloscope (D3 Waveform)' : 'Show Oscilloscope (D3 Waveform)'}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                showOscilloscope
                  ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Activity className={`h-3.5 w-3.5 ${showOscilloscope ? 'text-cyan-400 animate-pulse' : 'text-slate-500'}`} />
              <span className="hidden sm:inline">Scope</span>
            </button>

            {/* Optional LED Bulb Current Flow Toggle Button */}
            <button
              id="btn-toggle-led-bulb-top"
              onClick={() =>
                onChangeState((prev) => ({ ...prev, showLedBulb: !prev.showLedBulb }))
              }
              title={showLedBulb ? 'Hide LED Bulb Indicator' : 'Show Optional LED Bulb (Visual Current Flow Load)'}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                showLedBulb
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-xs'
                  : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
              }`}
            >
              <Lightbulb className={`h-3.5 w-3.5 ${showLedBulb ? 'text-amber-400 fill-amber-400/25' : 'text-slate-500'}`} />
              <span className="hidden sm:inline">LED Bulb</span>
              {showLedBulb && current > 0 && !isPaused && (
                <span className="text-[10px] font-mono text-amber-300 hidden md:inline">
                  {Math.round(Math.min(100, Math.max(8, (current / 2.0) * 100)))}%
                </span>
              )}
            </button>

            {/* Components & Display Visibility Menu */}
            <div className="relative">
              <button
                id="btn-toggle-components-menu"
                onClick={() => setShowComponentsMenu((prev) => !prev)}
                title="Toggle UI & 3D Components visibility (Power Equation, Metrics HUD, Oscilloscope, 3D Labels, etc.)"
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                  showComponentsMenu
                    ? 'bg-cyan-500/25 text-cyan-300 border border-cyan-500/40 shadow-xs'
                    : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                }`}
              >
                <Layers className="h-3.5 w-3.5 text-cyan-400" />
                <span className="hidden sm:inline">Components</span>
                <span className="rounded-full bg-slate-950/80 px-1.5 py-0.5 text-[10px] font-mono text-cyan-300 border border-slate-800">
                  {visibleComponentsCount}/9
                </span>
                <ChevronDown className={`h-3 w-3 text-slate-400 transition-transform ${showComponentsMenu ? 'rotate-180' : ''}`} />
              </button>

              {/* Popover Menu */}
              {showComponentsMenu && (
                <div
                  ref={menuRef}
                  id="components-visibility-menu"
                  className="absolute right-0 top-full mt-2 w-80 sm:w-96 rounded-2xl border border-slate-700/80 bg-slate-900/98 p-4 backdrop-blur-2xl shadow-2xl shadow-black/80 z-50 animate-in fade-in zoom-in-95 duration-150"
                >
                  {/* Header */}
                  <div className="flex items-center justify-between border-b border-slate-800 pb-2.5 mb-3">
                    <div className="flex items-center gap-2">
                      <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                        <Layers className="h-4 w-4" />
                      </div>
                      <div>
                        <h3 className="text-xs font-bold text-white tracking-tight flex items-center gap-1.5">
                          Components & Visibility
                        </h3>
                        <p className="text-[10px] text-slate-400">
                          Toggle UI overlays & 3D visual elements
                        </p>
                      </div>
                    </div>
                    <button
                      id="btn-close-components-menu"
                      onClick={() => setShowComponentsMenu(false)}
                      className="rounded-md p-1 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  {/* Preset quick actions */}
                  <div className="grid grid-cols-2 gap-2 mb-3">
                    <button
                      id="btn-comp-show-all"
                      onClick={handleShowAllComponents}
                      className="flex items-center justify-center gap-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 px-2 py-1.5 text-[11px] font-medium text-slate-200 hover:text-white transition-colors"
                    >
                      <Sparkles className="h-3 w-3 text-cyan-400" />
                      <span>Show All (8/8)</span>
                    </button>
                    <button
                      id="btn-comp-zen-mode"
                      onClick={handleZenMode}
                      className="flex items-center justify-center gap-1.5 rounded-lg bg-slate-800/80 hover:bg-slate-800 border border-slate-700/60 px-2 py-1.5 text-[11px] font-medium text-slate-200 hover:text-white transition-colors"
                    >
                      <EyeOff className="h-3 w-3 text-amber-400" />
                      <span>Zen / 3D Mode</span>
                    </button>
                  </div>

                  {/* Section 1: UI Overlays */}
                  <div className="space-y-1 mb-3">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 mb-1">
                      UI Overlays & Instrumentation
                    </div>

                    {/* Power Equation Toggle - specifically requested */}
                    <div className="flex items-center justify-between rounded-xl bg-slate-950/60 px-2.5 py-1.5 border border-slate-800/80 hover:border-slate-700/80 transition-colors">
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-emerald-500/20 text-emerald-400">
                          <Zap className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate-200">Power Equation Ribbon</div>
                          <div className="text-[10px] text-slate-400 font-mono">P = V · I ({pwrFmt.full})</div>
                        </div>
                      </div>
                      <button
                        id="toggle-comp-power-equation"
                        onClick={() =>
                          onChangeState((prev) => ({ ...prev, showPowerEquation: !prev.showPowerEquation }))
                        }
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          showPowerEquation ? 'bg-emerald-500' : 'bg-slate-800'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                            showPowerEquation ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Metrics HUD Cards Toggle */}
                    <div className="flex items-center justify-between rounded-xl bg-slate-950/60 px-2.5 py-1.5 border border-slate-800/80 hover:border-slate-700/80 transition-colors">
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-blue-500/20 text-blue-400">
                          <Gauge className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate-200">Metrics HUD Cards</div>
                          <div className="text-[10px] text-slate-400">Voltage, Resistance, Current & Power</div>
                        </div>
                      </div>
                      <button
                        id="toggle-comp-metrics-hud"
                        onClick={() =>
                          onChangeState((prev) => ({ ...prev, showMetricsHUD: !prev.showMetricsHUD }))
                        }
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          showMetricsHUD ? 'bg-blue-500' : 'bg-slate-800'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                            showMetricsHUD ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Oscilloscope Toggle */}
                    <div className="flex items-center justify-between rounded-xl bg-slate-950/60 px-2.5 py-1.5 border border-slate-800/80 hover:border-slate-700/80 transition-colors">
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-cyan-500/20 text-cyan-400">
                          <Activity className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate-200">Oscilloscope Waveform</div>
                          <div className="text-[10px] text-slate-400">Real-time D3.js V(t) & I(t) traces</div>
                        </div>
                      </div>
                      <button
                        id="toggle-comp-oscilloscope"
                        onClick={() =>
                          onChangeState((prev) => ({ ...prev, showOscilloscope: !prev.showOscilloscope }))
                        }
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          showOscilloscope ? 'bg-cyan-500' : 'bg-slate-800'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                            showOscilloscope ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Scenario Presets Bar Toggle */}
                    <div className="flex items-center justify-between rounded-xl bg-slate-950/60 px-2.5 py-1.5 border border-slate-800/80 hover:border-slate-700/80 transition-colors">
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-500/20 text-amber-400">
                          <Sliders className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate-200">Scenario Presets Bar</div>
                          <div className="text-[10px] text-slate-400">Preconfigured circuit scenarios</div>
                        </div>
                      </div>
                      <button
                        id="toggle-comp-presets"
                        onClick={() =>
                          onChangeState((prev) => ({ ...prev, showPresets: !prev.showPresets }))
                        }
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          showPresets ? 'bg-amber-500' : 'bg-slate-800'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                            showPresets ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Section 2: 3D Visual Scene Elements */}
                  <div className="space-y-1">
                    <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 px-1 mb-1">
                      3D Visual Elements
                    </div>

                    {/* 3D Billboard Labels */}
                    <div className="flex items-center justify-between rounded-xl bg-slate-950/60 px-2.5 py-1.5 border border-slate-800/80 hover:border-slate-700/80 transition-colors">
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-sky-500/20 text-sky-400">
                          <Eye className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate-200">3D Floating Labels</div>
                          <div className="text-[10px] text-slate-400">Battery & Resistor billboard tags</div>
                        </div>
                      </div>
                      <button
                        id="toggle-comp-3d-labels"
                        onClick={() =>
                          onChangeState((prev) => ({ ...prev, show3DLabels: !prev.show3DLabels }))
                        }
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          show3DLabels ? 'bg-sky-500' : 'bg-slate-800'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                            show3DLabels ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Charge Carrier Particles */}
                    <div className="flex items-center justify-between rounded-xl bg-slate-950/60 px-2.5 py-1.5 border border-slate-800/80 hover:border-slate-700/80 transition-colors">
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-cyan-500/20 text-cyan-400">
                          <Radio className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate-200">Charge Carrier Particles</div>
                          <div className="text-[10px] text-slate-400">Moving electron / current flow spheres</div>
                        </div>
                      </div>
                      <button
                        id="toggle-comp-particles"
                        onClick={() =>
                          onChangeState((prev) => ({ ...prev, showParticles: !prev.showParticles }))
                        }
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          showParticles ? 'bg-cyan-500' : 'bg-slate-800'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                            showParticles ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Thermal Shimmer / Field FX */}
                    <div className="flex items-center justify-between rounded-xl bg-slate-950/60 px-2.5 py-1.5 border border-slate-800/80 hover:border-slate-700/80 transition-colors">
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-orange-500/20 text-orange-400">
                          <Flame className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate-200">Thermal Heat Shimmer</div>
                          <div className="text-[10px] text-slate-400">Heat particles rising from resistor</div>
                        </div>
                      </div>
                      <button
                        id="toggle-comp-field-effects"
                        onClick={() =>
                          onChangeState((prev) => ({ ...prev, showFieldEffects: !prev.showFieldEffects }))
                        }
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          showFieldEffects ? 'bg-orange-500' : 'bg-slate-800'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                            showFieldEffects ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>

                    {/* Wire Direction Arrows */}
                    <div className="flex items-center justify-between rounded-xl bg-slate-950/60 px-2.5 py-1.5 border border-slate-800/80 hover:border-slate-700/80 transition-colors">
                      <div className="flex items-center gap-2">
                        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-violet-500/20 text-violet-400">
                          <Compass className="h-3.5 w-3.5" />
                        </div>
                        <div>
                          <div className="text-xs font-semibold text-slate-200">Wire Direction Arrows</div>
                          <div className="text-[10px] text-slate-400">Conductor chevron path indicators</div>
                        </div>
                      </div>
                      <button
                        id="toggle-comp-wire-arrows"
                        onClick={() =>
                          onChangeState((prev) => ({ ...prev, showWireArrows: !prev.showWireArrows }))
                        }
                        className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                          showWireArrows ? 'bg-violet-500' : 'bg-slate-800'
                        }`}
                      >
                        <span
                          className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                            showWireArrows ? 'translate-x-4' : 'translate-x-0'
                          }`}
                        />
                      </button>
                    </div>
                    {/* Optional LED Bulb Current Indicator */}
                    <div className="flex flex-col gap-1.5 rounded-xl bg-slate-950/60 p-2.5 border border-slate-800/80 hover:border-slate-700/80 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="flex h-6 w-6 items-center justify-center rounded-md bg-amber-500/20 text-amber-400">
                            <Lightbulb className="h-3.5 w-3.5" />
                          </div>
                          <div>
                            <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                              <span>LED Bulb Load</span>
                              {showLedBulb && (
                                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">
                                  {!isPaused && current > 0 ? `${Math.round(Math.min(100, Math.max(8, (current / 2.0) * 100)))}% Glow` : 'OFF'}
                                </span>
                              )}
                            </div>
                            <div className="text-[10px] text-slate-400">Visual physical load showing current flow</div>
                          </div>
                        </div>
                        <button
                          id="toggle-comp-led-bulb"
                          onClick={() =>
                            onChangeState((prev) => ({ ...prev, showLedBulb: !prev.showLedBulb }))
                          }
                          className={`relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                            showLedBulb ? 'bg-amber-500' : 'bg-slate-800'
                          }`}
                        >
                          <span
                            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ease-in-out ${
                              showLedBulb ? 'translate-x-4' : 'translate-x-0'
                            }`}
                          />
                        </button>
                      </div>

                      {/* Color Selector for LED Bulb */}
                      {showLedBulb && (
                        <div className="flex items-center justify-between pt-1.5 border-t border-slate-800/60 text-[10px]">
                          <span className="text-slate-400">Diode Color:</span>
                          <div className="flex items-center gap-1">
                            {(['amber', 'emerald', 'cyan', 'ruby'] as const).map((color) => {
                              const isSelected = (ledBulbColor || 'amber') === color;
                              const colorDots: Record<string, string> = {
                                amber: 'bg-amber-400',
                                emerald: 'bg-emerald-400',
                                cyan: 'bg-cyan-400',
                                ruby: 'bg-rose-500',
                              };
                              return (
                                <button
                                  key={color}
                                  id={`btn-led-color-${color}`}
                                  onClick={() =>
                                    onChangeState((prev) => ({ ...prev, ledBulbColor: color }))
                                  }
                                  className={`flex items-center gap-1 px-1.5 py-0.5 rounded capitalize transition-all ${
                                    isSelected
                                      ? 'bg-slate-800 text-white border border-slate-700 font-semibold shadow-xs'
                                      : 'text-slate-400 hover:text-slate-300'
                                  }`}
                                >
                                  <span className={`h-1.5 w-1.5 rounded-full ${colorDots[color]}`} />
                                  <span>{color}</span>
                                </button>
                              );
                            })}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Physics Formula Guide */}
            <button
              id="btn-open-guide"
              onClick={onOpenGuide}
              title="Ohm's Law Physics Guide"
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:bg-slate-800 hover:text-white transition-colors"
            >
              <HelpCircle className="h-3.5 w-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Guide</span>
            </button>
          </div>
        </div>

        {/* Quick Restore Pills if elements are hidden */}
        {(!showMetricsHUD || !showPowerEquation || !showLedBulb) && (
          <div className="flex flex-wrap items-center gap-2 pointer-events-auto">
            {!showMetricsHUD && (
              <button
                id="btn-restore-metrics-hud"
                onClick={() => onChangeState((prev) => ({ ...prev, showMetricsHUD: true }))}
                className="flex items-center gap-1.5 rounded-lg bg-slate-900/90 border border-blue-500/40 px-2.5 py-1 text-xs font-mono text-blue-300 hover:bg-blue-950/70 shadow-md transition-colors"
                title="Restore Live Metrics HUD Cards"
              >
                <Eye className="h-3 w-3 text-blue-400" />
                <span>Show Metrics HUD</span>
              </button>
            )}
            {!showPowerEquation && (
              <button
                id="btn-restore-power-equation"
                onClick={() => onChangeState((prev) => ({ ...prev, showPowerEquation: true }))}
                className="flex items-center gap-1.5 rounded-lg bg-slate-900/90 border border-emerald-500/40 px-2.5 py-1 text-xs font-mono text-emerald-300 hover:bg-emerald-950/70 shadow-md transition-colors"
                title="Restore Power Equation Banner (P = V · I)"
              >
                <Eye className="h-3 w-3 text-emerald-400" />
                <span>Show Power Equation</span>
              </button>
            )}
            {!showLedBulb && (
              <button
                id="btn-restore-led-bulb"
                onClick={() => onChangeState((prev) => ({ ...prev, showLedBulb: true }))}
                className="flex items-center gap-1.5 rounded-lg bg-slate-900/90 border border-amber-500/40 px-2.5 py-1 text-xs font-mono text-amber-300 hover:bg-amber-950/70 shadow-md transition-colors"
                title="Show 3D LED Bulb Load Indicator"
              >
                <Lightbulb className="h-3 w-3 text-amber-400" />
                <span>Show LED Bulb</span>
              </button>
            )}
          </div>
        )}

        {/* Live Metrics Grid Cards */}
        {showMetricsHUD && (
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
                <span className="text-[10px] text-blue-300/70 font-mono">
                  {unitNotation === 'engineering' ? 'SI Prefix' : 'Base SI'}
                </span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold tracking-tight text-white font-mono">
                  {voltFmt.value}
                </span>
                <span className="text-xs font-bold text-blue-400">{voltFmt.unit}</span>
              </div>
              <div className="mt-2 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all duration-150"
                  style={{ width: `${Math.min(100, Math.max(5, (voltage / vMax) * 100))}%` }}
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
                <span className="text-[10px] text-amber-300/70 font-mono">
                  {unitNotation === 'engineering' ? 'Auto-kΩ' : 'Base Ω'}
                </span>
              </div>
              <div className="flex items-baseline gap-1.5">
                <span className="text-2xl font-bold tracking-tight text-white font-mono">
                  {resFmt.value}
                </span>
                <span className="text-xs font-bold text-amber-400">{resFmt.unit}</span>
              </div>
              <div className="mt-2 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className="h-full bg-amber-500 transition-all duration-150"
                  style={{ width: `${Math.min(100, Math.max(5, (resistance / rMax) * 100))}%` }}
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
                  {curFmt.value}
                </span>
                <span className="text-xs font-bold text-cyan-400">{curFmt.unit}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-slate-400 truncate">
                <span>Drift: {Math.max(1, Math.round(Math.min(10, current) * 10))}%</span>
                <span className="flex items-center gap-1 text-cyan-300">
                  <Radio
                    className={`h-2.5 w-2.5 ${
                      circuitState.audioEnabled && !isPaused
                        ? 'animate-pulse text-cyan-400'
                        : 'text-slate-600'
                    }`}
                  />
                  {circuitState.audioEnabled && !isPaused
                    ? `~${Math.round(50 + Math.min(1.0, current / 10.0) * 45)}Hz`
                    : 'Muted'}
                </span>
              </div>
            </div>

            {/* Power (P = V * I) Card */}
            <div
              id="metric-power-card"
              className={`pointer-events-auto rounded-xl border ${
                isHighPower
                  ? 'border-red-500/40 ring-1 ring-red-500/20'
                  : isMediumPower
                  ? 'border-amber-500/40 ring-1 ring-amber-500/20'
                  : 'border-emerald-500/30'
              } bg-slate-900/90 p-3 backdrop-blur-md shadow-md shadow-black/30 flex flex-col justify-between transition-colors`}
            >
              <div className="flex items-center justify-between text-xs text-emerald-400 mb-1">
                <span className="font-mono font-semibold tracking-wider flex items-center gap-1">
                  <Zap className="h-3.5 w-3.5 text-emerald-400" /> POWER (P)
                </span>
                <span className="text-[10px] text-emerald-300/80 font-mono">P = V · I</span>
              </div>
              <div className="flex items-baseline justify-between gap-1.5">
                <div className="flex items-baseline gap-1.5">
                  <span className="text-2xl font-bold tracking-tight text-white font-mono">
                    {pwrFmt.value}
                  </span>
                  <span className="text-xs font-bold text-emerald-400">{pwrFmt.unit}</span>
                </div>
                <span className="text-[10px] font-mono text-slate-400">
                  {power < 1 ? `${(power * 1000).toFixed(0)} mJ/s` : `${power.toFixed(1)} J/s`}
                </span>
              </div>
              <div className="mt-2 flex items-center justify-between text-[10px] font-mono text-slate-400 truncate">
                <span className="truncate">
                  {voltFmt.full} × {curFmt.full}
                </span>
                <span
                  className={`font-medium ${
                    isHighPower
                      ? 'text-red-400'
                      : isMediumPower
                      ? 'text-amber-300'
                      : 'text-emerald-300'
                  }`}
                >
                  {isHighPower ? 'Heavy Heat' : isMediumPower ? 'Moderate' : 'Low Loss'}
                </span>
              </div>
              <div className="mt-1.5 h-1.5 w-full bg-slate-800 rounded-full overflow-hidden">
                <div
                  className={`h-full ${
                    isHighPower
                      ? 'bg-red-500'
                      : isMediumPower
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  } transition-all duration-150`}
                  style={{ width: `${powerPercent}%` }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Real-Time Power Equation & Relationship Inspector Ribbon */}
        {showPowerEquation && (
          <div
            id="power-relationship-banner"
            className="pointer-events-auto rounded-xl border border-slate-700/70 bg-slate-900/90 px-3 py-2 sm:px-4 sm:py-2.5 backdrop-blur-md shadow-lg shadow-black/40 max-w-4xl"
          >
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              {/* Live Formula Display: P = V * I */}
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 text-xs font-mono">
                <span className="text-slate-400 font-sans font-semibold text-[11px] uppercase tracking-wider flex items-center gap-1.5 mr-1">
                  <Zap className="h-3.5 w-3.5 text-emerald-400" />
                  Power Equation:
                </span>

                {/* Voltage V */}
                <div
                  title="Voltage (Potential Difference)"
                  className="inline-flex items-center gap-1 bg-blue-500/15 border border-blue-500/30 text-blue-300 px-2 py-0.5 rounded font-bold"
                >
                  <span>V</span>
                  <span className="text-slate-400">=</span>
                  <span>{voltFmt.full}</span>
                </div>

                <span className="text-slate-500 font-bold">×</span>

                {/* Current I */}
                <div
                  title="Current (Charge Flow Rate)"
                  className="inline-flex items-center gap-1 bg-cyan-500/15 border border-cyan-500/30 text-cyan-300 px-2 py-0.5 rounded font-bold"
                >
                  <span>I</span>
                  <span className="text-slate-400">=</span>
                  <span>{curFmt.full}</span>
                </div>

                <span className="text-slate-500 font-bold">=</span>

                {/* Power P */}
                <div
                  title="Power Dissipated (P = V * I)"
                  className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded font-bold transition-colors ${
                    isHighPower
                      ? 'bg-red-500/20 text-red-300 border border-red-500/40 shadow-sm shadow-red-500/20'
                      : isMediumPower
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}
                >
                  <span>P</span>
                  <span className="text-slate-400">=</span>
                  <span className="text-white">{pwrFmt.full}</span>
                </div>
              </div>

              {/* Equivalent Formulations, Physical Principle & Hide Button */}
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="hidden md:flex items-center gap-2.5 text-[11px] font-mono text-slate-400">
                  <span className="text-slate-600">|</span>
                  <span
                    title="Joule's Heating Law: P = I² · R"
                    className="hover:text-slate-200 transition-colors cursor-help"
                  >
                    <strong className="text-slate-300">I²·R:</strong> ({curFmt.full})² × {resFmt.full}
                  </span>
                  <span className="text-slate-600">|</span>
                  <span
                    title="Potential Dissipation: P = V² / R"
                    className="hover:text-slate-200 transition-colors cursor-help"
                  >
                    <strong className="text-slate-300">V²/R:</strong> ({voltFmt.full})² / {resFmt.full}
                  </span>
                </div>

                {/* Hide Power Equation Button */}
                <button
                  id="btn-hide-power-equation"
                  onClick={() =>
                    onChangeState((prev) => ({ ...prev, showPowerEquation: false }))
                  }
                  title="Hide Power Equation ribbon (can be restored from Components menu or restore pill)"
                  className="flex items-center gap-1 rounded-md px-1.5 py-1 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors text-[11px]"
                >
                  <X className="h-3.5 w-3.5 text-slate-400 hover:text-white" />
                  <span className="hidden sm:inline text-[10px]">Hide</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Real-Time D3.js Oscilloscope View */}
        {showOscilloscope && <OscilloscopeView circuitState={circuitState} />}
      </div>

      {/* --- BOTTOM CONTROLS DOCK --- */}
      <div className="pointer-events-auto mt-auto flex flex-col gap-3 max-w-4xl mx-auto w-full">
        {/* Preset chips row */}
        {showPresets && (
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
        )}

        {/* Main interactive Control Panel */}
        <div className="rounded-2xl border border-slate-700/70 bg-slate-900/95 p-3.5 sm:p-5 backdrop-blur-xl shadow-2xl shadow-black/60 transition-all">
          {/* Collapse / Expand header for controls */}
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-800/80">
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-200">
                <Sliders className="h-3.5 w-3.5 text-cyan-400" />
                <span>Circuit Controls</span>
              </div>
              <span className="text-[11px] font-mono text-slate-400">
                ({voltFmt.full} • {resFmt.full} • {curFmt.full})
              </span>
            </div>
            <button
              id="btn-toggle-collapse-controls"
              onClick={() => setControlsCollapsed((prev) => !prev)}
              title={controlsCollapsed ? 'Expand slider controls' : 'Minimize slider controls for full 3D view'}
              className="flex items-center gap-1 rounded-md px-2 py-1 text-xs font-medium text-slate-400 hover:text-slate-200 hover:bg-slate-800 transition-colors"
            >
              {controlsCollapsed ? (
                <>
                  <ChevronUp className="h-3.5 w-3.5 text-cyan-400" />
                  <span className="text-[11px]">Expand Sliders</span>
                </>
              ) : (
                <>
                  <ChevronDown className="h-3.5 w-3.5 text-slate-400" />
                  <span className="text-[11px]">Minimize</span>
                </>
              )}
            </button>
          </div>

          {!controlsCollapsed && (
            <div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
            {/* VOLTAGE SLIDER & RANGE SWITCH */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="voltage-slider"
                  className="text-xs font-semibold text-slate-200 flex items-center gap-1.5"
                >
                  <span className="inline-block h-2 w-2 rounded-full bg-blue-400" />
                  Battery Voltage (V)
                </label>

                {/* Range switcher for wide voltage range */}
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center bg-slate-950 p-0.5 rounded-md border border-slate-800 text-[10px] font-mono">
                    <button
                      id="btn-vrange-low"
                      onClick={() => handleSelectVoltageRange('low')}
                      title="Low-EMF Millivolt Range (0.1V - 2.0V) for sensor & thermocouple signals"
                      className={`px-1.5 py-0.5 rounded transition-colors ${
                        voltageRange === 'low'
                          ? 'bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      mV range
                    </button>
                    <button
                      id="btn-vrange-std"
                      onClick={() => handleSelectVoltageRange('std')}
                      title="Standard 1V - 12V DC Range"
                      className={`px-1.5 py-0.5 rounded transition-colors ${
                        voltageRange === 'std'
                          ? 'bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      1-12V
                    </button>
                    <button
                      id="btn-vrange-high"
                      onClick={() => handleSelectVoltageRange('high')}
                      title="High EMF 5V - 24V Range"
                      className={`px-1.5 py-0.5 rounded transition-colors ${
                        voltageRange === 'high'
                          ? 'bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      24V max
                    </button>
                  </div>
                  <span className="font-mono text-sm font-bold text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded border border-blue-500/20">
                    {voltFmt.full}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[11px] font-mono text-slate-500">
                  {formatVoltage(vMin, unitNotation).full}
                </span>
                <input
                  id="voltage-slider"
                  type="range"
                  min={vMin}
                  max={vMax}
                  step={vStep}
                  value={voltage}
                  onChange={handleVoltageChange}
                  className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-800 accent-blue-500 transition-all focus:outline-none"
                />
                <span className="text-[11px] font-mono text-slate-500">
                  {formatVoltage(vMax, unitNotation).full}
                </span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>{voltageRange === 'low' ? 'Sensor Signal EMF' : 'Low Potential'}</span>
                <span>{voltageRange === 'high' ? 'Industrial 24V DC' : 'Automotive 12V'}</span>
              </div>
            </div>

            {/* RESISTANCE SLIDER & RANGE MULTIPLIER (x1, x10, x100) */}
            <div className="flex flex-col gap-1.5">
              <div className="flex items-center justify-between">
                <label
                  htmlFor="resistance-slider"
                  className="text-xs font-semibold text-slate-200 flex items-center gap-1.5"
                >
                  <span className="inline-block h-2 w-2 rounded-full bg-amber-400" />
                  Resistor Value (R)
                </label>

                {/* Range Multiplier buttons to handle wide range gracefully */}
                <div className="flex items-center gap-1.5">
                  <div className="flex items-center bg-slate-950 p-0.5 rounded-md border border-slate-800 text-[10px] font-mono">
                    <button
                      id="btn-mult-1x"
                      onClick={() => handleSelectResMultiplier(1)}
                      title="1Ω to 100Ω range"
                      className={`px-1.5 py-0.5 rounded transition-colors ${
                        resMultiplier === 1
                          ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      ×1 (100Ω)
                    </button>
                    <button
                      id="btn-mult-10x"
                      onClick={() => handleSelectResMultiplier(10)}
                      title="10Ω to 1,000Ω (1 kΩ) range"
                      className={`px-1.5 py-0.5 rounded transition-colors ${
                        resMultiplier === 10
                          ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      ×10 (1 kΩ)
                    </button>
                    <button
                      id="btn-mult-100x"
                      onClick={() => handleSelectResMultiplier(100)}
                      title="100Ω to 10,000Ω (10 kΩ) range"
                      className={`px-1.5 py-0.5 rounded transition-colors ${
                        resMultiplier === 100
                          ? 'bg-amber-500/20 text-amber-300 font-bold border border-amber-500/30'
                          : 'text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      ×100 (10 kΩ)
                    </button>
                  </div>
                  <span className="font-mono text-sm font-bold text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/20">
                    {resFmt.full}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-[11px] font-mono text-slate-500">
                  {formatResistance(rMin, unitNotation).full}
                </span>
                <input
                  id="resistance-slider"
                  type="range"
                  min={rMin}
                  max={rMax}
                  step={rStep}
                  value={resistance}
                  onChange={handleResistanceChange}
                  className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-slate-800 accent-amber-500 transition-all focus:outline-none"
                />
                <span className="text-[11px] font-mono text-slate-500">
                  {formatResistance(rMax, unitNotation).full}
                </span>
              </div>
              <div className="flex justify-between text-[10px] text-slate-400">
                <span>{resMultiplier === 1 ? 'Low Resistance (High Current)' : 'Medium Impedance'}</span>
                <span>
                  {resMultiplier === 100 ? 'High Impedance (Pull-Up)' : 'Thermal Incandescence'}
                </span>
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

            {/* Optional LED Bulb Current Flow Toggle Button */}
            <div className="flex items-center gap-2">
              <button
                id="btn-toggle-led-bulb-bottom"
                onClick={() =>
                  onChangeState((prev) => ({ ...prev, showLedBulb: !prev.showLedBulb }))
                }
                className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-medium border transition-all ${
                  showLedBulb
                    ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-sm'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                }`}
                title="Toggle optional 3D LED bulb to visualize physical current flow"
              >
                <Lightbulb className={`h-3.5 w-3.5 ${showLedBulb ? 'text-amber-400 fill-amber-400/30' : 'text-slate-400'}`} />
                <span>LED Bulb:</span>
                <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded ${showLedBulb ? 'bg-amber-500/30 text-amber-200' : 'bg-slate-800 text-slate-400'}`}>
                  {showLedBulb ? 'ON' : 'OFF'}
                </span>
                {showLedBulb && current > 0 && !isPaused && (
                  <span className="text-[10px] text-amber-300 font-mono hidden sm:inline">
                    ({Math.round(Math.min(100, Math.max(8, (current / 2.0) * 100)))}% glow)
                  </span>
                )}
              </button>
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
          )}
        </div>
      </div>
    </div>
  );
}
