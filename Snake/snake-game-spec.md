# Enhanced Snake Game - Technical Specification

## Project Overview
Create a modern, enhanced version of the classic Snake game as a single-file HTML application with embedded CSS and JavaScript. The game features multiple game modes including a unique layered 3D mode, power-up system, and polished visual effects.

## Technical Requirements
- **Format**: Single HTML file with embedded CSS and JavaScript
- **No external dependencies**: Vanilla JavaScript, CSS, and HTML only
- **Browser compatibility**: Modern browsers (Chrome, Firefox, Safari, Edge)
- **Responsive design**: Should work on desktop browsers
- **Performance**: Smooth 60 FPS gameplay

## Game Modes

### 1. Classic Mode
- Traditional Snake gameplay
- Game over on wall collision or self-collision
- Score increases with each food item eaten
- Speed remains constant

### 2. Timed Challenge Mode
- 60-second countdown timer
- Goal: Maximize score before time runs out
- Game ends when timer reaches zero
- Display remaining time prominently

### 3. Survival Mode
- Progressive difficulty increase
- Speed gradually increases as snake grows
- Every 5 food items eaten, increase speed by 10%
- Game over on collision

### 4. Zen Mode
- No death/game over
- Snake passes through walls (wraps to opposite side)
- Snake passes through itself (no self-collision)
- Focus on relaxation and high scores
- Unlimited gameplay

### 5. 3D Mode (Layered)
- **5 vertical layers** stacked on top of each other
- Snake can move between layers using Q/E or J/K keys
- Each layer is a complete 2D playing field
- Food spawns randomly on any layer
- Visual representation:
  - Current layer: Full opacity, bright colors
  - Layers above/below: Translucent (30-50% opacity)
  - Clear visual indicator of current layer number (1-5)
  - Offset layers slightly in perspective to show depth
- Collision detection works within current layer only
- Snake segments on different layers appear at different depths
- Game over on wall collision or self-collision (same as Classic)

## Controls

### Movement Controls (both schemes supported simultaneously)
- **Arrow Keys**: Up/Down/Left/Right
- **WASD**: W(up) / S(down) / A(left) / D(right)

### Layer Switching (3D Mode only)
- **Q/J**: Move up one layer (toward layer 1)
- **E/K**: Move down one layer (toward layer 5)
- Layer switching is instantaneous
- Cannot move beyond layer boundaries (1-5)

### General Controls
- **Spacebar**: Pause/Resume game
- **R**: Restart current game mode
- **ESC**: Return to mode selection menu

## Power-Up System

### Power-Up Types
1. **Speed Boost** (Orange)
   - Duration: 5 seconds
   - Effect: 1.5x movement speed
   - Visual: Orange glow around snake

2. **Slow Motion** (Blue)
   - Duration: 5 seconds
   - Effect: 0.5x movement speed
   - Visual: Blue glow around snake

3. **Invincibility** (Purple)
   - Duration: 3 seconds
   - Effect: Pass through own tail without dying
   - Visual: Purple glow/shimmer effect

4. **Point Multiplier** (Gold/Yellow)
   - Duration: 10 seconds
   - Effect: 2x points for food eaten
   - Visual: Golden glow and sparkles

5. **Shrink** (Green)
   - Instant effect
   - Effect: Removes last 3 segments from snake (minimum length: 3)
   - Visual: Green flash effect

### Power-Up Mechanics
- Spawn chance: 15% probability when food is eaten
- Only one power-up visible at a time
- Power-up disappears after 8 seconds if not collected
- Power-up position is marked clearly (pulsing/glowing effect)
- Display active power-up status in UI with countdown timer
- Power-ups stack (can have multiple active simultaneously)

## Visual Effects

### Smooth Animations
- Snake movement: Smooth sliding transition between grid cells (200ms interpolation)
- Use CSS transforms or canvas animation for fluid motion
- Easing function: ease-out for natural feel

### Particle Effects
- **Food consumption**: 8-12 particles burst outward
- **Power-up collection**: 15-20 particles with power-up color
- **Layer switching** (3D mode): Subtle particle trail effect
- Particles fade out over 0.5-1 second
- Particle colors match the consumed item

### Glow Effects
- Snake head: Bright glow (4-6px radius)
- Snake body: Gradient from head color to tail
- Food items: Pulsing glow effect (animate between 100%-150% brightness)
- Power-ups: Strong glow with color matching power-up type
- Active power-up: Snake glows with power-up color

### Screen Effects
- **Eating food**: Subtle screen flash (very brief, 100ms)
- **Power-up collected**: Screen shake (3-5px, 200ms)
- **Game over**: Screen fade to semi-transparent overlay

