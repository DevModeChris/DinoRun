// 🎮 Welcome to our DinoRun game! This is where all the magic happens.
// Think of this file as the brain of our game - it makes everything work together!

// First, let's get all the tools we need for our game
import { Dino } from '../entities/dino.js';
import { Obstacle } from '../entities/obstacle.js';
import { PowerUp } from '../entities/powerup.js';
import { Mob } from '../entities/mob.js';
import { AudioManager } from '../utils/audio.js';
import { InputManager } from './input.js';
import { ScoreManager } from './score.js';
import { isColliding } from './collision.js';
import { getRandomEntityType } from '../utils/entity-helpers.js';
import { GAME_CONSTANTS } from '../utils/constants.js';
import { MOB_TYPES } from '../config/mobs.js';
import { OBSTACLE_TYPES } from '../config/obstacles.js';
import { POWER_UP_TYPES } from '../config/powerups.js';
import { particleSystem } from '../effects/particles.js';

/**
 * 🎯 DinoGame is the main class that controls everything in our game
 * Think of it like the game engine in Fortnite - it makes sure all parts work together:
 * - 🦖 The dino jumps and runs
 * - 🌵 Obstacles appear to dodge
 * - ⭐ Power-ups give special abilities
 * - 🎵 Music and sound effects play
 * - 📊 Score keeps track of how well you're doing
 */
export class DinoGame {
    /**
     * The constructor is like a recipe that sets up everything we need when the game starts.
     * It's called automatically when we create a new game.
     */
    constructor() {
        // First, let's get all the things we can see on the screen
        this.dino = new Dino(document.getElementById('dino'));
        this.gameContainer = document.getElementById('game-container');

        // Get all our game screens
        this.mainMenuScreen = document.getElementById('main-menu-screen');
        this.howToPlayScreen = document.getElementById('how-to-play-screen');
        this.settingsScreen = document.getElementById('settings-screen');
        this.gameOverScreen = document.getElementById('game-over-screen');

        // Get all our menu buttons
        this.startGameBtn = document.getElementById('start-game-btn');
        this.howToPlayBtn = document.getElementById('how-to-play-btn');
        this.settingsBtn = document.getElementById('settings-btn');
        this.backBtns = document.querySelectorAll('.back-btn');
        this.menuBtn = document.getElementById('menu-btn');
        this.restartBtn = document.getElementById('restart-btn');

        // Get our settings controls
        this.volumeSlider = document.getElementById('volume-slider');
        this.volumeValue = document.getElementById('volume-value');

        // Get the places where we'll show the score
        this.finalScoreContainer = document.getElementById('final-score-container');
        this.finalScoreElement = this.finalScoreContainer.querySelector('.final-score');
        this.highScoreMessage = document.querySelector('.high-score-message');

        // Create our sound player and score keeper
        this.audioManager = new AudioManager();
        this.scoreManager = new ScoreManager(
            document.getElementById('score-value'),
            document.getElementById('high-score-value'),
        );

        // Set up our controls
        this.inputManager = new InputManager();
        this.bindEvents();

        // Set up our particle system for visual effects
        this.particles = particleSystem;

        // Performance settings
        this.lastFrameTime = 0;
        this.targetFPS = 60;
        this.frameInterval = 1000 / this.targetFPS;
        this.deltaTime = 0;
        this.accumulator = 0;

        // Set up all our game's starting conditions
        this.currentState = 'MENU';  // Start at main menu
        this.isGameOver = false;     // Did we lose?
        this.gameSpeed = GAME_CONSTANTS.GAME_SPEED.INITIAL;  // How fast everything moves

        // Lists to keep track of everything in our game
        this.obstacles = [];            // Things to jump over
        this.powerUps = [];             // Special powers to collect
        this.mobs = [];                 // Moving creatures to avoid

        // Timers to control when new things appear
        this.lastObstacleSpawnTime = 0;  // When did we last add an obstacle?
        this.lastPowerUpSpawnTime = 0;   // When did we last add a power-up?
        this.lastMobSpawnTime = 0;       // When did we last add a mob?
        this.lastScoreTime = 0;          // When did we last update the score?

        // Special power-up effects
        this.isSlowMotionActive = false; // Is everything moving in slow motion?
        this.slowMotionTimeout = null;   // Timer for slow motion power-up
        this.isSpeedBoostActive = false; // Is speed boost active?

        // Make sure our dino starts in the correct state
        this.dino.element.classList.remove('crouching', 'running', 'dead');

        // Initialize volume
        this.volumeSlider.value = GAME_CONSTANTS.AUDIO.VOLUME * 100;
        this.volumeValue.textContent = `${Math.round(GAME_CONSTANTS.AUDIO.VOLUME * 100)}%`;

        // Start our game loop - this keeps everything moving
        this.animate = this.animate.bind(this);
        this.animationFrameId = requestAnimationFrame(this.animate);

        // Make our game available everywhere
        window.game = this;
    }

