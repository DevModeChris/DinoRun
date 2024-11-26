// Import all the different parts of our game
import { Dino } from '../entities/dino.js';
import { Obstacle } from '../entities/obstacle.js';
import { PowerUp } from '../entities/powerup.js';
import { AudioManager } from '../utils/audio.js';
import { GAME_CONSTANTS } from '../utils/constants.js';
import { ScoreManager } from './score.js';
import { isColliding } from './collision.js';

/**
 * DinoGame is the main class that controls everything in our game.
 * Think of it like the game engine in Fortnite - it makes sure all the parts of
 * (dino, obstacles, scoring, etc.) work together in harmony!
 */
export class DinoGame {
    /**
     * The constructor is like a recipe that sets up everything we need when the game starts.
     * It's called automatically when we create a new game.
     */
    constructor() {
        // First, we get all the elements from our HTML that we'll need
        this.dino = new Dino(document.getElementById('dino'));
        this.gameContainer = document.getElementById('game');
        this.startScreen = document.getElementById('start-screen');
        this.gameOverScreen = document.getElementById('game-over-screen');

        // Get the score container and its child elements
        this.finalScoreContainer = document.getElementById('final-score-container');
        this.finalScoreElement = this.finalScoreContainer.querySelector('.final-score');
        this.highScoreMessage = document.querySelector('.high-score-message');

        this.restartBtn = document.getElementById('restart-btn');

        // Create our helper managers for sound and scoring
        this.audioManager = new AudioManager();
        this.scoreManager = new ScoreManager(
            document.getElementById('score-value'),
            document.getElementById('high-score-value'),
        );

        // Set up our game's starting conditions
        this.gameStarted = false; // The game hasn't started yet
        this.isGameOver = false; // The game isn't over yet
        this.gameSpeed = GAME_CONSTANTS.GAME_SPEED.INITIAL; // How fast the game moves
        this.obstacles = []; // List to keep track of all obstacles
        this.powerUps = []; // List to keep track of all power-ups
        this.lastObstacleTime = 0; // When did we last create an obstacle?
        this.lastPowerUpTime = 0; // When did we last create a power-up?
        this.lastScoreTime = 0; // When did we last update the score?
        this.isSlowMotionActive = false; // Is slow-motion power-up active?
        this.slowMotionTimeout = null; // Timer for slow-motion power-up

        // Make sure dino starts in the correct state
        this.dino.element.classList.remove('crouching', 'running', 'dead');

        // Set up our event listeners (watching for player actions)
        this.bindEvents();

        // Start our game loop
        this.animate = this.animate.bind(this);
        requestAnimationFrame(this.animate);

        // Expose game instance globally
        window.game = this;
    }

    /**
     * bindEvents sets up all our controls - what should happen when
     * players press certain keys or click buttons
     */
    bindEvents() {
        // Watch for when specific keys are pressed
        document.addEventListener('keydown', (event) => {
            if (event.code === 'Space' || event.code === 'ArrowUp') {
                event.preventDefault();
                if (!this.isGameOver && !this.gameStarted) {
                    this.startGame();
                }
                else if (!this.isGameOver) {
                    // Only play jump sound if we actually start a new jump
                    const didJumpStart = this.dino.jump(
                        GAME_CONSTANTS.PHYSICS.JUMP_STRENGTH,
                    );
                    if (didJumpStart) {
                        this.audioManager.play('jump', this.isSlowMotionActive ? 0.5 : 1);
                    }
                }

                this.dino.isSpacePressed = true;
            }
            else if (
                event.code === 'ArrowDown'
                || event.code === 'ControlLeft'
                || event.code === 'ControlRight'
            ) {
                event.preventDefault();
                if (this.isGameOver || !this.gameStarted) {
                    return;
                }

                this.dino.crouch(true);
            }
            else if (event.code === 'Enter' && this.isGameOver) {
                this.restartGame();
            }
        });

        document.addEventListener('keyup', (event) => {
            if (event.code === 'Space' || event.code === 'ArrowUp') {
                this.dino.isSpacePressed = false;
            }
            else if (
                event.code === 'ArrowDown'
                || event.code === 'ControlLeft'
                || event.code === 'ControlRight'
            ) {
                this.dino.crouch(false);
            }
        });

        this.restartBtn.addEventListener('click', () => this.restartGame());
    }

    /**
     * startGame begins the game when the player first presses the spacebar
     */
    startGame() {
        this.gameStarted = true;
        this.startScreen.style.display = 'none';
        this.dino.element.classList.add('running');

        // Reset the score timer when game starts
        this.lastScoreTime = Date.now();
    }