### Background
- Animated grid lines with subtle pulse effect
- Dark background (#0a0a0a or similar)
- Grid cells slightly visible (#1a1a1a borders)
- Neon/modern aesthetic

### Snake Visual Design
- Gradient color along body (head bright, tail darker)
- Rounded segment corners for smooth appearance
- Slight gap between segments for definition
- Head segment slightly larger/distinct from body

## Game Board

### Grid Specifications
- **2D Modes**: 25x25 grid cells (adjustable)
- **3D Mode**: 25x25 grid per layer, 5 layers total
- Cell size: Calculated based on viewport (responsive)
- Border: Visible walls in non-Zen modes

### Rendering
- Use HTML5 Canvas for game rendering
- Separate canvas layers for background, game elements, and effects
- 60 FPS target frame rate
- Clear rendering for each layer in 3D mode

## Scoring System

### Point Values
- Regular food: 10 points
- Food with multiplier active: 20 points
- Each segment of snake at game end: 1 point

### Score Display
- Current score: Prominent display
- Current game mode indicator
- Active power-ups with timers
- For 3D mode: Current layer indicator
- For Timed mode: Countdown timer

## User Interface

### Main Menu
- Game title with stylish typography
- 5 mode selection buttons:
  - Classic
  - Timed Challenge
  - Survival
  - Zen
  - 3D Mode
- Brief description of each mode on hover
- Controls explanation section

### In-Game UI
- Top bar with:
  - Current score
  - Game mode name
  - Pause button
- Side panel (optional) with:
  - Active power-ups and timers
  - Current layer (3D mode only)
  - Timer (Timed mode only)
- Controls reminder (can be toggled)

### Game Over Screen
- Final score display
- Game mode played
- "Play Again" button (same mode)
- "Main Menu" button
- Personal best indicator if score is highest for that mode

### Pause Screen
- Semi-transparent overlay
- "Paused" text
- "Resume" button
- "Restart" button
- "Main Menu" button

## Color Scheme (Neon/Modern Theme)

### Primary Colors
- Background: #0a0a0a (very dark)
- Grid lines: #1a1a1a
- Snake: #00ff88 (neon green) with gradient to #00aa55
- Food: #ff0066 (neon pink/red)
- UI text: #ffffff or #e0e0e0

### Power-Up Colors
- Speed Boost: #ff8800 (orange)
- Slow Motion: #0088ff (blue)
- Invincibility: #aa00ff (purple)
- Point Multiplier: #ffdd00 (gold)
- Shrink: #00ff44 (green)

### 3D Mode Layer Colors
- Use slight color tint per layer to distinguish them
- Layer 1: Slight blue tint
- Layer 3: Normal colors
- Layer 5: Slight red tint

## Game Logic

### Snake Movement
- Snake moves one cell per tick
- Base tick rate: 150ms (adjust per difficulty)
- Snake grows by one segment when food is eaten
- Direction changes are queued (prevent reverse direction)

### Collision Detection
- Wall collision: Game over (except Zen mode)
- Self collision: Game over (except Zen mode and Invincibility)
- Food collision: Eat food, grow snake, spawn new food
- Power-up collision: Activate power-up effect

### 3D Mode Specifics
- Snake can have segments on multiple layers
- When switching layers, snake head moves to new layer
- Body segments follow head's path (including layer changes)
- Collision only checks current layer for head
- Visual trail shows path through layers

### Food Spawning
- Random empty cell on grid
- Cannot spawn on snake body
- In 3D mode: Random layer selection
- Instant spawn after previous food eaten

## Storage (NOT IMPLEMENTED - Placeholder for Future)
- No high score tracking in initial version
- Comment in code where localStorage would be added
- Structure for future implementation

## Code Structure

### File Organization (Single HTML File)
```html
<!DOCTYPE html>
<html>
<head>
    <style>
        /* All CSS here */
    </style>
</head>
<body>
    <!-- All HTML here -->
    <script>
        // All JavaScript here
        // Organized into clear sections:
        // 1. Constants and configuration
        // 2. Game state management
        // 3. Rendering functions
        // 4. Game logic functions
        // 5. Input handling
        // 6. Power-up system
        // 7. UI management
        // 8. Initialization
    </script>
</body>
</html>
```

### JavaScript Architecture
- Object-oriented approach with clear class/module separation
- Game state object containing all mutable state
- Separate render loop and game loop
- Event-driven input handling
- Clean separation between modes

## Performance Considerations
- Efficient canvas rendering (clear only necessary areas)
- RequestAnimationFrame for smooth animation
- Avoid memory leaks (clear intervals, remove listeners)
- Optimize particle system (limit active particles)
- Debounce input handling

## Accessibility
- Keyboard-only controls (no mouse required for gameplay)
- Clear visual indicators for all game states
- Pause functionality
- Color choices consider visibility
- Clear UI text with good contrast

## Testing Checklist
- [ ] All 5 game modes work correctly
- [ ] Both control schemes (Arrow + WASD, Q/E + J/K) function
- [ ] All 5 power-ups spawn and function correctly
- [ ] 3D mode layer switching works smoothly
- [ ] Collision detection accurate in all modes
- [ ] Visual effects render without performance issues
- [ ] Pause/Resume works in all modes
- [ ] Game over conditions trigger correctly
- [ ] UI updates properly for all states
- [ ] No console errors during gameplay

## Future Enhancement Ideas (Not in Initial Build)
- High score persistence (localStorage)
- Achievement system
- Custom color themes
- Board size options
- Difficulty settings
- Sound effects and music
- Mobile touch controls
- Multiplayer mode

## Development Notes
- Start with Classic mode as foundation
- Add visual effects incrementally
- Implement 3D mode after 2D modes are stable
- Test each power-up individually
- Performance test with maximum snake length
- Cross-browser testing before finalization

---

**Build Priority:**
1. Core game engine (Classic mode)
2. UI and menu system
3. Other 2D modes (Timed, Survival, Zen)
4. Power-up system
5. Visual effects and polish
6. 3D layered mode
7. Final testing and refinement
