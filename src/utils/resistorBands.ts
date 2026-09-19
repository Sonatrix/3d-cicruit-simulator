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
  const r = Math.max(1, Math.round(resistance));
  let d1 = 1;
  let d2 = 0;
  let multColor = 'black';

  if (r < 10) {
    d1 = r;
    d2 = 0;
    multColor = 'gold'; // x0.1
  } else {
    // 2 significant digits + 10^exp
    const str = r.toString();
    d1 = Math.min(9, Math.max(0, parseInt(str[0], 10)));
    d2 = Math.min(9, Math.max(0, parseInt(str[1] || '0', 10)));
    const exp = str.length - 2;
    const MULT_MAP: Record<number, string> = {
      0: 'black',  // 10^0 = x1
      1: 'brown',  // 10^1 = x10
      2: 'red',    // 10^2 = x100
      3: 'orange', // 10^3 = x1k
      4: 'yellow', // 10^4 = x10k
      5: 'green',  // 10^5 = x100k
      6: 'blue',   // 10^6 = x1M
    };
    multColor = MULT_MAP[Math.min(6, Math.max(0, exp))] || 'black';
  }

  const display = r >= 1000 ? `${(r / 1000).toFixed(r % 1000 === 0 ? 0 : 1)} kΩ` : `${r} Ω`;

  return {
    band1Color: COLOR_MAP[DIGIT_COLORS[d1]] || '#78350f',
    band2Color: COLOR_MAP[DIGIT_COLORS[d2]] || '#111827',
    multiplierColor: COLOR_MAP[multColor] || '#111827',
    toleranceColor: COLOR_MAP.gold,
    displayValue: display,
  };
}
