/**
 * 🎮 The main game scene where all the dino action happens!
 *
 * This is like the stage where our dino performs - it controls
 * everything you see and do in the main game.
 */
import Phaser from 'phaser';
import { BaseScene } from './base-scene.js';
import { Ground } from '../objects/ground.js';
import { Dino } from '../objects/dino.js';
import { Bird } from '../objects/bird.js';
import { SmallRock } from '../objects/small-rock.js';
import { SkySystem } from '../systems/sky-system.js';
import { ScoreManager } from '../systems/score-manager.js';
import { DifficultyManager } from '../systems/difficulty-manager.js';
import { CameraManager } from '../systems/camera-manager.js';
import { CountdownSystem } from '../systems/countdown-system.js';
import { SoundManager } from '../systems/sound-manager.js';
import { SettingsManager } from '../systems/settings-manager.js';
import { checkIfMobile } from '../../utils/helpers.js';
import { logger } from '../../utils/logger.js';
import { createEventEmitter } from '../systems/event-manager.js';
import { GameEvents } from '../constants/game-events.js';
import {
    gameConfig,
    BASE_WIDTH,
    BASE_HEIGHT,
} from '../config.js';

export class Game extends BaseScene {
    /** @type {boolean} */
    #isGameOver = false;

    /** @type {boolean} */
    #isPaused = false;

    /** @type {Ground} */
    #ground;

    /** @type {Dino} */
    #dino;

    /** @type {SkySystem} */
    #skySystem;

    /** @type {ScoreManager} */
    #scoreManager;

    /** @type {DifficultyManager} */
    #difficultyManager;

    /** @type {CameraManager} */
    #cameraManager;

    /** @type {CountdownSystem} */
    #countdownSystem;

    /** @type {SoundManager} */
    #soundManager;

    /** @type {Phaser.GameObjects.Rectangle} */
    #platform;

    /** @type {Phaser.GameObjects.Group} */
    #enemies;

    /** @type {Map<string, Phaser.Time.TimerEvent>} */
    #spawnTimers = new Map();

    /** @type {Object.<string, number>} */
    #lastSpawnTimes = {};

    /** @type {Phaser.GameObjects.Text} */
    #debugText;

    /** @type {Phaser.Input.Keyboard.Key} */
    #debugKey;

    /** @type {boolean} */
    #debugKeyPressed = false;

    /** @type {boolean} */
    #debugMode = false;

    /** @type {number} */
    #dinoX = 100;

    /** @type {number} */
    #groundY = 0;

    /** @type {number} */
    #groundCollisionHeight = Ground.COLLISION_HEIGHT;

    /** @type {Phaser.GameObjects.Container} */
    #gameOverOverlay;

    /** @type {Phaser.GameObjects.Particles.ParticleEmitterManager} */
    #highScoreEmitter;

    /** @type {boolean} */
    #isMobile = false;

    /** @type {Phaser.GameObjects.Sprite} */
    #pauseButton;

    /** @type {Phaser.GameObjects.Container} */
    #pauseOverlay;

    /** @type {Phaser.GameObjects.Text} */
    #pauseHeader;

    /** @type {Phaser.Input.Keyboard.Key} */
    #pauseKey;

    /** @type {boolean} */
    #pauseKeyPressed = false;

    /** @type {Phaser.GameObjects.Sprite} */
    #fullscreenButton;

    /** @type {boolean} */
    #isFullscreen = false;

    /** @type {boolean} */
    #isGameStarted = false;

    /**
     * Creates our main game scene! 🎮
     */
    constructor() {
        super({ key: 'Game' });

        // Load initial detective mode setting 🔍
        this.#updateDebugMode(SettingsManager.getSettings().developer.debugMode);

        // 🔍 Listen for when someone turns detective mode on or off
        SettingsManager.subscribe(GameEvents.DEVELOPER_SETTINGS_UPDATED, (settings) => {
            try {
                if ('debugMode' in settings) {
                    this.#updateDebugMode(settings.debugMode);
                    logger.debug(`Detective mode ${this.#debugMode ? 'activated' : 'deactivated'} 🔍`);
                }
            }
            catch (error) {
                logger.error('Oops! Something went wrong with detective mode:', error);
            }
        });
    }

    /**
     * Clean up any active timers and events
     */
    shutdown() {
        // Clean up all spawn timers
        for (const timer of this.#spawnTimers.values()) {
            timer.destroy();
        }
        this.#spawnTimers.clear();
        this.#lastSpawnTimes = {};

        // Destroy any active particle managers
        const particleManagers = this.add.particles.list;
        if (particleManagers) {
            particleManagers.forEach((manager) => {
                manager.destroy();
            });
        }

        // Properly destroy the sky system
        if (this.#skySystem) {
            this.#skySystem.destroy();
            this.#skySystem = null;
        }

        // Stop any active countdown
        if (this.#countdownSystem) {
            this.#countdownSystem.stopCountdown();
            this.#countdownSystem = null;
        }

        // Clean up debug graphics
        if (this.physics?.world?.debugGraphic) {
            this.physics.world.debugGraphic.destroy();
        }

        // Reset game state
        this.#isGameOver = false;
        this.#isPaused = false;
        this.#isGameStarted = false;
        this.anims.globalTimeScale = 1;

        // Reset all managers
        if (this.#scoreManager) {
            this.#scoreManager.reset();
        }
        if (this.#difficultyManager) {
            this.#difficultyManager.reset();
        }

        // Stop all running timers and tweens
        this.time.removeAllEvents();
        this.tweens.killAll();

        // Call parent shutdown
        super.shutdown();
    }

