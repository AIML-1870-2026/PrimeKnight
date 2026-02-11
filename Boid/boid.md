# Boids Simulation Specification

## 1. Project Overview
A web-based simulation of flocking behavior using the Reynolds Boids algorithm. The simulation will run in a standard web browser using the HTML5 `<canvas>` element.

## 2. Architecture
* **HTML:** Contains the `<canvas>` element acting as the viewport.
* **CSS:** Resets default margins and ensures the canvas fills the browser window (immersive view).
* **JavaScript:** Handles the simulation loop, math vector calculations, and rendering.

## 3. Data Structures

### The Boid Object
Each "Boid" in the flock requires the following state properties, represented as Vectors $(x, y)$:

| Property | Description |
| :--- | :--- |
| **Position** ($\vec{P}$) | Current coordinates on the canvas. |
| **Velocity** ($\vec{V}$) | Current direction and magnitude of movement. |
| **Acceleration** ($\vec{A}$) | Accumulation of forces applied this frame (steer, wind, etc.). |

### Global Constants (Tunable)
* **Max Speed:** The velocity magnitude cap (prevents boids from moving too fast).
* **Max Force:** The steering force magnitude cap (prevents boids from turning instantly/jittering).
* **Radii:**
    * *Separation Radius:* Distance to check for crowding (e.g., 25px).
    * *Neighbor Radius:* Distance to check for alignment/cohesion (e.g., 50px).

## 4. Physics Engine (Euler Integration)
The simulation advances one time step per frame using the following logic order:

1.  **Update Velocity:**
    $$\vec{V}_{new} = \vec{V}_{old} + \vec{A}$$
    *Apply `Max Speed` limit immediately after this calculation.*
2.  **Update Position:**
    $$\vec{P}_{new} = \vec{P}_{old} + \vec{V}_{new}$$
3.  **Reset Acceleration:**
    Set $\vec{A}$ to $(0,0)$.

## 5. Steering Behavior Logic
Boids do not set their velocity directly; they apply a steering force to their acceleration.

**The Steering Formula:**
$$\vec{Force} = \vec{V}_{desired} - \vec{V}_{current}$$
*The resulting force is always clamped to `Max Force`.*

## 6. Flocking Rules

### Rule 1: Separation (Avoidance)
**Goal:** Avoid collisions with local flockmates.
**Logic:**
1.  Check neighbors within **Separation Radius**.
2.  For each neighbor, calculate vector pointing **away**: $\vec{Diff} = \vec{P}_{self} - \vec{P}_{neighbor}$.
3.  **Weight by distance:** Scale $\vec{Diff}$ inversely proportional to distance (closer = stronger push).
4.  Sum all $\vec{Diff}$ vectors into $\vec{Steer}$.
5.  If $\vec{Steer} > 0$: Normalize, scale to `Max Speed`, subtract $\vec{V}_{current}$ to get Force.

### Rule 2: Alignment (Copycat)
**Goal:** Steer towards the average heading of neighbors.
**Logic:**
1.  Check neighbors within **Neighbor Radius**.
2.  Sum the **Velocity** ($\vec{V}$) of all neighbors.
3.  Divide by neighbor count to get Average Velocity.
4.  Normalize, scale to `Max Speed` (this is $\vec{V}_{desired}$).
5.  Subtract $\vec{V}_{current}$ to get Force.

### Rule 3: Cohesion (Togetherness)
**Goal:** Steer towards the average position (center of mass) of neighbors.
**Logic:**
1.  Check neighbors within **Neighbor Radius**.
2.  Sum the **Position** ($\vec{P}$) of all neighbors.
3.  Divide by neighbor count to get Average Position (Center).
4.  Calculate vector toward Center: $\vec{Target} = \text{Center} - \vec{P}_{self}$.
5.  Normalize $\vec{Target}$, scale to `Max Speed` (this is $\vec{V}_{desired}$).
6.  Subtract $\vec{V}_{current}$ to get Force.

## 7. Simulation Loop (Per Frame)
1.  **Clear Canvas:** Wipe previous frame.
2.  **Calculate Forces:**
    * Sum forces from Separation, Alignment, and Cohesion (multiplied by arbitrary weights/multipliers).
    * Apply resulting force to Acceleration.
3.  **Update Physics:** Run Euler Integration step.
4.  **Edge Handling:** **Wrap Around.** If $x > width$, $x = 0$. If $x < 0$, $x = width$. (Same for $y$).
5.  **Render:** Draw the boid shape at the new $\vec{P}$ oriented to match rotation of $\vec{V}$.