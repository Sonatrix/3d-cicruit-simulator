import * as THREE from 'three';

/**
 * Creates a continuous, smooth rectangular circuit curve with rounded corners
 * centered at the origin in the X-Z plane at Y = elevation.
 */
export function createCircuitPath(
  width: number = 10,
  depth: number = 6,
  radius: number = 1.0,
  elevation: number = 0.5
): THREE.CurvePath<THREE.Vector3> {
  const path = new THREE.CurvePath<THREE.Vector3>();

  const hw = width / 2;
  const hd = depth / 2;
  const r = Math.min(radius, hw * 0.4, hd * 0.4);

  // Define the 4 corners:
  // Top-Right: (+hw, -hd)
  // Bottom-Right: (+hw, +hd)
  // Bottom-Left: (-hw, +hd)
  // Top-Left: (-hw, -hd)

  // Segment 1: Bottom edge (Battery side, Z = +hd), moving right to left or left to right
  // Let's loop clockwise looking from above:
  // Top edge: (-hw + r, -hd) -> (+hw - r, -hd) [Resistor is here]
  // Corner 1: (+hw - r, -hd) -> (+hw, -hd + r)
  // Right edge: (+hw, -hd + r) -> (+hw, +hd - r)
  // Corner 2: (+hw, +hd - r) -> (+hw - r, +hd)
  // Bottom edge: (+hw - r, +hd) -> (-hw + r, +hd) [Battery is here]
  // Corner 3: (-hw + r, +hd) -> (-hw, +hd - r)
  // Left edge: (-hw, +hd - r) -> (-hw, -hd + r)
  // Corner 4: (-hw, -hd + r) -> (-hw + r, -hd)

  // Top Edge
  path.add(
    new THREE.LineCurve3(
      new THREE.Vector3(-hw + r, elevation, -hd),
      new THREE.Vector3(hw - r, elevation, -hd)
    )
  );

  // Corner 1 (Top-Right)
  const corner1 = createCornerArc(hw - r, -hd + r, r, -Math.PI / 2, 0, elevation);
  path.add(corner1);

  // Right Edge
  path.add(
    new THREE.LineCurve3(
      new THREE.Vector3(hw, elevation, -hd + r),
      new THREE.Vector3(hw, elevation, hd - r)
    )
  );

  // Corner 2 (Bottom-Right)
  const corner2 = createCornerArc(hw - r, hd - r, r, 0, Math.PI / 2, elevation);
  path.add(corner2);

  // Bottom Edge (Battery side)
  path.add(
    new THREE.LineCurve3(
      new THREE.Vector3(hw - r, elevation, hd),
      new THREE.Vector3(-hw + r, elevation, hd)
    )
  );

  // Corner 3 (Bottom-Left)
  const corner3 = createCornerArc(-hw + r, hd - r, r, Math.PI / 2, Math.PI, elevation);
  path.add(corner3);

  // Left Edge
  path.add(
    new THREE.LineCurve3(
      new THREE.Vector3(-hw, elevation, hd - r),
      new THREE.Vector3(-hw, elevation, -hd + r)
    )
  );

  // Corner 4 (Top-Left)
  const corner4 = createCornerArc(-hw + r, -hd + r, r, Math.PI, (3 * Math.PI) / 2, elevation);
  path.add(corner4);

  return path;
}

function createCornerArc(
  cx: number,
  cz: number,
  r: number,
  startAngle: number,
  endAngle: number,
  elevation: number,
  segments: number = 8
): THREE.Curve<THREE.Vector3> {
  const points: THREE.Vector3[] = [];
  for (let i = 0; i <= segments; i++) {
    const angle = startAngle + (endAngle - startAngle) * (i / segments);
    points.push(new THREE.Vector3(cx + r * Math.cos(angle), elevation, cz + r * Math.sin(angle)));
  }
  return new THREE.CatmullRomCurve3(points, false, 'centripetal');
}
