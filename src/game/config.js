/**
 * 🎮 Phaser Engine & Game Configuration
 */

import Phaser from 'phaser';
import { Bootloader } from './scenes/bootloader.js';
import { Game } from './scenes/game.js';
import { Menu } from './scenes/menu.js';

// Base dimensions for scaling calculations (16:9 aspect ratio)
export const BASE_WIDTH = 1280;
export const BASE_HEIGHT = 720;

export const gameConfig = {
    // The type of renderer (WebGL is faster and better)
    type: Phaser.AUTO,

    // The title of our game
    title: 'Dino Run',

    // The version of our game
    version: '0.4.6 (250225)',

    // Hide the Phaser logo
    banner: {
        hidePhaser: true,
    },

    // Set up the game size and scaling
    scale: {
        mode: Phaser.Scale.RESIZE,
        parent: 'game',
        fullscreenTarget: 'game',
        width: BASE_WIDTH,
        height: BASE_HEIGHT,
        expandParent: true,
        autoRound: false,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },

    // Configure the game physics
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 1400 },
            debug: false,
        },
    },

    // The scenes that make up our game in order
    scene: [
        Bootloader,
        Menu,
        Game,
    ],

    // Enable pixel art mode for crisp graphics
    render: {
        pixelArt: true,
        antialias: false,
        roundPixels: false,
        autoMobilePipeline: true,
    },
};
