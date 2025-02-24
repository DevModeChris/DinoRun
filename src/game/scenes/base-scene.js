/**
 * 🎮 BaseScene is like a template for all our game scenes!
 * It adds automatic logging for scene events.
 */
import Phaser from 'phaser';
import { logger } from '../../utils/logger.js';

export class BaseScene extends Phaser.Scene {
    /**
     * 🎮 Creates a new scene
     *
     * @param {string|Object} config - Scene configuration
     */
    constructor(config) {
        super(config);
        this.sceneName = config.key || 'UnnamedScene';
    }

    /**
     * 🎬 Called when the scene starts loading
     */
    preload() {
        logger.setContext({ scene: this.sceneName });
        logger.info('Starting to load scene assets');

        // Let the scene do its preloading
        if (super.preload) {
            super.preload();
        }
    }

    /**
     * 🎨 Called when the scene is created
     */
    create() {
        logger.info('Creating scene');

        // Let the scene do its creation
        if (super.create) {
            super.create();
        }
    }

    /**
     * 🔄 Called every frame to update the scene
     *
     * @param {number} time - Current time
     * @param {number} delta - Time since last frame
     */
    update(time, delta) {
        // Let the scene do its update
        if (super.update) {
            super.update(time, delta);
        }
    }

    /**
     * 🎭 Called when switching to a different scene
     */
    shutdown() {
        logger.info('Shutting down scene');
        logger.clearContext();

        // Let the scene do its shutdown
        if (super.shutdown) {
            super.shutdown();
        }
    }
}
