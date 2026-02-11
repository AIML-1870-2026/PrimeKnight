# Julia Set Explorer — Full Specification

## Overview

A single-page, educational Julia Set fractal explorer built as a **single-file React component** (`.jsx`). The app renders Julia sets in real-time on an HTML5 Canvas using the escape-time algorithm, with an extensive control panel exposing every meaningful parameter. Each control has an ⓘ info button that opens a popover explaining the math and visual effect. The aesthetic is a dark, observatory-themed UI with glassmorphism panels and warm amber accents.

---

## Technology & Constraints

- **Single `.jsx` file** — all HTML, CSS (via Tailwind utility classes + inline styles), and JS in one React component.
- **React with Hooks** — `useState`, `useEffect`, `useRef`, `useCallback`, `useMemo`.
- **Tailwind CSS** — core utility classes only (no compiler, no custom config). Use inline `style` objects for anything Tailwind can't express (gradients, glassmorphism, custom colors).
- **No external dependencies** beyond what's available in the artifact sandbox: React, Tailwind, `lucide-react` for icons.
- **Canvas API** — all fractal rendering via `<canvas>` and `CanvasRenderingContext2D` (or `ImageData` for pixel-level writes).
- **Web Workers are NOT available** — rendering must happen on the main thread. Use chunked/incremental rendering (`requestAnimationFrame` or `setTimeout` batching) to keep the UI responsive during computation.
- **No `localStorage`** — all state lives in React state.

---

## Layout

```
┌─────────────────────────────────────────────────────────┐
│  ◆ Julia Set Explorer          [c = -0.7 + 0.27i]  [?] │  ← Top bar
├────────────┬────────────────────────────────────────────┤
│            │                                            │
│  Controls  │                                            │
│  Sidebar   │            Canvas (fractal)                │
│  ~320px    │            fills remaining space           │
│  scrollable│                                            │
│            │                                            │
│            │                                            │
│            │                                            │
├────────────┴────────────────────────────────────────────┤
│  Zoom: 1.0x │ Center: (0, 0) │ Render: 42ms │ 800×600  │  ← Status bar
└─────────────────────────────────────────────────────────┘
```

### Top Bar
- App title with a small fractal icon/emoji (◆ or similar).
- Live readout of the current `c` value formatted as `c = Re + Im·i`.
- A `[?]` button that opens a general "What is a Julia Set?" educational modal.

### Sidebar (Left, 320px, collapsible)
- Collapsible via a toggle button (hamburger or `«` chevron).
- When collapsed, only the toggle button is visible; the canvas expands to fill the full width.
- Internally organized into **collapsible sections** (accordion-style, multiple can be open).
- Scrollable independently of the canvas if content overflows.

### Canvas (Main Area)
- Fills all remaining horizontal and vertical space.
- Renders the Julia set fractal.
- Supports mouse interactions: click-to-recenter, scroll-to-zoom, drag-to-pan.
- Overlays (axes, orbit visualization) drawn on top of the fractal.
- Shows a crosshair or coordinate tooltip on hover.

### Status Bar (Bottom)
- Displays: current zoom level, center coordinates, last render time in ms, canvas resolution.

---

## Sidebar Control Sections

Each section is an accordion panel with a header (section name + collapse chevron). Within each section, controls are arranged vertically. Every slider/toggle that has a mathematical or educational significance gets an **ⓘ button** next to its label.

### Section 1: Julia Set Parameters

