import { GAME_CONSTANTS } from '../utils/constants.js';
import { getRandomSize } from '../utils/entity-helpers.js';

// 🦊 Mobs are special creatures that move around in our game!
// They can fly, hop, or run - each with their own special behaviour.

/**
 * 🎮 The Mob class creates different types of creatures that move in unique ways
 */
export class Mob {
    /**
     * Create a new mob
     * @param {HTMLElement} gameContainer - Game container element
     * @param {Object} config - Configuration for this mob
     */
    constructor(gameContainer, config) {
        this.element = document.createElement('div');
        this.config = config;

        // Get random size
        this.size = getRandomSize(config.sizes);
        const sizeMultiplier = config.sizeMultipliers?.[this.size] || 1;

        // Calculate dimensions
        this.width = (config.baseWidth || config.width) * sizeMultiplier;
        this.height = (config.baseHeight || config.height) * sizeMultiplier;

        // Set position
        this.x = window.innerWidth;
        this.y = config.getRandomHeight
            ? config.getRandomHeight()
            : config.bottom || 100; // Use random height if available, otherwise use config.bottom

        // Calculate speed based on config or use default
        this.speed = config.getSpeed
            ? config.getSpeed(GAME_CONSTANTS.GAME_SPEED.INITIAL)
            : GAME_CONSTANTS.GAME_SPEED.INITIAL;

        // Set up base class and any additional classes
        this.element.className = 'mob';
        if (config.className) {
            this.element.classList.add(config.className);
        }
        if (this.size) {
            this.element.classList.add(this.size);
        }

        // Add to game container first
        gameContainer.appendChild(this.element);

        // Apply position and dimension styles
        Object.assign(this.element.style, {
            position: 'absolute',
            width: `${this.width}px`,
            height: `${this.height}px`,
            left: `${this.x}px`,
            bottom: `${this.y}px`,
            backgroundColor: config.backgroundColor || '#4a90e2',
            zIndex: '2',
            borderRadius: '4px',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
        });

        // Apply animations if defined
        if (config.animations?.fly) {
            const flyAnim = config.animations.fly;
            this.element.animate(flyAnim.keyframes, {
                duration: flyAnim.duration * 1000,
                iterations: Infinity,
                easing: 'ease-in-out',
            });
        }
    }

    /**
     * 🔄 Update the mob's position and check if it's still active
     *
     * @param {number} speedMultiplier - Current game speed multiplier
     * @param {number} gameSpeed - Current game speed
     * @returns {boolean} - Whether the mob is still active
     */
    update(speedMultiplier = 1, gameSpeed) {
        // Move at the mob's own speed, scaled by game speed and multiplier
        const effectiveSpeed = this.speed * (gameSpeed / GAME_CONSTANTS.GAME_SPEED.INITIAL);
        this.x -= effectiveSpeed * speedMultiplier;
        this.element.style.left = `${this.x}px`;

        // Return true if the mob is still on screen
        return this.x + this.width > 0;
    }

    /**
     * Get the mob's hitbox
     * @returns {object} - Hitbox coordinates and dimensions
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
     * Remove the mob's element from the DOM
     */
    remove() {
        this.element.remove();
    }
}
