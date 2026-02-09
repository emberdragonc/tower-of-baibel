# Tower of Baibel — Frontend Design Spec

## 🏗️ THE TOWER CONCEPT (Critical — Read First!)

The entire website IS a tower. A giant tower runs through the CENTER of the webpage vertically. As you scroll down, the tower continues endlessly (infinite scroll).

### Visual Design:
- Central column (~400px wide) styled as a literal tower
- Dark background (#0a0a0a) with the tower illuminated with amber/orange glow (#f59e0b)
- Each "floor" of the tower = one documentation collection
- Tower has architectural elements: brick texture, floor dividers, window-like details
- Subtle parallax or glow animations on scroll
- The tower starts below the hero text and extends infinitely downward

### Each Floor Shows:
- Collection name (prominent)
- Author address (truncated)
- Doc count
- Star rating (1-5, visual stars)
- EMBER staked amount
- Click to expand → full collection detail

### Layout:
```
┌─────────────────────────────────────┐
│         TOWER OF BAIBEL             │  ← Hero text
│   The Knowledge Layer for Agents    │
│         [Search Bar]                │
├─────────────────────────────────────┤
│              Stats Bar              │
│  Collections | Docs | Ratings       │
├─────────┬───────────┬───────────────┤
│         │ ┌───────┐ │               │
│  dark   │ │Floor N│ │    dark       │
│  space  │ │ ★★★★☆ │ │    space     │
│         │ │32 docs│ │               │
│         │ └───────┘ │               │
│         │ ┌───────┐ │               │
│         │ │Floor 2│ │               │
│         │ │ ★★★★★ │ │               │
│         │ │18 docs│ │               │
│         │ └───────┘ │               │
│         │ ┌───────┐ │               │
│         │ │Floor 1│ │               │
│         │ │ ★★★☆☆ │ │               │
│         │ │45 docs│ │               │
│         │ └───────┘ │               │
│         │    ...    │  ← infinite   │
│         │  loading  │    scroll     │
└─────────┴───────────┴───────────────┘
```

### CSS Approach:
- Tower column: `max-w-md mx-auto` with decorative borders
- Left/right borders styled as tower walls (gradient, subtle brick pattern via CSS)
- Floor dividers: horizontal lines with ornamental details
- Amber glow: `box-shadow: 0 0 60px rgba(245, 158, 11, 0.1)`
- Background: radial gradient from dark center outward
- Each floor: card-like component within the tower column

### Infinite Scroll:
- Load 20 collections initially
- Intersection Observer to load more as user scrolls
- Loading indicator styled as "building more floors..."
