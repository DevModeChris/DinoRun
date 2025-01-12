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
import { ScoreDisplay } from '../ui/score-display.js';
import { DifficultyManager } from '../systems/difficulty-manager.js';
import { checkIfMobile } from '../../utils/helpers.js';

export class GameScene extends Phaser.Scene {
    /** @type {number} */
    #groundCollisionHeight = 40; // Height of the collision area (not the full sprite height)

    /** @type {boolean} */
    #isGameOver = false;

    /** @type {Ground} */
    #ground;

    /** @type {Dino} */
    #dino;

    /** @type {SkySystem} */
    #skySystem;

    /** @type {ScoreDisplay} */
    #scoreDisplay;

    /** @type {DifficultyManager} */
    #difficultyManager;

    /** @type {Phaser.GameObjects.Rectangle} */
    #platform;

    /** @type {Phaser.GameObjects.Group} */
    #enemies;

    /** @type {Map<string, Phaser.Time.TimerEvent>} */
    #spawnTimers = new Map();

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
    #baseHeight = 720; // Base height for scaling calculations

    /** @type {number} */
    #dinoX = 100;

    /** @type {number} */
    #groundY = 0;

    /** @type {number} */
    #scaleFactor = 1;

    /** @type {Phaser.GameObjects.Text} */
    #gameOverText;

    /** @type {boolean} */
    #isMobile = false;

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