    /**
     * 🎮 Sets up all our controls - what should happen when
     * players press certain keys or click buttons
     */
    bindEvents() {
        // Handle jumping
        this.inputManager.onAction('jump', ({ pressed }) => {
            if (pressed && this.currentState === 'PLAYING' && !this.isGameOver) {
                // Only play jump sound if we actually start a new jump
                const didJumpStart = this.dino.jump(
                    GAME_CONSTANTS.PHYSICS.INITIAL_JUMP_SPEED,
                );
                if (didJumpStart) {
                    this.audioManager.play('jump', this.isSlowMotionActive ? 0.5 : 1);
                    const rect = this.dino.element.getBoundingClientRect();
                    particleSystem.emitJump(rect.left + (rect.width / 2), rect.bottom);
                }
                this.dino.isSpacePressed = true;
            }
            else {
                this.dino.isSpacePressed = false;
            }
        });

        // Handle crouching
        this.inputManager.onAction('crouch', ({ pressed }) => {
            if (this.currentState === 'PLAYING' && !this.isGameOver) {
                this.dino.crouch(pressed);
            }
        });

        // Menu navigation
        this.startGameBtn.addEventListener('click', () => this.startGame());
        this.howToPlayBtn.addEventListener('click', () => this.showScreen('HOW_TO_PLAY'));
        this.settingsBtn.addEventListener('click', () => this.showScreen('SETTINGS'));
        this.backBtns.forEach((btn) => btn.addEventListener('click', () => this.showScreen('MENU')));
        this.menuBtn.addEventListener('click', () => {
            this.showScreen('MENU');
            this.resetGame();
        });
        this.restartBtn.addEventListener('click', () => this.restartGame());

        // Volume control
        this.volumeSlider.addEventListener('input', (event) => {
            const volume = event.target.value / 100;
            this.volumeValue.textContent = `${event.target.value}%`;
            this.audioManager.setVolume(volume);
        });
    }

    /**
     * 🔄 Shows a specific game screen and hides others
     * @param {string} screenState - Which screen to show
     */
    showScreen(screenState) {
        // Hide all screens first
        this.mainMenuScreen.style.display = 'none';
        this.howToPlayScreen.style.display = 'none';
        this.settingsScreen.style.display = 'none';
        this.gameOverScreen.style.display = 'none';

        // Show the requested screen
        switch (screenState) {
            case 'MENU':
                this.mainMenuScreen.style.display = 'flex';
                break;
            case 'HOW_TO_PLAY':
                this.howToPlayScreen.style.display = 'flex';
                break;
            case 'SETTINGS':
                this.settingsScreen.style.display = 'flex';
                break;
            case 'GAME_OVER':
                this.gameOverScreen.style.display = 'flex';
                break;
            case 'PLAYING':
                this.gameContainer.style.display = 'block';
                break;
        }

        this.currentState = screenState;
    }

    /**
     * 🏃‍♂️‍➡️ Begins the game when the player clicks start
     */
    startGame() {
        // Hide all menu screens
        this.showScreen('PLAYING');

        // Reset timers
        this.lastScoreTime = Date.now();
        this.lastPowerUpSpawnTime = Date.now();
        this.lastObstacleSpawnTime = Date.now();
        this.lastMobSpawnTime = Date.now();

        // Start running animation
        this.dino.element.classList.add('running');
    }

