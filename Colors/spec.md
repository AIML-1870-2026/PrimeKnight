# RGB Colour Studio — Build Specification

## Overview

A single-page React application: an interactive RGB color mixer styled as a theatrical stage. Three spotlights (red, green, blue) shine down onto a stage floor and mix additively — just like real stage lighting. A palette generator panel sits to the right. All color controls live below the stage canvas.

---

## Stack & Setup

- **Framework:** React (with hooks)
- **Styling:** Inline styles only — no CSS modules, no Tailwind, no styled-components
- **Canvas:** Native HTML5 Canvas 2D API via `useRef`
- **Fonts:** Google Fonts — load dynamically in a `useEffect` via injected `<link>` tag
  - `Cinzel` (weights 400, 600, 700) — display / headers
  - `Oswald` (weights 300, 400, 500, 600) — UI labels, buttons
  - `Courier Prime` (weights 400, 700) — monospace data (hex, rgb, hsl values)
- **No external libraries** beyond React itself
- **Single file:** Everything in one `RGBColorStudio.jsx` with a default export

---

## File Structure

```
RGBColorStudio.jsx   ← entire app, single file, default export
```

---

## Global Styles (inject via useEffect)

Inject a `<style>` tag into `document.head` on mount, remove on unmount:

```css
* { box-sizing: border-box; }
input[type=range] { -webkit-appearance: none; appearance: none; }
::-webkit-scrollbar { width: 5px; }
::-webkit-scrollbar-track { background: #03030a; }
::-webkit-scrollbar-thumb { background: #181828; border-radius: 3px; }
@keyframes toastIn {
  from { opacity: 0; transform: translate(-50%, 8px); }
  to   { opacity: 1; transform: translate(-50%, 0); }
}
```

---

## Color Utility Functions

All pure functions, no imports needed:

### `clamp(v)`
`Math.max(0, Math.min(255, Math.round(v)))`

### `rgbToHex(r, g, b)`
Returns `"#rrggbb"` string. Each channel `.toString(16).padStart(2, "0")`.

### `hexToRgb(hex)`
Strips `#`, validates `/^[0-9a-fA-F]{6}$/`, returns `{ r, g, b }` or `null`.

### `rgbToHsl(r, g, b)`
Standard RGB→HSL. Returns `{ h, s, l }` where:
- `h` is `0–360`, rounded to 1 decimal
- `s` and `l` are `0–100` percentages, rounded to 1 decimal

### `hslToRgb(h, s, l)`
Standard HSL→RGB. Input: `h` in degrees (0–360), `s` and `l` in percent (0–100). Returns `{ r, g, b }` integers.

### `hslToHex(h, s, l)`
Convenience: calls `hslToRgb` then `rgbToHex`.

### `luminance(r, g, b)`
WCAG relative luminance:
```
f(v) = v/255 ≤ 0.03928 ? v/255/12.92 : ((v/255 + 0.055)/1.055)^2.4
L = 0.2126·f(r) + 0.7152·f(g) + 0.0722·f(b)
```

### `contrastRatio(r1,g1,b1, r2,g2,b2)`
`(max(L1,L2) + 0.05) / (min(L1,L2) + 0.05)`

---

## Color Name Lookup

An array of `[name, r, g, b]` tuples (~75 entries covering common CSS named colors). Function `findColorName(r, g, b)` returns the name of the nearest color by Euclidean distance in RGB space (sum of squared channel differences, no square root needed).

Include at minimum: Black, White, Red, Lime, Blue, Yellow, Cyan, Magenta, Silver, Gray, Maroon, Olive, Green, Purple, Teal, Navy, Orange, Coral, Crimson, DodgerBlue, Gold, HotPink, IndianRed, Lavender, LightBlue, LightCoral, LightGreen, LightPink, LightSkyBlue, LimeGreen, MediumBlue, MediumOrchid, MediumPurple, MediumSeaGreen, MidnightBlue, OrangeRed, Orchid, PaleGreen, Pink, Plum, RoyalBlue, SaddleBrown, Salmon, SandyBrown, SeaGreen, SkyBlue, SlateBlue, SpringGreen, SteelBlue, Tan, Tomato, Turquoise, Violet, YellowGreen, Chartreuse, DeepPink, DeepSkyBlue, FireBrick, ForestGreen, Chocolate, Sienna, Peru, Goldenrod, DarkOrange, DarkRed, DarkGreen, DarkViolet, Indigo, BlueViolet, CornflowerBlue, CadetBlue, Khaki, BurlyWood, LightSalmon, RebeccaPurple.

