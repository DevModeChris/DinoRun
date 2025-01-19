/**
 * 🎮 The main game scene where all the dino action happens!
 *
 * This is like the stage where our dino performs - it controls
 * everything you see and do in the main game.
 */
import Phaser from 'phaser';
import { Ground } from '../objects/ground.js';
import { Dino } from '../objects/dino.js';
import { Bird } from '../objects/bird.js';
import { SmallRock } from '../objects/small-rock.js';
import { SkySystem } from '../objects/sky-system.js';
import { ScoreManager } from '../systems/score-manager.js';
import { DifficultyManager } from '../systems/difficulty-manager.js';
import { checkIfMobile } from '../../utils/helpers.js';
import {
    gameConfig,
    BASE_WIDTH,
    BASE_HEIGHT,
} from '../config.js';

export class GameScene extends Phaser.Scene {
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
    #lastScoreUpdate = 0;

    /** @type {number} */
    #scoreUpdateInterval = 100; // Update score every 100ms

    /** @type {number} */
    #dinoX = 100;

    /** @type {number} */
    #groundY = 0;

    /** @type {number} */
    #groundCollisionHeight = Ground.COLLISION_HEIGHT;

    /** @type {Phaser.GameObjects.Text} */
    #gameOverText;

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

    constructor() {
        super('GameScene');
    }

    /**
     * Clean up any active timers and events
     */
    #cleanup() {
        // Clean up all spawn timers
        for (const timer of this.#spawnTimers.values()) {
            timer.destroy();
        }
        this.#spawnTimers.clear();

