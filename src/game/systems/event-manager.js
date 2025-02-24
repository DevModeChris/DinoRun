/**
 * 🎯 The EventManager is like our game's central message hub!
 *
 * It helps all our game systems talk to each other in an organised way.
 */
import Phaser from 'phaser';
import { logger } from '../../utils/logger.js';

/**
 * @typedef {Object} IEventEmitter
 * @property {function(string, Function, *): void} on - Add event listener
 * @property {function(string, Function): void} off - Remove event listener
 * @property {function(string, ...any): void} emit - Emit an event
 * @property {function(string): void} removeAllListeners - Remove all listeners
 */

/**
 * Creates a new event emitter instance
 *
 * @returns {IEventEmitter} A new event emitter
 */
export function createEventEmitter() {
    return EventManager.getInstance();
}

export class EventManager {
    /** @type {EventManager} */
    static #instance = null;

    /** @type {Phaser.Events.EventEmitter} */
    #emitter;

    /** @type {Map<string, Set<Function>>} */
    #listenerMap = new Map();

    /**
     * Creates our central event management system
     *
     * @private
     */
    constructor() {
        if (EventManager.#instance) {
            throw new Error('EventManager is a singleton - use EventManager.getInstance()');
        }
        this.#emitter = new Phaser.Events.EventEmitter();
        logger.setContext({ sys: 'event-manager' });
        logger.debug('EventManager initialised');
    }

    /**
     * Gets the singleton instance of our event manager
     *
     * @returns {EventManager} The singleton instance
     */
    static getInstance() {
        if (!EventManager.#instance) {
            EventManager.#instance = new EventManager();
        }

        return EventManager.#instance;
    }

    /**
     * Adds a listener for an event
     *
     * @param {string} event - The event to listen for
     * @param {Function} fn - The function to call when the event happens
     * @param {*} context - What 'this' should be in the function
     */
    on(event, fn, context) {
        if (!this.#listenerMap.has(event)) {
            this.#listenerMap.set(event, new Set());
        }

        this.#listenerMap.get(event).add(fn);
        this.#emitter.on(event, fn, context);
        logger.debug(`Added listener for event: ${event}, total listeners: ${this.#listenerMap.get(event).size}`);
    }

    /**
     * Removes a listener for an event
     *
     * @param {string} event - The event to stop listening to
     * @param {Function} fn - The function to remove
     */
    off(event, fn) {
        const listeners = this.#listenerMap.get(event);
        if (listeners) {
            listeners.delete(fn);
            if (listeners.size === 0) {
                this.#listenerMap.delete(event);
                logger.debug(`Removed last listener for event: ${event}`);
            }
            else {
                logger.debug(`Removed listener for event: ${event}, remaining listeners: ${listeners.size}`);
            }
        }
        this.#emitter.off(event, fn);
    }

    /**
     * Emits an event with optional data
     *
     * @param {string} event - The event to trigger
     * @param {...*} args - Any data to send with the event
     */
    emit(event, ...args) {
        const listeners = this.#listenerMap.get(event);
        const listenerCount = listeners ? listeners.size : 0;
        logger.debug(`Emitting event: ${event}, listeners: ${listenerCount}, args: ${JSON.stringify(args)}`);
        this.#emitter.emit(event, ...args);
    }

    /**
     * Removes all listeners for an event
     *
     * @param {string} event - The event to clear listeners for
     */
    removeAllListeners(event) {
        if (this.#listenerMap.has(event)) {
            logger.debug(`Removing all listeners for event: ${event}`);
            this.#listenerMap.delete(event);
        }
        this.#emitter.removeAllListeners(event);
    }

    /**
     * Gets all currently registered events
     *
     * @returns {string[]} Array of event names that have listeners
     */
    getRegisteredEvents() {
        return Array.from(this.#listenerMap.keys());
    }

    /**
     * Checks if an event has any listeners
     *
     * @param {string} event - The event to check
     * @returns {boolean} True if the event has listeners
     */
    hasListeners(event) {
        return this.#listenerMap.has(event) && this.#listenerMap.get(event).size > 0;
    }
}
