/**
 * 🎮 Main Game Entry Point
 *
 * This is where our game starts its journey!
 */

import Phaser from 'phaser';
import { gameConfig } from './game/config.js';

// Create our game instance
export const game = new Phaser.Game(gameConfig);

// Track the last resize dimensions to prevent duplicate resizing
let lastWidth = 0;
let lastHeight = 0;

const onChangeScreen = () => {
    // Get the base dimensions without pixel ratio scaling
    const baseWidth = window.innerWidth;
    const baseHeight = window.innerHeight;

    // Only resize if dimensions have actually changed
    if (baseWidth === lastWidth && baseHeight === lastHeight) {
        return;
    }

    lastWidth = baseWidth;
    lastHeight = baseHeight;

    // Resize the game
    game.scale.resize(baseWidth, baseHeight);

    // Get the currently active scene
    const activeScenes = game.scene.getScenes(true);
    if (activeScenes.length > 0) {
        const currentScene = activeScenes[0];

        // Call the scene's resize method if it exists
        if (typeof currentScene.resize === 'function') {
            currentScene.resize(baseWidth, baseHeight);
        }
    }
};

// Handle screen orientation changes
const orientation = screen.orientation || screen.mozOrientation || screen.msOrientation;
if (orientation) {
    orientation.addEventListener('change', () => {
        // Add a small delay to let the browser finish orientation change
        setTimeout(onChangeScreen, 100);
    });
}

// Listen for window resize events
let resizeTimeout;
window.addEventListener('resize', () => {
    // Debounce resize events
    clearTimeout(resizeTimeout);
    resizeTimeout = setTimeout(onChangeScreen, 100);
});
