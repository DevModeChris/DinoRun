/**
 * 🎮 Obstacle Configurations
 * This file defines all the different types of obstacles in our game.
 * Adding a new obstacle is as easy as adding a new entry here!
 */

/**
 * @typedef {Object} ObstacleConfig
 * @property {string} className - CSS class for styling the obstacle
 * @property {string[]} sizes - Available sizes for this obstacle type
 * @property {number} baseHeight - Base height in pixels
 * @property {number} baseWidth - Base width in pixels
 * @property {string} backgroundColor - CSS color for the obstacle
 * @property {number} [bottom] - Distance from bottom (for flying obstacles)
 * @property {function} [getSpeed] - Custom speed calculation (receives base speed)
 * @property {Object} [animations] - Custom animation configurations
 */

/**
 * All our obstacle types and their unique properties
 * @type {Object.<string, ObstacleConfig>}
 */
export const OBSTACLE_TYPES = {
    cactus: {
        className: 'cactus',
        sizes: ['small', 'medium', 'large'],
        baseWidth: 30,
        baseHeight: 70,
        backgroundColor: '#2ecc71',
        heightMultipliers: {
            small: 0.4,
            medium: 0.7,
            large: 1,
        },
    },
    rock: {
        className: 'rock',
        sizes: ['small', 'medium', 'large'],
        baseWidth: 50,
        baseHeight: 40,
        backgroundColor: '#666',
        heightMultipliers: {
            small: 0.5,
            medium: 0.8,
            large: 1,
        },
    },
    bird: {
        className: 'bird',
        sizes: ['small', 'medium', 'large'],
        baseWidth: 40,
        baseHeight: 30,
        backgroundColor: '#4a90e2',
        bottom: 100,
        getSpeed: (baseSpeed) => baseSpeed * (1 + (Math.random() * 0.5)), // 1x to 1.5x faster
        animations: {
            fly: {
                duration: 0.5,
                keyframes: [
                    { transform: 'translateY(0)' },
                    { transform: 'translateY(-5px)' },
                    { transform: 'translateY(0)' },
                ],
            },
        },
    },
    hole: {
        className: 'hole',
        sizes: ['small', 'medium', 'large'],
        baseWidth: 60,
        baseHeight: 20,
        backgroundColor: '#000',
        bottom: 0,
        widthMultipliers: {
            small: 1,
            medium: 1.3,
            large: 1.6,
        },
        styles: {
            border: '3px solid #555',
            borderBottom: 'none',
            zIndex: 3,
            boxShadow: 'inset 0 5px 5px rgba(0, 0, 0, 0.8), 0 -2px 4px rgba(0, 0, 0, 0.3)',
        },
    },
};

/**
 * Helper function to get a random size for an obstacle
 * @param {string[]} availableSizes - List of available sizes
 * @returns {string} Random size from the list
 */
export function getRandomSize(availableSizes) {
    return availableSizes[Math.floor(Math.random() * availableSizes.length)];
}

/**
 * Helper function to get a random obstacle type
 * @returns {string} Random obstacle type key from OBSTACLE_TYPES
 */
export function getRandomObstacleType() {
    const types = Object.keys(OBSTACLE_TYPES);
    return types[Math.floor(Math.random() * types.length)];
}
