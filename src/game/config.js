/**
 * 🎮 Phaser Engine & Game Configuration
 */

import Phaser from 'phaser';
import { GameScene } from './scenes/game-scene.js';

export const gameConfig = {
    // The type of renderer (WebGL is faster and better)
    type: Phaser.AUTO,

    // The title of our game
    title: 'Dino Run',

    // The version of our game
    version: '0.1.0',

    // Hide the Phaser logo
    banner: {
        hidePhaser: true,
    },

    // Set up the game size and scaling
    scale: {
        mode: Phaser.Scale.RESIZE,
        parent: 'game',
        width: '100%',
        height: '100%',
        expandParent: true,
        autoRound: true,
    },

    // Set up pixel art settings
    render: {
        pixelArt: true,
        antialias: false,
        roundPixels: true,
        autoMobilePipeline: true,
    },

    // Configure physics
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 1000 },
            debug: false,
        },
    },

    // Add our game scenes
    scene: [
        GameScene,
    ],
};
