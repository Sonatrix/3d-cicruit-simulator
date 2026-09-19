import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CircuitState } from '../types';
import { createCircuitPath } from '../utils/circuitCurve';
import { getResistorBands } from '../utils/resistorBands';
import { createLabelSprite } from '../utils/labelSprite';

interface Circuit3DProps {
  circuitState: CircuitState;
  onResetCameraRef?: (fn: () => void) => void;
  autoRotate?: boolean;
}

export default function Circuit3D({
  circuitState,
  onResetCameraRef,
  autoRotate = false,
}: Circuit3DProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const stateRef = useRef<CircuitState>(circuitState);
  stateRef.current = circuitState;

  // Scene references for updates
  const sceneRef = useRef<{
    scene: THREE.Scene;
    camera: THREE.PerspectiveCamera;
    renderer: THREE.WebGLRenderer;
    controls: OrbitControls;
    particlesMesh: THREE.InstancedMesh;
    curvePath: THREE.CurvePath<THREE.Vector3>;
    curveLength: number;
    resistorMaterial: THREE.MeshStandardMaterial;
    resistorGlowLight: THREE.PointLight;
    resistorBandsMaterials: THREE.MeshStandardMaterial[];
    batteryLedMaterials: THREE.MeshStandardMaterial[];
    batteryLight: THREE.PointLight;
    heatParticles?: THREE.Points;
    flowDirectionArrows: THREE.Group;
    batteryLabel: ReturnType<typeof createLabelSprite>;
    resistorLabel: ReturnType<typeof createLabelSprite>;
    batteryAnchorMat: THREE.MeshStandardMaterial;
    resistorAnchorMat: THREE.MeshStandardMaterial;
  } | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // --- 1. SETUP SCENE, CAMERA, RENDERER ---
    const width = container.clientWidth || 800;
    const height = container.clientHeight || 500;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#0c1017'); // Dark slate blueprint atmosphere
    scene.fog = new THREE.FogExp2('#0c1017', 0.025);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 100);
    camera.position.set(7.5, 7.0, 9.5);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.1;

    container.appendChild(renderer.domElement);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxPolarAngle = Math.PI / 2 - 0.02; // Keep above floor
    controls.minDistance = 3.5;
    controls.maxDistance = 24;
    controls.target.set(0, 0.6, 0);

    // Camera reset handler
    if (onResetCameraRef) {
      onResetCameraRef(() => {
        camera.position.set(7.5, 7.0, 9.5);
        controls.target.set(0, 0.6, 0);
        controls.update();
      });
    }

    // --- 2. LIGHTING ---
    const ambientLight = new THREE.AmbientLight('#94a3b8', 0.6);
    scene.add(ambientLight);

    const keyLight = new THREE.DirectionalLight('#f8fafc', 1.4);
    keyLight.position.set(6, 12, 8);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 2048;
    keyLight.shadow.mapSize.height = 2048;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 30;
    keyLight.shadow.camera.left = -9;
    keyLight.shadow.camera.right = 9;
    keyLight.shadow.camera.top = 9;
    keyLight.shadow.camera.bottom = -9;
    keyLight.shadow.bias = -0.0005;
    scene.add(keyLight);

    const rimLight = new THREE.DirectionalLight('#38bdf8', 0.5);
    rimLight.position.set(-8, 5, -8);
    scene.add(rimLight);

    // Resistor thermal point light
    const resistorGlowLight = new THREE.PointLight('#ea580c', 0, 4);
    resistorGlowLight.position.set(0, 0.9, -3);
    scene.add(resistorGlowLight);

    // Battery active light
    const batteryLight = new THREE.PointLight('#38bdf8', 0.8, 3.5);
    batteryLight.position.set(0, 0.9, 3);
    scene.add(batteryLight);

    // --- 3. WORKBENCH / PEDESTAL ---
    const floorGeo = new THREE.PlaneGeometry(30, 24);
    const floorMat = new THREE.MeshStandardMaterial({
      color: '#0f172a',
      roughness: 0.85,
      metalness: 0.15,
    });
    const floor = new THREE.Mesh(floorGeo, floorMat);
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = 0;
    floor.receiveShadow = true;
    scene.add(floor);

    // Studio grid helper on floor
    const gridHelper = new THREE.GridHelper(26, 26, '#334155', '#1e293b');
    gridHelper.position.y = 0.01;
    scene.add(gridHelper);

    // Baseboard circuit pedestal
    const pedestalGeo = new THREE.BoxGeometry(13.5, 0.25, 9.5);
    const pedestalMat = new THREE.MeshStandardMaterial({
      color: '#131d2f',
      roughness: 0.7,
      metalness: 0.3,
    });
    const pedestal = new THREE.Mesh(pedestalGeo, pedestalMat);
    pedestal.position.set(0, 0.125, 0);
    pedestal.receiveShadow = true;
    scene.add(pedestal);

    // Metallic pedestal border frame
    const frameGeo = new THREE.BoxGeometry(13.7, 0.08, 9.7);
    const frameMat = new THREE.MeshStandardMaterial({
      color: '#334155',
      roughness: 0.3,
      metalness: 0.8,
    });
    const frame = new THREE.Mesh(frameGeo, frameMat);
    frame.position.set(0, 0.04, 0);
    scene.add(frame);

    // 4 Stand-off insulated mounting posts for the wire corners
    const postGeo = new THREE.CylinderGeometry(0.22, 0.28, 0.6, 16);
    const postMat = new THREE.MeshStandardMaterial({
      color: '#334155',
      roughness: 0.4,
      metalness: 0.7,
    });
    const postPositions = [
      [4.2, 0.3, -2.2],
      [4.2, 0.3, 2.2],
      [-4.2, 0.3, 2.2],
      [-4.2, 0.3, -2.2],
    ];
    postPositions.forEach(([px, py, pz]) => {
      const post = new THREE.Mesh(postGeo, postMat);
      post.position.set(px, py, pz);
      post.castShadow = true;
      scene.add(post);

      const capGeo = new THREE.SphereGeometry(0.18, 12, 12);
      const capMat = new THREE.MeshStandardMaterial({
        color: '#64748b',
        metalness: 0.9,
        roughness: 0.2,
      });
      const cap = new THREE.Mesh(capGeo, capMat);
      cap.position.set(px, py + 0.3, pz);
      scene.add(cap);
    });

    // --- 4. THE CONTINUOUS WIRE LOOP ---
    // Width = 10, Depth = 6, Elevation = 0.6
    const curvePath = createCircuitPath(10, 6, 1.0, 0.6);
    const curveLength = curvePath.getLength();

    // Outer transparent protective wire sheath
    const wireSheathGeo = new THREE.TubeGeometry(curvePath, 280, 0.12, 16, true);
    const wireSheathMat = new THREE.MeshPhysicalMaterial({
      color: '#38bdf8',
      transparent: true,
      opacity: 0.32,
      roughness: 0.15,
      metalness: 0.1,
      transmission: 0.65,
      ior: 1.45,
      thickness: 0.25,
      depthWrite: false,
    });
    const wireSheath = new THREE.Mesh(wireSheathGeo, wireSheathMat);
    scene.add(wireSheath);

    // Inner copper conductor wire (thinner core)
    const copperCoreGeo = new THREE.TubeGeometry(curvePath, 200, 0.025, 8, true);
    const copperCoreMat = new THREE.MeshStandardMaterial({
      color: '#b45309',
      metalness: 0.85,
      roughness: 0.35,
    });
    const copperCore = new THREE.Mesh(copperCoreGeo, copperCoreMat);
    scene.add(copperCore);

    // --- 5. CHARGE CARRIER PARTICLES (ELECTRONS) ---
    const particleCount = 90;
    const particleGeo = new THREE.SphereGeometry(0.062, 12, 12);
    const particleMat = new THREE.MeshStandardMaterial({
      color: '#38bdf8',
      emissive: '#0284c7',
      emissiveIntensity: 1.8,
      roughness: 0.2,
      metalness: 0.1,
    });
    const particlesMesh = new THREE.InstancedMesh(particleGeo, particleMat, particleCount);
    particlesMesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
    scene.add(particlesMesh);

    // --- 6. RESISTOR COMPONENT (At (0, 0.6, -3)) ---
    const resistorGroup = new THREE.Group();
    resistorGroup.position.set(0, 0.6, -3);

    // Resistor ceramic cylinder body
    const resistorBodyGeo = new THREE.CylinderGeometry(0.3, 0.3, 2.2, 32);
    resistorBodyGeo.rotateZ(Math.PI / 2); // align along X axis
    const resistorMaterial = new THREE.MeshStandardMaterial({
      color: '#d97706',
      roughness: 0.4,
      metalness: 0.1,
      emissive: '#ea580c',
      emissiveIntensity: 0.2,
    });
    const resistorBody = new THREE.Mesh(resistorBodyGeo, resistorMaterial);
    resistorBody.castShadow = true;
    resistorGroup.add(resistorBody);

    // Resistor bulbous ends
    const endCapGeo = new THREE.SphereGeometry(0.3, 16, 16);
    const leftBulb = new THREE.Mesh(endCapGeo, resistorMaterial);
    leftBulb.position.set(-1.0, 0, 0);
    resistorGroup.add(leftBulb);

    const rightBulb = new THREE.Mesh(endCapGeo, resistorMaterial);
    rightBulb.position.set(1.0, 0, 0);
    resistorGroup.add(rightBulb);

    // Resistor metallic terminal leads connecting to wire
    const leadGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.8, 16);
    leadGeo.rotateZ(Math.PI / 2);
    const leadMat = new THREE.MeshStandardMaterial({
      color: '#94a3b8',
      metalness: 0.9,
      roughness: 0.2,
    });
    const leftLead = new THREE.Mesh(leadGeo, leadMat);
    leftLead.position.set(-1.4, 0, 0);
    resistorGroup.add(leftLead);

    const rightLead = new THREE.Mesh(leadGeo, leadMat);
    rightLead.position.set(1.4, 0, 0);
    resistorGroup.add(rightLead);

    // 4 Resistor Color Bands
    const bandOffsets = [-0.65, -0.25, 0.15, 0.65];
    const resistorBandsMaterials: THREE.MeshStandardMaterial[] = [];
    bandOffsets.forEach((bx) => {
      const bandGeo = new THREE.CylinderGeometry(0.305, 0.305, 0.12, 32);
      bandGeo.rotateZ(Math.PI / 2);
      const bMat = new THREE.MeshStandardMaterial({
        color: '#1e293b',
        roughness: 0.3,
        metalness: 0.1,
      });
      resistorBandsMaterials.push(bMat);
      const bandMesh = new THREE.Mesh(bandGeo, bMat);
      bandMesh.position.set(bx, 0, 0);
      resistorGroup.add(bandMesh);
    });

    // Resistor mounting clips on pedestal
    const clipGeo = new THREE.BoxGeometry(0.2, 0.5, 0.7);
    const clipMat = new THREE.MeshStandardMaterial({
      color: '#475569',
      metalness: 0.8,
      roughness: 0.3,
    });
    const leftClip = new THREE.Mesh(clipGeo, clipMat);
    leftClip.position.set(-1.3, -0.25, 0);
    resistorGroup.add(leftClip);
    const rightClip = new THREE.Mesh(clipGeo, clipMat);
    rightClip.position.set(1.3, -0.25, 0);
    resistorGroup.add(rightClip);

    scene.add(resistorGroup);

    // Floating heat shimmer particles above resistor
    const heatCount = 35;
    const heatGeo = new THREE.BufferGeometry();
    const heatPos = new Float32Array(heatCount * 3);
    for (let i = 0; i < heatCount; i++) {
      heatPos[i * 3] = (Math.random() - 0.5) * 1.6;
      heatPos[i * 3 + 1] = 0.6 + Math.random() * 1.5;
      heatPos[i * 3 + 2] = -3 + (Math.random() - 0.5) * 0.4;
    }
    heatGeo.setAttribute('position', new THREE.BufferAttribute(heatPos, 3));
    const heatMat = new THREE.PointsMaterial({
      color: '#f97316',
      size: 0.12,
      transparent: true,
      opacity: 0.0,
      blending: THREE.AdditiveBlending,
    });
    const heatParticles = new THREE.Points(heatGeo, heatMat);
    scene.add(heatParticles);

    // --- 7. BATTERY COMPONENT (At (0, 0.6, 3)) ---
    const batteryGroup = new THREE.Group();
    batteryGroup.position.set(0, 0.6, 3);

    // Battery outer casing (Cylinder along X axis)
    const batteryBodyGeo = new THREE.CylinderGeometry(0.42, 0.42, 2.5, 32);
    batteryBodyGeo.rotateZ(Math.PI / 2);
    const batteryBodyMat = new THREE.MeshStandardMaterial({
      color: '#0f172a',
      metalness: 0.85,
      roughness: 0.25,
    });
    const batteryBody = new THREE.Mesh(batteryBodyGeo, batteryBodyMat);
    batteryBody.castShadow = true;
    batteryGroup.add(batteryBody);

    // Decorative copper / brushed metal sleeve wraps
    const sleeveGeo = new THREE.CylinderGeometry(0.425, 0.425, 1.4, 32);
    sleeveGeo.rotateZ(Math.PI / 2);
    const sleeveMat = new THREE.MeshStandardMaterial({
      color: '#1e293b',
      metalness: 0.6,
      roughness: 0.4,
    });
    const sleeve = new THREE.Mesh(sleeveGeo, sleeveMat);
    batteryGroup.add(sleeve);

    // Positive terminal (+) on the Right side (X = +1.25)
    // Red insulator ring
    const posRingGeo = new THREE.CylinderGeometry(0.38, 0.38, 0.1, 32);
    posRingGeo.rotateZ(Math.PI / 2);
    const posRingMat = new THREE.MeshStandardMaterial({
      color: '#ef4444',
      roughness: 0.3,
      metalness: 0.2,
      emissive: '#b91c1c',
      emissiveIntensity: 0.4,
    });
    const posRing = new THREE.Mesh(posRingGeo, posRingMat);
    posRing.position.set(1.3, 0, 0);
    batteryGroup.add(posRing);

    // Positive brass nipple (+)
    const posNubGeo = new THREE.CylinderGeometry(0.18, 0.18, 0.22, 24);
    posNubGeo.rotateZ(Math.PI / 2);
    const posNubMat = new THREE.MeshStandardMaterial({
      color: '#eab308',
      metalness: 0.95,
      roughness: 0.15,
    });
    const posNub = new THREE.Mesh(posNubGeo, posNubMat);
    posNub.position.set(1.42, 0, 0);
    batteryGroup.add(posNub);

    // Positive wire lead to circuit
    const posLeadGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.4, 16);
    posLeadGeo.rotateZ(Math.PI / 2);
    const posLead = new THREE.Mesh(posLeadGeo, leadMat);
    posLead.position.set(1.6, 0, 0);
    batteryGroup.add(posLead);

    // Negative terminal (-) on the Left side (X = -1.25)
    const negCapGeo = new THREE.CylinderGeometry(0.4, 0.4, 0.1, 32);
    negCapGeo.rotateZ(Math.PI / 2);
    const negCapMat = new THREE.MeshStandardMaterial({
      color: '#94a3b8',
      metalness: 0.9,
      roughness: 0.2,
    });
    const negCap = new THREE.Mesh(negCapGeo, negCapMat);
    negCap.position.set(-1.3, 0, 0);
    batteryGroup.add(negCap);

    // Negative wire lead
    const negLead = new THREE.Mesh(posLeadGeo, leadMat);
    negLead.position.set(-1.5, 0, 0);
    batteryGroup.add(negLead);

    // LED Voltage level bars on the Battery body (12 bars representing 1V to 12V)
    const batteryLedMaterials: THREE.MeshStandardMaterial[] = [];
    const ledCount = 12;
    const barWidth = 0.08;
    const barGap = 0.035;
    const totalBarsWidth = ledCount * barWidth + (ledCount - 1) * barGap;
    const startX = -totalBarsWidth / 2 + barWidth / 2;

    for (let i = 0; i < ledCount; i++) {
      const bx = startX + i * (barWidth + barGap);
      const barGeo = new THREE.BoxGeometry(barWidth, 0.08, 0.12);
      const barMat = new THREE.MeshStandardMaterial({
        color: '#0284c7',
        emissive: '#0284c7',
        emissiveIntensity: 0.1,
        roughness: 0.2,
      });
      batteryLedMaterials.push(barMat);
      const barMesh = new THREE.Mesh(barGeo, barMat);
      barMesh.position.set(bx, 0.43, 0);
      batteryGroup.add(barMesh);
    }

    // Battery mounting clamps
    const bClampLeft = new THREE.Mesh(clipGeo, clipMat);
    bClampLeft.position.set(-1.4, -0.25, 0);
    batteryGroup.add(bClampLeft);
    const bClampRight = new THREE.Mesh(clipGeo, clipMat);
    bClampRight.position.set(1.4, -0.25, 0);
    batteryGroup.add(bClampRight);

    scene.add(batteryGroup);

    // --- 8. DIRECTION INDICATOR ARROWS ON THE WIRE ---
    const flowDirectionArrows = new THREE.Group();
    // 4 indicators placed along the 4 sides of the loop
    const arrowGeo = new THREE.ConeGeometry(0.14, 0.35, 16);
    const arrowMat = new THREE.MeshStandardMaterial({
      color: '#38bdf8',
      emissive: '#0284c7',
      emissiveIntensity: 1.5,
      transparent: true,
      opacity: 0.85,
    });

    // Helper to create and position arrow
    const createArrow = (pos: [number, number, number], rotY: number) => {
      const arrow = new THREE.Mesh(arrowGeo, arrowMat);
      arrow.position.set(...pos);
      arrow.rotation.z = -Math.PI / 2;
      arrow.rotation.y = rotY;
      return arrow;
    };

    // We will update arrow orientations dynamically based on flowDirection
    flowDirectionArrows.add(createArrow([5.0, 0.6, 0], 0)); // Right side
    flowDirectionArrows.add(createArrow([-5.0, 0.6, 0], Math.PI)); // Left side
    flowDirectionArrows.add(createArrow([0, 0.6, -3], -Math.PI / 2)); // Top side
    flowDirectionArrows.add(createArrow([0, 0.6, 3], Math.PI / 2)); // Bottom side
    scene.add(flowDirectionArrows);

    // --- 9. FLOATING 3D LABELS & STEMS ABOVE BATTERY & RESISTOR ---
    // Battery Label: Positioned at (0, 1.85, 3)
    const initialV = stateRef.current.voltage;
    const batteryLabel = createLabelSprite({
      title: '⚡ DC SOURCE (V)',
      value: `${initialV.toFixed(1)} V`,
      subtext: `${Math.round(initialV)}/12 V Active`,
      primaryColor: '#ffffff',
      accentColor: '#38bdf8',
      borderColor: 'rgba(56, 189, 248, 0.75)',
      glowColor: 'rgba(56, 189, 248, 0.45)',
    });
    batteryLabel.sprite.position.set(0, 1.85, 3);
    scene.add(batteryLabel.sprite);

    // Battery Anchor Pin (vertical stem)
    const pinGeo = new THREE.CylinderGeometry(0.02, 0.02, 0.45, 12);
    const batteryAnchorMat = new THREE.MeshStandardMaterial({
      color: '#38bdf8',
      emissive: '#0284c7',
      emissiveIntensity: 0.8,
      metalness: 0.8,
      roughness: 0.2,
    });
    const batteryPin = new THREE.Mesh(pinGeo, batteryAnchorMat);
    batteryPin.position.set(0, 1.15, 3);
    scene.add(batteryPin);

    // Resistor Label: Positioned at (0, 1.85, -3)
    const initialR = stateRef.current.resistance;
    const resistorLabel = createLabelSprite({
      title: '🔥 RESISTOR (R)',
      value: `${initialR} Ω`,
      subtext: 'Active Load',
      primaryColor: '#ffffff',
      accentColor: '#f59e0b',
      borderColor: 'rgba(245, 158, 11, 0.75)',
      glowColor: 'rgba(245, 158, 11, 0.45)',
    });
    resistorLabel.sprite.position.set(0, 1.85, -3);
    scene.add(resistorLabel.sprite);

    // Resistor Anchor Pin
    const resistorAnchorMat = new THREE.MeshStandardMaterial({
      color: '#f59e0b',
      emissive: '#d97706',
      emissiveIntensity: 0.8,
      metalness: 0.8,
      roughness: 0.2,
    });
    const resistorPin = new THREE.Mesh(pinGeo, resistorAnchorMat);
    resistorPin.position.set(0, 1.15, -3);
    scene.add(resistorPin);

    // Store references
    sceneRef.current = {
      scene,
      camera,
      renderer,
      controls,
      particlesMesh,
      curvePath,
      curveLength,
      resistorMaterial,
      resistorGlowLight,
      resistorBandsMaterials,
      batteryLedMaterials,
      batteryLight,
      heatParticles,
      flowDirectionArrows,
      batteryLabel,
      resistorLabel,
      batteryAnchorMat,
      resistorAnchorMat,
    };

    // --- 9. ANIMATION LOOP ---
    let animationFrameId: number;
    let particleOffset = 0;
    const clock = new THREE.Clock();
    const dummy = new THREE.Object3D();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);

      const delta = clock.getDelta();
      const st = stateRef.current;

      // Update particle positions along the wire
      if (!st.isPaused && curveLength > 0) {
        // Speed directly proportional to current (I = V / R)
        // At 0.05A (low current): slow drift
        // At 12A (high current): fast energetic flow
        // Normalized base velocity
        const baseVelocity = Math.max(0.015, Math.pow(st.current, 0.7) * 0.45) * st.speedScale;
        const deltaOffset = (baseVelocity * delta) / (curveLength * 0.1);

        // Direction logic:
        // Closed loop runs clockwise in X-Z plane:
        // Resistor is at Z = -3 (top)
        // Battery is at Z = +3 (bottom) with (-) at left (X=-1.25) and (+) at right (X=+1.25)
        // Electron flow leaves (-) at left (X=-1.25), moves UP the left side (X=-5) to Resistor,
        // then DOWN the right side (X=+5) to (+) terminal.
        // Clockwise vs Counter-Clockwise along our curve:
        // Curve construction: Top (-hw to hw) -> Right (hw) -> Bottom (hw to -hw) -> Left (-hw)
        // Moving in direction of curve (t increasing) = Clockwise!
        // Clockwise goes: Resistor (Z=-3) -> Right wire (Z down to +3) -> Battery (Z=+3) -> Left wire (Z up to -3).
        // That means: Right wire moves from -Z to +Z (towards Battery + terminal).
        // Battery moves from +hw to -hw (+ terminal to - terminal inside battery).
        // Left wire moves from +Z to -Z (from - terminal to Resistor).
        // This exactly matches ELECTRON FLOW!
        // Conventional Current is opposite (t decreasing).
        if (st.flowDirection === 'electron') {
          particleOffset = (particleOffset + deltaOffset) % 1.0;
        } else {
          particleOffset = (particleOffset - deltaOffset + 1.0) % 1.0;
        }
      }

      // Update instanced particles
      const count = particleCount;
      const isElectron = st.flowDirection === 'electron';

      for (let i = 0; i < count; i++) {
        // Distribute uniformly
        const t = (particleOffset + i / count) % 1.0;
        const pos = curvePath.getPointAt(t);

        dummy.position.copy(pos);

        // Scale particles slightly with current intensity
        const scale = 0.85 + Math.min(0.4, st.current * 0.05);
        dummy.scale.set(scale, scale, scale);
        dummy.updateMatrix();

        particlesMesh.setMatrixAt(i, dummy.matrix);
      }
      particlesMesh.instanceMatrix.needsUpdate = true;

      // Update particle color/glow based on mode & current
      if (isElectron) {
        // Cyan-blue electron glow
        particleMat.color.set('#38bdf8');
        particleMat.emissive.set('#0284c7');
        particleMat.emissiveIntensity = 1.2 + Math.min(2.5, st.current * 0.35);
      } else {
        // Amber-gold conventional current glow
        particleMat.color.set('#fbbf24');
        particleMat.emissive.set('#d97706');
        particleMat.emissiveIntensity = 1.2 + Math.min(2.5, st.current * 0.35);
      }

      // Update heat wave particles above resistor
      if (heatParticles) {
        const positions = heatParticles.geometry.attributes.position.array as Float32Array;
        const heatMat = heatParticles.material as THREE.PointsMaterial;
        // Thermal opacity scales with resistance & power
        const heatIntensity = Math.min(1.0, (st.resistance / 100) * 0.7 + (st.power / 100) * 0.4);
        heatMat.opacity = heatIntensity * 0.75;

        for (let i = 0; i < heatCount; i++) {
          positions[i * 3 + 1] += delta * (0.8 + heatIntensity * 1.2);
          // Loop back down if too high
          if (positions[i * 3 + 1] > 2.2) {
            positions[i * 3 + 1] = 0.6;
            positions[i * 3] = (Math.random() - 0.5) * 1.6;
            positions[i * 3 + 2] = -3 + (Math.random() - 0.5) * 0.4;
          }
        }
        heatParticles.geometry.attributes.position.needsUpdate = true;
      }

      // Auto-rotation if requested
      if (autoRotate) {
        controls.autoRotate = true;
        controls.autoRotateSpeed = 1.2;
      } else {
        controls.autoRotate = false;
      }

      controls.update();
      renderer.render(scene, camera);
    };

    animate();

    // --- 10. RESIZE OBSERVER ---
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: newW, height: newH } = entry.contentRect;
        if (newW > 0 && newH > 0) {
          camera.aspect = newW / newH;
          camera.updateProjectionMatrix();
          renderer.setSize(newW, newH);
        }
      }
    });
    resizeObserver.observe(container);

    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      controls.dispose();
      batteryLabel.dispose();
      resistorLabel.dispose();
      renderer.dispose();
      if (container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
    };
  }, [autoRotate, onResetCameraRef]);

  // Dynamic visual updates whenever circuitState changes
  useEffect(() => {
    const refs = sceneRef.current;
    if (!refs) return;

    const {
      resistorMaterial,
      resistorGlowLight,
      resistorBandsMaterials,
      batteryLedMaterials,
      batteryLight,
      flowDirectionArrows,
      batteryLabel,
      resistorLabel,
      resistorAnchorMat,
    } = refs;

    const { voltage, resistance, current, power, flowDirection } = circuitState;

    // 1. UPDATE RESISTOR VISUALS (React to resistance & thermal heating)
    // Requirement 4: "The Resistor block should visually react to resistance (e.g., color intensity shift or thermal glow as resistance increases)."
    const rFactor = Math.min(1.0, (resistance - 1) / 99); // 0 to 1
    // Color transitions:
    // Low resistance: ceramic sandy brown / olive cool (#d97706, emissive low)
    // Medium resistance: glowing orange (#ea580c)
    // High resistance: incandescent red-hot (#ef4444 to #ffedd5 core)
    const coldColor = new THREE.Color('#b45309');
    const warmColor = new THREE.Color('#ea580c');
    const hotColor = new THREE.Color('#ef4444');

    const bodyColor = new THREE.Color();
    if (rFactor < 0.5) {
      bodyColor.lerpColors(coldColor, warmColor, rFactor * 2);
    } else {
      bodyColor.lerpColors(warmColor, hotColor, (rFactor - 0.5) * 2);
    }

    resistorMaterial.color.copy(bodyColor);
    resistorMaterial.emissive.copy(bodyColor);
    // Emissive intensity ramps from 0.1 to 2.8 with resistance
    const emissiveBoost = 0.1 + rFactor * 2.2 + Math.min(1.0, power * 0.08);
    resistorMaterial.emissiveIntensity = emissiveBoost;

    // Resistor point light
    resistorGlowLight.color.copy(bodyColor);
    resistorGlowLight.intensity = 0.2 + rFactor * 3.5;
    resistorGlowLight.distance = 2.5 + rFactor * 4.0;

    // Update resistor color bands
    const bands = getResistorBands(resistance);
    const bandColors = [
      bands.band1Color,
      bands.band2Color,
      bands.multiplierColor,
      bands.toleranceColor,
    ];
    resistorBandsMaterials.forEach((mat, idx) => {
      mat.color.set(bandColors[idx]);
    });

    // 2. UPDATE BATTERY VISUALS (Reflect Voltage setting)
    // Requirement 5: "The Battery component should visually reflect the Voltage setting."
    // 1V to 12V controls 12 LED segments
    const activeLeds = Math.round(voltage);
    const vFactor = voltage / 12; // 0 to 1

    batteryLedMaterials.forEach((mat, idx) => {
      if (idx < activeLeds) {
        // High voltage shifts color from blue to vivid cyan / electric lime
        if (vFactor > 0.75) {
          mat.color.set('#38bdf8');
          mat.emissive.set('#38bdf8');
        } else if (vFactor > 0.4) {
          mat.color.set('#0284c7');
          mat.emissive.set('#0284c7');
        } else {
          mat.color.set('#0369a1');
          mat.emissive.set('#0369a1');
        }
        mat.emissiveIntensity = 1.2 + vFactor * 1.5;
      } else {
        // Inactive bar
        mat.color.set('#1e293b');
        mat.emissive.set('#0f172a');
        mat.emissiveIntensity = 0.05;
      }
    });

    // Battery point light reflects voltage energy
    batteryLight.intensity = 0.4 + vFactor * 2.5;
    batteryLight.distance = 2.5 + vFactor * 3.0;

    // 3. UPDATE DIRECTION ARROWS
    // Conventional vs Electron flow direction
    const isElectron = flowDirection === 'electron';
    flowDirectionArrows.children.forEach((child) => {
      const mesh = child as THREE.Mesh;
      const mat = mesh.material as THREE.MeshStandardMaterial;
      mat.color.set(isElectron ? '#38bdf8' : '#fbbf24');
      mat.emissive.set(isElectron ? '#0284c7' : '#d97706');

      // Invert arrow rotation if conventional
      if (mesh.userData.baseRot === undefined) {
        mesh.userData.baseRot = mesh.rotation.y;
      }
      mesh.rotation.y = mesh.userData.baseRot + (isElectron ? 0 : Math.PI);
    });

    // 4. UPDATE FLOATING 3D TEXT LABELS
    // Battery Label: Updates with current voltage
    batteryLabel.updateText({
      title: '⚡ DC SOURCE (V)',
      value: `${voltage.toFixed(1)} V`,
      subtext: `${activeLeds}/12 V Cells Active (${((voltage / 12) * 100).toFixed(0)}% EMF)`,
      primaryColor: '#ffffff',
      accentColor: '#38bdf8',
      borderColor: 'rgba(56, 189, 248, 0.75)',
      glowColor: 'rgba(56, 189, 248, 0.45)',
    });

    // Resistor Label: Updates with current resistance and thermal status
    const heatText = power < 1 ? `${(power * 1000).toFixed(0)} mW` : `${power.toFixed(1)} W`;
    const tempState = rFactor > 0.65 ? 'Hot Incandescent' : rFactor > 0.3 ? 'Warm Thermal' : 'Cool Ceramic';
    const rAccentHex = rFactor > 0.65 ? '#ef4444' : rFactor > 0.3 ? '#f97316' : '#d97706';
    const rGlowHex = rFactor > 0.65 ? 'rgba(239, 68, 68, 0.65)' : 'rgba(245, 158, 11, 0.5)';

    resistorLabel.updateText({
      title: '🔥 RESISTOR (R)',
      value: `${resistance} Ω`,
      subtext: `P = ${heatText} • ${tempState}`,
      primaryColor: '#ffffff',
      accentColor: rAccentHex,
      borderColor: rAccentHex,
      glowColor: rGlowHex,
    });

    resistorAnchorMat.color.set(rAccentHex);
    resistorAnchorMat.emissive.set(rAccentHex);
    resistorAnchorMat.emissiveIntensity = 0.5 + rFactor * 1.5;
  }, [circuitState]);

  return (
    <div
      ref={containerRef}
      id="canvas-3d-container"
      className="relative w-full h-full min-h-[440px] overflow-hidden select-none cursor-grab active:cursor-grabbing bg-slate-950"
    />
  );
}
