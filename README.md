# 🎴 Carta - Deck Simulator

A lightweight PWA for simulating card decks during tabletop RPG prototyping.

## Features

- **Import custom decks** from JSON files or URLs
- **Multiple decks in play** simultaneously
- **Draw with or without replacement** (toggle "Always Shuffle")
- **Works offline** as an installable PWA
- **Zero dependencies** - plain JavaScript, no build step

## Quick Start

### Local Development

```bash
# Just serve the files (any static server works)
python3 -m http.server 8080
# or
npx serve .
```

Open http://localhost:8080

### Deploy to GitHub Pages

1. Create a new repository on GitHub
2. Push this folder to the repo
3. Go to Settings → Pages
4. Set source to "Deploy from a branch" → select `main` / `root`
5. Your app will be live at `https://yourusername.github.io/repo-name/`

**Note:** If deploying to a subdirectory (not root), update the paths in:
- `manifest.json` → `start_url`
- `sw.js` → `APP_SHELL` array

## Deck JSON Format

```json
{
    "name": "Deck Name",
    "coverImage": "https://example.com/cover.jpg",
    "options": [
        {
            "title": "Card Title",
            "description": "Optional description text",
            "image": "https://example.com/card.jpg",
            "customField": "Any extra fields you want"
        }
    ]
}
```

### Required Fields
- `name` (string) - Deck name
- `options` (array) - At least one card
- `options[].title` (string) - Card title

### Optional Fields
- `coverImage` (string) - URL for deck cover in selection grid
- `options[].description` (string) - Card description text
- `options[].image` (string) - URL for card image
- Any additional fields will be displayed as key-value pairs

## Sample Decks

Check the `/data` folder for example deck files:
- `caravan-npcs.json` - NPC archetypes for Caravan game
- `uvg-destinations.json` - UVG-themed destinations

## Project Structure

```
deck-app/
├── index.html          # Entry point
├── manifest.json       # PWA manifest
├── sw.js               # Service worker for offline
├── css/
│   └── styles.css      # All styles (fantasy theme)
├── js/
│   ├── app.js          # Entry, routing, state
│   ├── deck.js         # Deck/DeckSession classes
│   ├── storage.js      # IndexedDB wrapper
│   ├── ui.js           # DOM helpers, components
│   └── screens/
│       ├── home.js     # Deck selection grid
│       ├── play.js     # Draw interface
│       └── manage.js   # Import/delete decks
├── assets/
│   └── icons/          # PWA icons
└── data/
    └── *.json          # Sample deck files
```

## Design Decisions

**Domain-Driven Design:**
- `Deck` class holds definition (immutable config)
- `DeckSession` holds play state (ephemeral, in-memory)
- Clean separation allows future features (multiple sessions of same deck)

**Storage Strategy:**
- Deck definitions → IndexedDB (persists across sessions)
- Play state → Memory only (resets on refresh)

**No Build Step:**
- Plain ES modules with dynamic imports
- Works directly in browser, easy to modify
- No transpilation, no bundling, no node_modules

## Customization

### Color Palette

Edit CSS variables in `css/styles.css`:

```css
:root {
    --color-parchment: #f4e9d8;  /* Background */
    --color-cream: #faf6f0;      /* Card surfaces */
    --color-sepia: #2c1810;      /* Primary text */
    --color-gold: #b8860b;       /* Accent */
    --color-burgundy: #722f37;   /* Emphasis */
}
```

### Adding New Card Fields

1. Add fields to your JSON deck
2. They'll automatically display in the card view
3. For special rendering, edit `cardDisplay()` in `js/ui.js`

## License

Do whatever you want with this. It's a tool for making games.

---

*"The cards tell you what happens. Your choices tell you who you are."*