    /**
     * gameOver handles what happens when the dino hits an obstacle
     */
    gameOver() {
        // Set game over state
        this.isGameOver = true;

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
     * restartGame resets everything to start a new game
     */
    restartGame() {
        // Reset game state
        this.isGameOver = false;
        this.gameSpeed = GAME_CONSTANTS.GAME_SPEED.INITIAL;

        // Clear objects
        this.obstacles.forEach((obstacle) => obstacle.remove());
        this.powerUps.forEach((powerUp) => powerUp.remove());
        this.obstacles = [];
        this.powerUps = [];
        this.lastObstacleTime = 0;
        this.lastPowerUpTime = 0;
        this.lastScoreTime = 0;
        this.deactivateSlowMotion();

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
     * spawnObstacle creates new obstacles for the dino to jump over
     */
    spawnObstacle() {
        const currentTime = Date.now();
        const timeSinceLastObstacle = currentTime - this.lastObstacleTime;
        const minInterval = this.isSlowMotionActive
            ? GAME_CONSTANTS.OBSTACLE.MIN_INTERVAL / GAME_CONSTANTS.POWER_UPS.SLOW_MOTION.SPEED_MULTIPLIER
            : GAME_CONSTANTS.OBSTACLE.MIN_INTERVAL;

        if (timeSinceLastObstacle > minInterval) {
            // Add random delay between min and max interval
            const randomDelay = Math.random() * (GAME_CONSTANTS.OBSTACLE.MAX_INTERVAL - GAME_CONSTANTS.OBSTACLE.MIN_INTERVAL);

            if (timeSinceLastObstacle > minInterval + randomDelay) {
                this.obstacles.push(new Obstacle(this.gameContainer, this.gameSpeed));
                this.lastObstacleTime = currentTime;
            }
        }
    }

    /**
     * spawnPowerUp creates new power-ups that give special abilities
     */
    spawnPowerUp() {
        const currentTime = Date.now();
        const timeSinceLastPowerUp = currentTime - this.lastPowerUpTime;

        if (timeSinceLastPowerUp > GAME_CONSTANTS.POWER_UPS.MIN_INTERVAL) {
            this.powerUps.push(new PowerUp(this.gameContainer, this.gameSpeed));
            this.lastPowerUpTime = currentTime;
        }
    }

    /**
     * activateSlowMotion handles what happens when the dino collects a slow-motion power-up
     */
    activateSlowMotion() {
        this.isSlowMotionActive = true;
        document.body.classList.add('slow-motion');

        if (this.slowMotionTimeout) {
            clearTimeout(this.slowMotionTimeout);
        }

        this.slowMotionTimeout = setTimeout(() => {
            this.deactivateSlowMotion();
        }, GAME_CONSTANTS.POWER_UPS.SLOW_MOTION.DURATION);
    }

    /**
     * deactivateSlowMotion handles what happens when the slow-motion power-up ends
     */
    deactivateSlowMotion() {
        this.isSlowMotionActive = false;
        document.body.classList.remove('slow-motion');

        if (this.slowMotionTimeout) {
            clearTimeout(this.slowMotionTimeout);
            this.slowMotionTimeout = null;
        }
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

            // Spawn and update obstacles
            this.spawnObstacle();

            // Calculate current speed multiplier
            const speedMultiplier = this.isSlowMotionActive
                ? GAME_CONSTANTS.POWER_UPS.SLOW_MOTION.SPEED_MULTIPLIER
                : 1;

            // Update and filter obstacles in a single pass
            this.obstacles = this.obstacles.reduce((activeObstacles, obstacle) => {
                if (obstacle.update(speedMultiplier)) {
                    // Check for collisions
                    for (const obstacle of this.obstacles) {
                        if (isColliding(this.dino, obstacle, { isHole: obstacle.type === 'hole' })) {
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
                    }
                    activeObstacles.push(obstacle);
                }
                else {
                    obstacle.remove();
                }
                return activeObstacles;
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

            // Spawn and update power-ups
            this.spawnPowerUp();
            this.powerUps = this.powerUps.filter((powerUp) => {
                const isActive = powerUp.update(speedMultiplier);
                if (!isActive) {
                    powerUp.remove();
                }
                return isActive;
            });

            // Check collisions with power-ups
            for (let i = 0; i < this.powerUps.length; i++) {
                const powerUp = this.powerUps[i];
                if (isColliding(this.dino, powerUp)) {
                    powerUp.remove();
                    this.powerUps.splice(i, 1);
                    this.activateSlowMotion();
                    break;
                }
            }
        }

        // Always request next frame first to keep animation smooth
        requestAnimationFrame(this.animate);
    }
}

// Initialize game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new DinoGame();
});
