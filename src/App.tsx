/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useRef, useCallback, useEffect } from 'react';
import Circuit3D from './components/Circuit3D';
import ControlsOverlay from './components/ControlsOverlay';
import FormulaGuideModal from './components/FormulaGuideModal';
import { CircuitState } from './types';
import { circuitAudio } from './utils/audioFeedback';

export default function App() {
  // Initial state strictly matching user specs:
  // Voltage: 5V (range 1V - 12V)
  // Resistance: 10 Ohms (range 1Ω - 100Ω)
  // Current: I = V / R = 5 / 10 = 0.5A
  const [circuitState, setCircuitState] = useState<CircuitState>(() => {
    const v = 5;
    const r = 10;
    const i = v / r;

    // Load saved preferences if available
    let savedVisibility = {
      showPowerEquation: true,
      showMetricsHUD: true,
      showOscilloscope: true,
      showPresets: true,
      show3DLabels: true,
      showParticles: true,
      showFieldEffects: true,
      showWireArrows: true,
      showLedBulb: true,
    };
    try {
      const stored = localStorage.getItem('circuit_display_visibility');
      if (stored) {
        savedVisibility = { ...savedVisibility, ...JSON.parse(stored) };
      }
    } catch {
      // ignore JSON error
    }

    return {
      voltage: v,
      resistance: r,
      current: i,
      power: v * i,
      flowDirection: 'electron',
      unitNotation: 'engineering',
      isPaused: false,
      speedScale: 1,
      audioEnabled: true,
      ledBulbColor: 'amber',
      ...savedVisibility,
    };
  });

  // Save visibility preferences on change
  useEffect(() => {
    try {
      const prefs = {
        showPowerEquation: circuitState.showPowerEquation,
        showMetricsHUD: circuitState.showMetricsHUD,
        showOscilloscope: circuitState.showOscilloscope,
        showPresets: circuitState.showPresets,
        show3DLabels: circuitState.show3DLabels,
        showParticles: circuitState.showParticles,
        showFieldEffects: circuitState.showFieldEffects,
        showWireArrows: circuitState.showWireArrows,
        showLedBulb: circuitState.showLedBulb,
      };
      localStorage.setItem('circuit_display_visibility', JSON.stringify(prefs));
    } catch {
      // ignore
    }
  }, [
    circuitState.showPowerEquation,
    circuitState.showMetricsHUD,
    circuitState.showOscilloscope,
    circuitState.showPresets,
    circuitState.show3DLabels,
    circuitState.showParticles,
    circuitState.showFieldEffects,
    circuitState.showWireArrows,
    circuitState.showLedBulb,
  ]);

  const [autoRotate, setAutoRotate] = useState<boolean>(false);
  const [isGuideOpen, setIsGuideOpen] = useState<boolean>(false);

  // Synchronize reactive audio feedback with current and paused state
  useEffect(() => {
    circuitAudio.update(
      circuitState.current,
      circuitState.isPaused,
      circuitState.audioEnabled
    );
  }, [circuitState.current, circuitState.isPaused, circuitState.audioEnabled]);

  // Unlock Web Audio on first user interaction anywhere
  useEffect(() => {
    const handleFirstInteraction = () => {
      circuitAudio.init();
      circuitAudio.update(
        circuitState.current,
        circuitState.isPaused,
        circuitState.audioEnabled
      );
    };

    window.addEventListener('pointerdown', handleFirstInteraction, { once: true });
    window.addEventListener('keydown', handleFirstInteraction, { once: true });

    return () => {
      window.removeEventListener('pointerdown', handleFirstInteraction);
      window.removeEventListener('keydown', handleFirstInteraction);
    };
  }, [circuitState.current, circuitState.isPaused, circuitState.audioEnabled]);

  const resetCameraFnRef = useRef<(() => void) | null>(null);

  const handleRegisterResetCamera = useCallback((fn: () => void) => {
    resetCameraFnRef.current = fn;
  }, []);

  const handleResetCamera = useCallback(() => {
    if (resetCameraFnRef.current) {
      resetCameraFnRef.current();
    }
  }, []);

  const handleToggleAutoRotate = useCallback(() => {
    setAutoRotate((prev) => !prev);
  }, []);

  return (
    <main className="relative w-screen h-screen overflow-hidden bg-slate-950 font-sans text-slate-100 flex flex-col">
      {/* 3D WebGL Canvas Layer */}
      <div className="relative w-full h-full flex-1">
        <Circuit3D
          circuitState={circuitState}
          onResetCameraRef={handleRegisterResetCamera}
          autoRotate={autoRotate}
        />

        {/* 3D Navigation Hint Pill */}
        <div className="pointer-events-none absolute bottom-4 left-4 hidden md:flex items-center gap-2 rounded-full border border-slate-800/80 bg-slate-950/70 px-3 py-1 text-[11px] text-slate-400 backdrop-blur-md">
          <span>Drag to orbit</span>
          <span className="text-slate-600">•</span>
          <span>Scroll to zoom</span>
          <span className="text-slate-600">•</span>
          <span>Right-click to pan</span>
        </div>

        {/* 2D Interactive HUD Overlay */}
        <ControlsOverlay
          circuitState={circuitState}
          onChangeState={setCircuitState}
          onResetCamera={handleResetCamera}
          autoRotate={autoRotate}
          onToggleAutoRotate={handleToggleAutoRotate}
          onOpenGuide={() => setIsGuideOpen(true)}
        />
      </div>

      {/* Educational Physics Guide Modal */}
      <FormulaGuideModal
        isOpen={isGuideOpen}
        onClose={() => setIsGuideOpen(false)}
        circuitState={circuitState}
      />
    </main>
  );
}