| Control | Type | Range | Default | ⓘ Info |
|---|---|---|---|---|
| **Real(c)** | Slider + number input | -2.0 to 2.0, step 0.001 | -0.7 | Explains the real component of the complex constant c and how it affects horizontal symmetry/shape. |
| **Imag(c)** | Slider + number input | -2.0 to 2.0, step 0.001 | 0.27 | Explains the imaginary component and its effect on vertical features. |
| **Mandelbrot c-Picker** | Mini canvas (180×180) | — | — | A small Mandelbrot set rendering. Clicking any point on it sets c to that point. A crosshair/dot shows the current c. The ⓘ explains the deep relationship: "Each point on the Mandelbrot set corresponds to a connected Julia set. Points outside produce disconnected 'dust' Julia sets. Points on the boundary produce the most intricate shapes." |
| **Max Iterations** | Slider | 50 to 2000, step 10 | 300 | Explains that more iterations reveal finer detail at the boundary but cost more computation. Points that haven't escaped after max iterations are considered "in the set." |
| **Escape Radius** | Slider | 2 to 20, step 0.5 | 4 | Explains the bailout condition: once |z| exceeds this, we know the point escapes. Values > 2 are mathematically sufficient; larger values produce smoother coloring with the smooth algorithm. |

### Section 2: Viewport

| Control | Type | Range | Default | ⓘ Info |
|---|---|---|---|---|
| **Zoom** | Slider (logarithmic) | 0.5 to 10000 | 1.0 | Explains self-similarity: "Fractals contain infinite detail. As you zoom in, you'll see similar structures repeating at every scale — this is a hallmark of fractal geometry." |
| **Center X** | Slider + number input | -3.0 to 3.0 | 0.0 | The real-axis coordinate of the viewport center. |
| **Center Y** | Slider + number input | -3.0 to 3.0 | 0.0 | The imaginary-axis coordinate of the viewport center. |
| **Reset View** | Button | — | — | Resets zoom to 1.0 and center to (0, 0). |

### Section 3: Coloring

| Control | Type | Options | Default | ⓘ Info |
|---|---|---|---|---|
| **Color Palette** | Visual dropdown / selector | See palette list below | "Deep Ocean" | Explains how escape-time coloring works: iteration count maps to color. Different palettes highlight different structures. |
| **Smooth Coloring** | Toggle | on/off | on | Explains the math: normalized iteration count using `n - log2(log2(|z|))` eliminates visible color banding, producing continuous gradients. |
| **Color Cycle Speed** | Slider | 0.1 to 10.0 | 1.0 | How many times the palette repeats across the iteration range. Higher values = more color bands = more visible detail in transition zones. |
| **Color Offset** | Slider | 0.0 to 1.0 | 0.0 | Rotates the palette starting point. Animating this creates a "breathing" or "flowing" effect. |
| **Interior Color** | Color picker (small preset grid) | Black, dark blue, dark purple, white, transparent | Black | The color of points *inside* the Julia set (those that never escape). |
| **Animate Colors** | Toggle | on/off | off | When on, slowly increments the color offset over time, creating a pulsing/flowing color animation. |

#### Color Palettes

Each palette is defined as an array of RGB color stops. The renderer interpolates between them.

1. **Deep Ocean** — `#0a0a2e → #003366 → #0077b6 → #00b4d8 → #90e0ef → #ffffff`
2. **Solar Flare** — `#000000 → #4a0000 → #cc3300 → #ff9900 → #ffcc00 → #ffffff`
3. **Neon Synthwave** — `#0d0221 → #3d1a78 → #cc00ff → #ff0099 → #00ffff → #ffffff`
4. **Aurora Borealis** — `#000000 → #003300 → #00cc66 → #33ffcc → #ccffee → #ffffff`
5. **Infrared** — `#000000 → #1a0033 → #660066 → #cc0044 → #ff6600 → #ffff00`
6. **Monochrome** — `#000000 → #333333 → #666666 → #999999 → #cccccc → #ffffff`
7. **Candy Gradient** — `#1a1a2e → #e94560 → #ff6b8a → #ffc2d1 → #b8f2e6 → #aef1e8`
8. **Electric Dusk** — `#0b0c10 → #1f4068 → #e43f5a → #f9a825 → #fffde7 → #ffffff`

### Section 4: Generalization

