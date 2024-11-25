/**
 * AudioManager handles all the sound effects in our game.
 * Playing the right sound at the right time!
 *
 * @class AudioManager
 */
export class AudioManager {
    /**
     * Initialises all the sound effects we'll need in the game
     */
    constructor() {
        // Get all our sound effects from the HTML
        this.sounds = {
            jump: document.getElementById('jump-sound'),
            gameOver: document.getElementById('game-over-sound'),
            point: document.getElementById('point-sound'),
        };

        // Keep track of when sounds were last played
        // This helps prevent sounds from playing too often
        this.lastPlayTime = {
            jump: 0,
            gameOver: 0,
            point: 0,
        };

        // Set up each sound with the right volume and settings
        Object.values(this.sounds).forEach((sound) => {
            if (sound) {
                sound.volume = 0.3; // 30% volume - not too loud!
                sound.preservesPitch = false; // Allow pitch to change with speed
            }
        });
    }

    /**
     * Plays a specific sound effect
     * @param {string} soundName - Which sound to play ('jump', 'gameOver', or 'point')
     * @param {number} playbackRate - How fast to play the sound (1 = normal, 0.5 = half speed)
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
        clone.volume = 0.3; // Keep the volume at 30%
        clone.playbackRate = playbackRate; // Set the speed
        clone.preservesPitch = false; // Let the pitch change with speed

        // Play the sound! If it fails, log the error
        clone.play().catch((e) => console.log('Error playing sound:', e));
    }
}
