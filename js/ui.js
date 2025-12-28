/**
 * UI - DOM manipulation helpers and common UI components
 */

/**
 * Create an element with attributes and children
 * @param {string} tag 
 * @param {Object} attrs 
 * @param  {...(Node|string)} children 
 * @returns {HTMLElement}
 */
export function createElement(tag, attrs = {}, ...children) {
    const element = document.createElement(tag);

    for (const [key, value] of Object.entries(attrs)) {
        if (key === 'className') {
            element.className = value;
        } else if (key === 'dataset') {
            Object.assign(element.dataset, value);
        } else if (key.startsWith('on') && typeof value === 'function') {
            const event = key.slice(2).toLowerCase();
            element.addEventListener(event, value);
        } else if (key === 'style' && typeof value === 'object') {
            Object.assign(element.style, value);
        } else if (key === 'checked' || key === 'disabled') {
            // Boolean properties must be set directly, not via setAttribute
            element[key] = value;
        } else {
            element.setAttribute(key, value);
        }
    }
    
    for (const child of children) {
        if (child == null) continue;
        if (typeof child === 'string') {
            element.appendChild(document.createTextNode(child));
        } else {
            element.appendChild(child);
        }
    }
    
    return element;
}

// Shorthand aliases
export const el = createElement;

/**
 * Clear all children from an element
 * @param {HTMLElement} element 
 */
export function clearElement(element) {
    while (element.firstChild) {
        element.removeChild(element.firstChild);
    }
}

/**
 * Render content into the app container
 * @param {HTMLElement} content 
 */
export function renderApp(content) {
    const app = document.getElementById('app');
    clearElement(app);
    app.appendChild(content);
}

// ============================================
// Toast Notifications
// ============================================

let toastContainer = null;

function ensureToastContainer() {
    if (!toastContainer) {
        toastContainer = createElement('div', { className: 'toast-container' });
        document.body.appendChild(toastContainer);
    }
    return toastContainer;
}

/**
 * Show a toast notification
 * @param {string} message 
 * @param {'info'|'success'|'error'} type 
 * @param {number} duration - ms
 */
export function showToast(message, type = 'info', duration = 3000) {
    const container = ensureToastContainer();
    
    const toast = createElement('div', {
        className: `toast ${type}`,
        role: 'alert'
    }, message);
    
    container.appendChild(toast);
    
    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transform = 'translateY(20px)';
        setTimeout(() => {
            if (toast.parentNode) {
                toast.parentNode.removeChild(toast);
            }
        }, 300);
    }, duration);
}

// ============================================
// Common Components
// ============================================

/**
 * Create a back button
 * @param {Function} onClick 
 * @returns {HTMLElement}
 */
export function backButton(onClick) {
    return createElement('button', {
        className: 'btn btn-secondary btn-icon',
        onClick,
        'aria-label': 'Go back'
    }, '←');
}

/**
 * Create an empty state component
 * @param {string} icon 
 * @param {string} message 
 * @param {HTMLElement} [action] - Optional action button
 * @returns {HTMLElement}
 */
export function emptyState(icon, message, action = null) {
    const children = [
        createElement('div', { className: 'empty-state-icon' }, icon),
        createElement('p', {}, message)
    ];
    
    if (action) {
        children.push(createElement('div', { className: 'mt-md' }, action));
    }
    
    return createElement('div', { className: 'empty-state' }, ...children);
}

/**
 * Create a card display component for a drawn card
 * @param {Object} card - Card data
 * @returns {HTMLElement}
 */
export function cardDisplay(card) {
    const elements = [
        createElement('h3', { className: 'drawn-card-title' }, card.title)
    ];

    // Description field (or 'visual' as alternative name)
    const descriptionText = card.description || card.visual;
    if (descriptionText) {
        elements.push(
            createElement('p', { className: 'drawn-card-description' }, descriptionText)
        );
    }

    // Image field
    if (card.image) {
        elements.push(
            createElement('img', {
                className: 'drawn-card-image',
                src: card.image,
                alt: card.title,
                loading: 'lazy'
            })
        );
    }

    // Pose field (additional descriptive text, rendered separately from visual)
    if (card.pose) {
        elements.push(
            createElement('p', {
                className: 'drawn-card-pose',
                style: { fontStyle: 'italic', marginTop: '0.5rem' }
            }, card.pose)
        );
    }

    // Handle any extra fields beyond the standard ones
    const handledFields = ['title', 'description', 'visual', 'image', 'pose', '_originalIndex'];
    const extraFields = Object.entries(card).filter(([key]) =>
        !handledFields.includes(key)
    );

    if (extraFields.length > 0) {
        const dl = createElement('dl', { className: 'drawn-card-extra' });
        for (const [key, value] of extraFields) {
            dl.appendChild(createElement('dt', {}, formatFieldName(key)));
            dl.appendChild(createElement('dd', {}, String(value)));
        }
        elements.push(dl);
    }

    return createElement('div', { className: 'drawn-card' }, ...elements);
}

/**
 * Format a camelCase or snake_case field name for display
 * @param {string} name 
 * @returns {string}
 */
function formatFieldName(name) {
    return name
        .replace(/_/g, ' ')
        .replace(/([a-z])([A-Z])/g, '$1 $2')
        .replace(/^./, str => str.toUpperCase());
}

/**
 * Create a loading spinner
 * @returns {HTMLElement}
 */
export function loadingSpinner() {
    return createElement('div', { 
        className: 'empty-state',
        'aria-label': 'Loading...'
    }, '⏳');
}

/**
 * Confirm dialog (using native confirm for simplicity)
 * @param {string} message 
 * @returns {boolean}
 */
export function confirmAction(message) {
    return window.confirm(message);
}
