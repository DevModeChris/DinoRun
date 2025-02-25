/**
 * 📝 The Logger class helps us keep track of what's happening in our game!
 *
 * Think of it as a message box that:
 * - 🔬 Shows every tiny detail (trace mode)
 * - 🔍 Helps us find problems (debug mode)
 * - 📢 Tells us important news (info messages)
 * - ⚠️ Warns us about potential issues
 * - ❌ Lets us know when something goes wrong
 */
import { SettingsManager } from '../game/systems/settings-manager.js';
import { GameEvents } from '../game/constants/game-events.js';

export class Logger {
    /** @type {Logger} The single instance of our logger */
    static #instance;

    /** @type {boolean} Whether we're logging messages */
    #loggingEnabled;

    /** @type {boolean} Whether we're in detective mode (extra details) */
    #debugLogging;

    /** @type {Object} Different types of messages we can write */
    #logLevels;

    /** @type {Object} Current context (scene, object, etc.) */
    #context;

    /**
     * 📝 Creates a new logger instance
     *
     * @private
     */
    constructor() {
        if (Logger.#instance) {
            throw new Error('🚫 Oops! There can only be one Logger! Use Logger.getInstance() instead');
        }

        // Load settings
        const settings = SettingsManager.getSettings().developer;
        this.#debugLogging = settings.debugMode;
        this.#loggingEnabled = settings.loggingEnabled;
        this.#logLevels = {
            TRACE: '🔬 TRACE',   // Most detailed level for frequent updates
            DEBUG: '🔍 DEBUG',   // Helpful for development
            INFO: '📢 INFO',     // Important game events
            WARN: '⚠️ WARN',     // Potential issues
            ERROR: '❌ ERROR',   // Something went wrong
        };

        this.#context = {};

        // Subscribe to developer settings changes
        SettingsManager.subscribe(GameEvents.DEVELOPER_SETTINGS_UPDATED, (settings) => {
            if ('loggingEnabled' in settings) {
                this.#loggingEnabled = settings.loggingEnabled;
            }
            if ('debugMode' in settings) {
                this.#debugLogging = settings.debugMode;
            }
        });

        Logger.#instance = this;
        this.debug('[Logger] Created new logger! 📝');
    }

    /**
     * 🏭 Gets the single instance of our logger
     *
     * @returns {Logger} The logger instance
     */
    static getInstance() {
        if (!Logger.#instance) {
            Logger.#instance = new Logger();
        }

        return Logger.#instance;
    }

    /**
     * 🎯 Sets the current context for logging
     *
     * @param {Object} context - The context object (scene, object, etc.)
     */
    setContext(context) {
        this.#context = context;
    }

    /**
     * 🧹 Clears the current context
     */
    clearContext() {
        this.#context = {};
    }

    /**
     * 📝 Formats a log message with context
     *
     * @private
     * @param {string} level - The log level
     * @param {string} message - The message to format
     * @returns {string} The formatted message
     */
    #formatMessage(level, message) {
        const timestamp = new Date().toISOString();
        const levelPrefix = this.#logLevels[level];

        // Get the caller's file and line number
        const stack = new Error().stack;
        const callerLine = stack.split('\n')[3]; // 0 is Error, 1 is formatMessage, 2 is log method, 3 is caller
        const match = callerLine.match(/at (?:.*\()?(.*):(\d+):(\d+)/);
        const [, file, line] = match || ['', 'unknown', '0'];

        // Clean up the filename - remove URL parameters and get just the base name
        const fileInfo = file.split('/').pop()?.split('?')[0] ?? 'unknown';

        // Format context
        const contextStr = Object.entries(this.#context)
            .map(([key, value]) => `${key}:${value}`)
            .join(', ');

        return `${timestamp} ${levelPrefix} [${contextStr}${contextStr ? ', ' : ''}file:${fileInfo}#${line}] ${message}`;
    }

    /**
     * 🔬 Writes a trace message (only in detective mode)
     *
     * @param {string} message - The trace message
     * @param {*} [data] - Extra details to include
     */
    trace(message, data) {
        try {
            if (this.#debugLogging && this.#loggingEnabled) {
                const formattedMessage = this.#formatMessage('TRACE', message);
                console.trace(formattedMessage, data ?? '');
            }
        }
        catch (error) {
            console.error('[Logger] Failed to log trace message! 😢', {
                error: error.message,
                stack: error.stack,
                originalMessage: message,
            });

            return message; // Return original message as fallback
        }
    }

    /**
     * 🔍 Writes a debug message (only in detective mode)
     *
     * @param {string} message - The debug message
     * @param {*} [data] - Extra details to include
     */
    debug(message, data) {
        try {
            if (this.#debugLogging && this.#loggingEnabled) {
                const formattedMessage = this.#formatMessage('DEBUG', message);
                console.debug(formattedMessage, data ?? '');
            }
        }
        catch (error) {
            console.error('[Logger] Failed to log debug message! 😢', {
                error: error.message,
                stack: error.stack,
                originalMessage: message,
            });
        }
    }

    /**
     * 📢 Writes an info message
     *
     * @param {string} message - The info message
     * @param {*} [data] - Extra details to include
     */
    info(message, data) {
        try {
            if (this.#loggingEnabled) {
                const formattedMessage = this.#formatMessage('INFO', message);
                console.info(formattedMessage, data ?? '');
            }
        }
        catch (error) {
            console.error('[Logger] Failed to log info message! 😢', {
                error: error.message,
                stack: error.stack,
                originalMessage: message,
            });
        }
    }

    /**
     * ⚠️ Writes a warning message
     *
     * @param {string} message - The warning message
     * @param {*} [data] - Extra details to include
     */
    warn(message, data) {
        try {
            if (this.#loggingEnabled) {
                const formattedMessage = this.#formatMessage('WARN', message);
                console.warn(formattedMessage, data ?? '');
            }
        }
        catch (error) {
            console.error('[Logger] Failed to log warning message! 😢', {
                error: error.message,
                stack: error.stack,
                originalMessage: message,
            });
        }
    }

    /**
     * ❌ Writes an error message
     *
     * @param {string} message - The error message
     * @param {*} [data] - Extra details to include
     */
    error(message, data) {
        try {
            if (this.#loggingEnabled) {
                const formattedMessage = this.#formatMessage('ERROR', message);
                console.error(formattedMessage, data ?? '');
            }
        }
        catch (error) {
            console.error('[Logger] Failed to log error message! 😢', {
                error: error.message,
                stack: error.stack,
                originalMessage: message,
            });
        }
    }

    /**
     * 🔍 Check if we're in debug logging mode
     *
     * @returns {boolean} Whether debug logging is active
     */
    get debugLogging() {
        return this.#debugLogging;
    }
}

// Export the singleton instance getter
export const logger = Logger.getInstance();