    /**
     * 🔁 Resets everything to start a new game
     */
    resetGame() {
        // Reset game state
        this.isGameOver = false;
        this.gameSpeed = GAME_CONSTANTS.GAME_SPEED.INITIAL;

        // Clean up all game entities
        [...this.obstacles, ...this.powerUps, ...this.mobs].forEach((entity) => entity.remove());

        // Reset arrays
        this.obstacles = [];
        this.powerUps = [];
        this.mobs = [];
        this.lastObstacleSpawnTime = 0;
        this.lastPowerUpSpawnTime = 0;
        this.lastMobSpawnTime = 0;
        this.lastScoreTime = 0;
        this.deactivateSlowMotion();
        this.deactivateSpeedBoost();

        // Reset the dino
        this.dino.reset();
        this.dino.element.classList.remove('crouching', 'running', 'dead');

        // Reset the score
        this.scoreManager.reset();
        this.highScoreMessage.classList.remove('visible');
    }

    /**
     * 🔄 Restarts the game immediately
     */
    restartGame() {
        this.resetGame();
        this.startGame();
    }

    /**
     * 💀 Handles what happens when the dino hits an obstacle
     */
    gameOver() {
        // Set game over state immediately to stop updates
        this.currentState = 'GAME_OVER';
        this.isGameOver = true;

        // Stop the dino and play game over sound
        this.dino.element.classList.remove('crouching', 'running');
        this.dino.element.classList.add('dead');
        this.audioManager.play('gameOver');

        // Delay showing game over screen to let collision effects play
        setTimeout(() => {
            // Get the current score and check if it's a new high score
            const currentScore = this.scoreManager.getScore(false);
            const isNewHighScore = this.scoreManager.isNewHighScore();

            // Update the high score if needed
            if (isNewHighScore) {
                this.scoreManager.updateHighScore();
            }

            // Show game over screen
            this.showScreen('GAME_OVER');
            this.finalScoreElement.textContent = String(currentScore).padStart(5, '0');

            // Show/hide high score message using classList
            if (isNewHighScore) {
                this.highScoreMessage.classList.add('visible');
                this.audioManager.play('point'); // Play a celebratory sound
            }
            else {
                this.highScoreMessage.classList.remove('visible');
            }
        }, 600); // Delay of 600ms to show collision effects
    }

    /**
     * 🪨 Creates new obstacles for the dino to jump over
     */
    spawnObstacle() {
        // Don't spawn if game isn't in playing state
        if (this.currentState !== 'PLAYING' || this.isGameOver) {
            return;
        }

        const currentTime = Date.now();
        const timeSinceLastObstacle = currentTime - this.lastObstacleSpawnTime;

        // Only spawn if enough time has passed since last spawn
        if (timeSinceLastObstacle >= GAME_CONSTANTS.OBSTACLE.MIN_INTERVAL) {
            const obstacleType = getRandomEntityType(OBSTACLE_TYPES);
            if (obstacleType !== null) {
                const obstacle = new Obstacle(this.gameContainer, OBSTACLE_TYPES[obstacleType]);
                this.obstacles.push(obstacle);
                this.lastObstacleSpawnTime = currentTime;
            }
        }
    }

    /**
     * 🐣 Creates new mobs that move with their own behaviour
     */
    spawnMob() {
        // Don't spawn if game isn't in playing state
        if (this.currentState !== 'PLAYING' || this.isGameOver) {
            return;
        }

        const currentTime = Date.now();
        const timeSinceLastMob = currentTime - this.lastMobSpawnTime;

        // Only spawn if enough time has passed since last spawn
        if (timeSinceLastMob < GAME_CONSTANTS.MOB.MIN_INTERVAL) {
            return;
        }

        // Random chance to spawn when interval is met
        if (Math.random() < GAME_CONSTANTS.MOB.SPAWN_CHANCE) {
            const mobType = getRandomEntityType(MOB_TYPES);
            if (mobType !== null) {
                const mob = new Mob(this.gameContainer, MOB_TYPES[mobType]);
                this.mobs.push(mob);
                this.lastMobSpawnTime = currentTime;
            }
        }
    }

