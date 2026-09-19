export type FlowDirection = 'electron' | 'conventional';

export interface CircuitState {
  voltage: number; // 1V to 12V
  resistance: number; // 1Ω to 100Ω
  current: number; // calculated I = V / R (Amperes)
  power: number; // calculated P = V * I (Watts)
  flowDirection: FlowDirection; // 'electron' (negative -> positive) or 'conventional' (positive -> negative)
  isPaused: boolean;
  speedScale: number; // animation speed multiplier
  showFieldEffects: boolean;
  audioEnabled: boolean;
}

export interface PresetScenario {
  id: string;
  name: string;
  description: string;
  voltage: number;
  resistance: number;
  badge: string;
}
