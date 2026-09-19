# Ohm's Law 3D Circuit Simulator

An interactive, physically grounded 3D circuit simulation visualizing **Ohm's Law ($V = I \cdot R$)**, **Joule's Heating & Power Dissipation ($P = V \cdot I$)**, and **electrical charge carrier drift** in real time. Built with React 19, TypeScript, Three.js, D3.js, and Tailwind CSS.

---

## ⚡ Overview

The **Ohm's Law 3D Circuit Simulator** transforms abstract electromagnetic principles into an intuitive, tactile virtual laboratory. Users can dynamically manipulate electromotive force (voltage) and circuit impedance (resistance) across wide engineering dynamic ranges, immediately observing direct real-time effects on:
- Electron drift velocity and directional flow conventions
- Thermal incandescence, ceramic color banding, and convective heat plumes across the load resistor
- Luminescence, radial illumination, and lumens output of an optional physical LED bulb load
- Dual-channel voltage and current waveforms on a virtual digital oscilloscope (DSO-1)
- Live mathematical relationships across both standard SI units and engineering notation

---

## ✨ Key Features

### 1. Interactive 3D Circuit Simulation (Three.js WebGL)
- **Closed Conductor Circuit**:
  - Modeled with an insulated copper core sheathed in translucent high-refraction glass tubing.
  - Realistic materials with specular reflections, roughness, and dynamic scene shadows.
- **Dynamic Battery Component ($0.1\text{V} – 24\text{V}$)**:
  - 12-segment illuminated LED charge level meter reflecting active voltage potential.
  - Color-coded positive ($+$ red) and negative ($-$ blue) terminal collars with polarity markers.
  - Real-time Three.js point lighting casting dynamic ambient illumination whose radius and intensity scale with voltage.
- **Thermal-Reactive Resistor ($1\Omega – 10.0\text{ k}\Omega$)**:
  - Procedural ceramic resistor body with automatic **4-band EIA color code decoding** (significant digits, multiplier band, and tolerance band).
  - Dynamic thermal heating that shifts from cool ceramic amber to incandescent orange and white-hot glow under high current dissipation.
  - Convective thermal heat particle shimmer rising above the resistor body proportional to Joule heating ($I^2 \cdot R$).
- **Charge Carrier Simulation**:
  - Over 90 instanced electron spheres continuously traversing the circuit loop.
  - Drift velocity scales proportionally with electric current ($I = V / R$).
  - Pause/Resume and speed dilation multipliers ($0.5\times$, $1\times$, $1.5\times$, $2\times$).
- **Flow Direction Toggle**:
  - **Physical Electron Flow**: Drift from negative terminal to positive terminal.
  - **Conventional Current**: Classical positive to negative flow.
  - 3D directional guide arrows positioned along the conductors rotate dynamically to reflect the active convention.
- **Optional Physical LED Bulb Load**:
  - Detailed 3D fixture positioned along the conductor featuring a machined socket collar, ceramic insulator ring, brass wire clamping terminals, internal cathode/anode lead posts, parabolic reflector anvil, semiconductor die, outer glass dome, and additive radial glow halo.
  - Real-time luminescence scaling:
    - **Filament & Die**: Emissive brightness reacts to instantaneous current ($I$).
    - **Point Light**: Casts real Three.js scene illumination onto nearby conductors.
    - **Luminous Output**: Reports estimated lumens ($\approx 0 - 1200\text{ lm}$) and glow intensity percentage ($0\% - 100\%$).
    - **Cold State Handling**: Automatically dims to a cold off state when current ceases or simulation is paused.
    - **Diode Color Selection**: Switchable between **Amber** (incandescent warmth), **Emerald** (green diode), **Cyan** (blue-green crystal), and **Ruby** (red indicator).
    - **Dedicated Controls**: Quick-toggle button in the header, bottom sub-controls dock, components menu, and restore pill.
- **Dynamic Billboarded 3D Labels**:
  - High-DPI volumetric badges anchored directly above the Battery, Resistor, and LED Bulb.
  - Built with dynamic HTML5 Canvas textures and automatic camera perspective tracking.
  - Displays live Voltage, Resistance, Power dissipation, Thermal state, and LED lumens in real time.
- **Camera Controls**:
  - Full OrbitControls with smooth damping, rotation, panning, and zoom limits.
  - One-click **Reset View** and continuous **Auto-Orbit** camera inspection mode.

---

### 2. Virtual Real-Time Oscilloscope (DSO-1 via D3.js)
- **Synchronized Waveform Generator**:
  - Real-time animated sine wave whose amplitude, cycle frequency, and wavelength dynamically scale with Current ($I = V/R$).
  - Constructed using D3.js linear scales (`d3.scaleLinear`), path generators (`d3.line`), and semi-transparent area gradients (`d3.area`).
  - Direction-aware phase propagation shifting seamlessly between physical electron drift and conventional current flow.
