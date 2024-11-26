/**
 * Dino is the main character that players control in our game.
 * It can jump, crouch, and collect power-ups!
 */
export class Dino {
    /**
     * Initialises our dino character with all its starting properties
     * @param {HTMLElement} element - The dino's HTML element on the page
     */
    constructor(element) {
        this.element = element;

        // Position of the dino
        this.verticalPosition = 0; // How high up in the air
        this.verticalVelocity = 0; // How fast moving up/down

        // Jumping properties
        this.isJumping = false; // Are we currently jumping?
        this.boostStartTime = 0; // When did the jump start?
        this.isSpacePressed = false; // Are we holding the jump button?
        this.lastUpdateTime = 0; // Track last update time for delta time calculation

        // Crouching properties
        this.isCrouching = false; // Are we currently crouching?

        // Reset to starting position
        this.reset();
    }

    /**
     * Gets the dino's current position and size for collision detection
     * This is like the dino's "physical space" in the game
     */
    getHitbox() {
        const rect = this.element.getBoundingClientRect();

        return {
            x: rect.left,
            y: rect.top,
            width: rect.width,
            height: rect.height,
        };
    }

    /**
     * Makes the dino start jumping when spacebar is pressed
     * @returns {boolean} Whether a new jump was started
     */
    jump(jumpStrength) {
        // Can't start a new jump if we're already in the air
        if (this.isJumping) {
            return false;
        }

        this.isJumping = true;
        this.isSpacePressed = true;
        this.boostStartTime = Date.now();
        this.lastUpdateTime = Date.now();

        // Use full jump strength - physics scaling will handle slow motion
        this.verticalVelocity = jumpStrength;
        this.element.classList.remove('running');

        return true;
    }

    /**
     * Called when player releases the spacebar
     * Stops the extra boost from holding the jump button
     */
    endJump() {
        this.isSpacePressed = false;
    }

    /**
     * Makes the dino crouch when down arrow is pressed
     */
    crouch(shouldCrouch) {
        // Can't crouch while jumping!
        if (this.isJumping) {
            return;
        }

        this.isCrouching = shouldCrouch;
        if (shouldCrouch) {
            this.element.classList.add('crouching');
            this.element.classList.remove('running');
        }
        else {
            this.element.classList.remove('crouching');

            if (!this.isJumping && window.game && window.game.gameStarted && !window.game.isGameOver) {
                this.element.classList.add('running');
            }
        }
    }

    /**
     * Updates the dino's position each frame based on physics
     * This makes the jumping feel natural!
     *
     * @param {number} gravity - How strongly gravity pulls down
     * @param {number} jumpBoostSpeed - How much extra jump power when holding space
     * @param {number} maxBoostTime - How long you can boost a jump
     * @param {boolean} isSlowMotion - Is slow-motion active?
     * @param {number} slowMotionSpeedMultiplier - How much slower in slow-motion
     */
    updatePosition(gravity, jumpBoostSpeed, maxBoostTime, isSlowMotion, slowMotionSpeedMultiplier) {
        // If we're jumping, apply physics!
        if (this.isJumping) {
            const currentTime = Date.now();

            // Calculate time since last update, scaled for slow motion
            const deltaTime = (currentTime - this.lastUpdateTime) * (isSlowMotion ? slowMotionSpeedMultiplier : 1);
            this.lastUpdateTime = currentTime;

            // Scale physics calculations by delta time
            const timeScale = deltaTime / (1000 / 60); // Normalize to 60 FPS

            // Apply gravity with time scaling
            this.verticalVelocity -= gravity * timeScale;

            // Update position with time scaling
            this.verticalPosition += this.verticalVelocity * timeScale;

            // Check if we've landed
            if (this.verticalPosition <= 0) {
                this.land();
            }

            // Handle continuous jump boost while space is held
            if (this.isSpacePressed && this.verticalVelocity > 0) {
                const boostTimeElapsed = currentTime - this.boostStartTime;

                // Scale boost time in slow-motion to allow for the same control period
                const adjustedMaxBoostTime = isSlowMotion ? maxBoostTime / slowMotionSpeedMultiplier : maxBoostTime;

                if (boostTimeElapsed <= adjustedMaxBoostTime) {
                    // Apply boost with time scaling
                    this.verticalVelocity += jumpBoostSpeed * timeScale;
                }
            }

            // Update dino's position on screen
            this.element.style.bottom = `${this.verticalPosition}px`;
        }
    }

    /**
     * Called when the dino lands on the ground
     */
    land() {
        this.isJumping = false;
        this.isSpacePressed = false;
        this.verticalPosition = 0;
        this.verticalVelocity = 0;

        // Only add running class if game is active and not crouching
        if (!this.isCrouching && window.game && window.game.gameStarted && !window.game.isGameOver) {
            this.element.classList.add('running');
        }
    }

    /**
     * 🕳️ Make the dino fall into a hole
     */
    fall() {
        this.element.classList.remove('running', 'crouching');
        this.element.classList.add('falling');

        return new Promise((resolve) => {
            setTimeout(resolve, 800); // Match the CSS animation duration
        });
    }

    /**
     * 🔄 Reset the dino to its starting state
     */
    reset() {
        this.element.classList.remove('running', 'crouching', 'falling', 'dead');
        this.verticalPosition = 0;
        this.verticalVelocity = 0;
        this.element.style.bottom = '0px';
    }
}