---

## Palette Generator

Function `makePalette(r, g, b)` returns an object with these keys:

```js
const { h, s, l } = rgbToHsl(r, g, b);
const S = Math.min(100, Math.max(s, 55));   // clamp saturation to min 55%
const L = Math.min(Math.max(l, 40), 58);    // clamp lightness 40–58%

{
  complementary:  [hslToHex((h+180)%360, S, L)],
  analogous:      [hslToHex((h+30)%360, S, L), hslToHex((h-30+360)%360, S, L)],
  triadic:        [hslToHex((h+120)%360, S, L), hslToHex((h+240)%360, S, L)],
  splitComp:      [hslToHex((h+150)%360, S, L), hslToHex((h+210)%360, S, L)],
  tetradic:       [hslToHex((h+90)%360, S, L), hslToHex((h+180)%360, S, L), hslToHex((h+270)%360, S, L)],
  monochromatic:  [14, 28, 44, 60, 76].map(lt => hslToHex(h, S, lt)),
}
```

---

## State

All state lives in the root `RGBColorStudio` component:

| State | Type | Initial |
|---|---|---|
| `rgb` | `{ r, g, b }` | `{ r: 180, g: 40, b: 200 }` |
| `hexFocus` | boolean | `false` |
| `hexInput` | string | `""` |
| `hexErr` | boolean | `false` |
| `toast` | string or null | `null` |

Derived (computed on every render, no state):
- `hex = rgbToHex(r, g, b)`
- `hsl = rgbToHsl(r, g, b)`
- `colorName = findColorName(r, g, b)`
- `pal = makePalette(r, g, b)`
- `crW = contrastRatio(r,g,b, 255,255,255)`
- `crB = contrastRatio(r,g,b, 0,0,0)`

---

## Canvas Animation

Use a `<canvas>` element with a `ref`. In a `useEffect`:

1. Create a `ResizeObserver` on the canvas element. On resize, set `canvas.width = rect.width * devicePixelRatio` and `canvas.height = rect.height * devicePixelRatio`.
2. Run a `requestAnimationFrame` loop. Pass `timestamp * 0.001` as `t` (time in seconds).
3. On every frame, read `r, g, b` from a ref (`rgbRef`) that is kept in sync with the `rgb` state via a separate `useEffect`.
4. Call `drawStage(ctx, canvas.width, canvas.height, t, r, g, b)` each frame.
5. Cancel the animation frame and disconnect the ResizeObserver on cleanup.

The canvas CSS size is `width: 100%; height: 100%` filling its container div.

---

## `drawStage(ctx, W, H, t, r, g, b)` — Full Renderer

Draws everything in order. Each section uses `ctx.save()` / `ctx.restore()` where needed.

### Stage Geometry Constants

```
archL  = W * 0.10    // proscenium opening left edge
archR  = W * 0.90    // proscenium opening right edge
archT  = H * 0.04    // top of arch / stage opening
cInL   = W * 0.28    // inner curtain edge left (where curtain ends, stage begins)
cInR   = W * 0.72    // inner curtain edge right
floorT = H * 0.54    // floor-meets-back-wall horizon line
floorB = H * 0.97    // front apron of stage (bottom)
rigY   = archT + H * 0.09   // lighting rig bar Y position
```

### Step 1 — Theater Void

Fill entire canvas with `#010106`.

### Step 2 — Cyclorama (Back Wall)

Fill a rectangle from `(cInL, archT)` to `(cInR, floorT + 8)` with a vertical linear gradient:
- stop 0: `#05050e`
- stop 1: `#0b0b14`

### Step 3 — Stage Floor

**Floor trapezoid corners:**
```
fTL = { x: cInL + (cInR - cInL) * 0.05,  y: floorT }
fTR = { x: cInR - (cInR - cInL) * 0.05,  y: floorT }
fBL = { x: archL + W * 0.025,             y: floorB }
fBR = { x: archR - W * 0.025,             y: floorB }
```

Draw and fill the trapezoid path (moveTo fTL → fTR → fBR → fBL → closePath) with a vertical gradient:
- stop 0 at `floorT`: `#1c1309`
- stop 0.4: `#151007`
- stop 1 at `floorB`: `#0c0905`

Then `ctx.clip()` to that shape, and draw inside it:

