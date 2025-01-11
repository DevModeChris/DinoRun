/**
 * 🌱 The Ground class creates our endless running surface!
 *
 * It scrolls from right to left to make it look like our dino is running.
 */
import Phaser from 'phaser';

export class Ground extends Phaser.GameObjects.TileSprite {
    /** @type {number} */
    #scrollSpeed = 300;

    /** @type {number} */
    static HEIGHT = 81;  // Full sprite height including grass

    /** @type {number} */
    static WIDTH = 825;

    /**
     * Creates our endless running ground!
     * @param {Phaser.Scene} scene - The scene that owns this ground
     * @param {number} y - How far down from the top to place the ground
     * @param {string} textureKey - The key of the atlas containing ground sprites
     * @param {string} frameKey - Which ground style to use (e.g. 'purpleGrass')
     */
    constructor(scene, y, textureKey, frameKey) {
        super(
            scene,
            0, // x position (0 since we want it at the left edge)
            y, // y position (passed in from scene)
            scene.scale.width, // width (we'll update this to match the scene width)
            Ground.HEIGHT, // height (full height including grass)
            textureKey, // texture key (our sprite atlas)
            frameKey, // frame key (which ground style to use)
        );

        // Set the origin to top-left since we're scrolling from right to left
        this.setOrigin(0, 0);

        // Add to scene's display list
        scene.add.existing(this);
    }

    /**
     * Updates the ground position each frame to create scrolling effect
     * Like a treadmill moving under our dino's feet! 🏃‍♂️
     *
     * @param {number} delta - Time since last update in milliseconds
     */
    update(delta) {
        // Calculate how far to move based on time passed
        const deltaSeconds = delta / 1000;
        const distance = this.#scrollSpeed * deltaSeconds;

        // Move the ground texture left by updating the tile position
        this.tilePositionX += distance;
    }

    /**
     * Changes the ground style
     *
     * @param {string} frameKey - The new ground style to use (e.g. 'purpleGrass', 'jungle')
     */
    setGroundStyle(frameKey) {
        this.setFrame(frameKey);
    }

    /**
     * Changes how fast the ground moves
     *
     * @param {number} speed - The new scroll speed
     */
    setScrollSpeed(speed) {
        this.#scrollSpeed = speed;
    }

    /**
     * Gets the current scroll speed
     *
     * @returns {number} The current scroll speed
     */
    getScrollSpeed() {
        return this.#scrollSpeed;
    }
}