    /**
     * 🎁 Creates new power-ups for the dino to collect
     */
    spawnPowerUp() {
        // Don't spawn if game isn't in playing state
        if (this.currentState !== 'PLAYING' || this.isGameOver) {
            return;
        }

        const currentTime = Date.now();
        const timeSinceLastPowerUp = currentTime - this.lastPowerUpSpawnTime;

        // Only spawn if enough time has passed
        if (timeSinceLastPowerUp < GAME_CONSTANTS.POWER_UPS.MIN_INTERVAL) {
            return;
        }

        // Random chance to spawn when interval is met
        if (Math.random() < GAME_CONSTANTS.POWER_UPS.SPAWN_CHANCE) {
            const powerUpType = getRandomEntityType(POWER_UP_TYPES);
            if (powerUpType !== null) {
                const powerUp = new PowerUp(this.gameContainer, POWER_UP_TYPES[powerUpType]);
                this.powerUps.push(powerUp);
                this.lastPowerUpSpawnTime = currentTime;
            }
        }
    }

    /**
     * 🎯 Handles what happens when the dino collects a power-up
     * @param {PowerUp} powerUp - The power-up that was collected
     */
    collectPowerUp(powerUp) {
        // Remove from active power-ups list
        this.powerUps = this.powerUps.filter((p) => p !== powerUp);

        // Apply power-up effects
        powerUp.collect(this);
    }

    /**
     * ⏰ Activates slow motion effect
     */
    activateSlowMotion() {
        this.isSlowMotionActive = true;
        document.body.classList.add('slow-motion');
    }

    /**
     * ⏰ Deactivates slow motion effect
     */
    deactivateSlowMotion() {
        this.isSlowMotionActive = false;
        document.body.classList.remove('slow-motion');
    }

    /**
     * ⚡ Activates speed boost effect
     */
    activateSpeedBoost() {
        this.isSpeedBoostActive = true;
        this.gameSpeed *= GAME_CONSTANTS.POWER_UPS.SPEED_BOOST.SPEED_MULTIPLIER;
    }

    /**
     * ⚡ Deactivates speed boost effect
     */
    deactivateSpeedBoost() {
        this.isSpeedBoostActive = false;
        this.gameSpeed /= GAME_CONSTANTS.POWER_UPS.SPEED_BOOST.SPEED_MULTIPLIER;
    }

    /**
     * 🧹 Clean up game resources and finalise
     */
    destroy() {
        // Clean up input manager
        this.inputManager.destroy();

        // Clean up game entities
        [...this.obstacles, ...this.powerUps, ...this.mobs].forEach((entity) => entity.remove());

        // Stop animation frame
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
        }

