/**
 * 🎮 InputManager handles all player input and control schemes
 * It converts raw input events into game actions
 */
export class InputManager {
    constructor() {
        // Default key bindings - can be customized later
        this.keyBindings = {
            jump: ['Space', 'ArrowUp'],
            crouch: ['ArrowDown', 'ControlLeft', 'ControlRight'],
            restart: ['Enter'],
        };

        // Track key states
        this.keyStates = new Map();

        // Callback storage
        this.actionCallbacks = new Map();

        // Bind event handlers
        this._handleKeyDown = this._handleKeyDown.bind(this);
        this._handleKeyUp = this._handleKeyUp.bind(this);

        // Set up listeners
        document.addEventListener('keydown', this._handleKeyDown);
        document.addEventListener('keyup', this._handleKeyUp);
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
     * Clean up event listeners
     */
    destroy() {
        document.removeEventListener('keydown', this._handleKeyDown);
        document.removeEventListener('keyup', this._handleKeyUp);
    }
}