**Horizontal planks (25 lines, i = 0..24):**
```
f = i / 24
y  = floorT + (floorB - floorT) * f
lx = fTL.x + (fBL.x - fTL.x) * f
rx = fTR.x + (fBR.x - fTR.x) * f
```
- Every 4th line (`i % 4 === 0`): `strokeStyle = "rgba(40,26,12,0.9)"`, `lineWidth = 1.4`
- Other lines: `strokeStyle = "rgba(24,16,8,0.6)"`, `lineWidth = 0.7`

**Convergence lines (9 lines, i = 1..9):** Simulate wood grain direction converging to vanishing point at `(W*0.5, floorT)`.
```
f  = i / 10
bx = fBL.x + (fBR.x - fBL.x) * f    // bottom point
tx = W*0.5 + (bx - W*0.5) * 0.06     // top point (near vanishing point)
```
Draw from `(tx, floorT)` to `(bx, floorB)`. `strokeStyle = "rgba(22,14,6,0.5)"`, `lineWidth = 0.5`.

**Floor gloss strip:** A vertical gradient rectangle at the top of the floor area (top 22% of floor height), width spanning fTL to fTR:
- stop 0: `rgba(255,235,180,0.04)`
- stop 1: `rgba(0,0,0,0)`

### Step 4 — Spotlight Beams & Floor Pools

**Idle drift function:**
```js
drift(amp, freq, phase) = amp * Math.sin(freq * t + phase)
```

**Three fixture definitions:**
```js
fixtures = [
  // Red — mounted left, lands left of center
  {
    id: 0,
    fx: W*0.29 + drift(W*0.008, 0.37, 0.0),   // fixture X (on rig)
    fy: rigY + H*0.04,                           // fixture Y (below rig)
    lx: W*0.5 - W*0.05 + drift(W*0.016, 0.37, 0.0),  // landing X (on floor)
    ly: floorT + (floorB-floorT)*0.30 + drift(H*0.009, 0.29, 0.7),
    col: [r, 0, 0],
  },
  // Green — mounted right, lands right of center
  {
    id: 1,
    fx: W*0.71 + drift(W*0.008, 0.32, 2.0),
    fy: rigY + H*0.04,
    lx: W*0.5 + W*0.05 + drift(W*0.016, 0.32, 2.0),
    ly: floorT + (floorB-floorT)*0.30 + drift(H*0.009, 0.27, 2.4),
    col: [0, g, 0],
  },
  // Blue — mounted center, lands center-low
  {
    id: 2,
    fx: W*0.50 + drift(W*0.008, 0.44, 3.9),
    fy: rigY + H*0.02,
    lx: W*0.5 + drift(W*0.016, 0.44, 3.9),
    ly: floorT + (floorB-floorT)*0.30 + H*0.04 + drift(H*0.009, 0.23, 4.3),
    col: [0, 0, b],
  },
]
```

**Skip any fixture where `col[0] + col[1] + col[2] < 4`** (channel is essentially off).

**Set `ctx.globalCompositeOperation = "screen"` for all beam and pool drawing.** This is what makes the colors add together like real light.

For each fixture, compute the beam direction vector and its perpendicular:
```
dx = fix.lx - fix.fx
dy = fix.ly - fix.fy
len = sqrt(dx² + dy²)
nx = -dy / len    // perpendicular unit vector
ny =  dx / len
hw0 = 4           // half-width at fixture (aperture)
hw1 = W * 0.070   // half-width at floor
```

Draw **three nested trapezoid shapes** along the beam, from fixture to landing point, each as a `createLinearGradient` from `(fix.fx, fix.fy)` to `(fix.lx, fix.ly)`:

**Outer glow** (widest, faintest — hw0*2.2 to hw1*1.7):
- stop 0: `rgba(cr,cg,cb, 0.45)`
- stop 0.12: `rgba(cr,cg,cb, 0.18)`
- stop 0.6: `rgba(cr,cg,cb, 0.07)`
- stop 1: `rgba(cr,cg,cb, 0.01)`

**Main beam** (hw0 to hw1):
- stop 0: `rgba(cr,cg,cb, 0.85)`
- stop 0.08: `rgba(cr,cg,cb, 0.52)`
- stop 0.45: `rgba(cr,cg,cb, 0.22)`
- stop 1: `rgba(cr,cg,cb, 0.05)`

**Hot core** (narrowest, brightest — hw0*0.25 to hw1*0.22):
- stop 0: `rgba(cr,cg,cb, 0.95)`
- stop 0.15: `rgba(cr,cg,cb, 0.60)`
- stop 0.55: `rgba(cr,cg,cb, 0.18)`
- stop 1: `rgba(cr,cg,cb, 0.0)`