        // Remove the particle texture if it exists
        if (this.textures.exists('particle')) {
            this.textures.remove('particle');
        }
    }

    preload() {
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

        // Load font
        this.load.font(
            'annie-use-your-telescope',
            'src/assets/fonts/AnnieUseYourTelescope-Regular.ttf',
            'truetype',
        );

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
     * Creates all the game objects and sets up the game
     */
    create() {
        // Reset game state
        this.#isGameOver = false;
        this.physics.resume();

        // Detect if we're on a mobile device
        this.#isMobile = checkIfMobile();

        const { width, height } = this.scale;

        // Calculate initial positions
        this.#calculatePositions();

        // Create our beautiful sky
        this.#skySystem = new SkySystem(this);

        // Create difficulty manager
        this.#difficultyManager = new DifficultyManager();

        // Create the invisible platform for physics
        this.#platform = this.add.rectangle(
            width / 2,
            this.#groundY + (this.#groundCollisionHeight / 2),
            width,
            this.#groundCollisionHeight,
            0xFF0000,
            0,
        );
        this.physics.add.existing(this.#platform, true);

        // Create the visual scrolling ground
        this.#ground = new Ground(this, height - Ground.HEIGHT, 'ground-sprites', 'purpleGrass');
        this.#ground.width = width;

        // Create our dino character at fixed position
        this.#dino = new Dino(this, this.#dinoX, this.#groundY - (this.#groundCollisionHeight / 2));

        // Make the dino collide with the platform
        this.physics.add.collider(this.#dino, this.#platform);

        // Create a group for all enemies
        this.#enemies = this.add.group();

        // Start spawning enemies
        this.#startSpawning('bird', () => this.#spawnBird(), 4000, 14000);
        this.#startSpawning('rock', () => this.#spawnRock(), 1000, 7000);

        // Initialise score display
        const fontSize = Math.round(28);
        this.#scoreDisplay = new ScoreDisplay(
            this,
            width - (20 * this.#scaleFactor),
            20 * this.#scaleFactor,
            fontSize,
        );

        // Create game over text (hidden initially)
        this.#createGameOverText();

        // Create debug text (hidden by default)
        this.#createDebugText();

        // Listen for resize events
        this.scale.on('resize', this.resize, this);

        // Set up collision detection
        this.physics.add.overlap(
            this.#dino,
            this.#enemies,
            this.#handleEnemyCollision,
            null,
            this,
        );

        // Set up debug controls
        const keys = this.input.keyboard.addKeys('TAB');
        this.#debugKey = keys.TAB;

        // Enable debug mode to see collision boxes
        this.physics.world.createDebugGraphic();
        this.physics.world.debugGraphic.visible = this.#debugMode;
    }

    /**
     * Calculates positions for game objects based on current screen size
     */
    #calculatePositions() {
        const { _width, height } = this.scale;

        // Calculate scale factor for UI elements only
        this.#scaleFactor = height / this.#baseHeight;

        // Ground is always at the bottom
        this.#groundY = height - this.#groundCollisionHeight;
    }

    /**
     * Creates the debug text overlay
     */
    #createDebugText() {
        const padding = 4;
        const buffer = 4;

        // Create text first to measure it
        this.#debugText = this.add.text(16, 16, '🕒 Time: 24:00', {  // Maximum length text
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

        // Get maximum width from initial text
        const maxWidth = this.#debugText.width;
        const maxHeight = this.#debugText.height;

        // Create background sized to maximum text width
        const background = this.add.rectangle(
            16 - padding - buffer,
            16 - padding - buffer,
            maxWidth + (padding * 2) + (buffer * 2),
            maxHeight + (padding * 2) + (buffer * 2),
            0x000000,
            0.7,
        )
            .setOrigin(0, 0)
            .setScrollFactor(0)
            .setDepth(999)
            .setVisible(false);

        // Store background reference for visibility toggling
        this.#debugText.background = background;

        // Clear the initial measuring text
        this.#debugText.setText('');
    }

    /**
     * Creates the game over text
     */
    #createGameOverText() {
        const { width, height } = this.scale;
        const fontSize = Math.round(52 * this.#scaleFactor);
        const message = this.#isMobile ? 'Tap to Play Again' : 'Press SPACE to Play Again';

        this.#gameOverText = this.add.text(
            width / 2,
            height / 2,
            ['GAME OVER', message],
            {
                fontFamily: 'annie-use-your-telescope',
                fontSize: `${fontSize}px`,
                fill: '#ffffff',
                align: 'center',
                lineSpacing: 20,
                stroke: '#000000',
                strokeThickness: 3,
            },
        )
            .setOrigin(0.5)
            .setScrollFactor(0)
            .setDepth(1000)
            .setVisible(false);  // Start hidden
    }

    /**
     * Handle window resize events
     *
     * @param {Phaser.Structs.Size} gameSize - New game size
     */
    resize(gameSize) {
        const { width, height } = gameSize;

        // Recalculate positions
        this.#calculatePositions();

        // Update ground position and size (only width changes)
        this.#ground.setPosition(0, height - Ground.HEIGHT);
        this.#ground.width = width;

        // Update platform position and size
        this.#platform.setPosition(width / 2, this.#groundY + (this.#groundCollisionHeight / 2));
        this.#platform.width = width;

        // Update platform physics body
        /** @type {Phaser.Physics.Arcade.StaticBody} */
        const body = this.#platform.body;
        body.setSize(width, this.#groundCollisionHeight);
        body.updateFromGameObject();

        // Update dino Y position only
        this.#dino.setPosition(this.#dinoX, this.#groundY - (this.#groundCollisionHeight / 2));

        // Update score display position and scale (UI element)
        const fontSize = Math.round(36 * this.#scaleFactor);
        this.#scoreDisplay.updateFontSize(fontSize);
        this.#scoreDisplay.updatePosition(width - (20 * this.#scaleFactor), 20 * this.#scaleFactor);

        // Recheck mobile status
        this.#isMobile = checkIfMobile();

        // Update game over text if it exists (UI element)
        if (this.#gameOverText) {
            const message = this.#isMobile ? 'Tap to Play Again' : 'Press SPACE to Play Again';
            this.#gameOverText
                .setPosition(width / 2, height / 2)
                .setStyle({ fontSize: `${Math.round(52 * this.#scaleFactor)}px` })
                .setText(['GAME OVER', message]);
        }

        // Update active obstacles Y position
        this.#enemies.getChildren().forEach((enemy) => {
            if (enemy instanceof Bird) {
                // Update bird height relative to ground
                enemy.y = this.#groundY - 100;
            }
            else {
                // Update rock position to ground level
                enemy.y = this.#groundY;
            }
        });
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
            if (this.#isGameOver) {
                return;
            }

            // Spawn the enemy
            const enemy = spawnFunc();
            if (enemy) {
                this.#enemies.add(enemy);

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
        if (this.#isGameOver) {
            return null;
        }

        // Get a random speed from the bird's speed range
        const baseSpeed = Phaser.Math.Between(Bird.SPEED_RANGE.min, Bird.SPEED_RANGE.max);

        // Scale the speed based on current difficulty (each level adds 10% more speed)
        const speedMultiplier = 1 + ((this.#difficultyManager.getCurrentLevel() - 1) * 0.1);
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
        if (this.#isGameOver) {
            return null;
        }

        return new SmallRock(
            this,
            this.scale.width + 100, // Start off-screen to the right
            this.scale.height - this.#groundCollisionHeight,
            this.#difficultyManager.getCurrentSpeed(), // Use current difficulty speed
        );
    }

    /**
     * Called every frame to update game objects
     *
     * @param {number} time - The current time in milliseconds
     * @param {number} delta - The time in milliseconds since the last update
     */
    update(time, delta) {
        if (this.#isGameOver) {
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
            this.#scoreDisplay.addScore(1);
            this.#lastScoreUpdate = time;

            // Update difficulty based on score
            if (this.#difficultyManager.update(this.#scoreDisplay.getCurrentScore())) {
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
     *
     * @private
     */
    #updateSpawnRates() {
        // Update bird spawn rate
        if (this.#spawnTimers.has('bird')) {
            this.#spawnTimers.get('bird').destroy();
            this.#startSpawning(
                'bird',
                () => this.#spawnBird(),
                this.#difficultyManager.getSpawnInterval(4000),
                this.#difficultyManager.getSpawnInterval(14000),
            );
        }

        // Update rock spawn rate
        if (this.#spawnTimers.has('rock')) {
            this.#spawnTimers.get('rock').destroy();
            this.#startSpawning(
                'rock',
                () => this.#spawnRock(),
                this.#difficultyManager.getSpawnInterval(1000),
                this.#difficultyManager.getSpawnInterval(7000),
            );
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

        // Reset score and difficulty when game restarts
        this.#scoreDisplay.reset();
        this.#difficultyManager.reset();

        // Show game over text
        this.#gameOverText.setVisible(true);

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

        // Restart the scene
        this.scene.restart();
    }
}
