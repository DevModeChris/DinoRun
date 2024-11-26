/**
 * 🌵 Obstacle Class: The Things Our Player Character Has to Avoid! 🪨
 *
 * Think of obstacles like hurdles in a race - they're the tricky things
 * our player character needs to jump over or duck under to stay safe!
 */

import { OBSTACLE_TYPES, getRandomObstacleType, getRandomSize } from '../config/obstacles.js';

export class Obstacle {
    /**
     * 🎮 Initialising a New Obstacle
     *
     * @param {HTMLElement} gameContainer - The game's playground where we put our obstacle
     * @param {number} speed - Base speed for the obstacle
     * @param {string} [type] - Specific obstacle type, or random if not specified
     * @param {string} [size] - Specific size, or random if not specified
     */
    constructor(gameContainer, speed, type, size) {
        // 🎨 Create the obstacle's look
        this.element = document.createElement('div');

        // Get obstacle type and configuration
        this.type = type || getRandomObstacleType();
        this.config = OBSTACLE_TYPES[this.type];

        // Get obstacle size
        this.size = size || getRandomSize(this.config.sizes);

        // Set up the obstacle's appearance
        this.element.className = `obstacle ${this.config.className} ${this.size}`;

        // Apply base styles
        this.element.style.backgroundColor = this.config.backgroundColor;
        this.element.style.width = `${this.config.baseWidth}px`;

        // Calculate and set height based on size multiplier
        const heightMultiplier = this.config.heightMultipliers?.[this.size] ?? 1;
        const height = this.config.baseHeight * heightMultiplier;
        this.element.style.height = `${height}px`;

        // Calculate and set width if there are width multipliers
        if (this.config.widthMultipliers) {
            const widthMultiplier = this.config.widthMultipliers[this.size];
            this.element.style.width = `${this.config.baseWidth * widthMultiplier}px`;
        }

        // Apply any additional styles
        if (this.config.styles) {
            Object.entries(this.config.styles).forEach(([property, value]) => {
                this.element.style[property] = value;
            });
        }

        // 📍 Place the obstacle at the starting position
        this.position = gameContainer.offsetWidth;

        // Set vertical position (for flying obstacles)
        if (this.config.bottom !== undefined) {
            this.element.style.bottom = `${this.config.bottom}px`;
        }

        // Set speed (use custom speed function if defined)
        this.speed = this.config.getSpeed ? this.config.getSpeed(speed) : speed;

        // Add animations if defined
        if (this.config.animations) {
            // Add animation class names to the element
            const animationClasses = Object.keys(this.config.animations).map((name) => `${this.config.className}-${name}`);
            this.element.classList.add(...animationClasses);

            // Set up CSS animations
            Object.entries(this.config.animations).forEach(([name, config]) => {
                const animationName = `${this.config.className}-${name}`;
                if (!document.querySelector(`style[data-animation="${animationName}"]`)) {
                    // Create keyframes if they don't exist yet
                    const style = document.createElement('style');
                    style.setAttribute('data-animation', animationName);
                    style.textContent = `
                        @keyframes ${animationName} {
                            ${config.keyframes.map((frame, index) =>
        `${(index * 100 / (config.keyframes.length - 1))}% { ${Object.entries(frame).map(([prop, value]) =>
            `${prop}: ${value}`).join('; ')} }`,
    ).join('\n')}
                        }
                        .${animationName} {
                            animation: ${animationName} ${config.duration}s infinite;
                        }
                    `;
                    document.head.appendChild(style);
                }
            });
        }

        // Update the position on screen
        this.element.style.left = `${this.position}px`;
        gameContainer.appendChild(this.element);
    }

    /**
     * 🔄 Moving the Obstacle
     *
     * @param {number} speedMultiplier - How much to multiply the speed by (for power-ups)
     * @returns {boolean} - Whether the obstacle is still active (on screen)
     */
    update(speedMultiplier) {
        this.position -= this.speed * speedMultiplier;
        this.element.style.left = `${this.position}px`;

        // Return true if obstacle is still visible on screen
        return this.position > -this.element.offsetWidth;
    }

    /**
     * 🎯 Get Collision Box
     * This tells us exactly where our obstacle is for checking collisions
     */
    getHitbox() {
        const bounds = this.element.getBoundingClientRect();
        return {
            x: bounds.left,
            y: bounds.top,
            width: bounds.width,
            height: bounds.height,
        };
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
