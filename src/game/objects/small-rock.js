/**
 * 🪨 The SmallRock class creates those pesky little rocks our dino needs to jump over!
 *
 * These rocks are like nature's hurdles in our dino's running track.
 */
import { Obstacle } from './obstacle';
import { logger } from '../../utils/logger.js';

export class SmallRock extends Obstacle {
    /** @type {string[]} */
    static VARIANTS = ['sml_rock_1', 'sml_rock_2', 'sml_rock_3', 'sml_rock_4', 'sml_rock_5'];

    /** @type {number} */
    static COLLISION_SCALE = 0.6; // 60% of sprite size for tighter collision

    /** @type {number} */
    #initialX;

    /** @type {number} */
    #initialGroundTileX;

    /**
     * Creates a new small rock obstacle
     *
     * @param {Phaser.Scene} scene - The game scene where this rock lives
     * @param {number} x - How far from the left to place the rock
     * @param {number} y - How far from the top to place the rock
     * @param {number} scrollSpeed - How fast the rock moves left (matches ground speed)
     */
    constructor(scene, x, y, scrollSpeed) {
        // Pick a random rock variant
        const frameKey = SmallRock.VARIANTS[Math.floor(Math.random() * SmallRock.VARIANTS.length)];

        super(scene, x, y, 'obstacle-small-rocks-sprites', frameKey, scrollSpeed);

        // Store initial positions
        this.#initialX = x;
        this.#initialGroundTileX = scene.getGround().tilePositionX;

        // Make sure the rock sits nicely on the ground by setting its origin point
        // to the middle-bottom of the sprite
        this.setOrigin(0.5, 0.8);

        // Add to scene
        scene.add.existing(this);

        // Match the ground's scale to ensure consistent movement
        const ground = scene.getGround();
        if (ground) {
            this.setScale(ground.scaleX, ground.scaleY);
        }

        // Get the frame dimensions for this specific rock variant
        const frame = scene.textures.getFrame('obstacle-small-rocks-sprites', frameKey);
        if (!frame) {
            logger.error('Could not get frame data for rock variant:', frameKey);

            return;
        }

        // Calculate collision box dimensions, taking scale into account
        const width = frame.width * SmallRock.COLLISION_SCALE * this.scaleX;
        const height = frame.height * SmallRock.COLLISION_SCALE * this.scaleY;

        // Create physics body directly
        scene.physics.add.existing(this, true);

        // Set up collision box
        if (this.body) {
            this.body.setSize(width, height);

            // Position the collision box at a fixed height from the ground
            // Scale the offset by the sprite's scale to maintain relative position
            const yOffset = -this.displayHeight * 0.6;

            this.body.setOffset(
                (this.displayWidth - width) / 2,  // Center horizontally, using scaled width
                yOffset,
            );
        }

        // Set initial position
        this.updatePosition();
    }

    /**
     * Updates the rock's position based on ground movement
     */
    updatePosition() {
        const ground = this.scene.getGround();
        if (!ground) {
            return;
        }

        // Calculate how far the ground has moved since rock creation
        const groundDelta = ground.tilePositionX - this.#initialGroundTileX;

        // Update position relative to initial spawn point, accounting for scale
        this.x = this.#initialX - (groundDelta * ground.scaleX);

        // Update physics body position, maintaining the vertical offset
        if (this.body) {
            // Only update the x position of the body, keep the y offset we set in constructor
            const currentYOffset = this.body.offset.y;
            this.body.position.x = this.x - (this.body.width / 2);
            this.body.position.y = this.y + currentYOffset;
        }
    }

    /**
     * Spawns/resets this rock instance at a new position
     * This is used for object pooling! ♻️
     *
     * @param {number} x - The x position to spawn at
     * @param {number} y - The y position to spawn at
     * @param {number} scrollSpeed - The scroll speed
     */
    spawn(x, y, scrollSpeed) {
        // Pick a new random rock variant
        const frameKey = SmallRock.VARIANTS[Math.floor(Math.random() * SmallRock.VARIANTS.length)];
        this.setFrame(frameKey);

        // Update scroll speed using parent class setter
        this.setScrollSpeed(scrollSpeed);

        // Reset position
        this.setPosition(x, y);
        this.#initialX = x;
        this.#initialGroundTileX = this.scene.getGround().tilePositionX;

        // Match the ground's scale
        const ground = this.scene.getGround();
        if (ground) {
            this.setScale(ground.scaleX, ground.scaleY);
        }

        // Update collision box for the new frame
        const frame = this.scene.textures.getFrame('obstacle-small-rocks-sprites', frameKey);
        if (frame && this.body) {
            const width = frame.width * SmallRock.COLLISION_SCALE * this.scaleX;
            const height = frame.height * SmallRock.COLLISION_SCALE * this.scaleY;
            this.body.setSize(width, height);

            const yOffset = -this.displayHeight * 0.6;
            this.body.setOffset(
                (this.displayWidth - width) / 2,
                yOffset,
            );
        }

        // Make visible and active
        this.setActive(true);
        this.setVisible(true);

        // Update initial position
        this.updatePosition();
    }

    /**
     * Returns this rock to the pool for reuse
     * Like putting a toy back in the toy box! 🧸
     */
    returnToPool() {
        // Hide and deactivate
        this.setActive(false);
        this.setVisible(false);
    }

    /**
     * Updates the rock's position to move with the ground
     *
     * @param {number} _delta - Time since last update in milliseconds
     */
    update(_delta) {
        // Skip update if not active
        if (!this.active) {
            return;
        }

        this.updatePosition();

        // Return to pool if off screen
        if (this.x < -this.width) {
            this.returnToPool();
        }
    }
}