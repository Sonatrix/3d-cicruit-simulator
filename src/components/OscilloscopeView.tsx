import React, { useEffect, useRef, useState, useId } from 'react';
import * as d3 from 'd3';
import { CircuitState } from '../types';
import {
  Activity,
  Maximize2,
  Minimize2,
  Pause,
  Play,
  Layers,
  Settings2,
  HelpCircle,
  Eye,
  EyeOff,
} from 'lucide-react';
import {
  formatCurrent,
  formatVoltage,
  formatResistance,
  formatPower,
} from '../utils/unitFormatting';

interface OscilloscopeViewProps {
  circuitState: CircuitState;
}

type ChannelMode = 'current' | 'voltage' | 'dual';
type WaveformShape = 'sine' | 'ripple';

export default function OscilloscopeView({ circuitState }: OscilloscopeViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const phaseRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(performance.now());

  // Component unique ID for SVG filter isolation
  const uniqueId = useId().replace(/:/g, '-');

  // Oscilloscope display preferences
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [channelMode, setChannelMode] = useState<ChannelMode>('dual');
  const [waveShape, setWaveShape] = useState<WaveformShape>('sine');
  const [timebaseMultiplier, setTimebaseMultiplier] = useState<number>(1.0);
  const [holdTrigger, setHoldTrigger] = useState<boolean>(false);
  const [showGrid, setShowGrid] = useState<boolean>(true);
  const [showMeasurements, setShowMeasurements] = useState<boolean>(true);

  const { voltage, resistance, current, power, flowDirection, isPaused, speedScale } = circuitState;

  // Formatted values for HUD using active unit notation (standard vs engineering)
  const notation = circuitState.unitNotation;
  const currentFormatted = formatCurrent(current, notation).full;
  const peakCurrentFormatted = formatCurrent(current * Math.SQRT2, notation).full;
  const voltageFormatted = formatVoltage(voltage, notation).full;
  const resistanceFormatted = formatResistance(resistance, notation).full;
  const powerFormatted = formatPower(power, notation).full;

  // Theoretical visual frequency based on current flow
  const baseFreq = Math.max(0.5, Math.min(12, 1.0 + current * 1.5));
  const effectiveFreq = baseFreq * speedScale * timebaseMultiplier;

  // D3 Real-time Render & Animation Loop
  useEffect(() => {
    const svgElement = svgRef.current;
    const container = containerRef.current;
    if (!svgElement || !container) return;

    const d3Svg = d3.select(svgElement);

    const renderOscilloscope = (currentTime: number) => {
      const dt = (currentTime - lastTimeRef.current) / 1000;
      lastTimeRef.current = currentTime;

      // Advance wave phase if not paused and not on hold
      const isWaveFrozen = isPaused || holdTrigger;
      if (!isWaveFrozen) {
        // Phase shift direction dependent on physical electron vs conventional current
        const directionSign = flowDirection === 'electron' ? -1 : 1;
        phaseRef.current += directionSign * (2 * Math.PI * effectiveFreq) * dt;
      }

      const rect = container.getBoundingClientRect();
      const width = Math.max(260, rect.width);
      const height = isExpanded ? 150 : 85;

      svgElement.setAttribute('viewBox', `0 0 ${width} ${height}`);

      // Clear dynamic wave elements (maintain static defs and grid structure)
      d3Svg.selectAll('.dynamic-layer').remove();

      const dynamicGroup = d3Svg.append('g').attr('class', 'dynamic-layer');

      const margin = { top: 12, right: 12, bottom: 12, left: 12 };
      const innerWidth = width - margin.left - margin.right;
      const innerHeight = height - margin.top - margin.bottom;
      const centerY = margin.top + innerHeight / 2;

      // 1. D3 SCALES
      const xScale = d3.scaleLinear().domain([0, innerWidth]).range([margin.left, margin.left + innerWidth]);

      // 2. GRID DRAWING
      if (showGrid) {
        const gridGroup = dynamicGroup.append('g').attr('class', 'osc-grid');
        const numHDivs = 8;
        const numVDivs = 4;

        // Vertical division lines
        for (let i = 0; i <= numHDivs; i++) {
          const x = margin.left + (innerWidth / numHDivs) * i;
          gridGroup
            .append('line')
            .attr('x1', x)
            .attr('y1', margin.top)
            .attr('x2', x)
            .attr('y2', margin.top + innerHeight)
            .attr('stroke', i === numHDivs / 2 ? 'rgba(56, 189, 248, 0.35)' : 'rgba(30, 41, 59, 0.65)')
            .attr('stroke-width', i === numHDivs / 2 ? 1.2 : 0.7)
            .attr('stroke-dasharray', i === numHDivs / 2 ? 'none' : '2,3');
        }

        // Horizontal division lines
        for (let j = 0; j <= numVDivs; j++) {
          const y = margin.top + (innerHeight / numVDivs) * j;
          gridGroup
            .append('line')
            .attr('x1', margin.left)
            .attr('y1', y)
            .attr('x2', margin.left + innerWidth)
            .attr('y2', y)
            .attr('stroke', j === numVDivs / 2 ? 'rgba(56, 189, 248, 0.45)' : 'rgba(30, 41, 59, 0.65)')
            .attr('stroke-width', j === numVDivs / 2 ? 1.2 : 0.7)
            .attr('stroke-dasharray', j === numVDivs / 2 ? 'none' : '2,3');
        }

        // Sub-tick markers on center axes
        const subTicksX = 24;
        for (let k = 0; k <= subTicksX; k++) {
          const x = margin.left + (innerWidth / subTicksX) * k;
          gridGroup
            .append('line')
            .attr('x1', x)
            .attr('y1', centerY - 2.5)
            .attr('x2', x)
            .attr('y2', centerY + 2.5)
            .attr('stroke', 'rgba(56, 189, 248, 0.4)')
            .attr('stroke-width', 0.8);
        }
      }

      // 3. GENERATE WAVEFORM DATA
      const numPoints = 120;
      const waveLength = innerWidth / (2.2 * timebaseMultiplier); // wavelengths shown across screen

      // Voltage normalization: 1V -> 12V maps to amplitude 10% to 85% of half-height
      const maxHalfHeight = innerHeight * 0.44;
      const vAmplitude = (Math.max(1, Math.min(12, voltage)) / 12) * maxHalfHeight;

      // Current normalization: scale current relative to max expected current (12A) with gentle power curve
      // for optimal readability across both small currents (0.01A) and large currents (12A)
      const normalizedCurrent = Math.min(1.0, current / 12);
      const iAmplitude =
        (0.12 + Math.pow(normalizedCurrent, 0.55) * 0.88) * maxHalfHeight;

      interface WavePoint {
        x: number;
        yCurrent: number;
        yVoltage: number;
      }

      const points: WavePoint[] = [];
      const currentPhase = phaseRef.current;

      for (let i = 0; i <= numPoints; i++) {
        const px = (i / numPoints) * innerWidth;
        const x = margin.left + px;
        const angle = (px / waveLength) * 2 * Math.PI + currentPhase;

        let curMultiplier = Math.sin(angle);
        let voltMultiplier = Math.sin(angle);

        if (waveShape === 'ripple') {
          // Add 3rd and 5th harmonic ripples to simulate discrete electron drift carrier bursts
          curMultiplier =
            Math.sin(angle) + 0.16 * Math.sin(3 * angle) + 0.08 * Math.sin(5 * angle);
          voltMultiplier = Math.sin(angle) + 0.06 * Math.sin(3 * angle);
        }

        points.push({
          x,
          yCurrent: centerY - curMultiplier * iAmplitude,
          yVoltage: centerY - voltMultiplier * vAmplitude,
        });
      }

      // 4. D3 LINE & AREA GENERATORS
      const currentAreaGenerator = d3
        .area<WavePoint>()
        .x((d) => d.x)
        .y0(centerY)
        .y1((d) => d.yCurrent)
        .curve(d3.curveBasis);

      const currentLineGenerator = d3
        .line<WavePoint>()
        .x((d) => d.x)
        .y((d) => d.yCurrent)
        .curve(d3.curveBasis);

      const voltageLineGenerator = d3
        .line<WavePoint>()
        .x((d) => d.x)
        .y((d) => d.yVoltage)
        .curve(d3.curveBasis);

      // 5. RENDER CHANNELS

      // Channel 2: Voltage Wave (V) (Rendered behind Current in Dual mode)
      if (channelMode === 'voltage' || channelMode === 'dual') {
        // Voltage Line
        dynamicGroup
          .append('path')
          .datum(points)
          .attr('d', voltageLineGenerator)
          .attr('fill', 'none')
          .attr('stroke', '#3b82f6')
          .attr('stroke-width', channelMode === 'dual' ? 1.6 : 2.2)
          .attr('stroke-opacity', channelMode === 'dual' ? 0.75 : 0.95)
          .attr('stroke-dasharray', channelMode === 'dual' ? '4,2' : 'none')
          .attr('filter', `url(#glow-blue-${uniqueId})`);
      }

      // Channel 1: Current Wave (I)
      if (channelMode === 'current' || channelMode === 'dual') {
        // Area under current trace for phosphor glow fill
        dynamicGroup
          .append('path')
          .datum(points)
          .attr('d', currentAreaGenerator)
          .attr('fill', `url(#current-grad-${uniqueId})`)
          .attr('opacity', 0.22);

        // Ghost persistence line (faint delayed/attenuated trace)
        dynamicGroup
          .append('path')
          .datum(points)
          .attr('d', currentLineGenerator)
          .attr('fill', 'none')
          .attr('stroke', '#10b981')
          .attr('stroke-width', 3.8)
          .attr('stroke-opacity', 0.2)
          .attr('filter', `url(#glow-cyan-${uniqueId})`);

        // Primary glowing current trace
        dynamicGroup
          .append('path')
          .datum(points)
          .attr('d', currentLineGenerator)
          .attr('fill', 'none')
          .attr('stroke', '#22d3ee')
          .attr('stroke-width', 2.2)
          .attr('stroke-linecap', 'round')
          .attr('filter', `url(#glow-cyan-${uniqueId})`);
      }

      // 6. REAL-TIME SWEEP / TRIGGER POINT MARKER
      const markerX = margin.left + ((Math.abs(phaseRef.current) * 22) % innerWidth);
      dynamicGroup
        .append('line')
        .attr('x1', markerX)
        .attr('y1', margin.top)
        .attr('x2', markerX)
        .attr('y2', margin.top + innerHeight)
        .attr('stroke', 'rgba(34, 211, 238, 0.4)')
        .attr('stroke-width', 1.0)
        .attr('stroke-dasharray', '1,4');

      animFrameRef.current = requestAnimationFrame(renderOscilloscope);
    };

    animFrameRef.current = requestAnimationFrame(renderOscilloscope);

    return () => {
      if (animFrameRef.current !== null) {
        cancelAnimationFrame(animFrameRef.current);
      }
    };
  }, [
    voltage,
    resistance,
    current,
    power,
    flowDirection,
    isPaused,
    speedScale,
    channelMode,
    waveShape,
    timebaseMultiplier,
    holdTrigger,
    showGrid,
    isExpanded,
    uniqueId,
    effectiveFreq,
  ]);

  return (
    <div
      id="mini-oscilloscope-panel"
      className="pointer-events-auto rounded-xl border border-slate-700/80 bg-slate-950/95 backdrop-blur-md shadow-xl shadow-black/50 overflow-hidden max-w-4xl w-full transition-all"
    >
      {/* --- OSCILLOSCOPE TOP BAR --- */}
      <div className="flex flex-wrap items-center justify-between gap-2 px-3 py-1.5 border-b border-slate-800 bg-slate-900/90 text-xs">
        {/* Left: Device Label & Active Channel Status */}
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 font-mono font-bold text-slate-200">
            <Activity className="h-3.5 w-3.5 text-cyan-400 animate-pulse" />
            <span className="tracking-wider text-[11px]">OSCILLOSCOPE DSO-1</span>
          </div>

          {/* Trigger State Pill */}
          <span
            className={`inline-flex items-center px-1.5 py-0.2 rounded text-[10px] font-mono font-semibold border ${
              holdTrigger || isPaused
                ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                : 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
            }`}
          >
            {holdTrigger ? 'HOLD' : isPaused ? 'PAUSED' : 'TRIG: AUTO'}
          </span>

          {/* Live Frequency Readout */}
          <span className="hidden sm:inline-block text-[10px] font-mono text-cyan-400/90">
            f ~ {effectiveFreq.toFixed(1)} Hz (∝ Current I)
          </span>
        </div>

        {/* Right: Quick Controls & Channel Selectors */}
        <div className="flex items-center gap-1.5">
          {/* Channel Selector */}
          <div className="flex items-center rounded-lg bg-slate-800/80 p-0.5 border border-slate-700/60 text-[10px] font-mono">
            <button
              id="osc-btn-ch1"
              type="button"
              onClick={() => setChannelMode('current')}
              title="Channel 1: Current I(t)"
              className={`px-1.5 py-0.5 rounded font-semibold transition-colors ${
                channelMode === 'current'
                  ? 'bg-cyan-500 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              CH1: I(t)
            </button>
            <button
              id="osc-btn-ch2"
              type="button"
              onClick={() => setChannelMode('voltage')}
              title="Channel 2: Voltage V(t)"
              className={`px-1.5 py-0.5 rounded font-semibold transition-colors ${
                channelMode === 'voltage'
                  ? 'bg-blue-500 text-white shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              CH2: V(t)
            </button>
            <button
              id="osc-btn-dual"
              type="button"
              onClick={() => setChannelMode('dual')}
              title="Dual Trace: V(t) & I(t)"
              className={`px-1.5 py-0.5 rounded font-semibold transition-colors ${
                channelMode === 'dual'
                  ? 'bg-emerald-500 text-slate-950 shadow-xs'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              DUAL
            </button>
          </div>

          {/* Timebase Multiplier */}
          <button
            id="osc-btn-timebase"
            type="button"
            onClick={() =>
              setTimebaseMultiplier((prev) => (prev === 0.5 ? 1.0 : prev === 1.0 ? 2.0 : 0.5))
            }
            title="Cycle Timebase (0.5x, 1x, 2x)"
            className="rounded bg-slate-800 px-1.5 py-0.5 text-[10px] font-mono text-slate-300 border border-slate-700/60 hover:text-white transition-colors"
          >
            {timebaseMultiplier}X
          </button>

          {/* Waveform Style (Pure Sine vs Carrier Ripple) */}
          <button
            id="osc-btn-waveshape"
            type="button"
            onClick={() => setWaveShape((prev) => (prev === 'sine' ? 'ripple' : 'sine'))}
            title="Toggle Pure Sine Wave or Carrier Ripple"
            className={`rounded px-1.5 py-0.5 text-[10px] font-mono border transition-colors ${
              waveShape === 'ripple'
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700/60 hover:text-white'
            }`}
          >
            {waveShape === 'sine' ? 'SIN' : 'RPL'}
          </button>

          {/* Freeze / Hold Trigger */}
          <button
            id="osc-btn-hold"
            type="button"
            onClick={() => setHoldTrigger((prev) => !prev)}
            title={holdTrigger ? 'Resume oscilloscope sweep' : 'Hold / Freeze oscilloscope sweep'}
            className={`rounded p-1 text-[10px] border transition-colors ${
              holdTrigger
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                : 'bg-slate-800 text-slate-400 border-slate-700/60 hover:text-white'
            }`}
          >
            {holdTrigger ? <Play className="h-3 w-3" /> : <Pause className="h-3 w-3" />}
          </button>

          {/* Toggle Grid */}
          <button
            id="osc-btn-grid"
            type="button"
            onClick={() => setShowGrid((prev) => !prev)}
            title={showGrid ? 'Hide reticle grid' : 'Show reticle grid'}
            className={`rounded p-1 text-[10px] border transition-colors ${
              showGrid
                ? 'bg-slate-800 text-cyan-400 border-slate-700/60'
                : 'bg-slate-900 text-slate-500 border-slate-800'
            }`}
          >
            <Layers className="h-3 w-3" />
          </button>

          {/* Expand / Minimize Toggle */}
          <button
            id="osc-btn-expand"
            type="button"
            onClick={() => setIsExpanded((prev) => !prev)}
            title={isExpanded ? 'Compact oscilloscope' : 'Expand oscilloscope'}
            className="rounded bg-slate-800 p-1 text-slate-400 border border-slate-700/60 hover:text-white transition-colors"
          >
            {isExpanded ? <Minimize2 className="h-3 w-3" /> : <Maximize2 className="h-3 w-3" />}
          </button>
        </div>
      </div>

      {/* --- OSCILLOSCOPE SCREEN (CRT / LCD RETICLE) --- */}
      <div
        ref={containerRef}
        className="relative w-full bg-slate-950 overflow-hidden select-none"
        style={{ height: isExpanded ? '150px' : '85px' }}
      >
        <svg
          ref={svgRef}
          id="oscilloscope-svg-canvas"
          className="w-full h-full block"
          preserveAspectRatio="none"
        >
          {/* Static SVG Filters & Gradients */}
          <defs>
            {/* Glow Filter for Cyan Current Wave */}
            <filter id={`glow-cyan-${uniqueId}`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Glow Filter for Blue Voltage Wave */}
            <filter id={`glow-blue-${uniqueId}`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2.5" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Current Area Gradient */}
            <linearGradient id={`current-grad-${uniqueId}`} x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#22d3ee" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#0f172a" stopOpacity="0.0" />
            </linearGradient>
          </defs>
        </svg>

        {/* --- ON-SCREEN DISPLAY (OSD) MEASUREMENT OVERLAYS --- */}
        {showMeasurements && (
          <>
            {/* Top-Left: Channel Metrics */}
            <div className="absolute top-1.5 left-2 flex flex-col gap-0.5 text-[9px] font-mono pointer-events-none text-slate-300 drop-shadow-md">
              <div className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-cyan-400 animate-pulse" />
                <span className="text-cyan-400 font-bold">CH1 I(t):</span>
                <span>RMS={currentFormatted}</span>
                <span className="text-slate-400">|</span>
                <span>Pk={peakCurrentFormatted}</span>
              </div>
              {(channelMode === 'voltage' || channelMode === 'dual') && (
                <div className="flex items-center gap-1.5">
                  <span className="h-1.5 w-1.5 rounded-full bg-blue-400" />
                  <span className="text-blue-400 font-bold">CH2 V(t):</span>
                  <span>{voltageFormatted}</span>
                  <span className="text-slate-400">|</span>
                  <span className="text-slate-400">R={resistanceFormatted}</span>
                </div>
              )}
            </div>

            {/* Top-Right: Timebase & Phase */}
            <div className="absolute top-1.5 right-2 flex flex-col items-end gap-0.5 text-[9px] font-mono pointer-events-none text-slate-400 drop-shadow-md">
              <div className="flex items-center gap-1">
                <span>TIME/DIV:</span>
                <span className="text-slate-200">{(50 / timebaseMultiplier).toFixed(0)} ms</span>
              </div>
              <div className="flex items-center gap-1">
                <span>FLOW:</span>
                <span className={flowDirection === 'electron' ? 'text-cyan-400' : 'text-amber-400'}>
                  {flowDirection === 'electron' ? 'e⁻ DRIFT (←)' : 'CONV (→)'}
                </span>
              </div>
            </div>

            {/* Bottom-Left: Real-Time Ohm's Law Proportionality Cue */}
            <div className="absolute bottom-1.5 left-2 text-[9px] font-mono text-slate-400 pointer-events-none flex items-center gap-1 drop-shadow-md">
              <span className="text-emerald-400 font-semibold">I = V/R</span>
              <span>→ Wave Amplitude ∝ Current ({currentFormatted})</span>
            </div>

            {/* Bottom-Right: Power readout */}
            <div className="absolute bottom-1.5 right-2 text-[9px] font-mono text-slate-400 pointer-events-none hidden sm:flex items-center gap-1 drop-shadow-md">
              <span>P = {powerFormatted}</span>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