        // Remove global reference
        window.game = undefined;
    }

    /**
     * 🔄 This is our game loop - it runs many times per second to update everything
     */
    animate(currentTime) {
        // Convert to seconds for easier physics calculations
        currentTime = currentTime / 1000;

        if (this.lastFrameTime === 0) {
            this.lastFrameTime = currentTime;
        }

        // Calculate delta time and cap it to prevent spiral of death
        this.deltaTime = Math.min(currentTime - this.lastFrameTime, 0.1);
        this.lastFrameTime = currentTime;

        this.accumulator += this.deltaTime;

        // Update particle system every frame
        this.particles.update();

        // Only update game state if we're playing
        if (this.currentState === 'PLAYING' && !this.isGameOver) {
            // Calculate current speed multiplier
            let speedMultiplier = 1;
            if (this.isSlowMotionActive) {
                speedMultiplier *= GAME_CONSTANTS.POWER_UPS.SLOW_MOTION.SPEED_MULTIPLIER;
            }
            if (this.isSpeedBoostActive) {
                speedMultiplier *= GAME_CONSTANTS.POWER_UPS.SPEED_BOOST.SPEED_MULTIPLIER;
            }

            // Update dino with delta time
            this.dino.updatePosition(
                GAME_CONSTANTS.PHYSICS.GRAVITY,
                GAME_CONSTANTS.PHYSICS.JUMP_BOOST_SPEED,
                GAME_CONSTANTS.PHYSICS.MAX_BOOST_TIME,
                this.isSlowMotionActive,
                speedMultiplier * this.deltaTime * this.targetFPS,
            );

            // Update game state
            while (this.accumulator >= 1 / this.targetFPS) {
                this.updates();
                this.updateScore();

                // Update game speed
                if (this.gameSpeed < GAME_CONSTANTS.GAME_SPEED.MAX) {
                    this.gameSpeed += GAME_CONSTANTS.GAME_SPEED.ACCELERATION * (1 / this.targetFPS);
                }

                this.accumulator -= 1 / this.targetFPS;
            }
        }

        // Request next frame
        this.animationFrameId = requestAnimationFrame(this.animate.bind(this));
    }

    /**
     * Batch DOM updates
     */
    updates() {
        // Spawn and update entities
        this.spawnObstacle();
        this.spawnMob();
        this.spawnPowerUp();

        // Calculate current speed multiplier
        let speedMultiplier = 1;
        if (this.isSlowMotionActive) {
            speedMultiplier *= GAME_CONSTANTS.POWER_UPS.SLOW_MOTION.SPEED_MULTIPLIER;
        }
        if (this.isSpeedBoostActive) {
            speedMultiplier *= GAME_CONSTANTS.POWER_UPS.SPEED_BOOST.SPEED_MULTIPLIER;
        }

        const timeStep = speedMultiplier * this.deltaTime * this.targetFPS;

        // Update and filter entities
        this.updateEntities(timeStep);
    }

    /**
     * Update all game entities
     * @param {number} timeStep
     */
    updateEntities(timeStep) {
        // Update and filter mobs
        this.mobs = this.mobs.reduce((activeMobs, mob) => {
            if (mob.update(timeStep, this.gameSpeed)) {
                if (isColliding(this.dino, mob)) {
                    mob.onCollision();

                    // Delay game over to let particles show
                    setTimeout(() => this.gameOver(), 100);
                    this.isGameOver = true; // Stop updates immediately
                }

                activeMobs.push(mob);
            }
            else {
                mob.remove();
            }

            return activeMobs;
        }, []);

        // Update and filter obstacles
        this.obstacles = this.obstacles.reduce((activeObstacles, obstacle) => {
            if (obstacle.update(timeStep, this.gameSpeed)) {
                if (isColliding(this.dino, obstacle, { isHole: obstacle.type === 'hole' })) {
                    obstacle.onCollision();

                    if (obstacle.type === 'hole') {
                        // Play fall sound and animation
                        this.audioManager.play('fall');
                        this.dino.element.classList.add('falling');

                        // Longer delay for fall animation
                        setTimeout(() => this.gameOver(), 600);
                    }
                    else {
                        // Regular collision handling
                        setTimeout(() => this.gameOver(), 100);
                    }

                    this.isGameOver = true; // Stop updates immediately
                }

                activeObstacles.push(obstacle);
            }
            else {
                obstacle.remove();
            }

            return activeObstacles;
        }, []);

        // Update and filter power-ups
        this.powerUps = this.powerUps.reduce((activePowerUps, powerUp) => {
            if (powerUp.update(timeStep, this.gameSpeed)) {
                if (isColliding(this.dino, powerUp)) {
                    this.collectPowerUp(powerUp);
                    powerUp.remove();

                    return activePowerUps;
                }

                activePowerUps.push(powerUp);
            }
            else {
                powerUp.remove();
            }

            return activePowerUps;
        }, []);
    }

    updateScore() {
        const now = Date.now();
        if (now - this.lastScoreTime >= (this.isSlowMotionActive ? 200 : 100)) {
            this.scoreManager.increment();
            this.lastScoreTime = now;
        }
    }
}

// Initialise game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    const game = new DinoGame();

    // Clean up when page unloads
    window.addEventListener('unload', () => {
        game.destroy();
    });
});
