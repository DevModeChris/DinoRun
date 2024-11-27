/**
 * 🎮 Obstacle Configurations
 * This file defines all the different types of obstacles in our game.
 * Adding a new obstacle is as easy as adding a new entry here!
 */

// 🌵 This is where we design all our different obstacles!
// Just like in platform games where you might find:
// - Spiky plants to jump over
// - Rocks to dodge
// - Holes to avoid falling into

/**
 * @typedef {Object} ObstacleConfig
 * @property {string} className - CSS class for styling the obstacle
 * @property {string[]} sizes - Available sizes for this obstacle type
 * @property {number} baseWidth - Base width in pixels
 * @property {number} baseHeight - Base height in pixels
 * @property {string} type - Type of obstacle
 * @property {Object} styles - Custom styles for the obstacle
 * @property {Object} sizeMultipliers - Size multipliers for different sizes
 */

/**
 * 🎨 OBSTACLE_TYPES defines all the different things our dino needs to dodge
 * Each one has its own look and challenge - like different enemies in Mario!
 * @type {Object.<string, ObstacleConfig>}
 */
export const OBSTACLE_TYPES = {
    cactus: {
        className: 'cactus',
        sizes: ['small', 'medium', 'large'],
        baseWidth: 30,
        baseHeight: 70,
        type: 'cactus',
        styles: {
            backgroundColor: '#2ecc71',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
            borderRadius: '2px',
            border: '1px solid #27ae60',
        },
        sizeMultipliers: {
            small: 0.6,
            medium: 0.8,
            large: 1,
        },
    },

    rock: {
        className: 'rock',
        sizes: ['small', 'medium', 'large'],
        baseWidth: 50,
        baseHeight: 40,
        type: 'rock',
        styles: {
            backgroundColor: '#666',
            boxShadow: '0 2px 4px rgba(0, 0, 0, 0.3)',
            borderRadius: '4px 4px 2px 2px',
            border: '1px solid #555',
        },
        sizeMultipliers: {
            small: 0.5,
            medium: 0.8,
            large: 1,
        },
    },

    hole: {
        className: 'hole',
        sizes: ['small', 'medium', 'large'],
        baseWidth: 60,
        baseHeight: 40, // Fixed height for all hole sizes
        type: 'hole',
        bottom: -20, // Position top edge at ground level
        styles: {
            backgroundColor: '#000',
            border: '3px solid #422f11',
            borderTop: 'none',
            borderBottom: 'none',
            zIndex: 3,
        },
        sizeMultipliers: {
            small: 0.8,
            medium: 1,
            large: 1.3,
        },
    },
};
