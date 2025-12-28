/**
 * Home Screen - Deck selection grid
 */

import { el, renderApp, emptyState } from '../ui.js';
import { getAllDecks } from '../storage.js';
import { Deck } from '../deck.js';
import { navigateTo, getActiveSessions, addSession } from '../app.js';

/**
 * Render the home screen
 */
export async function renderHomeScreen() {
    const decks = await getAllDecks();
    const activeSessions = getActiveSessions();
    
    const screen = el('div', { className: 'screen' },
        el('header', { className: 'screen-header' },
            el('h1', {}, '🎴 Carta'),
            activeSessions.length > 0 
                ? el('button', {
                    className: 'btn btn-primary',
                    onClick: () => navigateTo('play')
                }, `In Play (${activeSessions.length})`)
                : null,
            el('button', {
                className: 'btn btn-secondary',
                onClick: () => navigateTo('manage')
            }, '⚙️ Manage')
        ),
        el('div', { className: 'screen-content' },
            decks.length === 0
                ? renderEmptyState()
                : renderDeckGrid(decks)
        )
    );
    
    renderApp(screen);
}

/**
 * Render empty state when no decks exist
 */
function renderEmptyState() {
    return emptyState(
        '📚',
        'No decks yet. Import your first deck to begin.',
        el('button', {
            className: 'btn btn-primary',
            onClick: () => navigateTo('manage')
        }, 'Import Deck')
    );
}

/**
 * Render the grid of available decks
 * @param {Object[]} decks 
 */
function renderDeckGrid(decks) {
    const activeSessions = getActiveSessions();
    const activeIds = new Set(activeSessions.map(s => s.deck.id));
    
    return el('div', {},
        el('p', { className: 'mb-md', style: { color: 'var(--color-brown)' } },
            'Select a deck to add to your play session:'
        ),
        el('div', { className: 'deck-grid' },
            ...decks.map(deckConfig => renderDeckCard(deckConfig, activeIds.has(deckConfig.id)))
        )
    );
}

/**
 * Render a single deck card
 * @param {Object} deckConfig 
 * @param {boolean} isActive 
 */
function renderDeckCard(deckConfig, isActive) {
    const card = el('div', {
        className: 'deck-card',
        onClick: () => handleDeckSelect(deckConfig),
        style: isActive ? { borderColor: 'var(--color-gold)', opacity: '0.7' } : {},
        role: 'button',
        tabindex: '0'
    },
        el('div', { className: 'deck-card-image' },
            deckConfig.coverImage
                ? el('img', { 
                    src: deckConfig.coverImage, 
                    alt: '',
                    onerror: (e) => { e.target.parentNode.textContent = '🎴'; }
                })
                : '🎴'
        ),
        el('div', { className: 'deck-card-name' }, deckConfig.name),
        el('div', { className: 'deck-card-count' }, 
            `${deckConfig.options.length} cards`
        ),
        isActive 
            ? el('div', { 
                className: 'deck-card-count',
                style: { color: 'var(--color-gold)' }
            }, '• In Play')
            : null
    );
    
    // Handle keyboard activation
    card.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            handleDeckSelect(deckConfig);
        }
    });
    
    return card;
}

/**
 * Handle deck selection
 * @param {Object} deckConfig 
 */
function handleDeckSelect(deckConfig) {
    try {
        const deck = Deck.fromJSON(deckConfig);
        addSession(deck);
        navigateTo('play');
    } catch (error) {
        console.error('Failed to load deck:', error);
        import('../ui.js').then(({ showToast }) => {
            showToast('Failed to load deck: ' + error.message, 'error');
        });
    }
}
