export type FlowDirection = 'electron' | 'conventional';
export type UnitNotation = 'standard' | 'engineering';

export interface CircuitState {
  voltage: number; // Volts
  resistance: number; // Ohms
  current: number; // calculated I = V / R (Amperes)
  power: number; // calculated P = V * I (Watts)
  flowDirection: FlowDirection; // 'electron' (negative -> positive) or 'conventional' (positive -> negative)
  unitNotation: UnitNotation; // 'standard' (V, A, Ω) or 'engineering' (mV, mA, kΩ)
  isPaused: boolean;
  speedScale: number; // animation speed multiplier
  showFieldEffects: boolean;
  audioEnabled: boolean;
  // Component visibility toggles
  showPowerEquation: boolean;
  showMetricsHUD: boolean;
  showOscilloscope: boolean;
  showPresets: boolean;
  show3DLabels: boolean;
  showParticles: boolean;
  showWireArrows: boolean;
  showLedBulb: boolean; // Optional LED bulb component demonstrating physical current flow
  ledBulbColor?: 'amber' | 'emerald' | 'cyan' | 'ruby';
}

export interface PresetScenario {
  id: string;
  name: string;
  description: string;
  voltage: number;
  resistance: number;
  badge: string;
}
