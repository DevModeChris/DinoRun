// ⭐ This is where we design all our different power-ups!
// Just like in Mario Kart or Sonic, each power-up gives a special ability:
// - Slow Motion makes everything move slower
// - Speed Boost makes you go super fast
// - Shield protects you from one hit
// And we can easily add more!

import { GAME_CONSTANTS } from '../utils/constants.js';

/**
 * @typedef {Object} PowerUpConfig
 * @property {string} className - CSS class for styling the power-up
 * @property {string} emoji - Emoji icon to display
 * @property {number} duration - How long the power-up lasts (in milliseconds)
 * @property {Object} effects - Special effects this power-up applies
 * @property {Object} position - Where the power-up appears on screen
 * @property {Function} onCollect - What happens when dino collects this power-up
 * @property {Function} onExpire - What happens when power-up wears off
 */

/**
 * 🎮 POWER_UP_TYPES defines all the different power-ups in our game
 * Each one gives the dino a special ability!
 * @type {Object.<string, PowerUpConfig>}
 */
export const POWER_UP_TYPES = {
    slowMotion: {
        className: 'slow-motion',
        emoji: '⏳',
        duration: GAME_CONSTANTS.POWER_UPS.SLOW_MOTION.DURATION,
        effects: {
            speedMultiplier: GAME_CONSTANTS.POWER_UPS.SLOW_MOTION.SPEED_MULTIPLIER,
        },
        position: {
            bottom: 100,  // Float 100px from the bottom
            useGround: false,  // Don't place on ground
        },
        onCollect: (game) => {
            game.activateSlowMotion();
            game.audioManager.play('powerup');
        },
        onExpire: (game) => {
            game.deactivateSlowMotion();
        },
    },

    speedBoost: {
        className: 'speed-boost',
        emoji: '⚡',
        duration: GAME_CONSTANTS.POWER_UPS.SPEED_BOOST.DURATION,
        effects: {
            speedMultiplier: GAME_CONSTANTS.POWER_UPS.SPEED_BOOST.SPEED_MULTIPLIER,
        },
        position: {
            bottom: 150,
            useGround: false,
        },
        onCollect: (game) => {
            game.activateSpeedBoost();
            game.audioManager.play('powerup');
        },
        onExpire: (game) => {
            game.deactivateSpeedBoost();
        },
    },
};
