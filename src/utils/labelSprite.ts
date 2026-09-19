import * as THREE from 'three';

export interface BadgeConfig {
  title: string;
  value: string;
  subtext: string;
  primaryColor: string;
  accentColor: string;
  borderColor: string;
  glowColor: string;
}

/**
 * Creates a canvas, 2D context, and Three.js Sprite with a high-resolution CanvasTexture
 * for clean, anti-aliased floating 3D labels.
 */
export function createLabelSprite(initialConfig: BadgeConfig): {
  sprite: THREE.Sprite;
  updateText: (config: BadgeConfig) => void;
  dispose: () => void;
} {
  const canvas = document.createElement('canvas');
  canvas.width = 512;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const texture = new THREE.CanvasTexture(canvas);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;

  const spriteMaterial = new THREE.SpriteMaterial({
    map: texture,
    transparent: true,
    depthTest: true,
    depthWrite: false,
  });

  const sprite = new THREE.Sprite(spriteMaterial);
  // Aspect ratio is 512 / 256 = 2:1. Width 2.3, Height 1.15
  sprite.scale.set(2.3, 1.15, 1);

  const drawBadge = (config: BadgeConfig) => {
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    const w = canvas.width;
    const h = canvas.height;
    const padding = 16;
    const boxX = padding;
    const boxY = padding;
    const boxW = w - padding * 2;
    const boxH = h - padding * 2;
    const radius = 24;

    // Outer subtle glow
    ctx.save();
    ctx.shadowColor = config.glowColor;
    ctx.shadowBlur = 18;

    // Dark slate translucent background
    ctx.beginPath();
    ctx.roundRect(boxX, boxY, boxW, boxH, radius);
    ctx.fillStyle = 'rgba(10, 16, 26, 0.92)';
    ctx.fill();

    // Border
    ctx.lineWidth = 4;
    ctx.strokeStyle = config.borderColor;
    ctx.stroke();
    ctx.restore();

    // Top Category Pill / Header
    const pillH = 36;
    const pillY = boxY + 18;
    ctx.font = 'bold 20px "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    const titleWidth = ctx.measureText(config.title).width;
    const pillW = titleWidth + 32;
    const pillX = w / 2 - pillW / 2;

    ctx.beginPath();
    ctx.roundRect(pillX, pillY, pillW, pillH, 12);
    ctx.fillStyle = 'rgba(30, 41, 59, 0.85)';
    ctx.fill();
    ctx.strokeStyle = config.accentColor;
    ctx.lineWidth = 1.5;
    ctx.stroke();

    ctx.fillStyle = config.accentColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(config.title, w / 2, pillY + pillH / 2);

    // Main Value (Large bold typography)
    ctx.font = 'bold 74px "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, monospace';
    ctx.fillStyle = config.primaryColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(config.value, w / 2, boxY + 116);

    // Subtitle / Live physics state
    ctx.font = '500 22px "SF Pro Display", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(config.subtext, w / 2, boxY + 178);

    texture.needsUpdate = true;
  };

  drawBadge(initialConfig);

  return {
    sprite,
    updateText: drawBadge,
    dispose: () => {
      texture.dispose();
      spriteMaterial.dispose();
    },
  };
}