    /**
     * Creates all the game objects and sets up the game
     */
    create() {
        // Call base class method first
        super.create();

        const { width, height } = this.scale;
        const events = createEventEmitter();

        // Make sure we clean up properly when the scene shuts down
        this.events.once('shutdown', this.shutdown, this);

        // Create camera manager before other game objects
        this.#cameraManager = new CameraManager(this, events);

        // Check if we're on mobile
        this.#isMobile = checkIfMobile();

        // Create sky system first so it's behind everything
        this.#skySystem = new SkySystem(this);

        // Create the visual scrolling ground
        this.#ground = new Ground(this, 0, 'ground-sprites', 'purpleGrass');
        this.#ground.setScrollSpeed(0); // Start with ground not moving

        // Create the invisible platform for physics
        this.#platform = this.add.rectangle(0, 0, width, this.#groundCollisionHeight);
        this.physics.add.existing(this.#platform, true);

        // Initialise managers before creating game objects
        this.#soundManager = new SoundManager(this, events);
        this.#countdownSystem = new CountdownSystem(this, events);

        // Create dino at initial position and start with idle animation
        this.#dino = new Dino(this, 0, 0, events);

        // Set up countdown event handlers using shared event emitter
        events.on(GameEvents.COUNTDOWN_START, () => {
            // Disable controls and reset game state at start of countdown
            this.#dino.setControlsEnabled(false);
            this.#isGameStarted = false;
            this.#soundManager.pauseGameMusic();
            this.#soundManager.playCountdownSound();
        });

        events.on(GameEvents.COUNTDOWN_COMPLETE, () => {
            // Enable controls and start game when countdown completes
            this.#isGameStarted = true;
            this.#dino.setControlsEnabled(true);
            this.#dino.play('dino-run');
            this.#ground.setScrollSpeed(this.#difficultyManager.getCurrentSpeed());
            this.#soundManager.playGameMusic();
        });

        // Make the dino collide with the platform
        this.physics.add.collider(this.#dino, this.#platform);

        // Create difficulty manager
        this.#difficultyManager = new DifficultyManager(this);

        // Create enemy group with physics
        this.#enemies = this.add.group({
            classType: Phaser.GameObjects.Sprite,
            runChildUpdate: true,
        });

        // Initialise score display
        this.#scoreManager = new ScoreManager(this, 0, 0);

        // Create debug text (hidden initially)
        this.#createDebugText();

        // Create buttons UI
        this.#createButtonsUI();
        this.#createPauseOverlay();
        this.#createGameOverOverlay(0, 0, false);

        // Register with the camera manager as a game element
        this.#cameraManager.registerGameElement(this.#dino);
        this.#cameraManager.registerGameElement(this.#ground);
        this.#cameraManager.registerGameElement(this.#platform);

        // Register sky system components
        if (this.#skySystem) {
            const skyElements = this.#skySystem.getSkyElements();
            skyElements.forEach((element) => {
                this.#cameraManager.registerGameElement(element);
            });
        }

        // Set up collision detection
        this.physics.add.overlap(
            this.#dino,
            this.#enemies,
            this.#handleEnemyCollision,
            null,
            this,
        );

        // Calculate initial positions with proper scale
        const isPortrait = height > width;
        const scale = isPortrait
            ? Math.max(width / BASE_WIDTH, 0.85)
            : this.#isMobile
                ? Math.max(height / (BASE_HEIGHT / 2), 0.85)
                : Math.min(width / BASE_WIDTH, height / BASE_HEIGHT);

        // Add all UI elements to the UI camera
        this.#addUIElementsToCamera();

        this.#calculatePositions(width, height, scale);

        // Make the main camera follow the dino
        this.#cameraManager.cameraFollow(this.#dino);

        // Set up debug controls
        const keys = this.input.keyboard.addKeys('TAB,P');
        this.#debugKey = keys.TAB;
        this.#pauseKey = keys.P;

        // Enable debug graphics
        this.physics.world.createDebugGraphic();
        const debugGraphic = this.physics.world.debugGraphic;
        debugGraphic.visible = this.#debugMode;

        // Register debug graphics with main camera only
        if (debugGraphic) {
            this.#cameraManager.registerGameElement(debugGraphic);
        }

        // Start the game with countdown
        this.#startGameWithCountdown();

        // Make sure debug mode is properly initialized
        this.#updateDebugMode(this.#debugMode);
    }

