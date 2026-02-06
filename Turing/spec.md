# Turing Patterns Explorer — Specification

## Overview

A polished, interactive web application for exploring reaction-diffusion systems that produce Turing patterns. The app runs entirely client-side using WebGL for GPU-accelerated simulation, enabling real-time parameter exploration on grids up to 512×512 at 60fps.

The target audience ranges from curious newcomers (who benefit from presets and the parameter space map) to enthusiasts who want to tweak every knob.

---

## Tech Stack

| Layer | Choice | Rationale |
|---|---|---|
| Simulation | WebGL 2.0 fragment shaders | GPU-parallel computation; 100–1000× faster than CPU for this workload |
| Rendering | WebGL 2.0 (same context) | Zero-copy from simulation textures to screen |
| UI Framework | Vanilla JS + HTML/CSS | No build step; single `index.html` deliverable; keeps focus on the simulation |
| UI Components | Custom lightweight controls | Sliders, dropdowns, buttons styled with CSS; no framework dependency |
| Color Maps | GLSL lookup textures | Efficient; avoids CPU-side pixel manipulation |

### Why WebGL over Canvas2D

The simulation uses a ping-pong framebuffer technique: two textures alternate as input/output each frame. A fragment shader runs the reaction-diffusion stencil over every pixel in parallel. This makes 512×512 grids trivial even on integrated GPUs. Canvas2D would require CPU iteration over every pixel, limiting practical resolution to ~128×128.

---

## Reaction-Diffusion Models

### 1. Gray-Scott (default)

The workhorse model. Two chemicals U and V with feed/kill dynamics:

```
∂U/∂t = Du∇²U − U·V² + F·(1 − U)
∂V/∂t = Dv∇²V + U·V² − (F + k)·V
```

**Parameters:**
- `F` (feed rate): 0.0 – 0.1 (default: 0.055)
- `k` (kill rate): 0.0 – 0.1 (default: 0.062)
- `Du` (diffusion of U): 0.05 – 1.0 (default: 0.21)
- `Dv` (diffusion of V): 0.01 – 0.5 (default: 0.105)

### 2. FitzHugh-Nagumo

A simplified model of excitable media (nerve impulse propagation). Produces spirals and travelling waves:

```
∂U/∂t = Du∇²U + U − U³ − V
∂V/∂t = Dv∇²V + ε·(U − a₁·V − a₀)
```

**Parameters:**
- `ε` (time-scale separation): 0.001 – 0.1 (default: 0.02)
- `a₁`: 0.0 – 3.0 (default: 2.0)
- `a₀`: 0.0 – 1.0 (default: 0.0)
- `Du`: 0.05 – 1.0 (default: 0.21)
- `Dv`: 0.01 – 0.5 (default: 0.105)

### 3. Brusselator

Chemical oscillator producing Turing instabilities:

```
∂U/∂t = Du∇²U + A − (B + 1)·U + U²·V
∂V/∂t = Dv∇²V + B·U − U²·V
```

**Parameters:**
- `A`: 0.5 – 5.0 (default: 4.5)
- `B`: 1.0 – 12.0 (default: 8.0)
- `Du`: 0.05 – 1.0 (default: 0.21)
- `Dv`: 0.01 – 0.5 (default: 0.105)

### 4. Schnakenberg

Minimal Turing model — particularly clean spot/stripe patterns:

```
∂U/∂t = Du∇²U + a − U + U²·V
∂V/∂t = Dv∇²V + b − U²·V
```

**Parameters:**
- `a`: 0.0 – 1.0 (default: 0.1)
- `b`: 0.5 – 2.0 (default: 0.9)
- `Du`: 0.05 – 1.0 (default: 0.21)
- `Dv`: 0.01 – 0.5 (default: 0.105)

---

## UI Layout