**Floor pool** (perspective ellipse at landing point):
```
pr = W * 0.08          // pool radius
pyS = 0.30             // vertical scale factor (flattens ellipse for perspective)
```
Use `createRadialGradient(lx, ly, 0, lx, ly, pr)`:
- stop 0: `rgba(cr,cg,cb, 1.0)`
- stop 0.28: `rgba(cr,cg,cb, 0.65)`
- stop 0.65: `rgba(cr,cg,cb, 0.20)`
- stop 1: `rgba(cr,cg,cb, 0.0)`

Draw with `ctx.save(); ctx.translate(lx, ly); ctx.scale(1, pyS); ctx.arc(0,0,pr,0,PI*2); ctx.restore()`.

**Reflection shimmer** (softer ellipse slightly below pool, width 1.1x):
```
rG = createRadialGradient(lx, ly+pr*pyS*0.7, 0, lx, ly+pr*pyS, pr*0.85)
stops: 0 → rgba(cr,cg,cb,0.25), 1 → rgba(cr,cg,cb,0)
ctx.save(); ctx.translate(lx, ly + pr*pyS*0.5); ctx.scale(1.1, pyS*0.45);
ctx.arc(0,0,pr,...); ctx.restore()
```

### Step 5 — Atmospheric Dust Particles

Still with `globalCompositeOperation = "screen"`. For each fixture (skip if sum < 8):

Draw **30 particles per fixture**. Each particle:
```
seed = i * 131.4 + fix.id * 1777
prog = ((t * 0.055 + (seed % 100) * 0.01) % 1.0)   // 0..1, loops over time
```

Position along beam: `bx = fix.fx + (fix.lx - fix.fx) * prog`, same for `by`.

Lateral scatter from beam center (using perpendicular vector):
```
maxSpread = W * 0.05 * prog
sOff = (Math.sin(seed * 6.2) * 2 - 1) * maxSpread
px = bx + nx * sOff
py = by + ny * sOff
```

Alpha:
```
fade = Math.max(0, 1 - |sOff| / (maxSpread + 0.001))
twinkle = 0.3 + 0.7 * |Math.sin(seed * 3.3 + t * 0.9)|
alpha = 0.42 * fade * twinkle
```

Size: `sz = 0.8 + |Math.sin(seed * 5.1)| * 1.5` (px radius).

Draw a filled arc circle at `(px, py)` with `rgba(cr,cg,cb, alpha)`.

### Step 6 — Velvet Curtains

Draw for both `"left"` and `"right"` sides.

```
totalW = |inner - outer|   // (cInL - archL) for left, (archR - cInR) for right
numFolds = 12
foldW = totalW / numFolds
```

For each fold `f` (0..11):

Left side: `leftX = archL + f * foldW`, `rightX = leftX + foldW`
Right side: `leftX = cInR - (numFolds - f) * foldW`, `rightX = leftX + foldW`

`isPeak = f % 2 === 0`

Sway animation:
```
swayPhase = isLeft ? f * 0.42 : (numFolds - f) * 0.42
sway = foldW * 0.09 * Math.sin(0.14 * t + swayPhase)
```

Base colors (deep wine velvet):
```
isPeak:  baseR=100, baseG=9,  baseB=16
valley:  baseR=50,  baseG=4,  baseB=8
```

Fill a bezier-curved shape (top is straight line at `archT`, sides are cubic bezier curves swaying slightly, bottom extends to `floorB`):
```
ctx.beginPath()
ctx.moveTo(leftX, archT)
ctx.bezierCurveTo(leftX + sway*0.3, archT + H*0.3,
                  leftX + sway*0.7, archT + H*0.6,
                  leftX + sway,     floorB)
ctx.lineTo(rightX + sway, floorB)
ctx.bezierCurveTo(rightX + sway*0.7, archT + H*0.6,
                  rightX + sway*0.3, archT + H*0.3,
                  rightX, archT)
ctx.closePath()
```

Horizontal gradient for the fold (left-to-right linear gradient):

For peak folds:
- stop 0: `rgb(baseR*0.4, baseG*0.4, baseB*0.4)` (dark edge)
- stop 0.3: `rgb(baseR*0.88, baseG*0.88, baseB*0.88)`
- stop 0.5: `rgb(baseR+22, baseG+4, baseB+6)` (bright highlight)
- stop 0.7: `rgb(baseR*0.88, baseG*0.88, baseB*0.88)`
- stop 1: `rgb(baseR*0.4, baseG*0.4, baseB*0.4)` (dark edge)

