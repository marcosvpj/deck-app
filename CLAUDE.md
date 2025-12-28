# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Carta is a lightweight PWA for simulating card decks during tabletop RPG prototyping. It allows users to import custom decks from JSON and draw cards with or without replacement. Built with vanilla JavaScript (ES6+ modules), no build step required.

## Development Commands

### Local Development
```bash
# Serve with Python
python3 -m http.server 8080

# OR serve with npx
npx serve .
```

Open http://localhost:8080 in browser.

### Deployment
Push to GitHub's `main` branch - GitHub Actions automatically deploys to GitHub Pages.

**Important:** If deploying to a subdirectory (not root domain), update:
- `manifest.json` → `start_url` field
- `sw.js` → `APP_SHELL` array paths

## Architecture

### Core Design Pattern: Domain Model Separation

The app follows a clean separation between **domain definitions** (persistent) and **session state** (ephemeral):

- **`Deck`** class (`js/deck.js`): Immutable configuration loaded from JSON, stored in IndexedDB
- **`DeckSession`** class (`js/deck.js`): Ephemeral play state (drawn cards, shuffle mode) - lives in memory only

This separation enables future features like multiple simultaneous sessions of the same deck without polluting the domain model.

### Storage Strategy

- **Persistent (IndexedDB)**: Deck definitions imported by users
- **In-Memory Only**: Play state (active sessions, drawn cards, current card)
- **Service Worker Cache**: App shell (HTML/CSS/JS) for offline PWA functionality

**Why no session persistence?** Each play session is intentionally ephemeral - refreshing the page resets all play state. This matches the physical behavior of shuffling a deck between game sessions.

### Routing & Screens

Hash-based routing (`#home`, `#play`, `#manage`) with dynamic imports for code splitting:

```javascript
// app.js handles routing
const routes = {
    home: () => import('./screens/home.js'),
    play: () => import('./screens/play.js'),
    manage: () => import('./screens/manage.js')
};
```

Each screen module exports a `render[Screen]Screen()` function that:
1. Renders UI directly to `#app` container
2. Sets up event listeners
3. Returns nothing (side effects only)

### State Management

Global state in `js/app.js`:
- `activeSessions` array (DeckSession instances for decks currently in play)
- Exported functions: `getActiveSessions()`, `addSession()`, `removeSession()`, `clearSessions()`

Screens import these to read/modify state, then call `navigateTo()` for transitions.

### Module Structure

```
js/
├── app.js          # Entry point: routing, global state, initialization
├── deck.js         # Domain models: Deck & DeckSession classes
├── storage.js      # IndexedDB wrapper for deck persistence
├── ui.js           # DOM helpers: createElement(), showToast(), reusable components
└── screens/
    ├── home.js     # Deck selection grid
    ├── play.js     # Card drawing interface
    └── manage.js   # Import/delete deck management
```

## Deck JSON Schema

### Required Fields
- `name` (string): Deck name
- `options` (array): Array of card objects
- `options[].title` (string): Card title

### Optional Fields
- `coverImage` (string): URL for deck thumbnail in selection grid
- `options[].description` (string): Card description text
- `options[].image` (string): URL for card image

### Custom Fields
Any additional fields on card objects are automatically displayed as key-value pairs when a card is drawn. No code changes needed to support new fields.

Example:
```json
{
  "title": "The Wanderer",
  "archetype": "⚔️ Fighter",
  "hp": 12,
  "ability": "Second Wind"
}
```

All four custom fields (`archetype`, `hp`, `ability`) will render automatically in the card display.

## PWA Service Worker

`sw.js` implements a cache-first strategy for the app shell with background updates.

**Critical behavior:** User-imported JSON deck files are always fetched fresh from network (no caching) to ensure users always get the latest version when importing from URLs.

Cache is versioned (`carta-v1`). Increment version and update `CACHE_NAME` when deploying breaking changes to force cache invalidation.

## Styling

Fantasy theme using CSS custom properties in `css/styles.css`:
- Serif font: Google Fonts "Crimson Pro"
- Color palette: parchment, sepia, gold, burgundy tones
- Variables defined in `:root` for easy theming

## Sample Decks

First-run experience: `app.js` loads 2 sample decks from `SAMPLE_DECKS` constant if IndexedDB is empty. This provides immediate value without requiring imports.

Additional samples in `/data` folder (not auto-loaded, user must import manually).

## Key Principles

1. **No overengineering**: Vanilla JS, no frameworks, no build process
2. **Progressive enhancement**: Works without JavaScript (static HTML), enhanced with modules
3. **Domain purity**: Deck class has no UI concerns, DeckSession has no persistence logic
4. **Modularity**: Each screen is independently importable
5. **Offline-first**: PWA with service worker for installability and offline play