| Control | Type | Range | Default | ⓘ Info |
|---|---|---|---|---|
| **Power (n)** | Slider | 2.0 to 8.0, step 0.1 | 2.0 | Changes the formula from z² + c to zⁿ + c. "The classic Julia set uses n=2. Higher powers produce rotational symmetry: n=3 gives 3-fold symmetry, n=4 gives 4-fold, etc. Fractional powers create fascinating asymmetric shapes." |

### Section 5: Animation

| Control | Type | Range | Default | ⓘ Info |
|---|---|---|---|---|
| **Animate c** | Toggle | on/off | off | When enabled, c orbits a circle in the complex plane, showing how the Julia set morphs continuously. "Connected Julia sets smoothly transition through dramatically different shapes as c moves." |
| **Orbit Radius** | Slider | 0.1 to 1.5 | 0.7885 | Radius of the circle c travels along. 0.7885 is a classic choice that produces beautiful transitions. |
| **Animation Speed** | Slider | 0.1 to 5.0 | 1.0 | Revolutions per ~30 seconds. |
| **Pause / Resume** | Button | — | — | — |

### Section 6: Visualization Overlays

| Control | Type | Default | ⓘ Info |
|---|---|---|---|
| **Show Axes** | Toggle | off | Overlays the real (horizontal) and imaginary (vertical) axes with tick marks and labels. Helps orient the viewer in the complex plane. |
| **Show Orbit** | Toggle | off | "Click any point on the fractal to see its iteration orbit — the sequence of z values as the formula is applied repeatedly. Orbits that spiral outward escape; orbits that stay bounded are inside the set." |
| **Orbit Trail Length** | Slider (visible only when Show Orbit is on) | 50 | How many iteration steps to draw in the orbit trail. |
| **Coordinate Tooltip** | Toggle | on | Shows complex-plane coordinates as you hover over the canvas. |

### Section 7: Presets

A row of clickable preset buttons that set c, palette, and zoom to known beautiful configurations:

| Preset Name | c value | Palette | Notes |
|---|---|---|---|
| **Dendrite** | c = i (0 + 1i) | Monochrome | Classic dendritic (tree-like) structure |
| **Douady Rabbit** | c = -0.123 + 0.745i | Deep Ocean | Three-eared rabbit-like connected set |
| **Siegel Disc** | c = -0.391 - 0.587i | Aurora Borealis | Contains a Siegel disc (irrational rotation) |
| **San Marco** | c = -0.75 + 0i | Solar Flare | Basilica/San Marco fractal |
| **Spiral Galaxy** | c = -0.7 + 0.27015i | Neon Synthwave | Classic spiral arms |
| **Lightning** | c = -0.4 + 0.6i | Electric Dusk | Jagged, electric-looking boundary |
| **Cantor Dust** | c = 0.36 + 0.1i | Infrared | Disconnected dust — c is outside Mandelbrot set |
| **Dragon** | c = -0.8 + 0.156i | Candy Gradient | Dragon-curve-like boundary |

Each preset button can be a small 48×48 thumbnail (pre-rendered at low resolution) or a simple colored badge with the name.

---

## ⓘ Info Popover System

### Behavior
- Clicking an ⓘ button opens a **popover** (not a full modal) anchored near the button.
- The popover has a semi-transparent dark backdrop (frosted glass effect).
- Contains: a **title**, **explanation text** (2–5 sentences), and optionally a **formula** rendered in styled monospace or Unicode math.
- A close button (✕) or clicking outside dismisses it.
- Only one popover open at a time (opening a new one closes the previous).

