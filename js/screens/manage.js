/**
 * Manage Screen - Import and delete decks
 */

import { el, renderApp, emptyState, backButton, showToast, confirmAction, clearElement } from '../ui.js';
import { getAllDecks, importDeck, deleteDeck } from '../storage.js';
import { Deck } from '../deck.js';
import { navigateTo } from '../app.js';

/**
 * Render the manage screen
 */
export async function renderManageScreen() {
    const decks = await getAllDecks();
    
    const screen = el('div', { className: 'screen' },
        el('header', { className: 'screen-header' },
            backButton(() => navigateTo('home')),
            el('h1', {}, 'Manage Decks')
        ),
        el('div', { className: 'screen-content' },
            renderImportSection(),
            renderDeckListSection(decks)
        )
    );
    
    renderApp(screen);
}

/**
 * Render the import section
 */
function renderImportSection() {
    return el('section', { className: 'manage-section' },
        el('h2', {}, 'Import Deck'),
        el('div', { className: 'import-options' },
            // Import from URL
            el('div', { className: 'import-row' },
                el('input', {
                    type: 'text',
                    id: 'url-input',
                    placeholder: 'Paste JSON URL...',
                    'aria-label': 'JSON URL'
                }),
                el('button', {
                    className: 'btn btn-primary',
                    onClick: handleImportFromURL
                }, 'Import URL')
            ),
            // Import from file
            el('div', { className: 'import-row' },
                el('div', { className: 'file-input-wrapper' },
                    el('input', {
                        type: 'file',
                        id: 'file-input',
                        accept: '.json,application/json',
                        onChange: handleImportFromFile
                    }),
                    el('button', { 
                        className: 'btn btn-secondary',
                        'aria-hidden': 'true'
                    }, '📁 Choose File')
                )
            ),
            // Import from clipboard/paste
            el('div', { className: 'import-row' },
                el('button', {
                    className: 'btn btn-secondary',
                    onClick: handleImportFromClipboard
                }, '📋 Paste from Clipboard')
            )
        )
    );
}

/**
 * Render the deck list section
 * @param {Object[]} decks 
 */
function renderDeckListSection(decks) {
    return el('section', { className: 'manage-section' },
        el('h2', {}, `Your Decks (${decks.length})`),
        el('div', { className: 'deck-list', id: 'deck-list' },
            decks.length === 0
                ? el('p', { style: { color: 'var(--color-brown)' } }, 
                    'No decks imported yet.')
                : decks.map(deck => renderDeckListItem(deck))
        )
    );
}

/**
 * Render a single deck list item
 * @param {Object} deck 
 */
function renderDeckListItem(deck) {
    return el('div', { 
        className: 'deck-list-item',
        'data-deck-id': deck.id
    },
        el('div', { className: 'deck-list-item-info' },
            deck.coverImage
                ? el('img', {
                    className: 'deck-list-item-image',
                    src: deck.coverImage,
                    alt: '',
                    onerror: (e) => { e.target.style.display = 'none'; }
                })
                : el('div', { 
                    className: 'deck-list-item-image',
                    style: { 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: 'center' 
                    }
                }, '🎴'),
            el('div', {},
                el('strong', {}, deck.name),
                el('div', { 
                    style: { 
                        fontSize: 'var(--font-size-sm)', 
                        color: 'var(--color-brown)' 
                    }
                }, `${deck.options.length} cards`)
            )
        ),
        el('button', {
            className: 'btn btn-danger btn-icon',
            onClick: () => handleDeleteDeck(deck),
            'aria-label': `Delete ${deck.name}`
        }, '🗑️')
    );
}

/**
 * Handle importing from URL
 */
async function handleImportFromURL() {
    const input = document.getElementById('url-input');
    const url = input.value.trim();
    
    if (!url) {
        showToast('Please enter a URL', 'error');
        return;
    }
    
    try {
        showToast('Fetching...', 'info');
        
        const response = await fetch(url);
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}`);
        }
        
        const json = await response.json();
        await importAndValidateDeck(json);
        
        input.value = '';
    } catch (error) {
        console.error('Import from URL failed:', error);
        showToast('Failed to import: ' + error.message, 'error');
    }
}

/**
 * Handle importing from file
 * @param {Event} event 
 */
async function handleImportFromFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    
    try {
        const text = await file.text();
        const json = JSON.parse(text);
        await importAndValidateDeck(json);
        
        // Reset file input
        event.target.value = '';
    } catch (error) {
        console.error('Import from file failed:', error);
        showToast('Failed to import: ' + error.message, 'error');
    }
}

/**
 * Handle importing from clipboard
 */
async function handleImportFromClipboard() {
    try {
        const text = await navigator.clipboard.readText();
        const json = JSON.parse(text);
        await importAndValidateDeck(json);
    } catch (error) {
        console.error('Import from clipboard failed:', error);
        
        if (error.name === 'NotAllowedError') {
            showToast('Clipboard access denied. Check browser permissions.', 'error');
        } else {
            showToast('Failed to import: ' + error.message, 'error');
        }
    }
}

/**
 * Validate and import a deck
 * @param {Object} json 
 */
async function importAndValidateDeck(json) {
    // Validate using Deck class
    const validation = Deck.validate(json);
    
    if (!validation.valid) {
        throw new Error(validation.errors[0]);
    }
    
    // Import to storage
    const saved = await importDeck(json);
    
    showToast(`Imported "${saved.name}" (${saved.options.length} cards)`, 'success');
    
    // Refresh the deck list
    await refreshDeckList();
}

/**
 * Handle deleting a deck
 * @param {Object} deck 
 */
async function handleDeleteDeck(deck) {
    if (!confirmAction(`Delete "${deck.name}"? This cannot be undone.`)) {
        return;
    }
    
    try {
        await deleteDeck(deck.id);
        showToast(`Deleted "${deck.name}"`, 'success');
        
        // Remove from DOM
        const item = document.querySelector(`[data-deck-id="${deck.id}"]`);
        if (item) {
            item.remove();
        }
        
        // Check if list is now empty
        const list = document.getElementById('deck-list');
        if (list && list.children.length === 0) {
            await refreshDeckList();
        }
    } catch (error) {
        console.error('Delete failed:', error);
        showToast('Failed to delete deck', 'error');
    }
}

/**
 * Refresh the deck list UI
 */
async function refreshDeckList() {
    const decks = await getAllDecks();
    const listContainer = document.getElementById('deck-list');
    
    if (listContainer) {
        clearElement(listContainer);
        
        if (decks.length === 0) {
            listContainer.appendChild(
                el('p', { style: { color: 'var(--color-brown)' } }, 
                    'No decks imported yet.')
            );
        } else {
            decks.forEach(deck => {
                listContainer.appendChild(renderDeckListItem(deck));
            });
        }
        
        // Update count in header
        const header = listContainer.previousElementSibling;
        if (header && header.tagName === 'H2') {
            header.textContent = `Your Decks (${decks.length})`;
        }
    }
}
