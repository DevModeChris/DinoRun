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
    #previousX;

    /** @type {number} */
    #bodyWidth;

    /** @type {number} */
    #bodyHeight;

    /** @type {number} */
    #bodyOffsetX;

    /** @type {number} */
    #bodyOffsetY;

    /**
     * Creates a new obstacle for our dino to dodge
     *
     * @param {Phaser.Scene} scene - The game scene where this obstacle lives
     * @param {number} x - How far from the left to place the obstacle
     * @param {number} y - How far from the top to place the obstacle
     * @param {string} textureKey - The key of the sprite sheet containing obstacle images
     * @param {string} frameKey - Which obstacle style to use from the sprite sheet
     * @param {number} scrollSpeed - How fast the obstacle moves left (matches ground speed)
     */
    constructor(scene, x, y, textureKey, frameKey, scrollSpeed) {
        super(scene, x, y, textureKey, frameKey);

        this.#scrollSpeed = scrollSpeed;
        this.#previousX = x;
        this.#bodyWidth = 0;
        this.#bodyHeight = 0;
        this.#bodyOffsetX = 0;
        this.#bodyOffsetY = 0;

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
        this.#bodyWidth = width;
        this.#bodyHeight = height;
        this.#bodyOffsetX = offsetX;
        this.#bodyOffsetY = offsetY;

        if (this.body) {
            this.body.setSize(width, height);

            // Center the body within the sprite first
            const centerX = this.x - (width / 2);
            const centerY = this.y - (height / 2);

            // Then apply the offsets
            this.body.position.x = centerX + offsetX;
            this.body.position.y = centerY + offsetY;
        }
    }

    /**
     * Updates the obstacle position each frame to move with the ground
     * Like it's glued to our scrolling ground! 🏃‍♂️
     *
     * @param {number} delta - Time since last update in milliseconds
     */
    update(delta) {
        // Calculate new position
        const deltaSeconds = delta / 1000;
        const newX = this.x - (this.#scrollSpeed * deltaSeconds);

        // Update position and store previous position
        this.x = newX;
        this.#previousX = newX;

        // If the obstacle has moved completely off screen to the left, destroy it
        if (this.x < -this.width) {
            this.destroy();
        }

        // Update physics body position and size
        if (this.body) {
            // Center the body within the sprite first
            const centerX = this.x - (this.#bodyWidth / 2);
            const centerY = this.y - (this.#bodyHeight / 2);

            // Then apply the offsets
            this.body.position.x = centerX + this.#bodyOffsetX;
            this.body.position.y = centerY + this.#bodyOffsetY;

            this.body.setSize(this.#bodyWidth, this.#bodyHeight);
        }
    }
}
