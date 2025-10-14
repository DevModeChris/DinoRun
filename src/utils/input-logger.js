/**
 * 🎮 InputLogger helps us track all the ways players interact with our game!
 */
import { logger } from './logger.js';

export class InputLogger {
    /**
     * 🎮 Creates a new input logger
     *
     * @param {Phaser.Scene} scene - The scene this input logger belongs to
     * @param {string} objectName - Name of the game object being tracked
     */
    constructor(scene, objectName) {
        // Set up context for all input logs
        logger.setContext({
            scene: scene.scene.key,
            obj: objectName,
            sys: 'input',
        });
    }

    /**
     * ⌨️ Log a keyboard input event
     *
     * @param {Object} event - The keyboard event data
     */
    logKeyboard(event) {
        logger.debug('Keyboard input', {
            key: event.key,
            code: event.keyCode,
            repeat: event.repeat,
            action: event.action,
            type: event.type,
        });
    }

    /**
     * 🖱️ Log a pointer input event
     *
     * @param {Object} event - The pointer event data
     */
    logPointer(event) {
        logger.debug('Pointer input', {
            x: Math.round(event.x),
            y: Math.round(event.y),
            button: event.button,
            isDown: event.isDown,
            action: event.action,
        });
    }

    /**
     * 🎮 Log a gamepad input event
     *
     * @param {Object} event - The gamepad event data
     */
    logGamepad(event) {
        logger.debug('Gamepad input', {
            pad: event.pad,
            button: event.button,
        });
    }

    /**
     * 🧹 Cleans up the input logger
     */
    destroy() {
        logger.clearContext();
    }
}
