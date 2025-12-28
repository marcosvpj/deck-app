/**
 * Play Screen - Active deck sessions and card drawing
 */

import { el, renderApp, emptyState, backButton, cardDisplay, showToast, confirmAction } from '../ui.js';
import { navigateTo, getActiveSessions, removeSession } from '../app.js';

/**
 * Render the play screen
 */
export function renderPlayScreen() {
    const sessions = getActiveSessions();
    
    const screen = el('div', { className: 'screen' },
        el('header', { className: 'screen-header' },
            backButton(() => navigateTo('home')),
            el('h1', {}, 'Play Session'),
            el('button', {
                className: 'btn btn-secondary',
                onClick: () => navigateTo('home')
            }, '+ Add Deck')
        ),
        el('div', { className: 'screen-content', id: 'play-content' },
            sessions.length === 0
                ? renderEmptyState()
                : renderActiveSessions(sessions)
        )
    );
    
    renderApp(screen);
}

/**
 * Render empty state when no active sessions
 */
function renderEmptyState() {
    return emptyState(
        '🃏',
        'No decks in play. Go back to select some decks.',
        el('button', {
            className: 'btn btn-primary',
            onClick: () => navigateTo('home')
        }, 'Select Decks')
    );
}

/**
 * Render all active deck sessions
 * @param {DeckSession[]} sessions 
 */
function renderActiveSessions(sessions) {
    return el('div', { className: 'active-decks' },
        ...sessions.map((session, index) => renderDeckSession(session, index))
    );
}

/**
 * Render a single deck session UI
 * @param {DeckSession} session 
 * @param {number} index 
 */
function renderDeckSession(session, index) {
    const sessionId = `session-${index}`;
    const cardContainerId = `card-${index}`;
    
    return el('div', { 
        className: 'active-deck',
        id: sessionId
    },
        el('div', { className: 'active-deck-header' },
            el('span', { className: 'active-deck-title' }, session.deck.name),
            el('span', { 
                className: 'active-deck-status',
                id: `status-${index}`
            }, formatStatus(session)),
            el('button', {
                className: 'btn btn-secondary btn-icon',
                onClick: () => handleRemoveSession(index),
                'aria-label': 'Remove deck from session',
                title: 'Remove from session'
            }, '×')
        ),
        el('div', { className: 'active-deck-controls' },
            el('button', {
                className: 'btn btn-primary btn-large',
                onClick: () => handleDraw(session, index),
                disabled: session.isEmpty,
                id: `draw-${index}`
            }, '🎴 Draw'),
            el('button', {
                className: 'btn btn-secondary',
                onClick: () => handleShuffle(session, index)
            }, '🔀 Shuffle'),
            el('label', { className: 'checkbox-label' },
                el('input', {
                    type: 'checkbox',
                    checked: session.alwaysShuffle,
                    onChange: (e) => handleToggleAlwaysShuffle(session, index, e.target.checked)
                }),
                'Always shuffle'
            )
        ),
        el('div', { id: cardContainerId })
    );
}

/**
 * Format the status text for a session
 * @param {DeckSession} session 
 */
function formatStatus(session) {
    if (session.alwaysShuffle) {
        return `${session.deck.totalCards} cards (with replacement)`;
    }
    return `${session.remainingCount} / ${session.deck.totalCards} remaining`;
}

/**
 * Handle drawing a card
 * @param {DeckSession} session 
 * @param {number} index 
 */
function handleDraw(session, index) {
    const card = session.draw();
    
    if (!card) {
        showToast('Deck is empty! Shuffle to reset.', 'info');
        return;
    }
    
    // Update card display
    const container = document.getElementById(`card-${index}`);
    container.innerHTML = '';
    container.appendChild(cardDisplay(card));
    
    // Update status
    updateSessionUI(session, index);
}

/**
 * Handle shuffling the deck
 * @param {DeckSession} session 
 * @param {number} index 
 */
function handleShuffle(session, index) {
    session.shuffle();
    
    // Clear card display
    const container = document.getElementById(`card-${index}`);
    container.innerHTML = '';
    
    // Update status
    updateSessionUI(session, index);
    
    showToast('Deck shuffled!', 'success');
}

/**
 * Handle toggling always shuffle mode
 * @param {DeckSession} session 
 * @param {number} index 
 * @param {boolean} value 
 */
function handleToggleAlwaysShuffle(session, index, value) {
    session.setAlwaysShuffle(value);
    updateSessionUI(session, index);
}

/**
 * Update the UI elements for a session
 * @param {DeckSession} session 
 * @param {number} index 
 */
function updateSessionUI(session, index) {
    // Update status text
    const status = document.getElementById(`status-${index}`);
    if (status) {
        status.textContent = formatStatus(session);
    }
    
    // Update draw button disabled state
    const drawBtn = document.getElementById(`draw-${index}`);
    if (drawBtn) {
        drawBtn.disabled = session.isEmpty;
    }
}

/**
 * Handle removing a session
 * @param {number} index 
 */
function handleRemoveSession(index) {
    const sessions = getActiveSessions();
    const session = sessions[index];
    
    if (session.drawnCount > 0) {
        if (!confirmAction(`Remove "${session.deck.name}" from play? Current state will be lost.`)) {
            return;
        }
    }
    
    removeSession(index);
    
    // Re-render the play screen
    renderPlayScreen();
}
