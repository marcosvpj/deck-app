/**
 * Deck - Core domain class for card deck simulation
 * 
 * Handles:
 * - Drawing cards (with or without replacement)
 * - Shuffling
 * - Tracking remaining/drawn cards
 */
export class Deck {
    /**
     * @param {Object} config - Deck configuration from JSON
     * @param {string} config.name - Deck name
     * @param {string} [config.coverImage] - URL for cover image
     * @param {Array<Object>} config.options - Array of card objects
     */
    constructor(config) {
        this.id = config.id || crypto.randomUUID();
        this.name = config.name;
        this.coverImage = config.coverImage || null;
        this.cards = config.options.map((opt, index) => ({
            ...opt,
            _originalIndex: index
        }));
    }

    get totalCards() {
        return this.cards.length;
    }

    /**
     * Validate deck configuration
     * @param {Object} config 
     * @returns {{ valid: boolean, errors: string[] }}
     */
    static validate(config) {
        const errors = [];

        if (!config.name || typeof config.name !== 'string') {
            errors.push('Deck must have a "name" field (string)');
        }

        if (!Array.isArray(config.options)) {
            errors.push('Deck must have an "options" field (array)');
        } else if (config.options.length === 0) {
            errors.push('Deck must have at least one card in "options"');
        } else {
            config.options.forEach((opt, i) => {
                if (!opt.title || typeof opt.title !== 'string') {
                    errors.push(`Card at index ${i} must have a "title" field (string)`);
                }
            });
        }

        return {
            valid: errors.length === 0,
            errors
        };
    }

    /**
     * Create Deck from JSON config
     * @param {Object} config 
     * @returns {Deck}
     * @throws {Error} if validation fails
     */
    static fromJSON(config) {
        const validation = Deck.validate(config);
        if (!validation.valid) {
            throw new Error(`Invalid deck: ${validation.errors.join('; ')}`);
        }
        return new Deck(config);
    }

    /**
     * Export deck back to JSON format
     * @returns {Object}
     */
    toJSON() {
        return {
            id: this.id,
            name: this.name,
            coverImage: this.coverImage,
            options: this.cards.map(({ _originalIndex, ...card }) => card)
        };
    }
}

/**
 * DeckSession - Manages the play state of a deck
 * 
 * This is separate from Deck because:
 * - Multiple sessions could use the same deck definition
 * - Session state is ephemeral (not persisted)
 * - Deck definition is persistent
 */
export class DeckSession {
    /**
     * @param {Deck} deck 
     */
    constructor(deck) {
        this.deck = deck;
        this.alwaysShuffle = false;
        this.drawnIndices = new Set();
        this.currentCard = null;
    }

    get remainingCount() {
        if (this.alwaysShuffle) {
            return this.deck.totalCards;
        }
        return this.deck.totalCards - this.drawnIndices.size;
    }

    get drawnCount() {
        return this.drawnIndices.size;
    }

    get isEmpty() {
        return !this.alwaysShuffle && this.remainingCount === 0;
    }

    /**
     * Get indices of cards still in the draw pile
     * @returns {number[]}
     */
    getRemainingIndices() {
        if (this.alwaysShuffle) {
            return this.deck.cards.map((_, i) => i);
        }
        return this.deck.cards
            .map((_, i) => i)
            .filter(i => !this.drawnIndices.has(i));
    }

    /**
     * Draw a random card from remaining cards
     * @returns {Object|null} The drawn card, or null if deck is empty
     */
    draw() {
        const remaining = this.getRemainingIndices();
        
        if (remaining.length === 0) {
            return null;
        }

        const randomIndex = remaining[Math.floor(Math.random() * remaining.length)];
        
        if (!this.alwaysShuffle) {
            this.drawnIndices.add(randomIndex);
        }

        this.currentCard = this.deck.cards[randomIndex];
        return this.currentCard;
    }

    /**
     * Reset the deck - return all cards to draw pile
     */
    shuffle() {
        this.drawnIndices.clear();
        this.currentCard = null;
    }

    /**
     * Toggle always shuffle mode
     * @param {boolean} value 
     */
    setAlwaysShuffle(value) {
        this.alwaysShuffle = value;
        if (value) {
            // When enabling, we don't clear drawn - just ignore it
            // When disabling, current drawn state is preserved
        }
    }
}
