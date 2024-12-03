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
        };

        // Track key and touch states
        this.keyStates = new Map();
        this.touchStartY = 0;
        this.touchStartX = 0;

        // Callback storage
        this.actionCallbacks = new Map();

        // Bind event handlers
        this._handleKeyDown = this._handleKeyDown.bind(this);
        this._handleKeyUp = this._handleKeyUp.bind(this);
        this._handleTouchStart = this._handleTouchStart.bind(this);
        this._handleTouchMove = this._handleTouchMove.bind(this);
        this._handleTouchEnd = this._handleTouchEnd.bind(this);

        // Setup input handlers
        this.setupKeyboardControls();
        this.setupTouchControls();
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
     * Handle key down events
     * @private
     */
    _handleKeyDown(event) {
        // Update key state
        this.keyStates.set(event.code, true);

        // Find and trigger action callbacks
        Object.entries(this.keyBindings).forEach(([action, keys]) => {
            if (keys.includes(event.code)) {
                event.preventDefault();
                const callback = this.actionCallbacks.get(action);
                if (callback) {
                    callback({ pressed: true, action });
                }
            }
        });
    }

    /**
     * Handle key up events
     * @private
     */
    _handleKeyUp(event) {
        // Update key state
        this.keyStates.set(event.code, false);

        // Find and trigger action callbacks
        Object.entries(this.keyBindings).forEach(([action, keys]) => {
            if (keys.includes(event.code)) {
                const callback = this.actionCallbacks.get(action);
                if (callback) {
                    callback({ pressed: false, action });
                }
            }
        });
    }

    /**
     * Handle touch start events
     * @private
     */
    _handleTouchStart(event) {
        // Only prevent default for game area touches
        if (event.target.id === 'game-container') {
            event.preventDefault();
        }

        const screenWidth = window.innerWidth;

        // Store touch start position for swipe detection
        if (event.touches.length > 0) {
            const touch = event.touches[0];
            this.touchStartY = touch.clientY;
        }

        // Handle all touches
        if (window.game && window.game.currentState === 'PLAYING' && !window.game.isGameOver) {
            Array.from(event.touches).forEach((touch) => {
                // Determine action based on which half of the screen was touched
                const action = touch.clientX < screenWidth / 2 ? 'jump' : 'crouch';
                const callback = this.actionCallbacks.get(action);
                if (callback) {
                    callback({ pressed: true, action });
                }
            });
        }
    }

    /**
     * Handle touch move events
     * @private
     */
    _handleTouchMove(event) {
        if (event.touches.length > 0) {
            const touch = event.touches[0];
            const deltaY = this.touchStartY - touch.clientY;

            if (window.game && window.game.currentState === 'PLAYING' && !window.game.isGameOver) {
                // Handle swipe up
                if (deltaY > 50) {
                    const jumpCallback = this.actionCallbacks.get('jump');
                    if (jumpCallback) {
                        jumpCallback({ pressed: true, action: 'jump' });
                    }
                }

                // Handle swipe down
                else if (deltaY < -50) {
                    const crouchCallback = this.actionCallbacks.get('crouch');
                    if (crouchCallback) {
                        crouchCallback({ pressed: true, action: 'crouch' });
                    }
                }
            }
        }
    }

    /**
     * Handle touch end events
     * @private
     */
    _handleTouchEnd(event) {
        const screenWidth = window.innerWidth;

        // If there are still touches, check which side they're on
        const activeTouches = Array.from(event.touches);
        const leftSideTouches = activeTouches.filter((touch) => touch.clientX < screenWidth / 2);
        const rightSideTouches = activeTouches.filter((touch) => touch.clientX >= screenWidth / 2);

        // Release jump if no touches on left side
        if (leftSideTouches.length === 0) {
            const jumpCallback = this.actionCallbacks.get('jump');
            if (jumpCallback) {
                jumpCallback({ pressed: false, action: 'jump' });
            }
        }

        // Release crouch if no touches on right side
        if (rightSideTouches.length === 0) {
            const crouchCallback = this.actionCallbacks.get('crouch');
            if (crouchCallback) {
                crouchCallback({ pressed: false, action: 'crouch' });
            }
        }
    }

    setupKeyboardControls() {
        // Set up keyboard listeners
        document.addEventListener('keydown', this._handleKeyDown);
        document.addEventListener('keyup', this._handleKeyUp);
    }

    setupTouchControls() {
        // Set up touch listeners
        document.addEventListener('touchstart', this._handleTouchStart, { passive: false });
        document.addEventListener('touchmove', this._handleTouchMove, { passive: false });
        document.addEventListener('touchend', this._handleTouchEnd, { passive: false });
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