For valley folds:
- stop 0: `rgb(baseR, baseG, baseB)`
- stop 0.45: `rgb(baseR*0.55, baseG*0.55, baseB*0.55)` (darker center)
- stop 1: `rgb(baseR, baseG, baseB)`

**Inner shadow at curtain edge** (where curtain meets stage): A `rgba(0,0,0,0)` → `rgba(0,0,0,0.4)` linear gradient rect, 0.6 foldW wide, full height.

**Batten rod at top** (horizontal bar at `archT - 5`, height 9px, full curtain width):
Vertical gradient: `#5a5a5a` → `#cccccc` → `#3a3a3a`.

**Ring clips** (9 evenly spaced along batten):
- Outer circle: r=3.5, fill `#999`
- Inner circle: r=2, fill `#555`

### Step 7 — Proscenium Mask & Gold Trim

**Mask** (hard black rectangles covering outside the stage opening):
```
ctx.fillStyle = "#010108"
// left wing
ctx.fillRect(0, 0, archL, H)
// right wing
ctx.fillRect(archR, 0, W - archR, H)
// fly space (above arch)
ctx.fillRect(0, 0, W, archT)
```

**Gold top arch beam** (horizontal band at archT):
- Position: `(archL - 2, archT - H*0.022)`, width `(archR - archL) + 4`, height `H * 0.048`
- Vertical gradient (dark-gold-bright-gold-dark):
  - 0: `#181004`
  - 0.18: `#634810`
  - 0.42: `#d49618`
  - 0.58: `#f0cc44`
  - 0.78: `#c08818`
  - 1: `#1e1606`

**Gold left pillar** (vertical strip at left edge of arch):
- Position: `(archL - W*0.028, archT)`, width `W * 0.04`, height `H`
- Horizontal gradient (dark → gold → bright → dark):
  - 0: `#18100a`
  - 0.35: `#c98e18`
  - 0.70: `#f0cc44`
  - 1: `#2a1c08`

**Gold right pillar** (mirrored):
- Position: `(archR - W*0.012, archT)`, width `W * 0.04`, height `H`
- Horizontal gradient (dark → bright → gold → dark):
  - 0: `#2a1c08`
  - 0.30: `#f0cc44`
  - 0.65: `#c98e18`
  - 1: `#18100a`

**Inner arch decorative relief lines** (`strokeStyle = "rgba(240,204,68,0.22)"`, `lineWidth = 1`):
- Left: from `(archL + W*0.013, archT + H*0.03)` down to `(archL + W*0.013, H)`
- Right: from `(archR - W*0.013, archT + H*0.03)` down to `(archR - W*0.013, H)`
- Top: from `(archL, archT - H*0.025)` to `(archR, archT - H*0.025)`

### Step 8 — Lighting Rig Bar

**Bar itself** at `(cInL - W*0.01, rigY - 4.5)`, width `(cInR - cInL) + W*0.02`, height `9px`:
Vertical gradient: `#2a2a2a` → `#888` → `#777` → `#1a1a1a`.

**Clamp units** (11 clamps, i=0..10, evenly spaced from cInL to cInR):
- Outer circle: r=5, fill `#444`
- Inner circle: r=3, fill `#6a6a6a`
- Drop cable: `strokeStyle="#222"`, `lineWidth=1`, from `(cx, rigY+5)` to `(cx, rigY+13)`

### Step 9 — Spotlight Fixture Units

For each of the 3 fixtures:

`yokeY = rigY + 13`

**Yoke** (`strokeStyle="#505050"`, `lineWidth=2.5`, `lineCap="round"`):
- Horizontal bar: from `(fx-12, yokeY)` to `(fx+12, yokeY)`
- Left arm: from `(fx-10, yokeY)` to `(fx-10, yokeY+9)`
- Right arm: from `(fx+10, yokeY)` to `(fx+10, yokeY+9)`

**Barrel** (rotated to aim at landing point):
```
ctx.save()
ctx.translate(fix.fx, yokeY + 9)
ctx.rotate(Math.atan2(fix.ly - fix.fy, fix.lx - fix.fx) - Math.PI/2)
```

Inside rotated context:
- Body: `roundRect(-11, -4, 22, 30, 4)` — horizontal gradient `#181818` → `#383838` → `#303030` → `#141414`, stroke `#444` lineWidth 0.6
- Cooling vents: 5 horizontal lines at y = 3, 7, 11, 15, 19; `strokeStyle="#1e1e1e"`, lineWidth 0.8, from x=-8 to x=8
- Lens aperture: circle at `(0, 24)`, radius 9
  - `active = (cr + cg + cb > 5)`
  - Radial gradient from `rgba(min(cr+55,255), min(cg+55,255), min(cb+55,255), lA)` → `rgba(cr,cg,cb, lA*0.65)` → `rgba(cr,cg,cb,0)`
  - `lA = active ? 0.95 : 0.15`
  - Stroke the lens ring: `rgba(cr,cg,cb, 0.55)` if active, `#2a2a2a` if not
