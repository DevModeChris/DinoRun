/**
 * 🎮 The Boot Scene loads all our important game assets!
 *
 * Think of it like packing your backpack before a big adventure -
 * we need to make sure we have everything ready before we start playing!
 */
import Phaser from 'phaser';

export class BootScene extends Phaser.Scene {
    constructor() {
        super('BootScene');
    }

    /**
     * Load all the assets we need for the game
     */
    preload() {
        // Load font
        this.load.font(
            'annie-use-your-telescope',
            'src/assets/fonts/AnnieUseYourTelescope-Regular.ttf',
            'truetype',
        );

        // Create a canvas for our particle system
        const particleCanvas = document.createElement('canvas');
        particleCanvas.width = 8;
        particleCanvas.height = 8;
        const ctx = particleCanvas.getContext('2d');

        // Draw a simple circle
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(4, 4, 3, 0, Math.PI * 2);
        ctx.fill();

        // Convert to base64 and load as texture
        const base64 = particleCanvas.toDataURL();
        this.textures.addBase64('particle', base64);

        // Load the UI elements spritesheet and its data
        this.load.atlas(
            'ui-elements-sprites',
            'src/assets/sprites/ui-elements.png',
            'src/assets/sprites/ui-elements.json',
        );

        // Load the ground spritesheet and its data
        this.load.atlas(
            'ground-sprites',
            'src/assets/sprites/ground.png',
            'src/assets/sprites/ground.json',
        );

        // Load the dino spritesheet and its data
        this.load.atlas(
            'dino-sprites',
            'src/assets/sprites/dino.png',
            'src/assets/sprites/dino.json',
        );

        // Load bird sprites
        this.load.spritesheet(
            'bird-sprites',
            'src/assets/sprites/bird.png',
            { frameWidth: 32, frameHeight: 32 },
        );

        // Load the small rock obstacles spritesheet and its data
        this.load.atlas(
            'obstacle-small-rocks-sprites',
            'src/assets/sprites/sml-rocks.png',
            'src/assets/sprites/sml-rocks.json',
        );
    }

    /**
     * Once everything is loaded, start the game!
     */
    create() {
        this.scene.start('GameScene');
    }
}
