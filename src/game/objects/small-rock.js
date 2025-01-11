/**
 * 🪨 The SmallRock class creates those pesky little rocks our dino needs to jump over!
 *
 * These rocks are like nature's hurdles in our dino's running track.
 */
import { Obstacle } from './obstacle';

export class SmallRock extends Obstacle {
    /** @type {string[]} */
    static VARIANTS = ['sml_rock_1', 'sml_rock_2', 'sml_rock_3', 'sml_rock_4', 'sml_rock_5'];

    /** @type {number} */
    static COLLISION_SCALE = 0.8; // 80% of sprite size for tighter collision

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

        // Make sure the rock sits nicely on the ground by setting its origin point
        // to the middle-bottom of the sprite
        this.setOrigin(0.5, 0.8);

        // Add to scene and enable physics
        scene.add.existing(this);
        scene.physics.add.existing(this);  // Make it dynamic so it can move

        // Configure physics body - no gravity, just horizontal movement
        if (this.body) {
            this.body.setAllowGravity(false);

            // Initial velocity is set in the base class update method
        }

        // Make sure we have a physics body before trying to adjust it
        if (!this.body) {
            console.error('🚨 Physics body not created for SmallRock!');

            return;
        }

        // Get the frame dimensions for this specific rock variant
        const frame = scene.textures.getFrame('obstacle-small-rocks-sprites', frameKey);
        if (!frame) {
            console.error('🚨 Could not get frame data for rock variant:', frameKey);

            return;
        }

        // Set collision box size to be slightly smaller than the visual sprite
        const width = frame.width * SmallRock.COLLISION_SCALE;
        const height = frame.height * SmallRock.COLLISION_SCALE;

        // Move collision box up relative to sprite center
        // No horizontal offset needed as it's already centered
        const offsetX = 0;  // Centered horizontally
        const offsetY = -height * 0.4;  // Move up by 40% of collision box height

        // Set collision box with size and offset
        this.setCollisionBox(width, height, offsetX, offsetY);
    }

    /**
     * Updates the rock's position and ensures collision box stays correct
     *
     * @param {number} delta - Time since last update in milliseconds
     */
    update(delta) {
        super.update(delta);
    }
}
