// ⭐ Power-ups are special items that give our dino amazing abilities!
// Like getting super speed or slowing down time - just like in superhero movies!

import { GAME_CONSTANTS } from '../utils/constants.js';

/**
 * 🎁 The PowerUp class creates magical items that appear in our game
 * When the dino catches them, they give special powers for a short time
 * It's like collecting a star in Mario or a power ring in Sonic!
 */
export class PowerUp {
    /**
     * Create a new power-up
     * @param {HTMLElement} gameContainer - The game container element
     * @param {Object} config - Power-up configuration
     */
    constructor(gameContainer, config) {
        this.config = config;

        // Create the power-up element
        this.element = document.createElement('div');
        this.element.className = `power-up ${this.config.className}`;
        this.element.innerHTML = this.config.emoji || '⭐'; // Add emoji with fallback
        gameContainer.appendChild(this.element);

        // Position it on screen
        const gameWidth = gameContainer.offsetWidth;
        this.x = gameWidth;
        this.element.style.left = `${gameWidth}px`;

        // Set vertical position based on config
        if (this.config.position) {
            // If useGround is true, add the ground height to the bottom position
            const bottomOffset = this.config.position.useGround
                ? this.config.position.bottom + GAME_CONSTANTS.GROUND_HEIGHT
                : this.config.position.bottom;
            this.element.style.bottom = `${bottomOffset}px`;
        }
        else {
            // Default to ground level if no position specified
            this.element.style.bottom = `${GAME_CONSTANTS.GROUND_HEIGHT}px`;
        }

        // Get the width of the power-up
        const rect = this.element.getBoundingClientRect();
        this.width = rect.width;

        // Track if it's been collected
        this.isCollected = false;
        this.timeout = null;
    }

    /**
     * 🔄 Update the power-up's position and check if it's still active
     *
     * @param {number} speedMultiplier - Current game speed multiplier
     * @param {number} gameSpeed - Current game speed
     * @returns {boolean} - Whether the power-up is still active
     */
    update(speedMultiplier = 1, gameSpeed) {
        // Move at the current game speed
        this.x -= (gameSpeed || GAME_CONSTANTS.GAME_SPEED.INITIAL) * speedMultiplier;
        this.element.style.left = `${this.x}px`;

        // Return true if the power-up is still on screen
        return this.x + this.width > 0;
    }

    /**
     * What happens when dino collects this power-up
     * @param {Object} game - The game instance
     */
    collect(game) {
        if (this.isCollected) {
            return;
        }

        this.isCollected = true;
        this.element.remove();

        // Apply power-up effects
        if (this.config.onCollect) {
            this.config.onCollect(game);
        }

        // Set up expiration
        this.timeout = setTimeout(() => {
            if (this.config.onExpire) {
                this.config.onExpire(game);
            }
        }, this.config.duration);
    }

    /**
     * 🧹 Clean up when the power-up is no longer needed
     * Like picking up your toys when you're done playing!
     */
    remove() {
        if (this.timeout) {
            clearTimeout(this.timeout);
        }

        if (this.element && this.element.parentNode) {
            this.element.remove();
        }
    }

    /**
     * 🎯 Getting the Power-Up's Hitbox
     *
     * We need to know where our power-up is so we can check if the player caught it!
     * It's like drawing a box around the power-up to see where it is.
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
}
