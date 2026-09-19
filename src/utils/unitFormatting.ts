import { UnitNotation } from '../types';

export interface FormattedQuantity {
  value: string;
  unit: string;
  full: string;
  prefix: string; // e.g. "m", "k", "µ", ""
  baseUnit: string; // "V", "A", "Ω", "W"
}

/**
 * Format Voltage (V)
 * Standard: always Volts (e.g., "5.00 V", "0.50 V", "12.0 V")
 * Engineering: uses SI prefixes (mV, V, kV)
 */
export function formatVoltage(volts: number, notation: UnitNotation): FormattedQuantity {
  const abs = Math.abs(volts);

  if (notation === 'standard') {
    const decimals = abs < 1 ? 3 : abs < 10 ? 2 : 1;
    const str = volts.toFixed(decimals);
    return {
      value: str,
      unit: 'V',
      full: `${str} V`,
      prefix: '',
      baseUnit: 'V',
    };
  }

  // Engineering notation: multiples of 10^3
  if (abs < 0.001) {
    const v = volts * 1e6;
    const str = v.toFixed(1);
    return { value: str, unit: 'µV', full: `${str} µV`, prefix: 'µ', baseUnit: 'V' };
  }
  if (abs < 1.0) {
    const v = volts * 1000;
    const str = v.toFixed(v >= 100 ? 0 : 1);
    return { value: str, unit: 'mV', full: `${str} mV`, prefix: 'm', baseUnit: 'V' };
  }
  if (abs >= 1000) {
    const v = volts / 1000;
    const str = v.toFixed(2);
    return { value: str, unit: 'kV', full: `${str} kV`, prefix: 'k', baseUnit: 'V' };
  }

  // Normal Volts (1V to 999V)
  const str = volts.toFixed(volts >= 10 ? 1 : 2);
  return { value: str, unit: 'V', full: `${str} V`, prefix: '', baseUnit: 'V' };
}

/**
 * Format Resistance (Ω)
 * Standard: always Ohms (e.g., "10 Ω", "100 Ω", "4700 Ω")
 * Engineering: uses SI prefixes (mΩ, Ω, kΩ, MΩ)
 */
export function formatResistance(ohms: number, notation: UnitNotation): FormattedQuantity {
  const abs = Math.abs(ohms);

  if (notation === 'standard') {
    const str = ohms % 1 === 0 ? ohms.toFixed(0) : ohms.toFixed(1);
    return {
      value: str,
      unit: 'Ω',
      full: `${str} Ω`,
      prefix: '',
      baseUnit: 'Ω',
    };
  }

  // Engineering notation
  if (abs < 1.0) {
    const r = ohms * 1000;
    const str = r.toFixed(1);
    return { value: str, unit: 'mΩ', full: `${str} mΩ`, prefix: 'm', baseUnit: 'Ω' };
  }
  if (abs >= 1e6) {
    const r = ohms / 1e6;
    const str = r.toFixed(2);
    return { value: str, unit: 'MΩ', full: `${str} MΩ`, prefix: 'M', baseUnit: 'Ω' };
  }
  if (abs >= 1000) {
    const r = ohms / 1000;
    // e.g. 1.0 kΩ, 4.7 kΩ, 10.0 kΩ
    const str = r >= 10 ? r.toFixed(1) : r.toFixed(2);
    return { value: str, unit: 'kΩ', full: `${str} kΩ`, prefix: 'k', baseUnit: 'Ω' };
  }

  // Normal Ohms (1Ω to 999Ω)
  const str = ohms % 1 === 0 ? ohms.toFixed(0) : ohms.toFixed(1);
  return { value: str, unit: 'Ω', full: `${str} Ω`, prefix: '', baseUnit: 'Ω' };
}

/**
 * Format Current (I = V / R)
 * Standard: always Amperes (e.g., "0.500 A", "0.0125 A", "12.000 A")
 * Engineering: uses SI prefixes (pA, nA, µA, mA, A, kA)
 */
export function formatCurrent(amperes: number, notation: UnitNotation): FormattedQuantity {
  const abs = Math.abs(amperes);

  if (notation === 'standard') {
    let decimals = 3;
    if (abs < 0.001) decimals = 6;
    else if (abs < 0.01) decimals = 5;
    else if (abs < 0.1) decimals = 4;
    else if (abs >= 10) decimals = 2;

    const str = amperes.toFixed(decimals);
    return {
      value: str,
      unit: 'A',
      full: `${str} A`,
      prefix: '',
      baseUnit: 'A',
    };
  }

  // Engineering notation
  if (abs < 1e-6) {
    const i = amperes * 1e9;
    const str = i.toFixed(1);
    return { value: str, unit: 'nA', full: `${str} nA`, prefix: 'n', baseUnit: 'A' };
  }
  if (abs < 0.001) {
    const i = amperes * 1e6;
    const str = i.toFixed(i >= 100 ? 0 : 1);
    return { value: str, unit: 'µA', full: `${str} µA`, prefix: 'µ', baseUnit: 'A' };
  }
  if (abs < 1.0) {
    const i = amperes * 1000;
    const str = i >= 100 ? i.toFixed(1) : i.toFixed(2);
    return { value: str, unit: 'mA', full: `${str} mA`, prefix: 'm', baseUnit: 'A' };
  }
  if (abs >= 1000) {
    const i = amperes / 1000;
    const str = i.toFixed(2);
    return { value: str, unit: 'kA', full: `${str} kA`, prefix: 'k', baseUnit: 'A' };
  }

  // Normal Amperes (1A to 999A)
  const str = amperes.toFixed(3);
  return { value: str, unit: 'A', full: `${str} A`, prefix: '', baseUnit: 'A' };
}

/**
 * Format Power (P = V * I)
 * Standard: always Watts (e.g., "2.500 W", "0.025 W", "144.00 W")
 * Engineering: uses SI prefixes (µW, mW, W, kW)
 */
export function formatPower(watts: number, notation: UnitNotation): FormattedQuantity {
  const abs = Math.abs(watts);

  if (notation === 'standard') {
    const decimals = abs < 0.01 ? 4 : abs < 1 ? 3 : 2;
    const str = watts.toFixed(decimals);
    return {
      value: str,
      unit: 'W',
      full: `${str} W`,
      prefix: '',
      baseUnit: 'W',
    };
  }

  // Engineering notation
  if (abs < 0.001) {
    const p = watts * 1e6;
    const str = p.toFixed(1);
    return { value: str, unit: 'µW', full: `${str} µW`, prefix: 'µ', baseUnit: 'W' };
  }
  if (abs < 1.0) {
    const p = watts * 1000;
    const str = p >= 100 ? p.toFixed(1) : p.toFixed(2);
    return { value: str, unit: 'mW', full: `${str} mW`, prefix: 'm', baseUnit: 'W' };
  }
  if (abs >= 1000) {
    const p = watts / 1000;
    const str = p.toFixed(2);
    return { value: str, unit: 'kW', full: `${str} kW`, prefix: 'k', baseUnit: 'W' };
  }

  // Normal Watts (1W to 999W)
  const str = watts.toFixed(2);
  return { value: str, unit: 'W', full: `${str} W`, prefix: '', baseUnit: 'W' };
}