- **Multichannel Display Modes**:
  - `CH1: I(t)`: Glowing cyan phosphor trace visualizing current wave, RMS current ($I_{\text{RMS}}$), and peak amplitude ($I_{\text{pk}}$).
  - `CH2: V(t)`: Blue voltage trace representing the driving electromotive force.
  - `DUAL`: Side-by-side comparative trace directly demonstrating Ohm's Law proportionality ($I = V/R$).
- **Instrument Controls & OSD Overlay**:
  - Timebase sweep scaling ($0.5\times$, $1\times$, $2\times$), pure sine vs. carrier ripple harmonics, freeze/hold trigger, phosphor reticle grid toggle, and compact/expanded views.
  - Real-time On-Screen Display (OSD) reporting $I_{\text{RMS}}$, $I_{\text{pk}}$, time/div, and live cycle frequency.

---

### 3. Real-Time Instrumentation & Readouts
- **Unit System Toggle (Standard SI vs. Engineering Multipliers)**:
  - **Standard SI Base Units**: Displays values in pure Volts ($V$), Amperes ($A$), Ohms ($\Omega$), and Watts ($W$).
  - **Engineering Notation**: Automatic SI prefix formatting with engineering scale multipliers ($mV$, $\mu\text{V}$, $mA$, $\mu\text{A}$, $k\Omega$, $M\Omega$, $mW$, etc.).
  - Consistently applies across the 4-card HUD, live power formula ribbon, D3 oscilloscope OSD, and floating 3D WebGL labels.
- **Wide-Range Voltage & Resistance Controls**:
  - **Resistance Multipliers**: $\times 1$ ($1\Omega - 100\Omega$), $\times 10$ ($10\Omega - 1.0\text{ k}\Omega$), and $\times 100$ ($100\Omega - 10.0\text{ k}\Omega$).
  - **Voltage Range Switch**: Low-EMF sensor range ($0.1\text{V} - 2.0\text{V}$), Standard DC ($1\text{V} - 12\text{V}$), and High-EMF ($5\text{V} - 24\text{V}$).
  - Full support for fractional and wide dynamic ranges without cumbersome floating-point formatting.
- **Four-Card Telemetry HUD**:
  - **Voltage ($V$)**: Battery potential formatted with active range indicators.
  - **Resistance ($R$)**: Load impedance with live 4-band color swatch preview.
  - **Current ($I$)**: Instantaneous current flow with safety and drift velocity alerts.
  - **Power ($P$)**: Real-time power consumption alongside Joule heating rate ($J/\text{s}$).
- **Power Relationship Inspector**:
  - Dynamic formula ribbon displaying instantaneous variables: $V \times I = P$.
  - Equivalent physical formulations: Joule's Heating Law ($I^2 \cdot R$) and Potential Dissipation ($V^2 / R$).
  - Thermal loss gauge (`Low Loss`, `Moderate`, `Heavy Heat`) with an animated load level bar.

---

### 4. Component & UI Visibility Controls (Zen Mode & Custom Workspace)
- **Granular Component Toggles**:
  - The **Components** menu in the top navigation bar enables individual control over 9 distinct UI and 3D simulation elements:
    1. **Power Equation Banner ($P = V \cdot I$)**
    2. **Metrics HUD Cards ($V, R, I, P$)**
    3. **Real-Time Oscilloscope (DSO-1)**
    4. **Scenario Presets Row**
    5. **Floating 3D Billboard Labels**
    6. **Electron Particles Flow**
    7. **Wire Flow Vector Arrows**
    8. **Thermal Field Shimmer Effect**
    9. **Physical LED Bulb Load** (with inline diode color selector)
- **Collapsible Slider Dock**:
  - Minimize the bottom slider panel with the **Minimize / Expand Sliders** toggle for an unobstructed, edge-to-edge 3D viewing canvas.
- **One-Click Visibility Profiles**:
  - **Show All**: Instantly enables every readout, instrument, 3D label, and particle system.
  - **Zen Mode**: Hides extraneous banners, HUD cards, oscilloscope, and 3D labels to deliver a minimalist, distraction-free view of the 3D circuit.
- **Floating Quick-Restore Badges**:
  - When the Power Equation, Metrics HUD, or LED Bulb are hidden, discrete restore badges appear on the canvas for rapid one-click reactivation.
- **Automatic State Persistence**:
  - All visibility settings and preferred diode colors are persisted to browser `localStorage` (`circuit_display_visibility`) and restored across sessions.

---

