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
     */
    jump(jumpStrength, isSlowMotionActive = false) {
        // Can't start a new jump if we're already in the air
        if (this.isJumping) {
            return;
        }

        this.isJumping = true;
        this.isSpacePressed = true;
        this.boostStartTime = Date.now();

        // Scale jump strength during slow motion
        this.verticalVelocity = isSlowMotionActive ? jumpStrength * 0.5 : jumpStrength;
        this.element.classList.remove('running');
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
            // Scale gravity during slow motion
            const effectiveGravity = isSlowMotion ? gravity * 0.25 : gravity;

            // Apply gravity (pulls dino down)
            this.verticalVelocity -= effectiveGravity;

            // Update dino's height
            this.verticalPosition += this.verticalVelocity;

            // Check if we've landed
            if (this.verticalPosition <= 0) {
                this.land();
            }

            // Handle continuous jump boost while space is held
            if (this.isSpacePressed && this.verticalVelocity > 0) {
                const currentTime = Date.now();
                const boostTimeElapsed = currentTime - this.boostStartTime;
                const adjustedMaxBoostTime = isSlowMotion ? maxBoostTime / slowMotionSpeedMultiplier : maxBoostTime;

                if (boostTimeElapsed <= adjustedMaxBoostTime) {
                    // Scale boost speed during slow motion
                    const effectiveBoostSpeed = isSlowMotion ? jumpBoostSpeed * 0.5 : jumpBoostSpeed;
                    this.verticalVelocity += effectiveBoostSpeed;
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
     * Resets the dino to its starting state
     */
    reset() {
        this.verticalPosition = 0;
        this.verticalVelocity = 0;
        this.isJumping = false;
        this.isSpacePressed = false;
        this.isCrouching = false;
        this.element.classList.remove('crouching', 'running', 'dead');
        this.element.style.bottom = '0';
    }
}
