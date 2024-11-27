// 🎲 This is where we add randomness to our game!
// Just like how in Minecraft:
// - Trees appear in random places
// - Animals come in different sizes
// - Treasure chests have random loot

/**
 * 🎯 These helper functions make our game more fun and unpredictable
 * They help us decide:
 * - 🎨 What type of obstacle or mob appears next
 * - 📏 How big or small things should be
 * - ⏰ When things should appear
 */

/**
 * 🎲 Picks a random size from a list of options
 *
 * @param {string[]} sizes - Array of possible sizes
 * @returns {string} - Random size from the array
 */
export function getRandomSize(sizes) {
    if (!sizes || sizes.length === 0) {
        return 'medium';
    }

    return sizes[Math.floor(Math.random() * sizes.length)];
}

/**
 * 🎲 Picks a random type of thing to add to our game
 *
 * @param {Object} config - Configuration object containing entity types
 * @returns {string} - Random entity type
 */
export function getRandomEntityType(config) {
    if (!config) {
        return null;
    }

    const types = Object.keys(config);
    if (types.length === 0) {
        return null;
    }

    return types[Math.floor(Math.random() * types.length)];
}
