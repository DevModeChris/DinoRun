/**
 * 🔊 The SoundManager handles all our game's music and sound effects!
 * It makes sure all our sounds play at the right time and volume.
 */
import Phaser from 'phaser';
import { GameEvents } from '../constants/game-events.js';
import { SoundConfig } from '../constants/sound-config.js';
import { SettingsManager } from './settings-manager.js';
import { logger } from '../../utils/logger.js';

/**
 * @typedef {import('./event-manager.js').IEventEmitter} IEventEmitter
 */

export class SoundManager {
    /** @type {Phaser.Scene} The scene this manager belongs to */
    #scene;

    /** @type {number} Master volume for all sounds */
    #masterVolume;

    /** @type {boolean} Whether music is enabled */
    #musicEnabled;

    /** @type {boolean} Whether sound effects are enabled */
    #sfxEnabled;

    /** @type {Phaser.Sound.BaseSound} Our menu music */
    #menuMusic;

    /** @type {Phaser.Sound.BaseSound} Our game music */
    #gameMusic;

    /** @type {Phaser.Sound.BaseSound} */
    #countdownSound;

    /** @type {Phaser.Sound.BaseSound} */
    #playerJumpSound;

    /** @type {Phaser.Sound.BaseSound} */
    #playerLandSound;

    /** @type {Phaser.Sound.BaseSound} */
    #playerDeathSound;

    /** @type {Phaser.Sound.BaseSound} */
    #buttonSound;

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
     * Creates our sound manager! 🎵
     *
     * @param {Phaser.Scene} scene - The scene this manager belongs to
     * @param {IEventEmitter} events - The event emitter to use
     */
    constructor(scene, events) {
        this.#scene = scene;
        this.#events = events;

        // Load settings
        const settings = SettingsManager.getSettings();
        this.#masterVolume = settings.audio.masterVolume;
        this.#musicEnabled = settings.audio.musicEnabled;
        this.#sfxEnabled = settings.audio.sfxEnabled;

        // Subscribe to audio settings changes
        SettingsManager.subscribe(GameEvents.AUDIO_SETTINGS_UPDATED, (settings) => {
            if ('musicEnabled' in settings) {
                this.#musicEnabled = settings.musicEnabled;
                this.#updateMusicState();
            }
            if ('sfxEnabled' in settings) {
                this.#sfxEnabled = settings.sfxEnabled;
            }
            if ('masterVolume' in settings) {
                this.#masterVolume = settings.masterVolume;
                this.#updateAllVolumes();
            }
        });

        // Set up event listeners
        this.#events.on(GameEvents.SLOW_MOTION_ACTIVE, this.setSlowMotion, this);

        this.#setupSounds();
    }

