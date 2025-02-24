/**
 * 🔊 The SoundManager handles all our game's music and sound effects!
 */
import Phaser from 'phaser';
import { GameEvents } from '../constants/game-events.js';
import { SoundConfig } from '../constants/sound-config.js';

/**
 * @typedef {import('./event-manager.js').IEventEmitter} IEventEmitter
 */

export class SoundManager {
    /** @type {Phaser.Scene} */
    #scene;

    /** @type {Phaser.Sound.BaseSound} */
    #gameMusic;

    /** @type {Phaser.Sound.BaseSound} */
    #countdownSound;

    /** @type {Phaser.Sound.BaseSound} */
    #playerJumpSound;

    /** @type {Phaser.Sound.BaseSound} */
    #playerLandSound;

    /** @type {Phaser.Sound.BaseSound} */
    #playerDeathSound;

    /** @type {boolean} */
    #isSlowMotion = false;

    /** @type {number} */
    #normalTimeScale = 1;

    /** @type {number} */
    #slowMotionTimeScale = 0.5;

    /** @type {boolean} */
    #wasPlayingBeforePause = false;

    /** @type {IEventEmitter} */
    #events;

    /** @type {number} */
    #seekPosition = 0;

    /**
     * Creates a new sound manager
     *
     * @param {Phaser.Scene} scene - The scene this system belongs to
     * @param {IEventEmitter} events - The event emitter to use
     */
    constructor(scene, events) {
        this.#scene = scene;
        this.#events = events;

        // Set up event listeners
        this.#events.on(GameEvents.SLOW_MOTION_ACTIVE, this.setSlowMotion, this);

        this.#setupSounds();
    }

    /**
     * Sets up all the game sounds and their initial properties
     *
     * @private
     */
    #setupSounds() {
        // Set up game music with looping enabled
        this.#gameMusic = this.#scene.sound.add('music_game', {
            loop: true,
            volume: 0.3,
            rate: this.#normalTimeScale,
        });

        // Set up countdown sound
        this.#countdownSound = this.#scene.sound.add('sfx_countdown', {
            loop: false,
            volume: 0.4,
            rate: this.#normalTimeScale,
        });

        // Set up player sounds
        this.#playerJumpSound = this.#scene.sound.add('sfx_player_jump', {
            loop: false,
            volume: 0.8,
            rate: this.#normalTimeScale,
        });

        this.#playerLandSound = this.#scene.sound.add('sfx_player_land', {
            loop: false,
            volume: 1,
            rate: this.#normalTimeScale,
        });

        this.#playerDeathSound = this.#scene.sound.add('sfx_player_death', {
            loop: false,
            volume: 0.4,
            rate: this.#normalTimeScale,
        });

        // Listen for music updates to store position
        this.#gameMusic.on('update', () => {
            if (this.#gameMusic.isPlaying) {
                this.#seekPosition = this.#gameMusic.seek;
            }
        });
    }

    /**
     * Starts playing the game music
     */
    playGameMusic() {
        if (!this.#gameMusic.isPlaying) {
            this.#gameMusic.play();

            // Trigger music start event
            this.#events.emit(GameEvents.MUSIC_PLAY);
        }
    }

    /**
     * Pauses the game music and remembers if it was playing
     */
    pauseGameMusic() {
        if (this.#countdownSound.isPlaying) {
            this.#countdownSound.stop();
        }

        if (this.#gameMusic.isPlaying) {
            this.#wasPlayingBeforePause = true;
            this.#seekPosition = this.#gameMusic.seek;
            this.#gameMusic.pause();

            // Trigger music pause event
            this.#events.emit(GameEvents.MUSIC_PAUSE);
        }
    }

    /**
     * Resumes the game music if it was playing before being paused
     */
    resumeGameMusic() {
        if (this.#wasPlayingBeforePause) {
            if (this.#gameMusic.isPaused) {
                this.#gameMusic.resume();
            }
            else {
                this.#gameMusic.play({ seek: this.#seekPosition });
            }

            // Trigger music resume event
            this.#events.emit(GameEvents.MUSIC_RESUME);
        }
    }

    /**
     * Plays the countdown sound
     */
    playCountdownSound() {
        if (!this.#countdownSound.isPlaying) {
            this.#countdownSound.play();
        }
    }

    /**
     * 🎚️ Plays a sound with randomised pitch variation
     *
     * @param {Phaser.Sound.BaseSound} sound - The Phaser sound object to play
     * @param {Object} pitchRange - Object containing MIN and MAX values for pitch
     * @param {Object} [config={}] - Additional sound configuration options
     * @returns {Phaser.Sound.BaseSound} The sound that was played
     */
    #playSoundWithVariation(sound, pitchRange, config = {}) {
        const playbackRate = Phaser.Math.FloatBetween(pitchRange.MIN, pitchRange.MAX);

        return sound.play({ ...config, rate: playbackRate });
    }

    /**
     * 🦘 Plays the jump sound with slight pitch variation
     */
    playPlayerJumpSound() {
        this.#playSoundWithVariation(this.#playerJumpSound, SoundConfig.JUMP_PITCH_RANGE);
    }

    /**
     * 👟 Plays the land sound with slight pitch variation
     */
    playPlayerLandSound() {
        this.#playSoundWithVariation(this.#playerLandSound, SoundConfig.LAND_PITCH_RANGE);
    }

    /**
     * Plays the player death sound effect
     */
    playPlayerDeathSound() {
        if (!this.#playerDeathSound.isPlaying) {
            this.#playerDeathSound.play();
        }
    }

    /**
     * Sets whether slow motion is active and adjusts sound pitch accordingly
     *
     * @param {boolean} isActive - Whether slow motion is active
     */
    setSlowMotion(isActive) {
        // Don't update if state hasn't changed
        if (this.#isSlowMotion === isActive) {
            return;
        }

        this.#isSlowMotion = isActive;
        const timeScale = this.#isSlowMotion ? this.#slowMotionTimeScale : this.#normalTimeScale;

        // Store current position before changing rate
        const currentSeek = this.#gameMusic.seek;

        // Update the rate of all playing sounds
        if (this.#gameMusic) {
            this.#gameMusic.rate = timeScale;
            if (this.#gameMusic.isPlaying) {
                // Restart from current position to apply new rate
                this.#gameMusic.play({ seek: currentSeek });
            }
        }
    }

    /**
     * Stops all game sounds except for the player death sound
     */
    stopAll() {
        this.#gameMusic.stop();
        this.#countdownSound.stop();
        this.#playerJumpSound.stop();
        this.#playerLandSound.stop();
        this.#wasPlayingBeforePause = false;
        this.#seekPosition = 0;

        // Trigger music stop event
        this.#events.emit(GameEvents.MUSIC_STOP);
    }
}
