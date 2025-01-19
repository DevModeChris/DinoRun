/**
 * 🚧 The Obstacle class is like a factory for making things that get in our dino's way!
 *
 * All the tricky things our dino needs to dodge will be made from this special template.
 */
import Phaser from 'phaser';

export class Obstacle extends Phaser.GameObjects.Sprite {
    /** @type {number} */
    #scrollSpeed;

    /** @type {number} */
    #originalVelocityX;

    /**
     * Creates a new obstacle for our dino to dodge
     *
     * @param {Phaser.Scene} scene - The game scene where this obstacle lives
     * @param {number} x - How far from the left to place the obstacle
     * @param {number} y - How far from the top to place the obstacle
     * @param {string} texture - The key of the sprite sheet containing obstacle images
     * @param {string} frame - Which obstacle style to use from the sprite sheet
     * @param {number} scrollSpeed - How fast the obstacle moves left (matches ground speed)
     */
    constructor(scene, x, y, texture, frame, scrollSpeed) {
        super(scene, x, y, texture, frame);

        this.#scrollSpeed = scrollSpeed;
        this.#originalVelocityX = 0;

        // Set depth above sky,stars,etc but below lighting and ui
        this.setDepth(200);

        // Add to the scene
        scene.add.existing(this);
    }

    /**
     * Sets up the physics body for this obstacle
     * Like giving it a solid shape that can bump into things! 📦
     *
     * @param {boolean} [isStatic=true] - Whether the obstacle should be immovable
     */
    setupPhysics(isStatic = true) {
        this.scene.physics.add.existing(this, isStatic);
    }

    /**
     * Store the collision box dimensions so we can maintain them
     *
     * @param {number} width - Width of the collision box
     * @param {number} height - Height of the collision box
     * @param {number} offsetX - X offset for the collision box
     * @param {number} offsetY - Y offset for the collision box
     */
    setCollisionBox(width, height, offsetX = 0, offsetY = 0) {
        if (!this.body) {
            return;
        }

        // Set the collision box size
        this.body.setSize(width, height);

        // Calculate the offset from the sprite's origin
        const offsetFromOrigin = {
            x: (this.displayWidth * this.originX) - (width * 0.5) + offsetX,
            y: (this.displayHeight * this.originY) - (height * 0.5) + offsetY,
        };

        // Set the offset
        this.body.setOffset(offsetFromOrigin.x, offsetFromOrigin.y);
    }

    /**
     * Pause obstacle movement
     */
    pause() {
        // For static bodies (like rocks), we don't need to store velocity
        if (!this.body || this.body.immovable) {
            return;
        }

        this.#originalVelocityX = this.body.velocity.x;
        this.body.setVelocityX(0);
    }

    /**
     * Resume obstacle movement
     */
    resume() {
        // For static bodies (like rocks), we don't need to restore velocity
        if (!this.body || this.body.immovable) {
            return;
        }

        this.body.setVelocityX(this.#originalVelocityX);
    }

    /**
     * Updates the obstacle position each frame to move with the ground
     * Like it's glued to our scrolling ground! 🏃‍♂️
     *
     * @param {number} _delta - Time since last update in milliseconds
     */
    update(_delta) {
        // Get the current ground speed from the game scene
        const currentSpeed = this.scene.getGroundSpeed();

        // Update our speed to match the ground
        this.#scrollSpeed = currentSpeed;

        // Move left with the ground using physics
        if (this.body) {
            this.body.setVelocityX(-this.#scrollSpeed);
        }

        // Clean up when off screen
        if (this.x < -this.width) {
            this.destroy();
        }
    }
}
