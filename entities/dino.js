// 🦖 Meet our brave dino hero! This is where all the dino's special moves come from.
// Just like your favorite video game character, our dino can:
// - 🦘 Jump over obstacles
// - 🦆 Crouch under flying objects
// - 🏃 Run super fast
// - ⭐ Use special power-ups

/**
 * 🎮 The Dino class is like our game's main character creator!
 * It gives our dino all its cool abilities - just like how Mario can jump and run,
 * or how Sonic can roll into a ball and go fast!
 */
export class Dino {
    /**
     * 🎨 This is where we create our dino and give it all its special abilities
     * Just like creating a character in a video game!
     * @param {HTMLElement} element - The dino's body (what you see on screen)
     */
    constructor(element) {
        // 🎯 Keep track of our dino's HTML element
        this.element = element;

        // 📏 Position tracking - where is our dino?
        this.verticalPosition = 0;    // How high up in the air (0 means on the ground)
        this.verticalVelocity = 0;    // How fast moving up/down (like a speedometer for jumping)

        // 🦘 Jumping properties
        this.isJumping = false;       // Are we in the air?
        this.boostStartTime = 0;      // When did we start this jump?
        this.isSpacePressed = false;  // Is the jump button being held?
        this.lastUpdateTime = 0;      // When did we last move?

        // 🦆 Crouching properties
        this.isCrouching = false;     // Are we ducking down?

        // 🔄 Start at the beginning!
        this.reset();
    }

    /**
     * 📦 This is like our dino's physical space in the game
     * It helps us know when the dino bumps into things
     * Think of it like an invisible box around our dino
     */
    getHitbox() {
        const rect = this.element.getBoundingClientRect();
        const containerRect = window.game.gameContainer.getBoundingClientRect();

        const hitbox = {
            x: rect.left - containerRect.left,
            y: rect.top - containerRect.top,
            width: rect.width,
            height: rect.height,
        };

        // When crouching, we'll use a wider but shorter hitbox
        if (this.isCrouching) {
            hitbox.height = rect.height * 0.7;  // Make hitbox shorter when crouching
            hitbox.width = rect.width * 1.2;    // Make hitbox wider when crouching
            hitbox.y = (rect.bottom - containerRect.top) - hitbox.height; // Align hitbox with bottom of dino
        }

        return hitbox;
    }

    /**
     * 🦘 Makes the dino jump when spacebar is pressed
     * Just like Mario jumping over pipes!
     * @param {number} jumpStrength - How high we can jump
     * @returns {boolean} Whether we started a new jump
     */
    jump(jumpStrength) {
        // Can't start a new jump if we're already in the air!
        if (this.isJumping) {
            return false;
        }

        // 🚀 Start the jump!
        this.isJumping = true;
        this.isSpacePressed = true;
        this.boostStartTime = Date.now();
        this.lastUpdateTime = Date.now();

        // Create dust effect at the jump position
        if (window.game && window.game.particles) {
            const hitbox = this.getHitbox();
            window.game.particles.emitJump(hitbox.x + (hitbox.width / 2), hitbox.y + hitbox.height);
        }

        // 💨 Push off the ground
        this.verticalVelocity = jumpStrength;
        this.element.classList.remove('running');

        return true;
    }

    /**
     * 🎮 Called when player lets go of the spacebar
     * This stops the extra boost you get from holding the jump button
     */
    endJump() {
        this.isSpacePressed = false;
    }

    /**
     * 🦆 Makes the dino crouch when the crouch key is pressed
     * Perfect for ducking under flying obstacles!
     */
    crouch(shouldCrouch) {
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
     * 🔄 Updates where our dino is in the game world
     * This makes jumping feel natural and fun!
     *
     * @param {number} gravity - How strongly gravity pulls down
     * @param {number} jumpBoostSpeed - Extra jump power when holding space
     * @param {number} maxBoostTime - How long you can boost a jump
     * @param {boolean} isSlowMotion - Is slow-motion power-up active?
     * @param {number} slowMotionSpeedMultiplier - How much slower in slow-motion
     */
    updatePosition(gravity, jumpBoostSpeed, maxBoostTime, isSlowMotion, slowMotionSpeedMultiplier) {
        if (!this.isJumping) {
            return;
        }

        // ⏰ Calculate how much time has passed
        const currentTime = Date.now();
        const deltaTime = Math.min((currentTime - this.lastUpdateTime) / 1000, 0.1); // Cap deltaTime to prevent huge jumps
        this.lastUpdateTime = currentTime;

        // 🌟 Apply slow motion if active
        const effectiveGravity = gravity * (isSlowMotion ? slowMotionSpeedMultiplier : 1);
        const effectiveBoostSpeed = jumpBoostSpeed * (isSlowMotion ? slowMotionSpeedMultiplier : 1);

        // 🚀 Add extra jump power if holding space
        if (this.isSpacePressed && currentTime - this.boostStartTime < maxBoostTime) {
            this.verticalVelocity += effectiveBoostSpeed * deltaTime;
        }

        // 🌍 Apply gravity to pull us down
        this.verticalVelocity -= effectiveGravity * deltaTime;

        // 📏 Move up or down based on our speed
        this.verticalPosition += this.verticalVelocity * deltaTime;

        // 🛑 Stop if we hit the ground
        if (this.verticalPosition <= 0) {
            this.land();
        }

        // 🎨 Update how it looks on screen
        this.element.style.bottom = `${Math.max(0, this.verticalPosition)}px`;
    }

    /**
     * 🛬 Called when the dino lands on the ground
     * Time to get ready for the next jump!
     */
    land() {
        this.verticalPosition = 0;
        this.verticalVelocity = 0;
        this.isJumping = false;
        this.isSpacePressed = false;

        // Create dust particles when landing
        if (window.game && window.game.particles) {
            const hitbox = this.getHitbox();
            window.game.particles.emitLand(hitbox.x + (hitbox.width / 2), hitbox.y + hitbox.height);
        }

        // Start running animation if game is going
        if (window.game && window.game.gameStarted && !window.game.isGameOver) {
            this.element.classList.add('running');
        }
    }

    /**
     * 🕳️ Make the dino fall into a hole
     * Oh no! We hit a trap!
     */
    fall() {
        this.element.classList.add('falling');
        this.element.classList.remove('running', 'crouching');

        return new Promise((resolve) => {
            setTimeout(() => {
                if (!window.game.isGameOver) {
                    this.element.classList.remove('falling');
                }
                resolve();
            }, 400);
        });
    }

    /**
     * 🔄 Reset the dino to its starting state
     * Like starting a new game!
     */
    reset() {
        this.verticalPosition = 0;
        this.verticalVelocity = 0;
        this.isJumping = false;
        this.isCrouching = false;
        this.isSpacePressed = false;
        this.element.style.bottom = '0';
        this.element.classList.remove('crouching', 'running', 'dead', 'falling');
    }
}