- If active: draw a `globalCompositeOperation="screen"` radial glow around the lens (radius 20, center intensity `rgba(cr,cg,cb,0.55)`, edge 0)

`ctx.restore()`

### Step 10 — Grand Vignette

Radial gradient centered at `(W*0.5, H*0.58)`:
- Inner: 0 at radius `H*0.08`
- `rgba(0,0,0,0)` at stop 0.28
- `rgba(0,0,0,0.84)` at stop 1, radius `H*0.76`

Fill entire canvas.

### Step 11 — Scanlines

`ctx.globalAlpha = 0.02`, `ctx.fillStyle = "#000"`. Draw a 1px-tall rectangle every 3 pixels top to bottom across full width.

---

## Sub-components

### `<PaletteSwatch color={hex} />`

A rectangular swatch div. Behaviors:
- On hover: `transform: scale(1.09) translateY(-3px)`, `box-shadow: 0 8px 20px ${color}99`
- On click: copy `color` to clipboard; show "✓ Copied!" for 1300ms
- While hovered (or showing copied): show a tooltip above the swatch containing:
  - `color.toUpperCase()` in Courier Prime, 10px, `#ddd`
  - HSL values: `H{h}° S{s}% L{l}%`, 9px, `#444`
  - Or just "✓ Copied!" in `#c9a227` if just copied
- Tooltip: `background: #08081a`, `border: 1px solid #1a1a30`, `borderRadius: 6`, `padding: 5px 9px`, shadow `0 5px 18px rgba(0,0,0,0.75)`
- Swatch style: `height: 50px`, `borderRadius: 7px`, `border: 1px solid rgba(255,255,255,0.06)`

### `<DimmerSlider label value trackColor glowColor onChange />`

A custom-styled range slider. Structure:
- Label row: channel name (Oswald, 10px, 600 weight, spaced 0.18em, `glowColor`) + value number (Courier Prime, 13px, `#999`) — space-between
- Track div (6px tall, borderRadius 3, `background: #0b0b1c`, `border: 1px solid #151525`, inset shadow `0 2px 4px rgba(0,0,0,0.7)`):
  - Fill div: width `(value/255)*100%`, gradient `trackColor 44%` → `trackColor cc` → `trackColor`, box-shadow `0 0 12px ${trackColor}80` when value > 0
- Thumb div (absolutely positioned, 20×20px circle):
  - `left: calc(${pct}% - 10px)`
  - Radial gradient: `rgba(255,255,255,0.88)` center → `trackColor` 68%
  - Border: `1.5px solid rgba(255,255,255,0.5)`
  - Shadow: `0 0 18px ${trackColor}aa, 0 2px 6px rgba(0,0,0,0.6)` when active, `0 2px 5px rgba(0,0,0,0.5)` when 0
  - `pointerEvents: none`, `zIndex: 1`
- Native `<input type="range">` overlaid with `opacity: 0`, `zIndex: 2`

---

## Layout

```
┌─────────────────────────────────────────────────────────┐
│  HEADER (flex row, space-between, borderBottom #0d0d1c) │
│  "RGB COLOUR STUDIO"  [🎲 RAND] [⟨/⟩ CSS] [↓ PNG]      │
├──────────────────────────────────┬──────────────────────┤
│  LEFT COLUMN (flex: 1)           │  RIGHT COLUMN 255px  │
│  ┌──────────────────────────────┐│  Colour Palette      │
│  │  STAGE CANVAS                ││  ─ Primary swatch    │
│  │  height: clamp(260px,48vw,   ││  ─ Complementary     │
│  │          500px)              ││  ─ Analogous         │
│  └──────────────────────────────┘│  ─ Triadic           │
│  ┌──────────────────────────────┐│  ─ Split-Comp        │
│  │  Color info bar              ││  ─ Tetradic          │
│  │  Name · HEX · RGB · HSL      ││  ─ Monochromatic     │
│  └──────────────────────────────┘│                      │
│  ┌──────────────────────────────┐│                      │
│  │  DIMMER BOARD                ││                      │
│  │  Red / Green / Blue sliders  ││                      │
│  │  Hex input field             ││                      │
│  └──────────────────────────────┘│                      │
│  ┌──────────────────────────────┐│                      │
│  │  WCAG CONTRAST               ││                      │
│  │  on White · on Black         ││                      │
│  └──────────────────────────────┘│                      │
└──────────────────────────────────┴──────────────────────┘
```

