/**
 * 🎮 The Boot Scene loads all our important game assets!
 *
 * Think of it like packing your backpack before a big adventure -
 * we need to make sure we have everything ready before we start playing!
 */
import { BaseScene } from './base-scene.js';

export class Bootloader extends BaseScene {
    /** @type {Phaser.GameObjects.Rectangle} */
    #progressBarBg;

    /** @type {Phaser.GameObjects.Rectangle} */
    #progressBar;

    /** @type {Phaser.GameObjects.Sprite} */
    #loadingDino;

    /** @type {boolean} */
    #isFirstPhaseComplete = false;

    // Declare private methods in class scope
    #createLoadingUI;
    #loadFonts;
    #loadSprites;
    #loadAudioFiles;
    #startSecondPhase;

    constructor() {
        super({ key: 'Bootloader' });

        // Define private methods in constructor
        this.#createLoadingUI = () => {
            const { width, height } = this.scale;
            const padding = 20; // Padding from screen edges

            // Create a smooth gradient background
            const background = this.add.graphics();
            const gradientTop = 0x0a0a2a;
            const gradientMiddle = 0x1a1a4a;
            const gradientBottom = 0x2e1f5e;

            // Create our three-colour gradient by drawing two gradients
            // First gradient: top to middle
            background.fillGradientStyle(
                gradientTop,    // Top left
                gradientTop,    // Top right
                gradientMiddle, // Bottom left
                gradientMiddle, // Bottom right
                1,  // Alpha
            );
            background.fillRect(0, 0, width, height / 2);

            // Second gradient: middle to bottom
            background.fillGradientStyle(
                gradientMiddle, // Top left
                gradientMiddle, // Top right
                gradientBottom, // Bottom left
                gradientBottom, // Bottom right
                1,  // Alpha
            );
            background.fillRect(0, height / 2, width, height / 2);

            const barWidth = width - (padding * 6.5);
            const barHeight = 10;

            // Position everything at bottom left with padding
            const baseX = padding;
            const baseY = height - padding;

            // 🦖 Add the dino
            this.#loadingDino = this.add.sprite(baseX + 30, baseY - 20, 'dino-sprites', 'idle-1');
            this.#loadingDino.setOrigin(0.5, 0.9);
            this.#loadingDino.setScale(0.8);

            // Create the idle animation if it doesn't exist
            if (!this.anims.exists('loading-idle')) {
                this.anims.create({
                    key: 'loading-idle',
                    frames: this.anims.generateFrameNames('dino-sprites', {
                        prefix: 'idle-',
                        start: 1,
                        end: 3,
                        zeroPad: 0,
                    }),
                    frameRate: 10,
                    repeat: -1,
                    yoyo: true,
                });
            }

            // Start playing the idle animation
            this.#loadingDino.anims.play('loading-idle', true);

            // Loading Text - Now we can use our custom font
            const loadingText = this.add.text(baseX + 80, baseY - 50, 'Loading...', {
                fontSize: '24px',
                fontFamily: 'grandstander-bold',
                fill: '#FFFFFF',
            });
            loadingText.setOrigin(0, 0.5);

            // Progress Bar Background
            const progressBarBg = this.add.rectangle(
                baseX + 80,
                baseY - 20,
                barWidth,
                barHeight,
            );
            progressBarBg.setOrigin(0, 0.5);
            progressBarBg.setFillStyle(0x444444, 1);
            progressBarBg.setStrokeStyle(2, 0x000000);

            this.#progressBarBg = progressBarBg;

            // Progress Bar
            const progressBar = this.add.rectangle(
                baseX + 80,
                baseY - 20,
                0, // Start with width 0
                barHeight,
            );
            progressBar.setOrigin(0, 0.5);
            progressBar.setFillStyle(0x4ab54a, 1);

            this.#progressBar = progressBar;
        };

        this.#loadSprites = () => {
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
        };

        this.#loadAudioFiles = () => {
            // Load music files
            this.load.audio('music_menu', 'src/assets/audio/music/OFDN_Eternal_Explorer.ogg');
            this.load.audio('music_game', 'src/assets/audio/music/OFDN_Victory_Party.ogg');

            // Load sfx files
            this.load.audio('sfx_countdown', 'src/assets/audio/countdown.ogg');
            this.load.audio('sfx_player_jump', 'src/assets/audio/player/jump.ogg');
            this.load.audio('sfx_player_land', 'src/assets/audio/player/land.ogg');
            this.load.audio('sfx_player_death', 'src/assets/audio/player/death.ogg');

            // Load UI files
            this.load.audio('sfx_ui_button', 'src/assets/audio/ui/button.ogg');
        };

        this.#loadFonts = () => {
            this.load.font('grandstander-thin', 'src/assets/fonts/Grandstander-Thin.ttf', 'truetype');
            this.load.font('grandstander', 'src/assets/fonts/Grandstander-Regular.ttf', 'truetype');
            this.load.font('grandstander-black', 'src/assets/fonts/Grandstander-Black.ttf', 'truetype');
        };

        this.#startSecondPhase = () => {
            // Reset the loader
            this.load.reset();

            // Set up progress tracking
            const progressBarWidth = this.#progressBarBg.width;
            this.load.on('progress', (value) => {
                this.#progressBar.width = progressBarWidth * value;
            });

            // Load remaining assets
            this.#loadSprites();
            this.#loadFonts();
            this.#loadAudioFiles();

            // Start loading and handle completion
            this.load.start();

            this.load.once('complete', () => {
                // Small delay before starting menu to ensure everything is ready
                this.time.delayedCall(500, () => {
                    this.scene.start('Menu');
                });
            });
        };
    }

    /**
     * First phase: Load essential UI assets and gradient shader
     */
    preload() {
        // Call base preload method first
        super.preload();

        // Then load essential UI assets
        this.load.atlas(
            'dino-sprites',
            'src/assets/sprites/dino.png',
            'src/assets/sprites/dino.json',
        );

        this.load.font(
            'grandstander-bold',
            'src/assets/fonts/Grandstander-Bold.ttf',
            'truetype',
        );

        // When first phase assets are loaded, create UI and start second phase
        this.load.once('complete', () => {
            this.#isFirstPhaseComplete = true;
            this.#createLoadingUI();
            this.#startSecondPhase();
        });
    }
}