```
┌─────────────────────────────────────────────────────────────────┐
│  Header Bar                                                     │
│  [Logo/Title]  [Model Selector ▾]  [Preset ▾]  [? Info]        │
├────────────────────────────────────────┬────────────────────────┤
│                                        │  Control Panel         │
│                                        │                        │
│                                        │  ── Playback ──        │
│                                        │  [▶ Play] [⟲ Reset]   │
│                                        │  Speed: ━━━━●━━━━      │
│                                        │  Steps/frame: 1–32     │
│                                        │                        │
│        Simulation Canvas               │  ── Parameters ──      │
│        (WebGL, square,                 │  F:  ━━●━━━━━━━        │
│         aspect-locked)                 │  k:  ━━━━●━━━━━        │
│                                        │  Du: ━━━━━●━━━         │
│                                        │  Dv: ━━●━━━━━━         │
│                                        │                        │
│                                        │  ── Interaction ──     │
│                                        │  Tool: [Seed V] [Erase]│
│                                        │  Brush: ━━●━━━ (r=10)  │
│                                        │                        │
│                                        │  ── Visualization ──   │
│                                        │  Channel: [U] [V] [U−V]│
│                                        │  Colormap: [▾ Viridis] │
│                                        │                        │
│                                        │  ── Grid ──            │
│                                        │  Size: [256] [512]     │
│                                        │  Boundary: [Wrap][Clamp]│
├────────────────────────────────────────┤                        │
│  Parameter Space Map (F vs k)          │  ── Export ──          │
│  (thumbnail, clickable,                │  [📷 Screenshot]       │
│   highlighted current position)        │  [⬇ Download State]    │
└────────────────────────────────────────┴────────────────────────┘
```

### Layout Details

