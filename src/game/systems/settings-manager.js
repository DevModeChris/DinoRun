/**
 * 🎮 Manages all our game settings and saves them to localStorage!
 */
import { createEventEmitter } from './event-manager.js';
import { GameEvents } from '../constants/game-events.js';

export class SettingsManager {
    /** @type {Object} Default settings if none exist */
    static #defaultSettings = {
        audio: {
            masterVolume: 0.75,
            musicEnabled: true,
            sfxEnabled: true,
        },
        developer: {
            debugMode: false,
            loggingEnabled: false,
        },
    };

    /** @type {string} Key for our settings in localStorage */
    static #storageKey = 'dinoRunSettings';

    /** @type {IEventEmitter} Event emitter for settings changes */
    static #emitter = createEventEmitter();

    /**
     * Gets our current settings! 🎯
     *
     * @returns {Object} The current settings
     */
    static getSettings() {
        try {
            const savedSettings = localStorage.getItem(this.#storageKey);
            if (!savedSettings) {
                this.#saveSettings(this.#defaultSettings);

                return this.#defaultSettings;
            }

            return JSON.parse(savedSettings);
        }
        catch (error) {
            console.error('Failed to load settings:', error);

            return this.#defaultSettings;
        }
    }

    /**
     * Updates our settings! 🔄
     *
     * @param {string} category - Which category to update (e.g., 'audio', 'developer')
     * @param {string} setting - Which setting to update
     * @param {any} value - The new value
     */
    static updateSetting(category, setting, value) {
        try {
            const currentSettings = this.getSettings();
            if (!currentSettings[category]) {
                currentSettings[category] = {};
            }
            currentSettings[category][setting] = value;
            this.#saveSettings(currentSettings);

            // Emit specific category update
            const categoryEvent = category === 'developer'
                ? GameEvents.DEVELOPER_SETTINGS_UPDATED
                : category === 'audio'
                    ? GameEvents.AUDIO_SETTINGS_UPDATED
                    : null;

            if (categoryEvent) {
                this.#emitter.emit(categoryEvent, { [setting]: value });
            }

            // Emit general settings update
            this.#emitter.emit(GameEvents.SETTINGS_UPDATED, { category, setting, value });
        }
        catch (error) {
            console.error('Failed to update setting:', error);
        }
    }

    /**
     * Saves our settings to localStorage! 💾
     *
     * @private
     * @param {Object} settings - The settings to save
     */
    static #saveSettings(settings) {
        try {
            localStorage.setItem(this.#storageKey, JSON.stringify(settings));
        }
        catch (error) {
            console.error('Failed to save settings:', error);
        }
    }

    /**
     * Subscribe to settings changes! 📡
     *
     * @param {string} event - The event to listen for (from GameEvents)
     * @param {Function} callback - Function to call when settings change
     */
    static subscribe(event, callback) {
        this.#emitter.on(event, callback);
    }

    /**
     * Unsubscribe from settings changes! 🔕
     *
     * @param {string} event - The event to stop listening to
     * @param {Function} callback - The callback to remove
     */
    static unsubscribe(event, callback) {
        this.#emitter.off(event, callback);
    }

    /**
     * Resets our settings back to default! 🔄
     */
    static resetSettings() {
        this.#saveSettings(this.#defaultSettings);

        return this.#defaultSettings;
    }
}
