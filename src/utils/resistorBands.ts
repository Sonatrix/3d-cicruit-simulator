export interface ResistorBandInfo {
  band1Color: string;
  band2Color: string;
  multiplierColor: string;
  toleranceColor: string;
  displayValue: string;
}

const COLOR_MAP: Record<string, string> = {
  black: '#111827',
  brown: '#78350f',
  red: '#dc2626',
  orange: '#ea580c',
  yellow: '#ca8a04',
  green: '#16a34a',
  blue: '#2563eb',
  violet: '#7c3aed',
  gray: '#4b5563',
  white: '#f9fafb',
  gold: '#d97706',
  silver: '#9ca3af',
};

const DIGIT_COLORS = [
  'black',
  'brown',
  'red',
  'orange',
  'yellow',
  'green',
  'blue',
  'violet',
  'gray',
  'white',
];

export function getResistorBands(resistance: number): ResistorBandInfo {
  const r = Math.round(resistance);
  let d1 = 1;
  let d2 = 0;
  let multColor = 'black';

  if (r < 10) {
    d1 = r;
    d2 = 0;
    multColor = 'gold'; // x0.1
  } else if (r < 100) {
    const tens = Math.floor(r / 10);
    const ones = r % 10;
    d1 = Math.min(9, Math.max(0, tens));
    d2 = Math.min(9, Math.max(0, ones));
    multColor = 'black'; // x1
  } else {
    // 100
    d1 = 1;
    d2 = 0;
    multColor = 'brown'; // x10
  }

  return {
    band1Color: COLOR_MAP[DIGIT_COLORS[d1]] || '#78350f',
    band2Color: COLOR_MAP[DIGIT_COLORS[d2]] || '#111827',
    multiplierColor: COLOR_MAP[multColor] || '#111827',
    toleranceColor: COLOR_MAP.gold,
    displayValue: `${r} Ω`,
  };
}
