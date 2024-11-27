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
        this.startScreen = document.getElementById('start-screen');
        this.gameOverScreen = document.getElementById('game-over-screen');

        // Get the places where we'll show the score
        this.finalScoreContainer = document.getElementById('final-score-container');
        this.finalScoreElement = this.finalScoreContainer.querySelector('.final-score');
        this.highScoreMessage = document.querySelector('.high-score-message');

        this.restartBtn = document.getElementById('restart-btn');

        // Create our sound player and score keeper
        this.audioManager = new AudioManager();
        this.scoreManager = new ScoreManager(
            document.getElementById('score-value'),
            document.getElementById('high-score-value'),
        );

        // Set up our controls
        this.inputManager = new InputManager();
        this.bindEvents();

        // Set up all our game's starting conditions
        this.gameStarted = false;        // Is the game running?
        this.isGameOver = false;         // Did we lose?
        this.gameSpeed = GAME_CONSTANTS.GAME_SPEED.INITIAL;  // How fast everything moves

        // Lists to keep track of everything in our game
        this.obstacles = [];             // Things to jump over
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
        // Set up input handling
        this.inputManager.onAction('jump', ({ pressed }) => {
            if (pressed) {
                // Start game if not started
                if (!this.gameStarted && !this.isGameOver) {
                    this.startGame();
                    return;
                }

                // Handle jumping
                if (!this.isGameOver) {
                    // Only play jump sound if we actually start a new jump
                    const didJumpStart = this.dino.jump(
                        GAME_CONSTANTS.PHYSICS.INITIAL_JUMP_SPEED,
                    );
                    if (didJumpStart) {
                        this.audioManager.play('jump', this.isSlowMotionActive ? 0.5 : 1);
                    }
                }
                this.dino.isSpacePressed = true;
            }
            else {
                this.dino.isSpacePressed = false;
            }
        });

        this.inputManager.onAction('crouch', ({ pressed }) => {
            if (!this.isGameOver && this.gameStarted) {
                this.dino.crouch(pressed);
            }
        });

        this.inputManager.onAction('restart', ({ pressed }) => {
            if (pressed && this.isGameOver) {
                this.restartGame();
            }
        });

        // Button click handling
        this.restartBtn.addEventListener('click', () => this.restartGame());
    }

    /**
     * 🏃‍♂️‍➡️ Begins the game when the player first presses the spacebar
     */
    startGame() {
        if (this.isGameOver) {
            return;
        }

        // Hide the start screen
        this.startScreen.style.display = 'none';

        // Start the game
        this.gameStarted = true;
        this.lastScoreTime = Date.now();
        this.lastPowerUpSpawnTime = Date.now();
        this.dino.element.classList.add('running');
    }

    /**
     * 💀 Handles what happens when the dino hits an obstacle
     */
    gameOver() {
        // Set game over state
        this.isGameOver = true;
        this.gameStarted = false;

        // Get the current score and check if it's a new high score
        const currentScore = this.scoreManager.getScore(false);
        const isNewHighScore = this.scoreManager.isNewHighScore();

        // Update the high score if needed
        if (isNewHighScore) {
            this.scoreManager.updateHighScore();
        }

        // Show game over screen
        this.gameOverScreen.style.display = 'flex';
        this.finalScoreElement.textContent = String(currentScore).padStart(5, '0');

        // Show/hide high score message using classList
        if (isNewHighScore) {
            this.highScoreMessage.classList.add('visible');
            this.audioManager.play('point'); // Play a celebratory sound
        }
        else {
            this.highScoreMessage.classList.remove('visible');
        }

        // Stop the dino and play game over sound
        this.dino.element.classList.remove('crouching', 'running');
        this.dino.element.classList.add('dead');
        this.audioManager.play('gameOver');
    }

    /**
     * 🔁 Resets everything to start a new game
     */
    restartGame() {
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

        // Hide the game over screen and show the start screen
        this.gameOverScreen.style.display = 'none';
        this.startScreen.style.display = 'flex';

        // Reset game started flag
        this.gameStarted = false;
    }

    /**
     * 🪨 Creates new obstacles for the dino to jump over
     */
    spawnObstacle() {
        // Don't spawn if game hasn't started
        if (!this.gameStarted || this.isGameOver) {
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
        // Don't spawn if game hasn't started
        if (!this.gameStarted || this.isGameOver) {
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
        // Don't spawn if game hasn't started
        if (!this.gameStarted || this.isGameOver) {
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
    animate() {
        if (this.gameStarted && !this.isGameOver) {
            // Update the dino's position
            this.dino.updatePosition(
                GAME_CONSTANTS.PHYSICS.GRAVITY,
                GAME_CONSTANTS.PHYSICS.JUMP_BOOST_SPEED,
                GAME_CONSTANTS.PHYSICS.MAX_BOOST_TIME,
                this.isSlowMotionActive,
                GAME_CONSTANTS.POWER_UPS.SLOW_MOTION.SPEED_MULTIPLIER,
            );

            // Calculate current speed multiplier
            let speedMultiplier = 1;
            if (this.isSlowMotionActive) {
                speedMultiplier *= GAME_CONSTANTS.POWER_UPS.SLOW_MOTION.SPEED_MULTIPLIER;
            }
            if (this.isSpeedBoostActive) {
                speedMultiplier *= GAME_CONSTANTS.POWER_UPS.SPEED_BOOST.SPEED_MULTIPLIER;
            }

            // Spawn and update obstacles
            this.spawnObstacle();

            // Spawn and update mobs
            this.spawnMob();

            // Spawn and update power-ups
            this.spawnPowerUp();

            // Update and filter mobs in a single pass
            this.mobs = this.mobs.reduce((activeMobs, mob) => {
                if (mob.update(speedMultiplier, this.gameSpeed)) {
                    // Check for collisions with mobs
                    if (isColliding(this.dino, mob)) {
                        this.gameOver();
                    }
                    activeMobs.push(mob);
                }
                else {
                    mob.remove();
                }

                return activeMobs;
            }, []);

            // Update and filter obstacles in a single pass
            this.obstacles = this.obstacles.reduce((activeObstacles, obstacle) => {
                if (obstacle.update(speedMultiplier, this.gameSpeed)) {
                    // Check for collisions with obstacles
                    if (isColliding(this.dino, obstacle, {
                        isHole: obstacle.type === 'hole',
                    })) {
                        if (obstacle.type === 'hole' && !this.dino.isFalling) {
                            // Handle falling into hole
                            this.isGameOver = true;
                            this.dino.fall().then(() => this.gameOver());
                            this.audioManager.play('fall');
                        }
                        else {
                            this.gameOver();
                        }
                    }
                    activeObstacles.push(obstacle);
                }
                else {
                    obstacle.remove();
                }

                return activeObstacles;
            }, []);

            // Update and filter power-ups in a single pass
            this.powerUps = this.powerUps.reduce((activePowerUps, powerUp) => {
                if (powerUp.update(speedMultiplier, this.gameSpeed)) {
                    // Check for collisions with power-ups
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

            // Update game speed
            if (this.gameSpeed < GAME_CONSTANTS.GAME_SPEED.MAX) {
                this.gameSpeed += GAME_CONSTANTS.GAME_SPEED.ACCELERATION;
            }

            // Update score
            const currentTime = Date.now();
            if (currentTime - this.lastScoreTime >= (this.isSlowMotionActive ? 200 : 100)) {
                this.scoreManager.increment();
                this.lastScoreTime = currentTime;
            }
        }

        // Always request next frame first to keep animation smooth
        this.animationFrameId = requestAnimationFrame(this.animate);
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