        // Destroy any active particle managers
        const particleManagers = this.add.particles.list;
        if (particleManagers) {
            particleManagers.forEach((manager) => {
                manager.destroy();
            });
        }
    }

    /**
     * Creates all the game objects and sets up the game
     */
    create() {
        const { width, height } = this.scale;

        // Check if we're on mobile
        this.#isMobile = checkIfMobile();

        // Create sky background
        this.#skySystem = new SkySystem(this);

        // Create the visual scrolling ground
        this.#ground = new Ground(this, 0, 'ground-sprites', 'purpleGrass');

        // Create the invisible platform for physics
        this.#platform = this.add.rectangle(0, 0, width, this.#groundCollisionHeight);
        this.physics.add.existing(this.#platform, true);

        // Create dino at initial position
        this.#dino = new Dino(this, 0, 0);

        // Make the dino collide with the platform
        this.physics.add.collider(this.#dino, this.#platform);

        // Create difficulty manager
        this.#difficultyManager = new DifficultyManager();

        // Create a group for all enemies
        this.#enemies = this.add.group();

        // Start spawning enemies with randomized initial setup
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

        // Initialise score display
        this.#scoreManager = new ScoreManager(this, 0, 0);

        // Create game over text (hidden initially)
        this.#createGameOverText();

        // Create debug text (hidden initially)
        this.#createDebugText();

        // Create buttons UI
        this.#createButtonsUI();
        this.#createPauseOverlay();

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
            ? Math.max(width / BASE_WIDTH, 0.85) // Increased minimum scale for portrait
            : this.#isMobile
                ? Math.max(height / (BASE_HEIGHT / 2), 0.85)
                : Math.min(
                    width / BASE_WIDTH,
                    height / BASE_HEIGHT,
                );

        this.#calculatePositions(width, height, scale);

        // Set up debug controls
        const keys = this.input.keyboard.addKeys('TAB,P');
        this.#debugKey = keys.TAB;
        this.#pauseKey = keys.P;

        // Enable debug mode to see collision boxes
        this.physics.world.createDebugGraphic();
        this.physics.world.debugGraphic.visible = this.#debugMode;
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
            // In landscape, handle mobile and desktop differently
            if (this.#isMobile) {
                // For mobile landscape, use height-based scale with a higher minimum
                scale = Math.max(height / (BASE_HEIGHT / 2), 0.85);
            }
            else {
                // For desktop landscape, use the smaller ratio to prevent oversizing
                scale = Math.min(width / BASE_WIDTH, height / BASE_HEIGHT);
            }
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

        // Update ground
        if (this.#ground) {
            // Set ground scale and position (origin is bottom-left)
            this.#ground.setScale(scale);
            this.#ground.y = groundY;
            this.#ground.width = width * 2;
        }

        // Update platform
        if (this.#platform && this.#platform.body) {
            // Position platform at collision height from bottom
            const platformY = groundCollisionY + (groundCollisionHeight / 2);

            this.#platform.setPosition(Math.ceil(width / 2), platformY);
            this.#platform.width = width;

            // Update platform physics body
            /** @type {Phaser.Physics.Arcade.StaticBody} */
            const body = this.#platform.body;
            body.setSize(width, groundCollisionHeight);
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
                if (enemy instanceof Bird) {
                    enemy.y = groundTopY - (100 * scale);
                }
                else {
                    enemy.y = groundCollisionY;
                }
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

        // Update game over text
        if (this.#gameOverText) {
            this.#gameOverText
                .setPosition(width / 2, height / 2);
        }

        // Update pause overlay if it exists
        if (this.#pauseOverlay) {
            // Update background
            const background = this.#pauseOverlay.list[0];
            background.setSize(width, height);

            // Update pause header
            const pauseHeader = this.#pauseOverlay.list[1];
            pauseHeader.setPosition(width / 2, height * 0.25);

            // Update continue button
            const continueButton = this.#pauseOverlay.list[2];
            continueButton.setPosition(width / 2, height * 0.45);

            // Update version text
            const versionText = this.#pauseOverlay.list[3];
            versionText.setPosition(width / 2, height - 30);

            // Center the pause menu
            this.#pauseOverlay.setPosition(0, 0);
        }
    }

    /**
     * Creates the debug text overlay
     */
    #createDebugText() {
        const padding = 4;
        const buffer = 4;

        // Create debug text with default styling
        this.#debugText = this.add.text(16, 76, '', {
            fontFamily: 'monospace',
            fontSize: '13px',
            fill: '#ffffff',
            padding: { x: padding, y: padding },
            resolution: 3,        // Increased resolution for sharper text
            antialias: false,     // Disable antialiasing for crisp pixels
        })
            .setScrollFactor(0)
            .setDepth(1000)
            .setVisible(false)
            .setPipeline('TextureTintPipeline');  // Use pixel art pipeline

        // Create background for dynamic sizing
        this.#debugText.background = this.add.rectangle(
            16 - padding - buffer,
            76 - padding - buffer,
            0,  // Initial width will be set dynamically
            0,  // Initial height will be set dynamically
            0x000000,
            0.7,
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
    }

    /**
     * Creates the game over text
     */
    #createGameOverText() {
        // Create container for game over text
        this.#gameOverText = this.add.container(this.scale.width / 2, this.scale.height / 2);
        this.#gameOverText.setDepth(1000)
            .setVisible(false);
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

        // Add PAUSED header text
        this.#pauseHeader = this.add.text(
            0,
            0,
            'PAUSED',
            {
                fontFamily: 'annie-use-your-telescope',
                fontSize: '52px',
                color: '#ffffff',
                align: 'center',
            },
        )
            .setOrigin(0.5);

        // Create continue button
        const continueButton = this.add.text(
            0,
            0,
            'Continue',
            {
                fontFamily: 'annie-use-your-telescope',
                fontSize: '32px',
                color: '#ffffff',
                align: 'center',
                backgroundColor: '#222222',
                padding: { x: 20, y: 10 },
            },
        )
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerup', () => {
                this.#togglePause();
            });

        // Version text
        const versionText = this.add.text(
            0,
            0,
            `Version: ${gameConfig.version}`,
            {
                fontFamily: 'annie-use-your-telescope',
                fontSize: '24px',
                color: '#ffffff',
            },
        ).setOrigin(0.5);

        // Add all elements to the container
        this.#pauseOverlay.add([
            background,
            this.#pauseHeader,
            continueButton,
            versionText,
        ]);
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

        // Show/hide pause overlay
        this.#pauseOverlay.visible = this.#isPaused;

        if (this.#isPaused) {
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
        }
        else {
            this.physics.resume();
            this.#pauseOverlay.setVisible(false);

            // Resume dino
            this.#dino.resume();

            // Resume ground scrolling with current difficulty speed
            this.#ground.setScrollSpeed(this.#difficultyManager.getCurrentSpeed());

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

            // Show in-game UI elements
            if (this.#pauseButton) {
                this.#pauseButton.setVisible(true);
            }
            if (this.#fullscreenButton) {
                this.#fullscreenButton.setVisible(true);
            }
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
            console.warn('Fullscreen request failed:', error);
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

        // Get a random speed from the bird's speed range
        const baseSpeed = Phaser.Math.Between(Bird.SPEED_RANGE.min, Bird.SPEED_RANGE.max);

        // Scale the speed based on current difficulty (each level adds 5% more speed)
        const speedMultiplier = 1 + ((this.#difficultyManager.getCurrentLevel() - 1) * 0.05);
        const finalSpeed = baseSpeed * speedMultiplier;

        // Spawn bird with scaled random speed
        return new Bird(
            this,
            this.scale.width + 100,
            Phaser.Math.Between(100, this.scale.height - 200),
            finalSpeed,
        );
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
        return new SmallRock(
            this,
            this.scale.width + 100, // Start off-screen to the right
            this.scale.height - this.#groundCollisionHeight,
            this.#difficultyManager.getCurrentSpeed(), // Pass current speed for reference
        );
    }

    /**
     * Called every frame to update game objects
     *
     * @param {number} time - The current time in milliseconds
     * @param {number} delta - The time in milliseconds since the last update
     */
    update(time, delta) {
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

        // Update dino (handles keyboard and mobile controls)
        this.#dino.update();

        // Update our magical sky ✨
        this.#skySystem.update(delta, time);

        // Update debug text if enabled
        if (this.#debugMode) {
            const timeOfDay = this.#skySystem.getTimeOfDay();
            const hours = Math.floor(timeOfDay * 24);
            const minutes = Math.floor((timeOfDay * 24 * 60) % 60);
            this.#debugText.setText(`🕒 Time: ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`);
            this.#debugText.resizeBackground();
            this.#debugText.setVisible(true);
            this.#debugText.background.setVisible(true);
        }
        else {
            this.#debugText.setVisible(false);
            this.#debugText.background.setVisible(false);
        }

        // Handle debug toggle with key state tracking
        if (this.#debugKey.isDown && !this.#debugKeyPressed) {
            this.#debugKeyPressed = true;
            this.#debugMode = !this.#debugMode;
            this.physics.world.debugGraphic.setVisible(this.#debugMode);

            // Log debug state
            console.log(`Debug mode: ${this.#debugMode ? 'ON' : 'OFF'}`);
        }
        else if (!this.#debugKey.isDown) {
            this.#debugKeyPressed = false;
        }

        // Update score based on time survived
        if (time - this.#lastScoreUpdate >= this.#scoreUpdateInterval) {
            this.#scoreManager.addScore(1);
            this.#lastScoreUpdate = time;

            // Update difficulty based on score
            if (this.#difficultyManager.update(this.#scoreManager.getCurrentScore())) {
                // Speed up ground scrolling
                this.#ground.setScrollSpeed(this.#difficultyManager.getCurrentSpeed());

                // Adjust spawn rates
                this.#updateSpawnRates();
            }
        }

        // Update ground scrolling
        this.#ground.update(delta);

        // Update all enemies
        this.#enemies.getChildren().forEach((enemy) => {
            enemy.update(delta);
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
                const baseSpeed = Phaser.Math.Between(Bird.SPEED_RANGE.min, Bird.SPEED_RANGE.max);
                const speedMult = 1 + ((this.#difficultyManager.getCurrentLevel() - 1) * 0.05);
                enemy.body.setVelocityX(baseSpeed * speedMult);
            }
        });

        // Adjust spawn timers based on difficulty
        if (this.#spawnTimers.has('rock')) {
            const rockTimer = this.#spawnTimers.get('rock');
            const newDelay = Phaser.Math.Between(
                2000 / speedMultiplier,  // Faster minimum spawn rate
                8000 / speedMultiplier,   // Faster maximum spawn rate
            );
            rockTimer.delay = newDelay;
            rockTimer.reset({ delay: newDelay, callback: rockTimer.callback, callbackScope: this });
        }

        if (this.#spawnTimers.has('bird')) {
            const birdTimer = this.#spawnTimers.get('bird');
            const newDelay = Phaser.Math.Between(
                4000 / speedMultiplier,  // Faster minimum spawn rate
                14000 / speedMultiplier,  // Faster maximum spawn rate
            );
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
        dino.play('dino-dead');

        // Stop game physics
        this.physics.pause();

        // Clean up timers
        this.#cleanup();

        // Get final scores before resetting
        const finalScore = this.#scoreManager.getCurrentScore();
        const highScore = this.#scoreManager.getHighScore();
        const beatHighScore = finalScore >= highScore && finalScore > 0;

        // Clear any existing game over text
        if (this.#gameOverText) {
            this.#gameOverText.removeAll(true);
        }

        const message = this.#isMobile ? 'Tap to Play Again' : 'Press SPACE to Play Again';
        const scoreText = `Score: ${finalScore}m`;
        const gameOverLines = ['GAME OVER', scoreText];

        // Add celebration message if high score was beaten
        if (beatHighScore) {
            gameOverLines.splice(1, 0, 'NEW HIGH SCORE!');
        }

        gameOverLines.push(message);

        // Set different font sizes for each line
        const textConfig = {
            fontFamily: 'annie-use-your-telescope',
            fill: '#ffffff',
            align: 'center',
            lineSpacing: 20,
            stroke: '#000000',
            strokeThickness: 3,
        };

        // Apply different font sizes to each line
        let currentY = 0;
        const lineSpacing = 20;
        let highScoreTextY = 0;

        gameOverLines.forEach((line, index) => {
            let fontSize = 32; // Default size for most lines
            let textStyle = {
                ...textConfig,
                fontSize: `${fontSize}px`,
            };

            if (index === 0) {
                fontSize = 52; // "GAME OVER"
                textStyle.fontSize = `${fontSize}px`;
                textStyle.strokeThickness = 5;
            }
            else if (line.includes('NEW HIGH SCORE')) {
                fontSize = 40; // High score celebration
                textStyle = {
                    ...textStyle,
                    fontSize: `${fontSize}px`,
                    fill: '#FFD700', // Gold
                    stroke: '#AD9203',
                    strokeThickness: 3,
                    shadow: {
                        offsetX: 0,
                        offsetY: 0,
                        color: '#FFD700',
                        blur: 10,
                        stroke: true,
                        fill: true,
                    },
                };
                highScoreTextY = currentY;

                // Create a subtle floating animation
                const lineText = this.add.text(0, currentY, line, textStyle)
                    .setOrigin(0.5)
                    .setData('originalSize', fontSize);

                // Subtle scale pulse animation
                this.tweens.add({
                    targets: lineText,
                    scaleX: 1.1,
                    scaleY: 1.1,
                    duration: 1000,
                    ease: 'Sine.easeInOut',
                    yoyo: true,
                    repeat: -1,
                });

                this.#gameOverText.add(lineText);
                currentY += fontSize + lineSpacing;

                return; // Skip the default text creation
            }
            else if (line.includes('Score:')) {
                fontSize = 36; // Score display
                textStyle.fontSize = `${fontSize}px`;
            }

            const lineText = this.add.text(0, currentY, line, textStyle)
                .setOrigin(0.5)
                .setData('originalSize', fontSize); // Store original size for scaling

            this.#gameOverText.add(lineText);
            currentY += fontSize + lineSpacing;
        });

        // Center the container's content vertically
        const totalHeight = currentY - lineSpacing;
        this.#gameOverText.list.forEach((text) => {
            text.y -= totalHeight / 2;
        });

        // Create celebration particles if high score was beaten
        if (beatHighScore) {
            const width = this.scale.width;
            const height = this.scale.height;
            const particleY = (height / 2) + (highScoreTextY - (totalHeight / 2));

            const emitter = this.add.particles(0, 0, 'particle', {
                x: width / 2,
                y: particleY,
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

            // Stop emitting after 10 seconds
            this.time.delayedCall(20000, () => {
                emitter.stop();

                // Remove the emitter after it's done
                this.time.delayedCall(1000, () => {
                    emitter.destroy();
                });
            });
        }

        // Show game over text with score
        this.#gameOverText.setVisible(true);

        // Hide in-game UI elements
        this.#pauseButton.setVisible(false);
        this.#fullscreenButton.setVisible(false);
        this.#scoreManager.toggleScoreTextVisibility();
        this.#dino.toggleButtonVisibility();

        // Now reset the score and difficulty for the next game
        this.#scoreManager.reset();
        this.#difficultyManager.reset();

        // Listen for restart input
        if (this.#isMobile) {
            // Listen for tap to restart
            this.input.once('pointerdown', () => {
                this.#restartGame();
            });
        }
        else {
            // Listen for space to restart
            this.input.keyboard.once('keydown-SPACE', () => {
                this.#restartGame();
            });
        }
    }

    /**
     * Restarts the game after game over
     */
    #restartGame() {
        // Clean up existing objects
        if (this.#gameOverText) {
            this.#gameOverText.destroy();
            this.#gameOverText = null;
        }

        // Reset game state
        this.#isGameOver = false;
        this.#isPaused = false;
        this.#spawnTimers.clear();
        this.physics.resume();

        // Restart the scene
        this.scene.restart();
    }
}