    /**
     * Sets up all our game sounds with their starting settings! 🎶
     *
     * @private
     */
    #setupSounds() {
        // Setup menu music with looping enabled
        this.#menuMusic = this.#scene.sound.add('music_menu', {
            loop: true,
            volume: 0.2 * this.#masterVolume,
            rate: this.#normalTimeScale,
        });

        // Setup game music with looping enabled
        this.#gameMusic = this.#scene.sound.add('music_game', {
            loop: true,
            volume: 0.3 * this.#masterVolume,
            rate: this.#normalTimeScale,
        });

        // Setup countdown sound
        this.#countdownSound = this.#scene.sound.add('sfx_countdown', {
            loop: false,
            volume: 0.4 * this.#masterVolume,
            rate: this.#normalTimeScale,
        });

        // Setup player sounds
        this.#playerJumpSound = this.#scene.sound.add('sfx_player_jump', {
            loop: false,
            volume: 0.8 * this.#masterVolume,
            rate: this.#normalTimeScale,
        });

        this.#playerLandSound = this.#scene.sound.add('sfx_player_land', {
            loop: false,
            volume: 1 * this.#masterVolume,
            rate: this.#normalTimeScale,
        });

        this.#playerDeathSound = this.#scene.sound.add('sfx_player_death', {
            loop: false,
            volume: 0.4 * this.#masterVolume,
            rate: this.#normalTimeScale,
        });

        // Setup UI sounds
        this.#buttonSound = this.#scene.sound.add('sfx_ui_button', {
            loop: false,
            volume: 0.2 * this.#masterVolume,
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
     * Updates the volume of all sounds based on their type and current settings! 🔊
     *
     * @private
     */
    #updateVolumes() {
        const musicVolume = this.#musicEnabled ? this.#masterVolume : 0;
        const sfxVolume = this.#sfxEnabled ? this.#masterVolume : 0;

        // Update music volumes
        if (this.#menuMusic) {
            this.#menuMusic.setVolume(0.2 * musicVolume);
        }
        if (this.#gameMusic) {
            this.#gameMusic.setVolume(0.3 * musicVolume);
        }

        // Update sound effect volumes
        if (this.#countdownSound) {
            this.#countdownSound.setVolume(0.4 * sfxVolume);
        }
        if (this.#playerJumpSound) {
            this.#playerJumpSound.setVolume(0.8 * sfxVolume);
        }
        if (this.#playerLandSound) {
            this.#playerLandSound.setVolume(1 * sfxVolume);
        }
        if (this.#playerDeathSound) {
            this.#playerDeathSound.setVolume(0.4 * sfxVolume);
        }

        // Update UI sound effect volumes
        if (this.#buttonSound) {
            this.#buttonSound.setVolume(0.2 * sfxVolume);
        }
    }

    /**
     * Updates the music state based on the current settings! 🎵
     *
     * @private
     */
    #updateMusicState() {
        if (this.#musicEnabled) {
            this.playMenuMusic();
        }
        else {
            this.stopMenuMusic();
            this.stopGameMusic();
        }
    }

    /**
     * Updates the volume of all sounds based on the master volume! 🎚️
     *
     * @private
     */
    #updateAllVolumes() {
        this.#updateVolumes();
    }

    /**
     * Sets the master volume for all sounds! 🎚️
     *
     * @param {number} volume - Volume level (0-1)
     */
    setMasterVolume(volume) {
        this.#masterVolume = Phaser.Math.Clamp(volume, 0, 1);
        this.#scene.sound.volume = volume;
        this.#updateVolumes();
        SettingsManager.updateSetting('audio', 'masterVolume', this.#masterVolume);
    }

    /**
     * Enables or disables music! 🎵
     *
     * @param {boolean} enabled - Whether music should be enabled
     */
    setMusicEnabled(enabled) {
        this.#musicEnabled = enabled;
        if (!enabled) {
            this.stopMenuMusic();
            this.stopGameMusic();
        }

        this.#updateVolumes();
        SettingsManager.updateSetting('audio', 'musicEnabled', enabled);
    }

    /**
     * Enables or disables sound effects! 🔊
     *
     * @param {boolean} enabled - Whether sound effects should be enabled
     */
    setSfxEnabled(enabled) {
        this.#sfxEnabled = enabled;
        this.#updateVolumes();
        SettingsManager.updateSetting('audio', 'sfxEnabled', enabled);
    }

    /**
     * Starts playing our menu music! 🎵
     */
    playMenuMusic() {
        if (!this.#menuMusic.isPlaying) {
            this.#menuMusic.play();
        }
    }

    /**
     * Stops playing our menu music! 🎵
     */
    stopMenuMusic() {
        if (this.#menuMusic?.isPlaying) {
            this.#menuMusic.stop();
        }
    }

    /**
     * Starts playing our game music! 🎵
     */
    playGameMusic() {
        if (this.#menuMusic?.isPlaying) {
            this.#menuMusic.stop();
        }

        if (!this.#gameMusic.isPlaying) {
            this.#gameMusic.play();

            // Trigger music start event
            this.#events.emit(GameEvents.MUSIC_PLAY);
        }
    }

    /**
     * Stops playing our game music! 🎵
     */
    stopGameMusic() {
        if (this.#gameMusic?.isPlaying) {
            this.#gameMusic.stop();
        }
    }

    /**
     * Pauses the game music and remembers if it was playing! ⏸️
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
     * Resumes the game music if it was playing before! ▶️
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
     * Plays the countdown sound! ⏰
     */
    playCountdownSound() {
        if (!this.#countdownSound.isPlaying) {
            this.#countdownSound.play();
        }
    }

    /**
     * Plays the button sound!
     */
    playButtonSound() {
        this.#buttonSound.play();
    }

    /**
     * Plays a sound with random pitch variation to make it more interesting! 🎚️
     *
     * @param {Phaser.Sound.BaseSound} sound - The Phaser sound object to play
     * @param {Object} pitchRange - Object containing MIN and MAX values for pitch
     * @param {Object} [config={}] - Additional sound configuration options
     * @returns {Phaser.Sound.BaseSound} The sound that was played
     * @private
     */
    #playSoundWithVariation(sound, pitchRange, config = {}) {
        const playbackRate = Phaser.Math.FloatBetween(pitchRange.MIN, pitchRange.MAX);

        return sound.play({ ...config, rate: playbackRate });
    }

    /**
     * Makes our dino's jump sound! 🦖
     */
    playPlayerJumpSound() {
        this.#playSoundWithVariation(this.#playerJumpSound, SoundConfig.JUMP_PITCH_RANGE);
    }

    /**
     * Makes our dino's landing sound! 👟
     */
    playPlayerLandSound() {
        this.#playSoundWithVariation(this.#playerLandSound, SoundConfig.LAND_PITCH_RANGE);
    }

    /**
     * Plays the sad sound when our dino gets hurt! 😢
     */
    playPlayerDeathSound() {
        if (!this.#playerDeathSound.isPlaying) {
            this.#playerDeathSound.play();
        }
    }

    /**
     * Makes all sounds play slower or faster for cool effects! ⏱️
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
     * Stops all game sounds except for the player death sound! 🔇
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

    /**
     * Cleans up all our sounds when we're done! 🧹
     */
    destroy() {
        try {
            // Stop and clean up all sounds
            const sounds = [
                this.#menuMusic,
                this.#gameMusic,
                this.#countdownSound,
                this.#playerJumpSound,
                this.#playerLandSound,
                this.#playerDeathSound,
            ];

            for (const sound of sounds) {
                if (sound) {
                    try {
                        // First try to stop the sound
                        sound.stop();
                    }
                    catch (error) {
                        logger.warn('Failed to stop sound:', error);
                    }
                }
            }

            // Clean up event listeners
            if (this.#events) {
                this.#events.off(GameEvents.SLOW_MOTION_ACTIVE, this.setSlowMotion, this);
                this.#events = null;
            }

            // Clear all sound references
            this.#menuMusic = null;
            this.#gameMusic = null;
            this.#countdownSound = null;
            this.#playerJumpSound = null;
            this.#playerLandSound = null;
            this.#playerDeathSound = null;

            // Clear scene reference
            this.#scene = null;

            logger.debug('🔊 Sound manager cleaned up successfully');
        }
        catch (error) {
            logger.error('Failed to clean up sound manager:', error);
        }
    }
}