- **Main canvas**: Takes the dominant area. Maintains 1:1 aspect ratio. Resizes responsively but stays square.
- **Control panel**: Fixed-width right sidebar (~300px). Scrollable if viewport is short. Collapsible on mobile (hamburger/drawer pattern).
- **Parameter space map**: Below the canvas, roughly 300×200px. Only shown for Gray-Scott model (the other models don't have a well-known classification map). Clicking on the map sets F and k simultaneously.
- **Header bar**: Minimal. Model selector, preset dropdown, info/help toggle.

### Responsive Behavior

- **≥1024px**: Full side-by-side layout as shown above.
- **768–1023px**: Control panel becomes a bottom drawer, canvas takes full width.
- **<768px**: Controls in a slide-out drawer activated by a floating button. Canvas fills viewport width.

---

## Parameter Space Map (Gray-Scott)

This is a key feature. Display a precomputed thumbnail image of the Gray-Scott parameter space (F on x-axis, k on y-axis) colored by pattern type. This image is based on the Pearson classification of Gray-Scott patterns.

**Behavior:**
- Render as a `<canvas>` element below the main simulation.
- Overlay a crosshair or dot at the current (F, k) position.
- Clicking anywhere on the map instantly sets F and k to the corresponding values.
- Dragging across the map continuously updates F and k (and the simulation responds in real-time).
- Hovering shows a tooltip with the approximate pattern type name (e.g., "α — Uniform", "δ — Spots", "ε — Stripes", etc.) if known regions can be mapped.
- The map should have labeled axes and a border.

**Implementation:** Pre-render the map at startup by running short simulations at a grid of (F, k) values (expensive) — OR — ship a precomputed PNG/texture and overlay on it (preferred for instant load). The precomputed image can be generated offline.

**Fallback:** For non-Gray-Scott models, replace the parameter space map area with a brief text description of the model's behavior or hide it entirely.

---

## Presets

Each preset stores a complete snapshot of settings:

```json
{
  "name": "Coral Growth",
  "model": "gray-scott",
  "params": { "F": 0.062, "k": 0.063, "Du": 0.21, "Dv": 0.105 },
  "stepsPerFrame": 8,
  "gridSize": 256,
  "colormap": "magma",
  "channel": "v",
  "boundary": "wrap",
  "seed": "center-square"
}
```

### Included Presets

**Gray-Scott:**
| Name | F | k | Pattern Type |
|---|---|---|---|
| Spots (α) | 0.030 | 0.062 | Stable solitons |
| Stripes | 0.042 | 0.059 | Parallel stripe formation |
| Coral | 0.062 | 0.063 | Branching coral-like growth |
| Mitosis | 0.028 | 0.062 | Self-replicating spots |
| Waves | 0.014 | 0.054 | Pulsating/chaotic waves |
| Maze | 0.029 | 0.057 | Labyrinthine patterns |
| Holes | 0.039 | 0.058 | Inverse spots (holes in solid) |
| Worms | 0.078 | 0.061 | Moving worm-like structures |
| Chaos | 0.026 | 0.051 | Turbulent spatiotemporal chaos |

**FitzHugh-Nagumo:**
| Name | ε | a₁ | a₀ | Pattern Type |
|---|---|---|---|---|
| Spiral Waves | 0.02 | 2.0 | 0.0 | Classic spiral rotation |
| Target Waves | 0.01 | 1.5 | 0.1 | Concentric ring emission |
| Breakup | 0.05 | 2.0 | 0.0 | Spiral breakup / defect chaos |

**Brusselator:**
| Name | A | B | Pattern Type |
|---|---|---|---|
| Turing Spots | 4.5 | 8.0 | Hexagonal spot array |
| Turing Stripes | 4.5 | 6.8 | Stripe domains |

**Schnakenberg:**
| Name | a | b | Pattern Type |
|---|---|---|---|
| Spots | 0.1 | 0.9 | Regular spotting |
| Mixed | 0.05 | 0.9 | Spots and stripes |

---

## Interaction / Mouse Tools

### Seed Tool (default)
- **Click/drag** on canvas to inject chemical V (sets V=1.0, U=0.0 in a circular brush area).
- This is how patterns are initiated — the simulation starts with uniform U=1, V=0 everywhere, and seeding V triggers pattern formation.

### Erase Tool
- **Click/drag** to reset a region to initial conditions (U=1, V=0).

### Brush Settings
- **Brush radius**: Slider, 1–50 pixels (default 10).
- Visual indicator: Show a circle outline following the cursor on the canvas.

### Seed Patterns (for Reset)
When resetting the simulation, the user can choose an initial condition:
- **Center square**: Small square of V in the center (default).
- **Random noise**: Random V scattered across the grid.
- **Multiple seeds**: Several small circles placed randomly.
- **Ring**: Circular ring of V.
- **Clear**: All U=1, V=0 (user must manually seed).

---

## Visualization

### Channel Display
- **U**: Show chemical U concentration.
- **V**: Show chemical V concentration (default — this is where patterns are most visible in Gray-Scott).
- **U − V**: Difference, which often highlights edges.
- **Magnitude**: sqrt(U² + V²).

### Color Maps
Implemented as 1D lookup textures in the fragment shader. Include at least:

| Name | Style |
|---|---|
| Viridis | Blue → Green → Yellow (perceptually uniform, default) |
| Magma | Black → Purple → Orange → White |
| Inferno | Black → Purple → Red → Yellow |
| Plasma | Purple → Red → Yellow |
| Grayscale | Black → White |
| Turbo | Blue → Cyan → Green → Yellow → Red |
| Coolwarm | Blue → White → Red (diverging) |
| Cubehelix | Spiraling through color space |

### Rendering Pipeline
1. Simulation runs in a pair of floating-point framebuffer textures (RGBA32F or RGBA16F).
2. A separate "display" fragment shader reads the simulation texture, selects the channel, and applies the color map.
3. The display shader renders to the screen via a full-screen quad.

---

## Playback Controls

- **Play / Pause**: Toggle button. Simulation starts paused so the user can read the UI.
- **Step**: Advance one frame (one batch of steps) while paused.
- **Reset**: Reinitialize the grid to the selected seed pattern and current parameters.
- **Speed (steps per frame)**: Slider, 1–32 (default 8). Higher values = faster pattern evolution but same frame rate. Each "step" is one Euler integration step of Δt.
- **Time step (Δt)**: Usually fixed at 1.0 for Gray-Scott (stable with the standard diffusion constants). Expose as an advanced parameter.

### Performance Overlay
- Optional FPS counter (toggle in header or settings).
- Show simulation step count.

---

## Grid Settings

- **Resolution**: Choosable from 128, 256, 512, 1024. Changing resolution resets the simulation. Default: 256.
- **Boundary conditions**:
  - **Wrap** (periodic): Edges connect to opposite side. Default. Best for most patterns.
  - **Clamp** (Neumann zero-flux): Edges have zero derivative. Patterns bounce off walls.

---

## Export Features

- **Screenshot**: Capture current canvas as PNG. Use `canvas.toBlob()`. Filename includes model name and parameters.
- **Download State**: Export current simulation state (parameter values, grid data) as a JSON file. Allows reloading later (stretch goal).
- **Record GIF** (stretch goal): Capture N frames and encode as animated GIF using a library like gif.js.

---

## Visual Design

### Theme
- Dark theme (dark gray/charcoal background, `#1a1a2e` or similar).
- The simulation canvas should have maximum visual impact — bright patterns on dark background.
- Controls use muted colors; the canvas is the star.
- Accent color: Teal/cyan (`#00d4aa`) for active states, sliders, highlights.

### Typography
- System font stack for UI: `-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif`.
- Monospace for numeric values: `"JetBrains Mono", "Fira Code", monospace`.

### Control Styling
- Sliders: Custom-styled range inputs with value display. Show current numeric value next to each slider.
- Sections: Collapsible groups with subtle headers.
- Buttons: Rounded, filled for primary actions (Play, Reset), outlined for secondary.
- Transitions: Smooth hover/active states. No jarring changes.

### Loading State
- On first load, show a brief intro/splash (1–2 seconds) or jump straight into a running preset (e.g., "Coral") to immediately demonstrate what the app does.

---

## Implementation Notes

### WebGL Ping-Pong Architecture

```
Frame N:
  Texture A (current state) → Simulation Shader → Texture B (next state)
  Texture B → Display Shader → Screen

Frame N+1:
  Texture B (current state) → Simulation Shader → Texture A (next state)
  Texture A → Display Shader → Screen
```

- Use `RGBA32F` textures (via `EXT_color_buffer_float`). Channels: R = U, G = V, B and A unused (or used for auxiliary data).
- Fallback: If float textures unavailable, encode values into RGBA8 using a packing scheme, though this reduces precision.

### Laplacian Computation
Use a 3×3 discrete Laplacian kernel in the fragment shader:
```
[ 0.05  0.20  0.05 ]
[ 0.20 -1.00  0.20 ]
[ 0.05  0.20  0.05 ]
```
This weighted kernel produces smoother results than the simple cross stencil.

### Mouse Interaction Shader
Instead of reading back GPU data to CPU, inject mouse input via uniforms:
- `u_mouse_pos` (vec2): Current mouse position in texture coordinates.
- `u_mouse_radius` (float): Brush radius in texels.
- `u_mouse_active` (int): 0 = inactive, 1 = seed, 2 = erase.
The simulation shader checks distance from each fragment to the mouse position and overrides values when within the brush radius.

### Parameter Space Map Generation
- Ship a precomputed 200×200 PNG image of the Gray-Scott parameter space.
- Generate it offline by running short (5000-step) simulations at each grid point and classifying the final state.
- Alternatively, generate it at build time with a Node script.
- At runtime, overlay the current (F, k) as a highlighted marker.

---

## File Structure

```
index.html              — Single entry point; all markup
css/
  style.css             — All styling
js/
  main.js              — App initialization, event wiring, animation loop
  simulation.js        — WebGL context, shader compilation, ping-pong logic
  shaders.js           — GLSL shader source strings (simulation + display)
  controls.js          — UI control binding and state management
  parameter-map.js     — Parameter space map canvas and interaction
  presets.js           — Preset definitions
  colormaps.js         — Color map data (256-entry RGB arrays)
  export.js            — Screenshot and state export utilities
  models.js            — Model definitions (equations, parameter ranges, defaults)
assets/
  parameter-space.png  — Precomputed Gray-Scott parameter map image
  favicon.svg          — App icon
```

---

## Accessibility

- All controls keyboard-navigable.
- Sliders operable with arrow keys.
- Sufficient color contrast in UI (WCAG AA).
- Canvas content is inherently visual; provide a text description of current model/parameters in an aria-live region.
- Play/pause button clearly labeled.

---

## Browser Support

- Target: Latest Chrome, Firefox, Safari, Edge.
- Requires WebGL 2.0 (97%+ global support).
- Graceful degradation message if WebGL 2 unavailable.
- No build step; works by opening `index.html` directly or via any static server.

---

## Stretch Goals (Not in MVP but nice to have)

1. **GIF/video recording** — Capture animation loops.
2. **Shareable URLs** — Encode parameters in URL hash for sharing.
3. **3D visualization** — Height-map rendering of concentration using Three.js.
4. **Custom shader editor** — Let advanced users write their own reaction equations.
5. **Anisotropic diffusion** — Direction-dependent diffusion for oriented patterns.
6. **Multi-species** — 3+ chemical systems (more exotic patterns).
7. **Import state** — Upload a previously exported JSON to resume.
8. **Touch support** — Multi-touch painting on tablets.