- Root: `minHeight: 100vh`, `background: #020208`, `display: flex`, `flexDirection: column`
- Header: `padding: 11px 22px`, `flexShrink: 0`, `background: linear-gradient(to bottom, #04040e, #020208)`
- Body: `flex: 1`, `display: flex`, `minHeight: 0`
- Left column: `flex: 1`, `display: flex`, `flexDirection: column`, `minWidth: 0`, `overflow: auto`
- Right column: `width: 255px`, `borderLeft: 1px solid #0c0c1c`, `background: #030310`, `padding: 15px 12px`, `overflowY: auto`, `flexShrink: 0`
- Controls area: `padding: 15px 18px`, `display: flex`, `flexDirection: column`, `gap: 11px`

---

## Header

Title: `"RGB COLOUR STUDIO"` — Cinzel, 19px, weight 700, color `#ede5d5`, letterSpacing `0.12em`
Subtitle: `"Theatrical Additive Light Composition"` — Courier Prime, 9px, color `#c9a22755`, letterSpacing `0.28em`, uppercase

**Three buttons:**

| Button | Style |
|---|---|
| 🎲 RAND | Gold gradient `linear-gradient(135deg, #b88018, #e8c048, #c9a020)`, text `#180e00`, border `1px solid #c9a02266` |
| ⟨/⟩ CSS | Transparent bg, text `#44446a`, border `1px solid #181830` |
| ↓ PNG | Same as CSS button |

All buttons: Oswald 12px weight 600, letterSpacing 0.1em, borderRadius 7, padding 7px 17px. On hover: opacity 0.8.

---

## Color Info Bar

Card style: `background: #060610`, `border: 1px solid #0e0e20`, `borderRadius: 12`, `padding: 15px 18px`.

Displayed as a flex row:
- **Name** label (`#222238`, 8px, Courier Prime, uppercase, spaced) + value in Oswald 14px weight 500 `#c9a227`
- **HEX** label + `hex.toUpperCase()` — clickable, copies hex to clipboard, Courier Prime 13px `#c0b8a8`
- **RGB** label + `"r  g  b"` — clickable, copies `rgb(r,g,b)` to clipboard
- **HSL** label + `"h°  s%  l%"` — not clickable, color `#383850`

---

## Dimmer Board Card

Card with label `"DIMMER BOARD"` (8px, `#1e1e32`, Courier Prime, spaced 0.25em).

Three `DimmerSlider` components in a flex row with `gap: 18`:
- Red: `trackColor="#ff2020"`, `glowColor="#ff8080"`
- Green: `trackColor="#20ee44"`, `glowColor="#80ff90"`
- Blue: `trackColor="#2244ff"`, `glowColor="#88aaff"`

**Hex input field** below sliders:
- A small colored square (14×14px, borderRadius 3, `background: hex`, `boxShadow: 0 0 8px ${hex}66`) positioned absolutely at left-10 inside the input
- Input: `padding: 9px 12px 9px 32px` (leaves room for the swatch), Courier Prime 13px
- Normal state: `background: #090918`, `border: 1px solid #141424`
- Error state (invalid hex): `background: #120505`, `border: 1px solid #f87171`
- Focused: show `hexInput` value; blurred: show `hex.toUpperCase()`
- On change: update `hexInput`; if pattern matches `#[0-9a-fA-F]{6}`, parse and update `rgb` state

---

## WCAG Contrast Card

Card with label `"WCAG CONTRAST"`.

Two items side by side:
- A 40×40 rounded square (`borderRadius: 8`, border `1px solid #1c1c30`) filled with the background color (`#fff` or `#000`), containing `"Aa"` in Oswald weight 600 size 16 **colored with `hex`**
- To the right: contrast ratio `"{cr.toFixed(2)}:1"` in Courier Prime 12px `#aaa`, followed by two `<Badge>` components
- Below: label `"on White"` or `"on Black"` in 9px `#2a2a42`

**`<Badge pass level>`**: Inline span, Courier Prime 9px. Green (`#4ade80`) with `rgba(74,222,128,0.07)` bg and `#4ade8025` border if pass; red (`#f87171`) with equivalent red tints if fail. Shows `"AA ✓"` / `"AA ✗"` etc.

