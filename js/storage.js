/**
 * Storage - IndexedDB wrapper for deck persistence
 * 
 * Stores deck definitions (JSON configs) that persist across sessions.
 * Play state (drawn cards) is NOT persisted - that's in-memory only.
 */

const DB_NAME = 'carta-decks';
const DB_VERSION = 1;
const STORE_NAME = 'decks';

let db = null;

/**
 * Initialize the database
 * @returns {Promise<IDBDatabase>}
 */
export async function initDB() {
    if (db) return db;

    return new Promise((resolve, reject) => {
        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => {
            reject(new Error('Failed to open database'));
        };

        request.onsuccess = (event) => {
            db = event.target.result;
            resolve(db);
        };

        request.onupgradeneeded = (event) => {
            const database = event.target.result;
            
            if (!database.objectStoreNames.contains(STORE_NAME)) {
                const store = database.createObjectStore(STORE_NAME, { keyPath: 'id' });
                store.createIndex('name', 'name', { unique: false });
            }
        };
    });
}

/**
 * Get all stored decks
 * @returns {Promise<Object[]>}
 */
export async function getAllDecks() {
    const database = await initDB();
    
    return new Promise((resolve, reject) => {
        const transaction = database.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.getAll();

        request.onsuccess = () => {
            resolve(request.result || []);
        };

        request.onerror = () => {
            reject(new Error('Failed to get decks'));
        };
    });
}

/**
 * Get a single deck by ID
 * @param {string} id 
 * @returns {Promise<Object|null>}
 */
export async function getDeck(id) {
    const database = await initDB();
    
    return new Promise((resolve, reject) => {
        const transaction = database.transaction([STORE_NAME], 'readonly');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.get(id);

        request.onsuccess = () => {
            resolve(request.result || null);
        };

        request.onerror = () => {
            reject(new Error('Failed to get deck'));
        };
    });
}

/**
 * Save a deck (insert or update)
 * @param {Object} deckConfig - Deck configuration with id
 * @returns {Promise<void>}
 */
export async function saveDeck(deckConfig) {
    const database = await initDB();
    
    return new Promise((resolve, reject) => {
        const transaction = database.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.put(deckConfig);

        request.onsuccess = () => {
            resolve();
        };

        request.onerror = () => {
            reject(new Error('Failed to save deck'));
        };
    });
}

/**
 * Delete a deck by ID
 * @param {string} id 
 * @returns {Promise<void>}
 */
export async function deleteDeck(id) {
    const database = await initDB();
    
    return new Promise((resolve, reject) => {
        const transaction = database.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.delete(id);

        request.onsuccess = () => {
            resolve();
        };

        request.onerror = () => {
            reject(new Error('Failed to delete deck'));
        };
    });
}

/**
 * Import deck from JSON object
 * @param {Object} config - Raw JSON deck config
 * @returns {Promise<Object>} The saved deck config with generated ID
 */
export async function importDeck(config) {
    // Ensure deck has an ID
    const deckWithId = {
        ...config,
        id: config.id || crypto.randomUUID()
    };
    
    await saveDeck(deckWithId);
    return deckWithId;
}

/**
 * Check if any decks exist
 * @returns {Promise<boolean>}
 */
export async function hasDecks() {
    const decks = await getAllDecks();
    return decks.length > 0;
}

/**
 * Clear all decks (for testing/reset)
 * @returns {Promise<void>}
 */
export async function clearAllDecks() {
    const database = await initDB();
    
    return new Promise((resolve, reject) => {
        const transaction = database.transaction([STORE_NAME], 'readwrite');
        const store = transaction.objectStore(STORE_NAME);
        const request = store.clear();

        request.onsuccess = () => {
            resolve();
        };

        request.onerror = () => {
            reject(new Error('Failed to clear decks'));
        };
    });
}
