# ♟️ Chess Lobby + Game (Vanilla HTML/CSS/JS)

A responsive chess web app with a styled lobby ,settings modal ,move list,captures,timers,sounds,and mobile touch-drag support(including drag piece).

## Features

- Full chess board with legal move validation
- Drag & drop on desktop
- Touch drag on mobile (with floating piece preview)
- check ,checkmate,stalemate detection
- Castling ,en passant ,promotion
- 50-move and threefold repetition claim buttons
- undo /Redo (disabled in timer mode)
- Timers:none,5 min,10 min,custom
- Move history panel + PGN download
- Captured pieces + captured points display
- Sound toggle + move/capture/check/game-end sounds
- Lobby screen + settings modal
- Mobile-friendly layout + orientation guard

---

## Controls

### Desktop
- Click piece then click target square or
- Drag piece to target square

### Mobile
- Touch and drag piece to target square
- A floating piece image follows your finger
- Release to drop

### Buttons
- **⮌ Undo**, **⮎ Redo**, **⭮ Reset**
- **50M** = claim 50-move draw (if eligible)
- **3x** = cliam threefold repetation draw(if eligible)
- **Moves** = open/close move list popup in mobile

---

## Settings

From lobby ⚙️:

- **Play as**:White/Black view orientation
- **Suggestions**: Show/Hide legal move indicators
- **Sound**: On/Off
- **Timer**:
  - No timer
  - 5 min
  - 10 min
  - Custom minutes

Settings are persisted using `localStorage`.

---

## Chess Rules Implemented

- piece movement rules for all pieces
- King safety filtering (illegal self-check moves blocked)
- Castling rights tracking
- En passant support
- Promotion modal (`Q`, `R`, `B`, `N`)
- Check/checkmate/stalemate detection
- Insufficient material draw detection
- 50-move rule claim logic
- Threefold repetation claim logic

---

### Mobile/Responsive Notes

- Mobile layout is enabled for small/touch devices
- orientation guard prompts portrait mode in landscape (mobile)
- Moves popup has backdrop blur overlay
- Touch interaction uses:
  - `touchstart`
  - `touchmove`
  - `touchend`
  - `touchcancel`
- Touch ghost class: `.touch-drag-ghost`

---

