/**
 * App - Main entry point, routing, and global state
 */

import { initDB } from './storage.js';
import { DeckSession } from './deck.js';
import { showToast } from './ui.js';

// ============================================
// Global State (in-memory, not persisted)
// ============================================

/** @type {DeckSession[]} */
let activeSessions = [];

/**
 * Get all active deck sessions
 * @returns {DeckSession[]}
 */
export function getActiveSessions() {
    return activeSessions;
}

/**
 * Add a new session for a deck
 * @param {Deck} deck 
 */
export function addSession(deck) {
    // Check if deck is already in play
    const existing = activeSessions.find(s => s.deck.id === deck.id);
    if (existing) {
        showToast(`"${deck.name}" is already in play`, 'info');
        return;
    }
    
    const session = new DeckSession(deck);
    activeSessions.push(session);
}

/**
 * Remove a session by index
 * @param {number} index 
 */
export function removeSession(index) {
    activeSessions.splice(index, 1);
}

/**
 * Clear all sessions
 */
export function clearSessions() {
    activeSessions = [];
}

// ============================================
// Routing
// ============================================

const routes = {
    home: () => import('./screens/home.js').then(m => m.renderHomeScreen()),
    play: () => import('./screens/play.js').then(m => m.renderPlayScreen()),
    manage: () => import('./screens/manage.js').then(m => m.renderManageScreen())
};

let currentRoute = 'home';

/**
 * Navigate to a screen
 * @param {'home'|'play'|'manage'} route 
 */
export async function navigateTo(route) {
    if (!routes[route]) {
        console.error(`Unknown route: ${route}`);
        return;
    }
    
    currentRoute = route;
    
    // Update URL hash for basic history support
    window.location.hash = route === 'home' ? '' : route;
    
    try {
        await routes[route]();
    } catch (error) {
        console.error('Navigation error:', error);
        showToast('Failed to load screen', 'error');
    }
}

/**
 * Handle browser back/forward
 */
function handleHashChange() {
    const hash = window.location.hash.slice(1) || 'home';
    if (routes[hash] && hash !== currentRoute) {
        navigateTo(hash);
    }
}

// ============================================
// Sample Decks (bundled for first-run experience)
// ============================================

const SAMPLE_DECKS = [
    {
        name: "Quick Atmosphere",
        coverImage: "",
        options: [
            { title: "Eerie Silence", description: "The air feels thick. No birds, no wind, nothing." },
            { title: "Distant Thunder", description: "Rumbling on the horizon. Storm coming, or something else?" },
            { title: "Purple Haze", description: "A violet mist rolls in, tasting of copper and old dreams." },
            { title: "Singing Stones", description: "The rocks here hum a low frequency. Your teeth ache." },
            { title: "Wrong Colors", description: "The sunset is green. The grass is red. Something is off." },
            { title: "Time Skip", description: "You blink and an hour has passed. Or was it a minute?" },
            { title: "Watchful Eyes", description: "Something observes from the tall grass. You never see it directly." },
            { title: "Sweet Decay", description: "The smell of rotting fruit, but there's no fruit here." },
            { title: "Shadow Lag", description: "Your shadow moves a half-second behind you." },
            { title: "Memory Echo", description: "You remember being here before. You've never been here." }
        ]
    },
    {
        name: "Random NPC Archetypes",
        coverImage: "",
        options: [
            { title: "The Retired Sword-Saint", archetype: "⚔️ Fighter", quirk: "Has killed more than they remember. Seeks quieter deaths now." },
            { title: "Machine Whisperer", archetype: "🔧 Tinker", quirk: "Understands tech that shouldn't exist. Sometimes argues with dead engines." },
            { title: "Former Merchant Prince", archetype: "🗣️ Diplomat", quirk: "Lost their kingdom to debt. Knows everyone's price, including their own." },
            { title: "Color Prophet", archetype: "🔮 Mystic", quirk: "Sees futures in the purple grass. The grass lies, but rarely." },
            { title: "Spice Merchant", archetype: "💰 Trader", quirk: "Knows the price of everything. Trades in cardamom and secrets." },
            { title: "Wasteland Guide", archetype: "🌿 Survivor", quirk: "Knows which grass is food, which is poison, which is both." }
        ]
    }
];

/**
 * Load sample decks on first run
 */
async function loadSampleDecks() {
    const { hasDecks, importDeck } = await import('./storage.js');
    
    if (await hasDecks()) {
        return; // Already has decks, don't overwrite
    }
    
    console.log('First run: loading sample decks');
    
    for (const deck of SAMPLE_DECKS) {
        try {
            await importDeck(deck);
        } catch (error) {
            console.error('Failed to load sample deck:', error);
        }
    }
}

// ============================================
// PWA Service Worker Registration
// ============================================

async function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        try {
            const registration = await navigator.serviceWorker.register('./sw.js');
            console.log('Service Worker registered:', registration.scope);
        } catch (error) {
            console.error('Service Worker registration failed:', error);
        }
    }
}

// ============================================
// App Initialization
// ============================================

async function init() {
    try {
        // Initialize database
        await initDB();
        
        // Load sample decks on first run
        await loadSampleDecks();
        
        // Register service worker for PWA
        await registerServiceWorker();
        
        // Set up hash-based routing
        window.addEventListener('hashchange', handleHashChange);
        
        // Initial navigation based on URL hash
        const initialRoute = window.location.hash.slice(1) || 'home';
        await navigateTo(routes[initialRoute] ? initialRoute : 'home');
        
    } catch (error) {
        console.error('App initialization failed:', error);
        document.getElementById('app').innerHTML = `
            <div class="screen">
                <div class="empty-state">
                    <div class="empty-state-icon">⚠️</div>
                    <p>Failed to initialize app. Please refresh the page.</p>
                    <p style="font-size: 0.875rem; color: var(--color-brown);">
                        ${error.message}
                    </p>
                </div>
            </div>
        `;
    }
}

// Start the app
init();
