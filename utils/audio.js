import { GAME_CONSTANTS } from '../utils/constants.js';

// 🎵 This is where all the fun sounds in our game come from!
// Just like in your favorite games, we need sounds for:
// - 🦘 Jumping and landing
// - ⭐ Collecting power-ups
// - 💥 Game over moments

/**
 * 🎮 AudioManager makes sure all our game sounds play at just the right time
 *
 * @class AudioManager
 */
export class AudioManager {
    /**
     * Initialises all the sound effects we'll need in the game
     */
    constructor() {
        // Get all our sound effects from the assets
        this.sounds = {
            // TODO: Replace sound effects
            jump: document.getElementById('jump-sound'),
            gameOver: document.getElementById('game-over-sound'),
            point: document.getElementById('point-sound'),
            powerUp: document.getElementById('point-sound'),
            fall: document.getElementById('jump-sound'),
        };

        // Keep track of when sounds were last played
        // This helps prevent sounds from playing too often
        this.lastPlayTime = {
            jump: 0,
            gameOver: 0,
            point: 0,
            fall: 0,
        };

        // Set initial volume for all sounds
        this.volume = GAME_CONSTANTS.AUDIO.VOLUME;
        this.setVolume(this.volume);
    }

    /**
     * 🔊 Play a sound effect
     * @param {string} soundName - Which sound to play
     * @param {number} [playbackRate=1] - How fast to play the sound (1 = normal, 0.5 = half speed)
     */
    play(soundName, playbackRate = 1) {
        const sound = this.sounds[soundName];
        if (!sound) {
            return; // If sound doesn't exist, do nothing
        }

        // Check if enough time has passed since last play
        const currentTime = Date.now();
        const cooldown = soundName === 'jump' ? 100 : 0; // 100ms cooldown for jump sound

        if (currentTime - this.lastPlayTime[soundName] < cooldown) {
            return; // Too soon to play again!
        }

        // Update when this sound was last played
        this.lastPlayTime[soundName] = currentTime;

        // Create a fresh copy of the sound to play
        const clone = sound.cloneNode();
        clone.volume = this.volume;
        clone.playbackRate = playbackRate; // Set the speed
        clone.preservesPitch = false; // Let the pitch change with speed

        // Play the sound! If it fails, log the error
        clone.play().catch((e) => console.log('Error playing sound:', e));
    }

    /**
     * 🎚️ Set the volume for all game sounds
     * @param {number} volume - Volume level from 0 to 1
     */
    setVolume(volume) {
        this.volume = volume;
        Object.values(this.sounds).forEach((sound) => {
            sound.volume = volume;
            sound.preservesPitch = false; // Allow pitch to change with speed
        });
    }
}