### Styling
- Background: `rgba(15, 23, 42, 0.92)` with `backdrop-filter: blur(12px)`.
- Border: 1px solid `rgba(245, 158, 11, 0.3)` (amber glow).
- Border radius: 12px.
- Max width: 320px.
- Text: light gray (#e2e8f0), formulas in amber (#f59e0b).
- Subtle box shadow with amber tint.

---

## General "What is a Julia Set?" Modal

Triggered by the `[?]` button in the top bar. This is a centered modal (not a popover) with a dark frosted-glass panel. Content:

**Title:** "What is a Julia Set?"

**Body (educational, friendly tone):**

> Julia sets are a family of fractals discovered by French mathematician Gaston Julia in 1918. They arise from an astonishingly simple formula applied repeatedly:
>
> **z → z² + c**
>
> Starting from every point z₀ in the complex plane, we apply this formula over and over. Some starting points produce sequences that spiral off to infinity (they "escape"), while others remain bounded forever.
>
> The **Julia set** is the boundary between these two behaviors — and it turns out to be infinitely complex.
>
> The constant **c** determines the shape. Every different value of c produces a completely different fractal. When c is chosen from *inside* the Mandelbrot set, the Julia set is a single connected piece. When c is *outside* the Mandelbrot set, the Julia set shatters into infinitely many disconnected pieces called "Fatou dust."
>
> The colors you see represent how quickly each point escapes — points that escape fast get one color, points that escape slowly get another, and points that never escape (inside the set) are colored separately.
>
> Use the **Mandelbrot mini-map** in the sidebar to explore how the choice of c transforms the fractal. Try the **presets** to visit famous Julia sets, or adjust the **power** to see generalizations beyond z².

---

## Canvas Interaction

### Mouse / Touch
- **Scroll wheel**: Zoom in/out centered on cursor position.
- **Click + drag**: Pan the viewport.
- **Click (without drag)**: If "Show Orbit" is enabled, display the orbit for the clicked point.
- **Hover**: If "Coordinate Tooltip" is on, show `z = x + yi` near the cursor.

### Mandelbrot Mini-Map Interaction
- **Click**: Sets c to the clicked complex coordinate.
- **Hover**: Shows coordinate tooltip.
- The current c is marked with a bright crosshair or glowing dot.
- The Mandelbrot set should be rendered once at load (and re-rendered only if max iterations changes).

---

## Rendering Algorithm

### Escape-Time (Standard)
```
for each pixel (px, py):
    map (px, py) to complex number z₀ based on viewport (center, zoom)
    z = z₀
    for i = 0 to maxIterations:
        z = z^n + c
        if |z|² > escapeRadius²:
            color pixel based on i (and smooth value if enabled)
            break
    if not escaped:
        color pixel with interior color
```

### Smooth Coloring
When enabled, after escape at iteration `i` with final `|z|`:
```
smooth_val = i + 1 - log2(log(|z|)) / log(n)
```
Use `smooth_val` (a float) instead of integer `i` to index into the color palette.

### Color Mapping
```
t = (smooth_val * cycleSpeed + colorOffset) mod 1.0
```
Interpolate through the palette color stops at position `t`.

### Performance Strategy
- Render at **half resolution** during interaction (drag/zoom/slider changes), then render at full resolution after a debounce (~200ms of inactivity).
- Use `ImageData` and direct pixel buffer writes (avoid per-pixel `fillRect`).
- Consider rendering in horizontal strips across multiple `requestAnimationFrame` calls to avoid blocking the UI for >50ms.

---

## UI Theme & Styling

### Color System
| Role | Color | Hex |
|---|---|---|
| Background (app) | Deep navy/charcoal | `#0f1729` |
| Sidebar background | Slightly lighter, glassmorphic | `rgba(15, 23, 42, 0.8)` with blur |
| Panel/section headers | Slate | `#1e293b` |
| Primary accent | Warm amber | `#f59e0b` |
| Secondary accent | Soft amber | `#fbbf24` |
| Text (primary) | Light gray | `#e2e8f0` |
| Text (secondary) | Muted gray | `#94a3b8` |
| Borders | Subtle slate | `rgba(148, 163, 184, 0.2)` |
| Slider track | Dark slate | `#334155` |
| Slider thumb | Amber | `#f59e0b` |
| Toggle (on) | Amber | `#f59e0b` |
| Toggle (off) | Dark gray | `#475569` |
| Buttons | Amber bg, dark text | `#f59e0b` / `#0f1729` |
| Info button (ⓘ) | Muted amber outline | border `#f59e0b`, text `#f59e0b` |

### Typography
- Font stack: `'Inter', system-ui, -apple-system, sans-serif` (Inter is available via Tailwind defaults).
- Section headers: 14px, semibold, uppercase tracking-wide, amber color.
- Control labels: 13px, medium, light gray.
- Values/readouts: 13px, monospace (`font-family: 'JetBrains Mono', 'Fira Code', monospace`).
- Info popover text: 14px, normal weight, generous line height (1.6).

### Component Styling
- **Sliders**: Custom-styled range inputs — thin track (#334155), round amber thumb with subtle glow.
- **Number inputs**: Small, inline, dark background (#1e293b), amber border on focus, monospace font. Shown next to sliders for precise value entry.
- **Toggles**: Pill-shaped switch, smooth transition, amber when on.
- **Buttons**: Rounded (8px), amber background with dark text for primary actions; dark background with amber border for secondary.
- **Accordion sections**: Click header to expand/collapse with smooth height animation. Chevron icon rotates. Section header has a subtle bottom border.
- **Preset buttons**: Rounded pills, dark background, amber border, amber text. On hover: amber background, dark text.

### Glassmorphism
The sidebar and modals use a frosted-glass effect:
```css
background: rgba(15, 23, 42, 0.85);
backdrop-filter: blur(16px);
-webkit-backdrop-filter: blur(16px);
border: 1px solid rgba(148, 163, 184, 0.15);
```

---

## Responsive Behavior

- **≥1024px**: Full layout as described (sidebar + canvas).
- **<1024px**: Sidebar becomes a bottom drawer (slides up from bottom, overlays the canvas). Toggle button moves to bottom-left corner. Canvas fills the full viewport.
- The canvas should always resize to fill available space (`ResizeObserver` or window resize event).

---

## State Management

All state in a single component using individual `useState` hooks (no external state library). Key state variables:

```
// Julia parameters
c: { re: number, im: number }
maxIterations: number
escapeRadius: number
power: number

// Viewport
center: { x: number, y: number }
zoom: number

// Coloring
palette: string (palette name)
smoothColoring: boolean
cycleSpeed: number
colorOffset: number
interiorColor: string
animateColors: boolean

// Animation
animateC: boolean
orbitRadius: number
animSpeed: number

// Overlays
showAxes: boolean
showOrbit: boolean
orbitTrailLength: number
showTooltip: boolean
orbitPoint: { x: number, y: number } | null

// UI
sidebarOpen: boolean
activeInfoPopover: string | null
showHelpModal: boolean
activeSection: string[] (which accordion sections are expanded)
```

---

## Rendering Triggers

The fractal should re-render when any of these change: `c`, `maxIterations`, `escapeRadius`, `power`, `center`, `zoom`, `palette`, `smoothColoring`, `cycleSpeed`, `colorOffset`, `interiorColor`.

Use a `useEffect` that depends on these values, with a debounce (~100ms) during active slider dragging and immediate render on release.

Overlays (axes, orbit) are drawn in a separate pass on top of the fractal image data and do NOT trigger a full re-render.

---

## Accessibility Notes

- All sliders should have `aria-label` and `aria-valuetext`.
- Info popovers should trap focus when open and be dismissible via Escape.
- Keyboard navigation: Tab through controls, Enter/Space to toggle, arrow keys for sliders.
- Canvas interactions should have keyboard alternatives (arrow keys to pan, +/- to zoom).

---

## File Output

Deliver as a single file: `JuliaSetExplorer.jsx`

The file should export a default React component that renders the complete application. All styles should be inline or Tailwind classes. No separate CSS files.
