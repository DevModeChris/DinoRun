/**
 * 🎮 InputManager handles all player input and control schemes
 * It converts raw input events into game actions
 */
export class InputManager {
    constructor() {
        // Default key bindings - can be customised later
        this.keyBindings = {
            jump: ['Space', 'ArrowUp'],
            crouch: ['ArrowDown', 'ControlLeft', 'ControlRight'],
            restart: ['Enter'],
        };

        // Track key and touch states
        this.keyStates = new Map();
        this.touchStartY = 0;

        // Callback storage
        this.actionCallbacks = new Map();

        // Bind event handlers
        this._handleKeyDown = this._handleKeyDown.bind(this);
        this._handleKeyUp = this._handleKeyUp.bind(this);
        this._handleTouchStart = this._handleTouchStart.bind(this);
        this._handleTouchMove = this._handleTouchMove.bind(this);
        this._handleTouchEnd = this._handleTouchEnd.bind(this);

        // Set up keyboard listeners
        document.addEventListener('keydown', this._handleKeyDown);
        document.addEventListener('keyup', this._handleKeyUp);

        // Set up touch listeners
        document.addEventListener('touchstart', this._handleTouchStart, { passive: false });
        document.addEventListener('touchmove', this._handleTouchMove, { passive: false });
        document.addEventListener('touchend', this._handleTouchEnd, { passive: false });
    }

    /**
     * Register a callback for a specific game action
     * @param {string} action - The game action (e.g., 'jump', 'crouch')
     * @param {Function} callback - Function to call when action occurs
     */
    onAction(action, callback) {
        this.actionCallbacks.set(action, callback);
    }

    /**
     * Check if a specific action's key is currently pressed
     * @param {string} action - The action to check
     * @returns {boolean} Whether any key for this action is pressed
     */
    isActionPressed(action) {
        const keys = this.keyBindings[action] || [];
        return keys.some((key) => this.keyStates.get(key));
    }

    /**
     * Handle keydown events
     * @private
     */
    _handleKeyDown(event) {
        this.keyStates.set(event.code, true);

        // Find which action this key triggers
        for (const [action, keys] of Object.entries(this.keyBindings)) {
            if (keys.includes(event.code)) {
                event.preventDefault();
                const callback = this.actionCallbacks.get(action);
                if (callback) {
                    callback({ pressed: true, action });
                }
            }
        }
    }

    /**
     * Handle keyup events
     * @private
     */
    _handleKeyUp(event) {
        this.keyStates.set(event.code, false);

        // Find which action this key triggers
        for (const [action, keys] of Object.entries(this.keyBindings)) {
            if (keys.includes(event.code)) {
                event.preventDefault();
                const callback = this.actionCallbacks.get(action);
                if (callback) {
                    callback({ pressed: false, action });
                }
            }
        }
    }

    /**
     * Handle touch start events
     * @private
     */
    _handleTouchStart(event) {
        event.preventDefault();
        const touch = event.touches[0];
        this.touchStartY = touch.clientY;

        // Trigger jump on touch if game over (acts as restart)
        const callback = this.actionCallbacks.get('jump');
        if (callback) {
            callback({ pressed: true, action: 'jump' });
        }
    }

    /**
     * Handle touch move events
     * @private
     */
    _handleTouchMove(event) {
        event.preventDefault();
        const touch = event.touches[0];
        const deltaY = touch.clientY - this.touchStartY;

        // If swiping down, trigger crouch
        if (deltaY > 30) {
            const callback = this.actionCallbacks.get('crouch');
            if (callback) {
                callback({ pressed: true, action: 'crouch' });
            }
        }

        // If swiping up, trigger jump
        else if (deltaY < -30) {
            const callback = this.actionCallbacks.get('jump');
            if (callback) {
                callback({ pressed: true, action: 'jump' });
            }
        }
    }

    /**
     * Handle touch end events
     * @private
     */
    _handleTouchEnd(event) {
        event.preventDefault();

        // Release any active actions
        ['jump', 'crouch'].forEach((action) => {
            const callback = this.actionCallbacks.get(action);
            if (callback) {
                callback({ pressed: false, action });
            }
        });
    }

    /**
     * Clean up event listeners
     */
    destroy() {
        // Remove keyboard listeners
        document.removeEventListener('keydown', this._handleKeyDown);
        document.removeEventListener('keyup', this._handleKeyUp);

        // Remove touch listeners
        document.removeEventListener('touchstart', this._handleTouchStart);
        document.removeEventListener('touchmove', this._handleTouchMove);
        document.removeEventListener('touchend', this._handleTouchEnd);
    }
}
