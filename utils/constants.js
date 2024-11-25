/**
 * GAME_CONSTANTS holds all the numbers that control how our game behaves.
 * By keeping them all in one place, it's easy to adjust them and see how they change the game!
 */
export const GAME_CONSTANTS = {
    // Physics controls how things move in our game
    PHYSICS: {
        GRAVITY: 0.9, // How strongly gravity pulls the player down
        JUMP_STRENGTH: 15, // How high the player jumps
        MAX_JUMP_STRENGTH: 20, // Maximum jump height when holding space
        JUMP_BOOST_SPEED: 0.4, // How much extra boost holding space gives
        MAX_BOOST_TIME: 260, // How long you can boost a jump
    },

    // Game speed controls how fast everything moves
    GAME_SPEED: {
        INITIAL: 3.5, // Starting speed of the game
        MAX: 7, // Fastest the game can go
        ACCELERATION: 0.001, // How quickly the game speeds up
    },

    // Power-ups are special items that help the player
    POWER_UPS: {
        SLOW_MOTION: {
            DURATION: 5000, // How long slow motion lasts (in milliseconds)
            SPEED_MULTIPLIER: 0.5, // How much slower everything moves (0.5 = half speed)
        },
        MIN_INTERVAL: 10000, // Minimum time between power-ups
        MAX_INTERVAL: 20000, // Maximum time between power-ups
    },

    // Obstacle settings control how often obstacles appear
    OBSTACLE: {
        MIN_INTERVAL: 2000, // Minimum time between obstacles
        MAX_INTERVAL: 4000, // Maximum time between obstacles
    },
};