---

## Palette Panel (Right Column)

Header: `"Colour Palette"` in Cinzel 9px, `#c9a22728`, letterSpacing 0.22em.

**Primary swatch**: 52px tall, `borderRadius: 9`, filled with `hex`, `cursor: pointer`. `boxShadow: 0 4px 18px ${hex}60, inset 0 1px 0 rgba(255,255,255,0.1)`. Clicks copy hex.

**Palette groups** (in order):
1. Complementary (1 swatch)
2. Analogous (2 swatches)
3. Triadic (2 swatches)
4. Split-Comp (2 swatches)
5. Tetradic (3 swatches)
6. Monochromatic (5 swatches)

Each group has a section label (8px, `#1e1e32`, Courier Prime, uppercase, letterSpacing 0.22em) and a flex row of `<PaletteSwatch>` components with `gap: 5`.

---

## Toast Notifications

When copying or performing actions, call `showToast(message)`:
- Sets `toast` state to the message string
- Clears after 1800ms

Toast div: fixed position, `bottom: 22px`, `left: 50%`, `transform: translateX(-50%)`. `background: #08081c`, `border: 1px solid #1e1e38`, `borderRadius: 8`, `padding: 9px 20px`. Courier Prime 12px, `color: #c9a227`. `animation: toastIn 0.18s ease`. `pointerEvents: none`.

---

## Randomize

Sets `rgb` to `{ r: random 0–255, g: random 0–255, b: random 0–255 }` using `Math.floor(Math.random() * 256)`.

---

## Export CSS

Builds a `:root { }` CSS block. Variable naming:
- `--color-primary: {hex};`
- `--color-comp: {hex};` (complementary — single, no number suffix)
- `--color-analog-1:`, `--color-analog-2:` (analogous)
- `--color-triadic-1:`, `--color-triadic-2:`
- `--color-split-1:`, `--color-split-2:`
- `--color-tetrad-1:`, `--color-tetrad-2:`, `--color-tetrad-3:`
- `--color-mono-1:` through `--color-mono-5:`

Copies entire `:root { ... }` block to clipboard and shows toast `"CSS variables copied!"`.

---

## Export PNG

Creates a 960×280 offscreen canvas:
- `background: #07070e`
- Primary swatch: 150×110px rect at (20, 20) filled `hex`
- Below swatch: `hex.toUpperCase()` (bold 14px monospace), `rgb(r, g, b)` (11px), `colorName` (11px) — text color white or black based on luminance > 0.35
- All palette swatches (up to 12): 58px wide × 80px tall rects starting at x=190, gap 62px; hex code below in 8px monospace `#555`
- Footer stripe at y=240, height 40: `#1a1a28` bg, text `"RGB Colour Studio"` in 10px monospace `#444`

Triggers a download via `<a>` element with filename `palette-{hex without #}.png`.

---

## "The Colour Stage" Watermark

Absolutely positioned inside the stage canvas container:
- `bottom: 14px`, `left: 50%`, `transform: translateX(-50%)`
- Cinzel, 7px, letterSpacing 0.44em, `rgba(201,160,32,0.22)`, uppercase
- Text: `"The Colour Stage"`
- `pointerEvents: none`

---

## Key Design Tokens

| Token | Value |
|---|---|
| Page background | `#020208` |
| Card background | `#060610` |
| Card border | `1px solid #0e0e20` |
| Right panel bg | `#030310` |
| Header gradient | `#04040e` → `#020208` |
| Text primary | `#d0c8c0` |
| Text dim | `#2a2a42` |
| Gold accent | `#c9a227` |
| Gold bright | `#f0cc44` |
| Red channel color | `#ff2020` / glow `#ff8080` |
| Green channel color | `#20ee44` / glow `#80ff90` |
| Blue channel color | `#2244ff` / glow `#88aaff` |
| Curtain peak color | `rgb(100, 9, 16)` |
| Curtain valley color | `rgb(50, 4, 8)` |
| Font: Display | Cinzel |
| Font: UI | Oswald |
| Font: Mono | Courier Prime |

---

## Performance Notes

- Use a `useRef` for `rgbRef` and keep it in sync with `rgb` state — the animation loop reads from the ref, not from captured closure state
- The canvas DPR scaling ensures crisp rendering on retina displays
- Do not put `r, g, b` in the canvas `useEffect` dependency array — the loop reads from `rgbRef` continuously
- Each frame clears and redraws the entire canvas; no partial updates
- Dust particles are drawn with simple `ctx.arc` fills — no pixel manipulation — for performance
