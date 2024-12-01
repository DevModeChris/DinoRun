/**
 * 🌵 Obstacles are the things our dino needs to dodge!
 * They make the game challenging and fun, just like:
 * - Pipes in Mario
 * - Spikes in Sonic
 * - Lava in Minecraft
 *
 * 🎮 The Obstacle class creates things for our dino to jump over or duck under
 * Each obstacle is unique and needs different skills to avoid!
 */

import { GAME_CONSTANTS } from '../utils/constants.js';
import { getRandomSize } from '../utils/entity-helpers.js';

export class Obstacle {
    /**
     * 🎮 Initialising a New Obstacle
     *
     * @param {HTMLElement} gameContainer - The game container element
     * @param {object} config - Obstacle configuration
     */
    constructor(gameContainer, config) {
        // Create the obstacle's look
        this.element = document.createElement('div');
        this.config = config;

        // Get random size if sizes are configured
        this.size = getRandomSize(config.sizes);
        const sizeMultiplier = config.sizeMultipliers?.[this.size] || 1;

        // Calculate dimensions
        this.width = (config.baseWidth || config.width) * sizeMultiplier;

        // For holes, only apply multiplier to width, not height
        this.height = config.type === 'hole'
            ? (config.baseHeight || config.height)
            : (config.baseHeight || config.height) * sizeMultiplier;

        // Set position
        this.x = window.innerWidth;
        this.y = config.bottom || 20; // Default to ground height if not specified
        this.type = config.type;

        // Set up base class and any additional classes
        this.element.className = 'obstacle';
        if (config.className) {
            this.element.classList.add(config.className);
        }
        if (this.size) {
            this.element.classList.add(this.size);
        }
        if (config.class) {
            this.element.classList.add(config.class);
        }

        // Add to game container first
        gameContainer.appendChild(this.element);

        // Apply all styles
        Object.assign(this.element.style, {
            position: 'absolute',
            width: `${this.width}px`,
            height: `${this.height}px`,
            left: `${this.x}px`,
            bottom: `${this.y}px`,
            backgroundColor: config.backgroundColor || '#2ecc71',
            zIndex: '2',
            ...config.styles,
        });
    }

    /**
     * 🔄 Update the obstacle's position and check if it's still active
     *
     * @param {number} speedMultiplier - Current game speed multiplier
     * @param {number} gameSpeed - Current game speed
     * @returns {boolean} - Whether the obstacle is still active
     */
    update(speedMultiplier = 1, gameSpeed) {
        // Move at the current game speed
        this.x -= (gameSpeed || GAME_CONSTANTS.GAME_SPEED.INITIAL) * speedMultiplier;
        this.element.style.left = `${this.x}px`;

        // Return true if the obstacle is still on screen
        return this.x + this.width > 0;
    }

    /**
     * 🎯 Get Collision Box
     * This tells us exactly where our obstacle is for checking collisions
     */
    getHitbox() {
        const rect = this.element.getBoundingClientRect();
        const containerRect = window.game.gameContainer.getBoundingClientRect();

        return {
            x: rect.left - containerRect.left,
            y: rect.top - containerRect.top,
            width: rect.width,
            height: rect.height,
        };
    }

    /**
     * Handle collision effects
     */
    onCollision() {
        // Add hit animation class
        this.element.classList.add('hit');

        // Emit collision particles
        if (window.game && window.game.particles) {
            const hitbox = this.getHitbox();
            window.game.particles.emitCollision(hitbox.x + (hitbox.width / 2), hitbox.y + (hitbox.height / 2));
        }

        // Remove hit class after animation
        setTimeout(() => {
            this.element.classList.remove('hit');
        }, 200);
    }

    /**
     * 🚮 Removing the Obstacle
     *
     * When our obstacle is no longer needed, we tidy up and remove it
     * from the game, this helps keep the game running smoothly by freeing up
     * memory and resources!
     */
    remove() {
        this.element.remove();
    }
}
