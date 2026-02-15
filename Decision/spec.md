# Decision Neuron — Project Spec

## Overview

An interactive web-based decision-making tool visualized as a neural network. Users weigh competing factors to decide between restaurants. The tool renders a dark, techy neural network diagram with animated signal flows showing how each factor contributes to the final recommendation.

**Stack:** HTML / CSS / TypeScript (single-page app, no frameworks)

---

## Architecture

### Three-Layer Neural Network Layout

```
[Factor Nodes]  →  [Decision Neuron]  →  [Restaurant Nodes]
   (left)              (center)              (right)
```

- **Layer 1 — Factor Nodes (left):** Each factor is a glowing node with a label and a weight slider.
- **Layer 2 — Decision Neuron (center):** A single large central node that aggregates weighted scores.
- **Layer 3 — Restaurant Nodes (right):** Each restaurant is a node. The winner is highlighted.

Animated lines connect Layer 1 → Layer 2 → Layer 3, with brightness/pulse speed proportional to signal strength.

---

## Default Data

### Restaurants

| Restaurant   | Editable | Removable |
|-------------|----------|-----------|
| Scott Cafe  | Yes      | Yes       |
| DJ's Dugout | Yes      | Yes       |

Users can add new restaurants via an "Add Restaurant" button.

### Factors (with default values)

| Factor             | Scott Cafe | DJ's Dugout | Notes                              |
|--------------------|------------|-------------|------------------------------------|
| Cost               | 10 (free)  | 3 ($15)     | Lower cost = higher score (0–10)   |
| Food Quality       | 5 (medium) | 9 (high)    | Scale 0–10                         |
| Time to Eat        | 8 (fast)   | 4 (slower)  | Less time = higher score (0–10)    |
| Social Atmosphere  | 3 (low)    | 9 (great)   | Scale 0–10                         |
| Walking Distance   | 9 (close)  | 4 (farther) | Closer = higher score (0–10)       |

Users can add custom factors via an "Add Factor" button, setting a name and a score (0–10) for each restaurant.

---

## Interaction Design

### Weight Sliders

- Each factor node has a slider (range: 0–10, default: 5).
- The slider controls how much that factor matters in the decision.
- Adjusting a slider immediately updates:
  - The animated connection brightness/speed from that factor to the decision neuron.
  - The final scores and recommendation.

### Adding Factors

- "Add Factor" button opens an inline form:
  - Factor name (text input)
  - Score for each restaurant (0–10 slider or number input per restaurant)
- New factor appears as a new node on the left with its own weight slider.
- Factor nodes should have an "×" button to remove them.

### Adding / Editing Restaurants

- "Add Restaurant" button opens an inline form:
  - Restaurant name (text input)
  - Score for each existing factor (0–10)
- Restaurant nodes should have an "×" button to remove them.
- Clicking a restaurant node or an edit icon allows editing its name and factor scores.

---

## Scoring Algorithm

For each restaurant, compute a weighted score:

```
score(restaurant) = Σ (factor_weight[i] * factor_score[restaurant][i]) / Σ factor_weight[i]
```

- `factor_weight[i]` = the user's slider value for factor i (0–10)
- `factor_score[restaurant][i]` = how that restaurant rates on factor i (0–10)
- Normalize by dividing by the sum of weights (so result is 0–10).
- If all weights are 0, show no recommendation.

The restaurant with the highest score is the **winner** and should be visually highlighted.

---

## Visual Design

### Theme: Dark / Techy / Neural Network

- **Background:** Dark (#0a0a1a or similar deep navy/black).
- **Nodes:** Circular with a subtle glow. Use neon accent colors:
  - Factor nodes: Cyan/teal glow (#00e5ff or similar)
  - Decision neuron: Larger node, white or bright glow, pulsing
  - Restaurant nodes: Green for winner (#00ff88), dim for loser(s)
- **Connections:** SVG or canvas lines between nodes.
  - Color: Matches the source node color, fading toward the center.
  - Animation: Small particles/dots travel along the lines from left to right, simulating signal flow.
  - Speed & brightness of particles should scale with the weight of that factor.
  - Connections with weight = 0 should be very dim / no particles.
- **Typography:** Monospace or clean sans-serif. Light text on dark background.
- **Sliders:** Styled to match the theme (dark track, glowing thumb).

### Layout

- Responsive but primarily designed for desktop.
- Factor nodes vertically stacked on the left (~25% width).
- Decision neuron centered (~50% position).
- Restaurant nodes vertically stacked on the right (~75% width).
- Below the diagram: score breakdown panel showing each restaurant's computed score as a bar or percentage.
- Controls (Add Factor, Add Restaurant) at the bottom or in a collapsible sidebar.

---

## Animation Details

- Use `requestAnimationFrame` for smooth animation.
- Particles travel along bezier curves from factor nodes → decision neuron → restaurant nodes.
- Particle properties:
  - Size: 2–4px circles
  - Color: Inherited from source node
  - Speed: Proportional to factor weight (weight 10 = fast, weight 1 = slow)
  - Opacity: Proportional to factor weight
  - Spawn rate: Proportional to factor weight (more particles for higher weights)
- The decision neuron should pulse/breathe gently.
- When a winner changes, the winning restaurant node should flash or have a brief highlight animation.

---

## File Structure

```
decision-neuron/
├── index.html        # Page structure, containers for the visualization
├── styles.css        # All styling, animations, theme
└── app.ts            # All logic: scoring, rendering, state management, animation
```

Compile `app.ts` to `app.js` before running. The HTML should reference `app.js`.

---

## State Management

Maintain a single state object in TypeScript:

```typescript
interface Factor {
  id: string;
  name: string;
  weight: number; // 0–10, user-controlled slider
  scores: Record<string, number>; // restaurantId → score (0–10)
}

interface Restaurant {
  id: string;
  name: string;
}

interface AppState {
  factors: Factor[];
  restaurants: Restaurant[];
}
```

All UI updates should be driven by re-rendering from this state.

---

## Edge Cases

- **0 or 1 restaurants:** Show the diagram but no "winner" comparison if fewer than 2.
- **0 factors:** Show restaurant nodes but no connections or scores.
- **All weights at 0:** Display "Adjust weights to get a recommendation" message.
- **Tied scores:** Highlight both/all tied restaurants equally.
- **Many factors (10+):** Factor list should scroll; layout should remain usable.
- **Many restaurants (5+):** Restaurant list should scroll; connections should remain readable.

---

## Summary

Build a single-page HTML/CSS/TypeScript app that visualizes a restaurant decision as an animated neural network. Factor nodes on the left feed weighted signals through animated connections into a central decision neuron, which outputs scores to restaurant nodes on the right. Users control weights via sliders and can fully customize both factors and restaurants. Dark techy aesthetic with glowing nodes and particle-based signal animations.