    /**
     * Creates a menu button with consistent styling
     *
     * @param {string} text - The button text
     * @param {number} width - Fixed width for the button
     * @returns {Phaser.GameObjects.Text} The created button
     */
    #createMenuButton(text, width) {
        const button = this.add.text(
            0,
            0,
            text,
            {
                fontFamily: 'grandstander',
                fontSize: '26px',
                color: '#ffffff',
                align: 'center',
                backgroundColor: '#222222',
                padding: { x: 20, y: 10 },
                fixedWidth: width,
            },
        )
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => button.setBackgroundColor('#4a4a4a'))
            .on('pointerout', () => button.setBackgroundColor('#222222'));

        return button;
    }

    /**
     * Creates the pause overlay with resume button and version info
     */
    #createPauseOverlay() {
        const { width, height } = this.scale;

        // Create a semi-transparent black overlay
        this.#pauseOverlay = this.add.container(0, 0)
            .setScrollFactor(0)
            .setDepth(900)
            .setVisible(false);

        // Add semi-transparent background
        const background = this.add.rectangle(
            0,
            0,
            width,
            height,
            0x000000,
            0.5,
        )
            .setOrigin(0, 0)
            .setInteractive(); // Block input when paused

        // Add Paused header text
        this.#pauseHeader = this.add.text(
            0,
            0,
            'Paused',
            {
                fontFamily: 'grandstander-bold',
                fontSize: '46px',
                color: '#ffffff',
                align: 'center',
                stroke: '#000000',
                strokeThickness: 5,
            },
        )
            .setOrigin(0.5);

        // Create temporary buttons to measure their widths
        const tempContinue = this.add.text(
            0,
            0,
            'Continue',
            {
                fontFamily: 'grandstander',
                fontSize: '26px',
                padding: { x: 20, y: 10 },
            },
        );

        const tempRestart = this.add.text(
            0,
            0,
            'Restart',
            {
                fontFamily: 'grandstander',
                fontSize: '26px',
                padding: { x: 20, y: 10 },
            },
        );

        const tempReturnToMenu = this.add.text(
            0,
            0,
            'Return to Menu',
            {
                fontFamily: 'grandstander',
                fontSize: '26px',
                padding: { x: 20, y: 10 },
            },
        );

        // Calculate the maximum width needed
        const maxButtonWidth = Math.max(tempContinue.width, tempRestart.width, tempReturnToMenu.width);

        // Destroy temporary text objects
        tempContinue.destroy();
        tempRestart.destroy();
        tempReturnToMenu.destroy();

        // Create the actual buttons with consistent width
        const continueButton = this.#createMenuButton('Continue', maxButtonWidth);
        continueButton.on('pointerup', () => {
            this.#soundManager.playButtonSound();
            this.#togglePause();
        });

        const restartButton = this.#createMenuButton('Restart', maxButtonWidth);
        restartButton.on('pointerup', () => {
            this.#soundManager.playButtonSound();
            this.#restartGame();
        });

        const returnToMenuButton = this.#createMenuButton('Return to Menu', maxButtonWidth);
        returnToMenuButton.on('pointerup', () => {
            this.#soundManager.playButtonSound();
            this.#returnToMenu();
        });

        // Version text
        const versionText = this.add.text(
            0,
            0,
            `Version: ${gameConfig.version}`,
            {
                fontFamily: 'grandstander-thin',
                fontSize: '20px',
                color: '#ffffff',
            },
        ).setOrigin(0.5);

        // Add all elements to the container
        this.#pauseOverlay.add([
            background,
            this.#pauseHeader,
            continueButton,
            restartButton,
            returnToMenuButton,
            versionText,
        ]);
    }

    /**
     * Handle scene resizing
     *
     * @param {number} width - New game width
     * @param {number} height - New game height
     */
    resize(width, height) {
        // Recheck mobile status
        this.#isMobile = checkIfMobile();

        // Update camera and physics world bounds
        this.cameras.main.setBounds(0, 0, width, height);
        this.physics.world.setBounds(0, 0, width, height);

        // Determine if we're in portrait mode
        const isPortrait = height > width;

        // Calculate scale based on orientation and device type
        let scale;
        if (isPortrait) {
            // In portrait, use width-based scale but ensure it's not too small
            scale = Math.max(width / BASE_WIDTH, 0.85);
        }
        else {
            // Handle mobile and desktop differently in landscape mode
            scale = this.#isMobile
                ? Math.max(height / (BASE_HEIGHT / 2), 0.85)  // Mobile: height-based scale with higher minimum
                : Math.min(width / BASE_WIDTH, height / BASE_HEIGHT);  // Desktop: smaller ratio to prevent oversizing
        }

        // Update all positions and scales
        this.#calculatePositions(width, height, scale);
    }

    /**
     * Calculates positions for game objects based on current screen size
     *
     * @param {number} width - Current game width
     * @param {number} height - Current game height
     * @param {number} [scale=1] - Scale factor for sizing objects
     */
    #calculatePositions(width, height, scale = 1) {
        // Get camera padding if available
        const padding = this.#cameraManager?.cameraPadding || { x: 0, y: 0 };

        // Calculate ground dimensions first - these are our reference points
        const groundHeight = Math.ceil(Ground.HEIGHT * scale);
        const groundCollisionHeight = Math.ceil(Ground.COLLISION_HEIGHT * scale);

        // Calculate ground positions from bottom of screen
        const groundY = height;
        const groundTopY = groundY - groundHeight;
        const groundCollisionY = groundY - groundCollisionHeight;

        // Cache these values for other calculations
        this.#groundY = groundTopY;
        this.#groundCollisionHeight = groundCollisionHeight;

        // Update ground - extend width to cover padded area
        if (this.#ground) {
            this.#ground.setScale(scale);
            this.#ground.y = groundY;

            // Make ground wider than camera bounds to prevent edges showing
            this.#ground.width = width + (padding.x * 4); // Extra wide to account for scrolling
            this.#ground.x = -padding.x * 2; // Center the extra width
        }

        // Update platform - extend width to cover padded area
        if (this.#platform && this.#platform.body) {
            const platformY = groundCollisionY + (groundCollisionHeight / 2);
            const platformWidth = width + (padding.x * 2); // Match camera bounds

            this.#platform.setPosition(Math.ceil(width / 2), platformY);
            this.#platform.width = platformWidth;

            // Update platform physics body
            /** @type {Phaser.Physics.Arcade.StaticBody} */
            const body = this.#platform.body;
            body.setSize(platformWidth, groundCollisionHeight);
            body.updateFromGameObject();
        }

        // Update dino position
        if (this.#dino) {
            // Set dino X position (fixed distance from left)
            this.#dinoX = Math.ceil(100 * scale);

            // Calculate dino's position relative to platform
            const hitboxOffset = Math.ceil((Dino.HEIGHT - Dino.STANDING_HITBOX_HEIGHT) * scale);

            // Position dino so its hitbox aligns with ground collision
            // Since origin is at bottom (1), we need to account for the hitbox offset
            const dinoY = groundCollisionY - hitboxOffset;

            // Update dino position and scale
            this.#dino.setScale(scale);
            this.#dino.setPosition(this.#dinoX, dinoY);

            // Reset physics body to match new position
            this.#dino.body.reset(this.#dinoX, dinoY);
        }

        // Update enemy positions and scale
        if (this.#enemies) {
            this.#enemies.getChildren().forEach((enemy) => {
                enemy.setScale(scale);
            });
        }

        // Update UI elements
        this.#updateUIPositioning(width, height, scale);
    }

    /**
     * Updates the position and scale of UI elements
     *
     * @param {number} width - Current game width
     * @param {number} height - Current game height
     * @param {number} [scale=1] - Scale factor for sizing objects
     */
    #updateUIPositioning(width, height, scale = 1) {
        const basePadding = 20;
        const scaledPadding = basePadding * scale;

        // Position score display at top-right corner
        if (this.#scoreManager) {
            this.#scoreManager.updatePosition(width - basePadding, basePadding, scale);
        }

        // Position pause button in top left with padding
        if (this.#pauseButton) {
            this.#pauseButton
                .setPosition(scaledPadding, scaledPadding)
                .setScale(scale);
        }

        // Position fullscreen button in top-left corner, next to pause
        if (this.#fullscreenButton) {
            this.#fullscreenButton
                .setPosition(scaledPadding * 3.5, scaledPadding)
                .setScale(scale);
        }

        // Update game over overlay
        if (this.#gameOverOverlay) {
            const background = this.#gameOverOverlay.list[0];
            background.setSize(width, height);

            const gameOverHeader = this.#gameOverOverlay.list[1];
            gameOverHeader.setPosition(width / 2, height * 0.25);

            const scoreText = this.#gameOverOverlay.list[2];
            scoreText.setPosition(width / 2, gameOverHeader.y + 60);

            const restartButton = this.#gameOverOverlay.list[3];
            restartButton.setPosition(width / 2, scoreText.y + 80);

            const returnToMenuButton = this.#gameOverOverlay.list[4];
            returnToMenuButton.setPosition(width / 2, restartButton.y + 60);
        }

        // Update pause overlay if it exists
        if (this.#pauseOverlay) {
            const pauseMenuButtonPadding = 16;

            // Update background
            const background = this.#pauseOverlay.list[0];
            background.setSize(width, height);

            // Update pause header
            const pauseHeader = this.#pauseOverlay.list[1];
            pauseHeader.setPosition(width / 2, height * 0.25);

            // Update continue button
            const continueButton = this.#pauseOverlay.list[2];
            continueButton.setPosition(width / 2, height * 0.45);

            // Update restart button
            const restartButton = this.#pauseOverlay.list[3];
            restartButton.setPosition(width / 2, (height * 0.55) + pauseMenuButtonPadding);

            // Update return to menu button
            const returnToMenuButton = this.#pauseOverlay.list[4];
            returnToMenuButton.setPosition(width / 2, (height * 0.65) + (pauseMenuButtonPadding * 2));

            // Update version text
            const versionText = this.#pauseOverlay.list[5];
            versionText.setPosition(width / 2, height - 30);

            // Center the pause menu
            this.#pauseOverlay.setPosition(0, 0);
        }
    }

    /**
     * Like organizing all our HUD elements! 📊
     */
    #addUIElementsToCamera() {
        // Create an array of all UI elements
        const uiElements = [
            this.#scoreManager.getScoreTextElms(),
            this.#gameOverOverlay,
            this.#debugText,
            this.#pauseOverlay,
            this.#pauseHeader,
            this.#pauseButton,
            this.#fullscreenButton,
            this.#countdownSystem.getCountdownContainer(),
        ].filter(Boolean); // Remove any null/undefined elements

        // Add each UI element to the UI camera if it exists
        uiElements.forEach((element) => {
            if (element) {
                if (element instanceof Phaser.GameObjects.Container) {
                    // For containers like pauseOverlay, add all its children
                    element.getAll().forEach((child) => {
                        this.#cameraManager.registerUIElement(child);
                    });
                }

                this.#cameraManager.registerUIElement(element);
            }
        });

        // Add mobile controls if they exist
        if (this.#dino) {
            const mobileControls = this.#dino.getMobileControls();
            if (mobileControls) {
                this.#cameraManager.registerUIElement(mobileControls);
            }
        }
    }

    /**
     * Creates debug text display (hidden initially)
     */
    #createDebugText() {
        const padding = 4;
        const buffer = 4;

        // Create debug textarea
        this.#debugText = this.add.text(16, 86, '', {
            fontFamily: 'monospace',
            fontSize: '13px',
            fill: '#ffffff',
            padding: { x: padding, y: padding },
            resolution: 3,        // Increased resolution for sharper text
            antialias: false,     // Disable antialiasing for crisp pixels
        })
            .setScrollFactor(0)
            .setDepth(1000)
            .setVisible(false);

        // Create background for dynamic sizing
        this.#debugText.background = this.add.rectangle(
            16 - padding - buffer,
            86 - padding - buffer,
            0, // Initial width will be set dynamically
            0, // Initial height will be set dynamically
            0x000000,
            0.4,
        )
            .setOrigin(0, 0)
            .setScrollFactor(0)
            .setDepth(999)
            .setVisible(false);

        // Add a method to dynamically resize the background
        this.#debugText.resizeBackground = () => {
            this.#debugText.background.width = this.#debugText.width + (padding * 2) + (buffer * 2);
            this.#debugText.background.height = this.#debugText.height + (padding * 2) + (buffer * 2);
        };

        // Register debug text with UI camera
        this.#cameraManager.registerUIElement(this.#debugText);
        this.#cameraManager.registerUIElement(this.#debugText.background);
    }

    /**
     * Updates debug text with current game state
     */
    #updateDebugText() {
        if (!this.#debugText || !this.#debugMode) {
            return;
        }

        const timeOfDay = this.#skySystem.getTimeOfDay();
        const hours = Math.floor(timeOfDay * 24);
        const minutes = Math.floor((timeOfDay * 24 * 60) % 60);

        const debugInfo = [
            `FPS: ${Math.round(this.game.loop.actualFps)}`,
            `Time: ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`,
            `Level: ${this.#difficultyManager.getCurrentLevel()}/${this.#difficultyManager.getMaxLevel()} (s: ${this.#difficultyManager.getCurrentSpeed()})`,
            `Enemies: ${this.#enemies.getLength()}`,
        ].join('\n');

        this.#debugText.setText(debugInfo);
        this.#debugText.resizeBackground();
    }

    /**
     * Creates the game over overlay
     *
     * @param {number} finalScore - The final score achieved
     * @param {number} highScore - The current high score
     * @param {boolean} beatHighScore - Whether the high score was beaten
     */
    #createGameOverOverlay(finalScore, highScore, beatHighScore) {
        const { width, height } = this.scale;

        // Create a semi-transparent black overlay
        this.#gameOverOverlay = this.add.container(0, 0)
            .setScrollFactor(0)
            .setDepth(900)
            .setVisible(false);

        // Add semi-transparent background
        const background = this.add.rectangle(
            0,
            0,
            width,
            height,
            0x000000,
            0.5,
        )
            .setOrigin(0, 0)
            .setInteractive(); // Block input

        // Add background to container first (bottom layer)
        this.#gameOverOverlay.add(background);

        // Add Game Over header text
        const gameOverHeader = this.add.text(
            width / 2,
            height * 0.10,
            'GAME OVER',
            {
                fontFamily: 'grandstander-bold',
                fontSize: '52px',
                color: '#ffffff',
                align: 'center',
                stroke: '#000000',
                strokeThickness: 5,
            },
        ).setOrigin(0.5);

        // Add score text
        const scoreText = this.add.text(
            width / 2,
            gameOverHeader.y + 60,
            `Score: ${finalScore}m`,
            {
                fontFamily: 'grandstander',
                fontSize: '32px',
                color: '#ffffff',
                align: 'center',
                stroke: '#000000',
                strokeThickness: 3,
            },
        ).setOrigin(0.5);

        // Add high score celebration if achieved
        let highScoreText;
        if (beatHighScore) {
            highScoreText = this.add.text(
                width / 2,
                scoreText.y + 50,
                'NEW HIGH SCORE!',
                {
                    fontFamily: 'grandstander',
                    fontSize: '40px',
                    fill: '#FFD700',
                    align: 'center',
                    stroke: '#AD9203',
                    strokeThickness: 3,
                    shadow: {
                        offsetX: 0,
                        offsetY: 0,
                        color: '#FFD70080',
                        blur: 6,
                        stroke: true,
                        fill: true,
                    },
                },
            ).setOrigin(0.5);

            // Add floating animation
            this.tweens.add({
                targets: highScoreText,
                scaleX: 1.1,
                scaleY: 1.1,
                duration: 1000,
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut',
            });

            // Create celebration particles if high score was beaten
            let emitter;

            // Create celebration particles (second layer, above background but below UI)
            emitter = this.add.particles(0, 0, 'particle', {
                x: width / 2,
                y: scoreText.y + 50, // Position at high score text location
                lifespan: 4000,
                speed: { min: 100, max: 300 },
                scale: { start: 0.8, end: 0 },
                gravityY: 0,
                quantity: 4,
                frequency: 50,
                blendMode: 'ADD',
                tint: [0xffff00, 0xff00ff, 0x00ffff, 0xff0000],
                angle: { min: 0, max: 360 }, // Emit in all directions
                rotate: { min: 0, max: 360 }, // Particles spin as they move
            });

            // Add particles to container (second layer)
            this.#gameOverOverlay.add(emitter);

            // Store the emitter reference in the scene for cleanup
            this.#highScoreEmitter = emitter;

            // Stop emitting after 20 seconds
            this.time.delayedCall(20000, () => {
                if (this.#highScoreEmitter) {
                    this.#highScoreEmitter.stop();
                }
            });
        }

        // Create temporary buttons to measure their widths
        const tempRestart = this.add.text(
            0,
            0,
            'Play Again',
            {
                fontFamily: 'grandstander',
                fontSize: '26px',
                padding: { x: 20, y: 10 },
            },
        );

        const tempReturnToMenu = this.add.text(
            0,
            0,
            'Return to Menu',
            {
                fontFamily: 'grandstander',
                fontSize: '26px',
                padding: { x: 20, y: 10 },
            },
        );

        // Calculate the maximum width needed
        const maxButtonWidth = Math.max(tempRestart.width, tempReturnToMenu.width);

        // Destroy temporary text objects
        tempRestart.destroy();
        tempReturnToMenu.destroy();

        // Create the actual buttons with consistent width
        const restartButton = this.#createMenuButton('Play Again', maxButtonWidth);
        restartButton.on('pointerup', () => {
            this.#soundManager.playButtonSound();
            this.#restartGame();
        });

        const returnToMenuButton = this.#createMenuButton('Return to Menu', maxButtonWidth);
        returnToMenuButton.on('pointerup', () => {
            this.#soundManager.playButtonSound();
            this.#returnToMenu();
        });

        // Position buttons
        const buttonY = beatHighScore ? highScoreText.y + 80 : scoreText.y + 80;
        restartButton.setPosition(width / 2, buttonY);
        returnToMenuButton.setPosition(width / 2, buttonY + 60);

        // Add all elements to the container in order of layering
        // (UI elements are added last so they appear on top)
        this.#gameOverOverlay.add([
            gameOverHeader,
            scoreText,
            restartButton,
            returnToMenuButton,
        ]);

        if (beatHighScore) {
            this.#gameOverOverlay.add(highScoreText);
        }

        // Register with camera manager
        this.#cameraManager.registerUIElement(this.#gameOverOverlay);
    }

    /**
     * Creates in-game menu UI elements
     */
    #createButtonsUI() {
        const buttonAlpha = 0.5; // 50% opacity
        const padding = 16;

        // Create pause button in top left with padding
        this.#pauseButton = this.add.sprite(padding, padding, 'ui-elements-sprites', 'pauseBtn')
            .setScrollFactor(0)
            .setDepth(1000)
            .setOrigin(0, 0)
            .setAlpha(buttonAlpha)
            .setInteractive({ useHandCursor: true })
            .on('pointerup', () => this.#togglePause());

        // Create fullscreen button next to pause button
        this.#fullscreenButton = this.add.sprite(0, padding, 'ui-elements-sprites', 'fullscreenBtn')
            .setScrollFactor(0)
            .setDepth(1000)
            .setOrigin(0, 0)
            .setAlpha(buttonAlpha)
            .setInteractive({ useHandCursor: true })
            .on('pointerup', () => this.#toggleFullscreen());
    }

    /**
     * Toggles the game pause state
     */
    #togglePause() {
        // Don't pause game if game over
        if (this.#isGameOver) {
            return;
        }

        this.#isPaused = !this.#isPaused;

        if (this.#isPaused) {
            // Stop any active countdown first
            if (this.#countdownSystem) {
                this.#countdownSystem.stopCountdown();
            }

            // Show pause overlay
            this.#pauseOverlay.visible = true;

            this.physics.pause();

            // Pause dino
            this.#dino.pause();

            // Pause ground scrolling
            this.#ground.setScrollSpeed(0);

            // Pause all enemies
            this.#enemies.getChildren().forEach((enemy) => {
                enemy.pause();
            });

            // Clear all spawn timers
            for (const timer of this.#spawnTimers.values()) {
                timer.destroy();
            }
            this.#spawnTimers.clear();

            // Hide in-game UI elements
            if (this.#pauseButton) {
                this.#pauseButton.setVisible(false);
            }
            if (this.#fullscreenButton) {
                this.#fullscreenButton.setVisible(false);
            }

            this.#soundManager.pauseGameMusic();
        }
        else {
            // Hide pause overlay immediately
            this.#pauseOverlay.setVisible(false);

            // Show in-game UI elements
            if (this.#pauseButton) {
                this.#pauseButton.setVisible(true);
            }
            if (this.#fullscreenButton) {
                this.#fullscreenButton.setVisible(true);
            }

            // Show mobile controls
            this.#dino.toggleButtonVisibility();

            // Start countdown before resuming
            if (!this.#countdownSystem) {
                return;
            }

            this.#countdownSystem.startCountdown(0, 0, () => {
                this.physics.resume();

                // Resume dino
                this.#dino.resume();

                // Resume ground scrolling with current difficulty speed
                this.#ground.setScrollSpeed(this.#difficultyManager.getCurrentSpeed());

                // Resume game music after countdown
                this.#soundManager.resumeGameMusic();

                // Resume all enemies
                this.#enemies.getChildren().forEach((enemy) => {
                    enemy.resume();
                });

                // Only restart spawning if we don't have any active spawn timers
                if (this.#spawnTimers.size === 0) {
                    // Use the last spawn times to maintain proper spacing
                    const currentTime = this.time.now;
                    const birdDelay = Math.max(0, 3000 - (currentTime - (this.#lastSpawnTimes['bird'] || 0)));
                    const rockDelay = Math.max(0, 1500 - (currentTime - (this.#lastSpawnTimes['rock'] || 0)));

                    this.time.delayedCall(birdDelay, () => {
                        this.#startSpawning('bird', () => this.#spawnBird(), 3000, 8000);
                    });

                    this.time.delayedCall(rockDelay, () => {
                        this.#startSpawning('rock', () => this.#spawnRock(), 1500, 4000);
                    });
                }
            });
        }
    }

    /**
     * Toggles fullscreen mode
     */
    #toggleFullscreen() {
        try {
            if (!this.#isFullscreen) {
                if (!document.fullscreenElement) {
                    this.scale.startFullscreen();
                }
            }
            else {
                if (document.fullscreenElement) {
                    this.scale.stopFullscreen();
                }
            }

            this.#isFullscreen = !this.#isFullscreen;

            if (!this.#fullscreenButton) {
                return;
            }

            // Update sprite frame based on fullscreen state
            const frame = this.#isFullscreen ? 'exitFullscreenBtn' : 'fullscreenBtn';
            this.#fullscreenButton.setFrame(frame);
        }
        catch (error) {
            logger.warn('Fullscreen request failed:', error);
        }
    }

    /**
     * Updates our detective mode and all its special tools! 🕵️‍♂️
     *
     * @private
     * @param {boolean} enabled - Whether to turn detective mode on or off
     */
    #updateDebugMode(enabled) {
        // Update our detective mode setting
        this.#debugMode = enabled;

        // Show or hide our special detective tools! 🕵️‍♂️
        if (this.physics?.world?.debugGraphic) {
            this.physics.world.debugGraphic.visible = this.#debugMode;
        }

        // Show or hide our detective notes! 📝
        if (this.#debugText) {
            this.#debugText.setVisible(this.#debugMode);
            this.#debugText.background.setVisible(this.#debugMode);
        }
    }

    /**
     * Starts spawning enemies of a specific type
     *
     * @param {string} type - Type of enemy to spawn
     * @param {Function} spawnFunc - Function to call to spawn the enemy
     * @param {number} minDelay - Minimum delay between spawns in ms
     * @param {number} maxDelay - Maximum delay between spawns in ms
     */
    #startSpawning(type, spawnFunc, minDelay, maxDelay) {
        const spawn = () => {
            if (this.#isGameOver || this.#isPaused) {
                return;
            }

            const currentTime = this.time.now;
            const lastSpawnTime = this.#lastSpawnTimes[type] || 0;
            const timeSinceLastSpawn = currentTime - lastSpawnTime;

            // Ensure minimum spacing between enemies of the same type
            if (timeSinceLastSpawn < minDelay) {
                // Schedule next check after remaining time
                const remainingDelay = minDelay - timeSinceLastSpawn;
                const timer = this.time.addEvent({
                    delay: remainingDelay,
                    callback: spawn,
                    callbackScope: this,
                });
                this.#spawnTimers.set(type, timer);

                return;
            }

            // Spawn the enemy
            const enemy = spawnFunc();
            if (enemy) {
                this.#enemies.add(enemy);
                this.#lastSpawnTimes[type] = currentTime;

                // Add collision with dino
                this.physics.add.overlap(
                    this.#dino,
                    enemy,
                    this.#handleEnemyCollision,
                    null,
                    this,
                );
            }

            // Schedule next spawn
            const delay = Phaser.Math.Between(minDelay, maxDelay);
            const timer = this.time.addEvent({
                delay,
                callback: spawn,
                callbackScope: this,
            });
            this.#spawnTimers.set(type, timer);
        };

        // Start the spawn cycle
        spawn();
    }

    /**
     * Spawns a bird at the current difficulty level
     *
     * @returns {Bird} The spawned bird
     */
    #spawnBird() {
        if (this.#isGameOver || this.#isPaused) {
            return null;
        }

        // Get current game speed
        const gameSpeed = this.#difficultyManager.getCurrentSpeed();

        // Create a new bird and add it to the enemy group
        const bird = Bird.spawn(this, gameSpeed);

        // Register with camera manager before adding to group
        this.#cameraManager.registerGameElement(bird);
        this.#enemies.add(bird);

        return bird;
    }

    /**
     * Spawns a rock at the current difficulty level
     *
     * @returns {SmallRock} The spawned rock
     */
    #spawnRock() {
        if (this.#isGameOver || this.#isPaused) {
            return null;
        }

        // Spawn rock offscreen to the right
        const rock = new SmallRock(
            this,
            this.scale.width + 100, // Start off-screen to the right
            this.scale.height - this.#groundCollisionHeight,
            this.#difficultyManager.getCurrentSpeed(), // Pass current speed for reference
        );

        // Register with camera manager before adding to group
        this.#cameraManager.registerGameElement(rock);

        return rock;
    }

    /**
     * Called every frame to update game objects
     *
     * @param {number} time - The current time in milliseconds
     * @param {number} delta - The delta time in milliseconds since the last update
     */
    update(time, delta) {
        // Call base class method first
        super.update(time, delta);

        // Don't update game objects if game over
        if (this.#isGameOver) {
            return;
        }

        // Always check pause key regardless of game state
        if (this.#pauseKey.isDown && !this.#pauseKeyPressed) {
            this.#pauseKeyPressed = true;
            this.#togglePause();
        }
        else if (!this.#pauseKey.isDown) {
            this.#pauseKeyPressed = false;
        }

        // Don't update game objects if paused
        if (this.#isPaused) {
            return;
        }

        // Get time scales
        const slowMotionScale = this.anims.globalTimeScale;
        const gameSpeed = this.#difficultyManager.getCurrentSpeed() / this.#difficultyManager.getBaseSpeed(); // Normalise by base speed
        const slowMotionDelta = delta * slowMotionScale;
        const gameSpeedDelta = slowMotionDelta * gameSpeed;

        // Update dino (handles keyboard and mobile controls)
        this.#dino.update();

        // Update our magical sky ✨ (affected by slow motion but not game speed)
        this.#skySystem.update(time, slowMotionDelta);

        // Only update score and difficulty if game has started (countdown finished)
        if (this.#isGameStarted) {
            // Update score and difficulty (affected by both slow motion and game speed)
            this.#scoreManager.update(time, gameSpeedDelta);
            const score = this.#scoreManager.getCurrentScore();
            if (this.#difficultyManager.update(score)) {
                // Adjust spawn rates
                // TODO: Fix this spawning enemies immediately after pause
                this.#updateSpawnRates();

                // Speed changed, update ground scroll speed
                this.#ground.setScrollSpeed(this.#difficultyManager.getCurrentSpeed());
            }
        }

        // Update debug text if enabled
        this.#updateDebugText();

        // Handle debug toggle with key state tracking
        if (this.#debugKey.isDown && !this.#debugKeyPressed) {
            this.#debugKeyPressed = true;
            this.#updateDebugMode(!this.#debugMode);
        }
        else if (!this.#debugKey.isDown) {
            this.#debugKeyPressed = false;
        }

        // Update ground scrolling with game speed
        this.#ground.update(gameSpeedDelta);

        // Update all enemies with game speed
        this.#enemies.getChildren().forEach((enemy) => {
            enemy.update(gameSpeedDelta);
        });

        // Check for collisions between dino and enemies
        this.physics.overlap(
            this.#dino,
            this.#enemies,
            this.#handleEnemyCollision,
            null,
            this,
        );
    }

    /**
     * Updates the spawn rates of obstacles based on current difficulty
     */
    #updateSpawnRates() {
        const speedMultiplier = this.#difficultyManager.getCurrentSpeed() / this.#difficultyManager.getBaseSpeed();

        // Only birds need speed updates since rocks use ground position
        this.#enemies.getChildren().forEach((enemy) => {
            if (enemy instanceof Bird && enemy.body) {
                enemy.setGameSpeed(this.#difficultyManager.getCurrentSpeed());
            }
        });

        // Adjust spawn timers based on difficulty
        if (this.#spawnTimers.has('rock')) {
            const rockTimer = this.#spawnTimers.get('rock');
            const newDelay = Phaser.Math.Between(2000, 4000) / speedMultiplier;
            rockTimer.delay = newDelay;
            rockTimer.reset({ delay: newDelay, callback: rockTimer.callback, callbackScope: this });
        }

        if (this.#spawnTimers.has('bird')) {
            const birdTimer = this.#spawnTimers.get('bird');
            const newDelay = Phaser.Math.Between(1500, 10000) / speedMultiplier;
            birdTimer.delay = newDelay;
            birdTimer.reset({ delay: newDelay, callback: birdTimer.callback, callbackScope: this });
        }
    }

    /**
     * Gets the current ground scroll speed
     *
     * @returns {number} The current ground scroll speed
     */
    getGroundSpeed() {
        return this.#ground.getScrollSpeed();
    }

    /**
     * Gets the ground object
     *
     * @returns {Ground} The ground object
     */
    getGround() {
        return this.#ground;
    }

    /**
     * Gets the camera manager instance
     * @returns {CameraManager} The camera manager
     */
    getCameraManager() {
        return this.#cameraManager;
    }

    /**
     * Gets the sound manager instance
     * @returns {SoundManager} The sound manager
     */
    getSoundManager() {
        return this.#soundManager;
    }

    /**
     * Handles what happens when our dino bumps into any enemy
     * Game over! Time to try again!
     *
     * @param {Dino} dino - The player's dino
     * @param {Phaser.GameObjects.Sprite} enemy - The enemy (bird or obstacle) that hit the dino
     */
    #handleEnemyCollision(dino, enemy) {
        if (this.#isGameOver) {
            return;
        }

        this.#isGameOver = true;
        this.anims.globalTimeScale = 1;
        this.physics.world.timeScale = 1;

        // Stop enemy movement based on physics body type
        if (enemy.body) {
            if (enemy.body instanceof Phaser.Physics.Arcade.Body) {
                // Dynamic bodies
                enemy.body.setVelocity(0, 0);
            }
            else if (enemy.body instanceof Phaser.Physics.Arcade.StaticBody) {
                // Static bodies
                enemy.body.enable = false;
            }
        }

        // Play death animation
        dino.die();

        // Stop game physics
        this.physics.pause();

        // Get final scores before resetting
        const finalScore = this.#scoreManager.getCurrentScore();
        const highScore = this.#scoreManager.getHighScore();
        const beatHighScore = finalScore >= highScore && finalScore > 0;

        // Clear any existing game over overlay
        if (this.#gameOverOverlay) {
            this.#gameOverOverlay.destroy();
        }

        // Create new game over overlay
        this.#createGameOverOverlay(finalScore, highScore, beatHighScore);

        // Show game over overlay
        this.#gameOverOverlay.setVisible(true);

        // Hide in-game UI elements
        this.#pauseButton.setVisible(false);
        this.#fullscreenButton.setVisible(false);
        this.#scoreManager.toggleScoreTextVisibility();
        this.#dino.toggleButtonVisibility();

        // Now reset the score and difficulty for the next game
        this.#scoreManager.reset();
        this.#difficultyManager.reset();
        this.#soundManager.stopAll();
    }

    /**
     * Restarts the game after game over
     */
    #restartGame() {
        // Clean up any active timers and events
        this.shutdown();

        // Clean up existing objects
        if (this.#gameOverOverlay) {
            this.#gameOverOverlay.destroy();
        }

        // Clean up particle emitter if it exists
        if (this.#highScoreEmitter) {
            this.#highScoreEmitter.destroy();
            this.#highScoreEmitter = null;
        }

        // Reset game state
        this.anims.globalTimeScale = 1;
        this.physics.world.timeScale = 1;
        this.#isGameOver = false;
        this.#isPaused = false;
        this.physics.resume();

        // Restart the scene
        this.scene.restart();
    }

    /**
     * Returns to the main menu
     */
    #returnToMenu() {
        // Reset physics state before cleanup
        if (this.#isPaused) {
            this.physics.resume();
        }
        this.physics.world.timeScale = 1;

        // Clean up any active timers and events
        this.shutdown();

        // Stop all running tweens
        this.tweens.killAll();

        // Stop all running timers
        this.time.removeAllEvents();

        // Stop the current scene before starting the menu
        this.scene.stop();

        // Start the main menu scene
        this.scene.start('Menu');
    }

    /**
     * Starts the game with countdown
     */
    #startGameWithCountdown() {
        // Ensure dino is in idle animation
        this.#dino.play('dino-idle');

        // Start countdown at dino's position
        if (this.#countdownSystem) {
            this.#countdownSystem.startCountdown(0, 0, () => {
                // Start spawning enemies after a short delay
                this.time.delayedCall(2000, () => {
                    // Randomly choose which enemy type spawns first
                    const spawnFirst = Math.random() < 0.5 ? 'bird' : 'rock';

                    // Randomise initial delays (2-5 seconds for first enemy, 4-7 seconds for second)
                    const firstDelay = Phaser.Math.Between(0, 1000);
                    const secondDelay = Phaser.Math.Between(2000, 4000);

                    if (spawnFirst === 'bird') {
                        this.time.delayedCall(firstDelay, () => {
                            this.#startSpawning('bird', () => this.#spawnBird(), 3000, 8000);
                        });
                        this.time.delayedCall(secondDelay, () => {
                            this.#startSpawning('rock', () => this.#spawnRock(), 1500, 4000);
                        });
                    }
                    else {
                        this.time.delayedCall(firstDelay, () => {
                            this.#startSpawning('rock', () => this.#spawnRock(), 1500, 4000);
                        });
                        this.time.delayedCall(secondDelay, () => {
                            this.#startSpawning('bird', () => this.#spawnBird(), 3000, 8000);
                        });
                    }
                });
            });
        }
    }
}
