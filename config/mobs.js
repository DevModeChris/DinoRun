/**
 * @typedef {Object} MobConfig
 * @property {string} className - CSS class for styling the mob
 * @property {string[]} sizes - Available sizes for this mob type
 * @property {number} baseWidth - Base width in pixels
 * @property {number} baseHeight - Base height in pixels
 * @property {string} type - Type of mob
 * @property {Object} styles - Custom styles for the mob
 * @property {Object} sizeMultipliers - Size multipliers for different sizes
 * @property {Function} getSpeed - Function to calculate speed of mob
 */

// 🎨 This is where we design all our different mob creatures!

/**
 * 🦁 MOB_TYPES defines all the different creatures in our game
 * Each one has its own special look and way of moving.
 * @type {Object.<string, MobConfig>}
 */
export const MOB_TYPES = {
    bird: {
        className: 'bird',
        sizes: ['small', 'medium', 'large'],
        baseWidth: 40,
        baseHeight: 30,
        type: 'bird',
        getRandomHeight: () => Math.floor((Math.random() * (280 - 60)) + 60), // Random height between 60 and 280
        backgroundColor: '#4a90e2',
        bottom: 100,
        getSpeed: (baseSpeed) => baseSpeed * (1 + (Math.random() * 0.5)), // 1x to 1.5x faster
        animations: {
            fly: {
                duration: 0.5,
                keyframes: [
                    { transform: 'translateY(0)' },
                    { transform: 'translateY(-5px)' },
                    { transform: 'translateY(-10px)' },
                    { transform: 'translateY(0)' },
                ],
            },
        },
        sizeMultipliers: {
            small: 0.6,
            medium: 0.75,
            large: 1,
        },
    },

    // Add more mob types here in the future
};
