/**
 * 🎮 Welcome to the Game Settings!
 * This is like the control panel of our game where we can adjust everything:
 * - 🏃 How fast things move
 * - 🦘 How high our dino can jump
 * - ⭐ How powerful the power-ups are
 * - 🎵 How the sounds work
 * Think of it like adjusting the settings in Minecraft or Roblox!
 */

/**
 * 🎯 GAME_CONSTANTS holds all the special numbers that make our game work
 * It's like a recipe book that tells us exactly how everything should behave
 */
export const GAME_CONSTANTS = {
    // 🏃 Game Speed Settings - How fast everything moves
    GAME_SPEED: {
        INITIAL: 5,          // How fast we start (like level 1)
        MAX: 12,            // Top speed (like max level)
        ACCELERATION: 0.005, // How quickly we speed up (like leveling up)
    },

    // 🌍 Physics - How things move in our game world
    PHYSICS: {
        GRAVITY: 1200,           // How strongly gravity pulls down (bigger = harder jumps)
        INITIAL_JUMP_SPEED: 400, // Starting speed when jump begins
        JUMP_BOOST_SPEED: 1200,  // Extra power when holding jump button
        MAX_BOOST_TIME: 250,     // How long you can boost a jump (in milliseconds)
    },

    // ⭐ Power-Up Settings - Special abilities that make the game extra fun!
    POWER_UPS: {
        MIN_INTERVAL: 20000,         // Wait at least 20 second between power-ups
        MAX_INTERVAL: 40000,         // Wait at most 40 seconds between power-ups
        SPAWN_CHANCE: 0.2,           // 20% chance to spawn when interval is met

        // ⏳ Slow Motion Power-Up - Makes everything move in slow-mo, like in The Matrix!
        SLOW_MOTION: {
            DURATION: 5000,           // How long it lasts (5 seconds)
            SPEED_MULTIPLIER: 0.5,    // How much slower everything moves
        },

        // ⚡ Speed Boost Power-Up - Makes everything move faster!
        SPEED_BOOST: {
            DURATION: 3000,           // How long it lasts (3 seconds)
            SPEED_MULTIPLIER: 1.2,    // How much faster everything moves
        },
    },

    // 🚧 Obstacle Settings
    OBSTACLE: {
        MIN_INTERVAL: 1500,   // Minimum time between obstacles (1.5 seconds)
        MAX_INTERVAL: 4000,   // Maximum time between obstacles (4 seconds)
        SPAWN_CHANCE: 0.6,    // 60% chance to spawn when allowed
    },

    // 🐦 Moving Creature (Mob) Settings
    MOB: {
        MIN_INTERVAL: 3000,   // Minimum time between mobs (3 seconds)
        MAX_INTERVAL: 6000,   // Maximum time between mobs (6 seconds)
        SPAWN_CHANCE: 0.3,    // 30% chance to spawn when allowed
    },

    // 🎵 Sound Settings - All the fun noises in our game!
    AUDIO: {
        VOLUME: 0.3,                // How loud the sounds are (0 = quiet, 1 = loud)
    },
};
