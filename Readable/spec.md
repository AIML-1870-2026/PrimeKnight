# Readable Explorer — Project Spec

## Overview

Build a single-page web application called **Readable** that lets users explore the readability of different background color, text color, and font size combinations. All interactivity happens in real-time with no page reloads.

Deliver this as a single self-contained `index.html` file (HTML, CSS, and JS inline).

---

## Features

### 1. Background Color Controls

- Three sliders labeled **R**, **G**, and **B**, each ranging from `0` to `255`
- Each slider is paired with an integer input field showing the same value
- Moving the slider updates the number field immediately
- Changing the number field updates the slider immediately
- Clamped to `[0, 255]`; non-integer input should be ignored or rounded
- The combined RGB value sets the background color of the Text Display Area

### 2. Text Color Controls

- Same structure as Background Color Controls (three synchronized RGB slider + number field pairs)
- The combined RGB value sets the text (foreground) color in the Text Display Area

### 3. Text Size Control

- A single slider ranging from `8` to `72` (pixels)
- Paired with a synchronized integer display/input field
- Controls the `font-size` of the sample text in the Text Display Area

### 4. Text Display Area

- A visible region that renders sample text
- Background color, text color, and font size all update in real-time as controls change
- Sample text should be long enough to demonstrate readability (at least a sentence or two)

### 5. Contrast Ratio Display

- Shows the calculated WCAG contrast ratio between the current background and text colors
- Updates automatically whenever either color changes
- Displayed in the format `X.XX:1`

### 6. Luminosity Displays

- Shows the relative luminance of the background color and the relative luminance of the text color as separate labeled values
- Helps users understand the underlying math behind the contrast ratio

---

## Synchronization Behavior

- Slider → number field: updates immediately on `input` event
- Number field → slider: updates immediately on `input` event
- Any color or size change is reflected in the Text Display Area in real-time
- Contrast ratio and luminance values recalculate on every color change

---

## Contrast Ratio Calculation (WCAG)

Use the following algorithm:

**Step 1 — Convert each 8-bit channel to relative luminance:**

For each channel value `C` in `[0, 255]`:
```
c_srgb = C / 255

if c_srgb <= 0.04045:
    c_linear = c_srgb / 12.92
else:
    c_linear = ((c_srgb + 0.055) / 1.055) ^ 2.4
```

Then compute luminance `L`:
```
L = 0.2126 * R_linear + 0.7152 * G_linear + 0.0722 * B_linear
```

**Step 2 — Compute contrast ratio:**
```
contrast = (L_lighter + 0.05) / (L_darker + 0.05)
```
where `L_lighter` is the higher luminance value and `L_darker` is the lower.

**Step 3 — Display:**

Show the result rounded to two decimal places in the format `X.XX:1`.

---

## Deliverable

- Single file: `index.html`
- No external dependencies or build steps required
- Works when opened directly in a browser
