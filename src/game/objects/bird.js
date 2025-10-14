/**
 * 🦅 The Bird class represents our flying enemy!
 *
 * These pesky birds try to knock our dino out of the sky.
 */
import Phaser from 'phaser';

export class Bird extends Phaser.GameObjects.Sprite {
    /** @type {number} */
    static WIDTH = 32;

    /** @type {number} */
    static HEIGHT = 32;

    /** @type {{min: number, max: number}} */
    static BASE_SPEED_RANGE = {
        min: 1.6,  // Faster birds (multiplier relative to ground speed)
        max: 1.8,  // Slower birds (multiplier relative to ground speed)
    };

    /** @type {number[]} */
    static SPAWN_HEIGHTS = [120, 130, 140, 150, 200, 220, 240, 250]; // Heights above ground level

    /** @type {number} */
    #speedMultiplier;

    /** @type {number} */
    #currentGameSpeed;

    /**
     * Creates a new bird enemy! 🦅
     *
     * @param {Phaser.Scene} scene - The scene that owns this bird
     * @param {number} x - The bird's starting x position
     * @param {number} y - The bird's starting y position
     * @param {number} gameSpeed - The current game speed
     */
    constructor(scene, x, y, gameSpeed) {
        super(scene, x, y, 'bird-sprites');

        // Set depth above sky,stars,etc but below lighting and ui
        this.setDepth(200);

        // Add to scene and enable physics
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Store initial game speed
        this.#currentGameSpeed = gameSpeed;

        // Calculate speed multiplier based on gameSpeed
        // Base multiplier range for gameSpeed 280 is 1.6 - 1.8
        // Add an extra boost proportional to how much gameSpeed exceeds 280
        const baseMultiplier = Phaser.Math.FloatBetween(Bird.BASE_SPEED_RANGE.min, Bird.BASE_SPEED_RANGE.max);
        const extraBoost = (gameSpeed - 280) / 500;
        this.#speedMultiplier = baseMultiplier + extraBoost;

        // Set up physics body
        /** @type {Phaser.Physics.Arcade.Body} */
        const body = this.body;
        body.setSize(Bird.WIDTH, Bird.HEIGHT);
        body.setAllowGravity(false);

        // Create flying animation if it doesn't exist
        if (!scene.anims.exists('bird-fly')) {
            scene.anims.create({
                key: 'bird-fly',
                frames: scene.anims.generateFrameNumbers('bird-sprites', {
                    start: 0,
                    end: 8,
                }),
                frameRate: 12,
                repeat: -1,
            });
        }

        // Start flying!
        this.play('bird-fly');

        // Register update handler so that the bird moves each frame using delta time
        this.scene.events.on('update', this.update, this);

        // Auto-destroy when off screen
        this.checkDestroy = this.scene.time.addEvent({
            delay: 100,
            callback: this.#checkIfOffScreen,
            callbackScope: this,
            loop: true,
        });
    }

    /**
     * Updates the bird's position based on game speed and delta time
     *
     * @param {number} _time - Time since last update in milliseconds
     * @param {number} _delta - Time since last update in milliseconds
     */
    update(_time, _delta) {
        // If the bird is not active, skip update
        if (!this.active) {
            return;
        }

        // Update the physics body's horizontal velocity based on the current game speed and multiplier
        if (this.body && this.body.enable) {
            this.body.setVelocityX(-this.#currentGameSpeed * this.#speedMultiplier);
        }
    }

    /**
     * Updates the current game speed
     *
     * @param {number} newSpeed - The new game speed
     */
    setGameSpeed(newSpeed) {
        this.#currentGameSpeed = newSpeed;
    }

    /**
     * Checks if the bird has flown off screen and returns it to the pool if so
     */
    #checkIfOffScreen() {
        if (this.x < -Bird.WIDTH) {
            this.returnToPool();
        }
    }

    /**
     * Spawns/resets this bird instance at a random height
     * This is used for object pooling! ♻️
     *
     * @param {number} gameSpeed - The current game speed
     */
    spawn(gameSpeed) {
        const gameWidth = this.scene.scale.width;
        const groundY = this.scene.scale.height - 30; // Ground level
        const heightAboveGround = Phaser.Math.RND.pick(Bird.SPAWN_HEIGHTS);
        const spawnY = groundY - heightAboveGround;

        // Reset position
        this.setPosition(gameWidth + Bird.WIDTH, spawnY);

        // Reset game speed
        this.#currentGameSpeed = gameSpeed;

        // Recalculate speed multiplier
        const baseMultiplier = Phaser.Math.FloatBetween(Bird.BASE_SPEED_RANGE.min, Bird.BASE_SPEED_RANGE.max);
        const extraBoost = (gameSpeed - 280) / 500;
        this.#speedMultiplier = baseMultiplier + extraBoost;

        // Reset physics
        if (this.body) {
            this.body.setVelocityX(-this.#currentGameSpeed * this.#speedMultiplier);
        }

        // Make visible and active
        this.setActive(true);
        this.setVisible(true);

        // Restart animation
        this.play('bird-fly');

        // Restart off-screen check timer if it was stopped
        if (this.checkDestroy && !this.checkDestroy.paused) {
            this.checkDestroy.paused = false;
        }
    }

    /**
     * Returns this bird to the pool for reuse
     * Like putting a toy back in the toy box! 🧸
     */
    returnToPool() {
        // Stop animation
        this.anims.stop();

        // Stop physics
        if (this.body) {
            this.body.setVelocityX(0);
        }

        // Pause the off-screen check timer
        if (this.checkDestroy) {
            this.checkDestroy.paused = true;
        }

        // Hide and deactivate
        this.setActive(false);
        this.setVisible(false);
    }

    /**
     * Pause bird animations and movement
     */
    pause() {
        this.anims.pause();
        this.body.setVelocityX(0);
    }

    /**
     * Resume bird animations and movement
     */
    resume() {
        this.anims.resume();
        this.body.setVelocityX(-this.#currentGameSpeed * this.#speedMultiplier);
    }

    /**
     * Creates a new bird at a random height above the ground
     * @deprecated Use spawn() instance method with object pooling instead
     *
     * @param {Phaser.Scene} scene - The scene to spawn the bird in
     * @param {number} gameSpeed - The current game speed
     * @returns {Bird} The newly created bird
     */
    static spawn(scene, gameSpeed) {
        const gameWidth = scene.scale.width;
        const groundY = scene.scale.height - 30; // Ground level
        const heightAboveGround = Phaser.Math.RND.pick(Bird.SPAWN_HEIGHTS);
        const spawnY = groundY - heightAboveGround;

        return new Bird(scene, gameWidth + Bird.WIDTH, spawnY, gameSpeed);
    }

    /**
     * Overrides the default destroy method to also remove the update event listener
     */
    destroy(...args) {
        // Clean up timer
        if (this.checkDestroy) {
            this.checkDestroy.destroy();
            this.checkDestroy = null;
        }

        // Remove the update event listener if scene exists, to avoid memory leaks
        if (this.scene && this.scene.events) {
            this.scene.events.off('update', this.update, this);
        }

        super.destroy(...args);
    }
}
