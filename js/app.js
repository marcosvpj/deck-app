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
// Data Deck Files (auto-loaded on first run)
// ============================================

const DATA_DECK_FILES = [
    'data/caravan-npcs.json',
    'data/uvg-destinations.json',
    'data/formigueiro-sombrio-bestiary.json'
];

/**
 * Load all deck files from data folder on first run
 */
async function loadDataDecks() {
    const { hasDecks, importDeck } = await import('./storage.js');

    if (await hasDecks()) {
        return; // Already has decks, don't overwrite
    }

    console.log('First run: loading data decks');

    for (const filePath of DATA_DECK_FILES) {
        try {
            const response = await fetch(filePath);
            if (!response.ok) {
                console.warn(`Failed to fetch ${filePath}: ${response.status}`);
                continue;
            }

            const deckData = await response.json();
            await importDeck(deckData);
            console.log(`Loaded: ${deckData.name}`);
        } catch (error) {
            console.error(`Failed to load ${filePath}:`, error);
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

        // Load data decks on first run
        await loadDataDecks();
        
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
