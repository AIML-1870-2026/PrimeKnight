# Blackjack Game — Feature Specification

## Overview
A classic casino-style Blackjack game built as a single HTML file with embedded CSS and JavaScript. Single player vs dealer, realistic card design, chip-based betting, and ambient casino atmosphere.

---

## Tech Stack
- Single `.html` file (HTML + CSS + JS, no frameworks, no external dependencies except audio)
- No backend required
- All game state managed in memory (JavaScript)

---

## Gameplay Rules
- Standard casino Blackjack rules
- Dealer stands on **soft 17**
- **Blackjack pays 3:2**
- Player can **Hit**, **Stand**, **Double Down**, or **Split**
- **Double Down** allowed on hard 9, 10, or 11 only
- **Split** allowed when player has two cards of equal value
- **Re-split** allowed if a matching card is dealt after splitting
- **Double Down after Split** allowed (same 9/10/11 restriction applies)
- Dealer does not reveal hole card until player has finished all actions
- Single deck, reshuffled before every hand

---

## Betting System
- **Chip denominations:** $1, $5, $10, $25, $100, $500
- **Starting bankroll:** $1,000
- **Minimum bet:** $1
- **Maximum bet:** Full bankroll (all in)
- Clicking a chip adds it to the current bet
- Clicking the bet area removes the last chip added (undo)
- A "Clear Bet" button resets the current bet before a hand starts
- Bet is locked in once the hand is dealt

---

## Visual Design
- Green felt casino table background
- Single player seat centered at the bottom, dealer at the top
- Realistic card design: standard suits (♠ ♥ ♦ ♣), face cards (J, Q, K), Ace, numbered cards
- Decorative card back design
- Dealer's hole card shown face-down until reveal
- Chip tray displayed near the player's betting area
- Current bankroll and current bet displayed prominently on screen
- Smooth card dealing animations (cards slide into position)
- Card flip animation when dealer reveals hole card
- Chip animation when placing bets

---

## Game Flow
1. Player places bet using chip tray
2. Player clicks "Deal" to start the hand
3. Two cards dealt to player (face up), two to dealer (one face up, one face down)
4. If player has Blackjack, reveal dealer card immediately and resolve
5. Player chooses actions: Hit, Stand, Double Down, Split (where applicable)
6. If split, player plays each hand sequentially
7. Once player stands or busts, dealer reveals hole card and plays out hand
8. Result displayed (Win, Lose, Push, Blackjack), bankroll updated
9. "Deal Again" button resets for the next hand

---

## Broke & Reset Flow
- When bankroll reaches $0, the hand ends and a **"Better Luck Next Time"** screen is shown
- Screen displays a casino-style message and final stats for the session
- A **"Reset & Play Again"** button restores the bankroll to $1,000 and starts a fresh session

---

## Audio
- Ambient casino background track (subtle, looping)
- Card dealing sound (per card dealt)
- Chip placement sound (per chip clicked)
- Win sound cue
- Lose sound cue
- Push/tie sound cue
- Blackjack sound cue (distinct, celebratory)
- Mute/unmute toggle button in the UI
- Use royalty-free audio files or Web Audio API generated sounds

---

## Statistics & History Panel
- Collapsible side panel (toggle button always visible)
- **Session Stats:**
  - Hands played
  - Wins / Losses / Pushes
  - Blackjacks hit
  - Win rate (%)
  - Net profit/loss for the session
- **Hand History:**
  - Scrollable log of recent hands
  - Each entry shows: hand number, player hand, dealer hand, bet amount, result, bankroll after hand
- Stats and history reset when the player resets after going broke

---

## UI Controls Summary
| Control | Description |
|---|---|
| Chip tray | Click chips to add to bet |
| Bet area | Click to undo last chip |
| Clear Bet | Remove all chips from bet |
| Deal | Start the hand |
| Hit | Draw another card |
| Stand | End player's turn |
| Double Down | Double bet, draw one card, stand (9/10/11 only) |
| Split | Split matching pair into two hands |
| Deal Again | Start next hand after result |
| Stats toggle | Open/close stats & history panel |
| Mute toggle | Toggle all audio on/off |
| Reset | Appears on broke screen, restores $1,000 |

---

## Edge Cases to Handle
- Player busts: hand ends immediately, loss recorded
- Dealer busts: all active player hands win
- Push: bet returned, no win/loss recorded
- Split Aces: player receives one card per Ace, no further hitting (standard casino rule)
- Insurance: not implemented
- Side bets: not implemented
