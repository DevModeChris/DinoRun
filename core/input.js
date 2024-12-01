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
        // Only prevent default for game area touches
        if (event.target.id === 'game-container') {
            event.preventDefault();
        }

        const screenWidth = window.innerWidth;

        // If game hasn't started and we're not on game over screen,
        // any touch should start the game
        if (!window.game.gameStarted && !window.game.isGameOver) {
            const callback = this.actionCallbacks.get('jump');
            if (callback) {
                callback({ pressed: true, action: 'jump' });
            }

            return;
        }

        // Handle all touches
        Array.from(event.touches).forEach((touch) => {
            // Determine action based on which half of the screen was touched
            const action = touch.clientX < screenWidth / 2 ? 'jump' : 'crouch';
            const callback = this.actionCallbacks.get(action);
            if (callback) {
                callback({ pressed: true, action });
            }
        });

        // Store touch start position for swipe detection
        if (event.touches.length > 0) {
            const touch = event.touches[0];
            this.touchStartX = touch.clientX;
            this.touchStartY = touch.clientY;
        }
    }

    /**
     * Handle touch move events
     * @private
     */
    _handleTouchMove(event) {
        // Only prevent default for game area touches
        if (event.target.id === 'game-container') {
            event.preventDefault();
        }

        // Touch move is only used for the restart gesture
        if (event.touches.length > 0) {
            const touch = event.touches[0];
            const deltaY = touch.clientY - this.touchStartY;
            const deltaX = touch.clientX - this.touchStartX;

            // If significant vertical swipe while game is over, trigger restart
            if (Math.abs(deltaY) > 50 && Math.abs(deltaY) > Math.abs(deltaX)) {
                const callback = this.actionCallbacks.get('restart');
                if (callback) {
                    callback({ pressed: true, action: 'restart' });
                }
            }
        }
    }

    /**
     * Handle touch end events
     * @private
     */
    _handleTouchEnd(event) {
        // Only prevent default for game area touches
        if (event.target.id === 'game-container') {
            event.preventDefault();
        }

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