### 5. Presets, Audio & Educational Physics Guide
- **One-Click Circuit Scenarios**:
  - *Standard Demo*: $5\text{V} / 10\Omega \rightarrow 0.5\text{A}$ ($2.5\text{W}$)
  - *High Current / Low R*: $12\text{V} / 1\Omega \rightarrow 12\text{A}$ ($144\text{W}$)
  - *Low Current / High R*: $1.5\text{V} / 100\Omega \rightarrow 15\text{mA}$ ($22.5\text{mW}$)
  - *Balanced Circuit*: $6\text{V} / 12\Omega \rightarrow 0.5\text{A}$ ($3\text{W}$)
  - *High Power Dissipation*: $12\text{V} / 2\Omega \rightarrow 6\text{A}$ ($72\text{W}$)
- **Multi-Sensory Audio Feedback**:
  - Built-in **Web Audio API synthesizer** generating an electric circuit hum and carrier noise.
  - Fundamental pitch and harmonic distortion scale proportionally with instantaneous electric current.
- **Educational Formula Guide**:
  - Interactive modal featuring the Ohm's Law triangle ($V, I, R$), calculation walkthroughs, 4-band EIA color decoding charts, and physical unit conversion cheat-sheets.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend Framework** | React 19, TypeScript |
| **3D Rendering Engine** | Three.js (WebGL, OrbitControls, InstancedMesh, CanvasTexture, PointLights) |
| **Data Visualization** | D3.js (`d3-shape`, `d3-scale`, `d3-selection`) |
| **Styling & Design** | Tailwind CSS v4 |
| **Icons & Micro-interactions** | Lucide React |
| **Animations** | Motion (`motion/react`) |
| **Audio Engine** | Web Audio API (custom modular oscillator, biquad filter & gain nodes) |
| **Build & Tooling** | Vite, TypeScript Compiler (`tsc`), Node.js |

---

## 📁 Project Structure

```
├── index.html                      # HTML entry point with metadata
├── package.json                    # Dependencies and build scripts
├── tsconfig.json                   # TypeScript configuration
├── vite.config.ts                  # Vite build configuration & plugins
├── metadata.json                   # Application metadata & capabilities
├── src/
│   ├── main.tsx                    # React application bootstrapping
│   ├── App.tsx                     # Core state coordinator & layout shell
│   ├── index.css                   # Global styling with Tailwind CSS imports
│   ├── types.ts                    # TypeScript models, circuit state & scenario types
│   ├── components/
│   │   ├── Circuit3D.tsx           # Three.js 3D circuit canvas, particles & LED load
│   │   ├── ControlsOverlay.tsx     # Telemetry HUD, formula banner, sliders & docks
│   │   ├── OscilloscopeView.tsx    # D3.js digital storage oscilloscope (DSO-1)
│   │   └── FormulaGuideModal.tsx   # Educational reference dialog & color code chart
│   └── utils/
│       ├── audioFeedback.ts        # Web Audio API procedural circuit synthesizer
│       ├── circuitCurve.ts         # Spline curves & closed circuit loop geometry
│       ├── labelSprite.ts          # Canvas-generated high-DPI 3D billboard sprites
│       ├── resistorBands.ts        # EIA 4-band resistor color code decoder
│       └── unitFormatting.ts       # Standard SI and engineering notation formatters
```

---

## 🚀 Getting Started

### Prerequisites
- Node.js (v18+ recommended)
- npm (v9+)

### Installation
```bash
npm install
```

### Development Server
```bash
npm run dev
```
The application will launch on `http://localhost:3000`.

### Production Build
```bash
npm run build
```
Compiles and bundles production-ready static assets in the `dist/` directory.

### Code Quality & Verification
```bash
npm run lint
```
Runs TypeScript verification (`tsc --noEmit`) to ensure clean types without errors.

---

## 📐 Mathematical Reference

### 1. Ohm's Law
$$V = I \cdot R \quad \iff \quad I = \frac{V}{R} \quad \iff \quad R = \frac{V}{I}$$

### 2. Joule's Heating & Electric Power
$$P = V \cdot I = I^2 \cdot R = \frac{V^2}{R}$$

### 3. Drift Velocity & Charge Transport
$$I = n \cdot A \cdot q \cdot v_d \quad \implies \quad v_d = \frac{I}{n \cdot A \cdot q}$$

Where:
- $V$: Potential Difference / Electromotive Force in **Volts (V)**
- $I$: Electric Current in **Amperes (A)**
- $R$: Resistance in **Ohms ($\Omega$)**
- $P$: Electric Power / Thermal Dissipation in **Watts (W)**
- $v_d$: Electron Drift Velocity in **Meters per Second (m/s)**
- $q$: Elementary Charge ($1.602 \times 10^{-19}\text{ C}$)

---

## 📄 License

SPDX-License-Identifier: Apache-2.0
