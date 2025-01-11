/**
 * 🦖 The Dino class is like our game's main character creator!
 *
 * This is where all the dino's special moves come from.
 */
import Phaser from 'phaser';

export class Dino extends Phaser.GameObjects.Sprite {
    /** @type {number} */
    static WIDTH = 96;

    /** @type {number} */
    static HEIGHT = 82;

    /** @type {number} */
    static STANDING_HITBOX_WIDTH = 36;

    /** @type {number} */
    static STANDING_HITBOX_HEIGHT = 66;

    /** @type {number} */
    static DUCKING_HITBOX_WIDTH = 73;

    /** @type {number} */
    static DUCKING_HITBOX_HEIGHT = 56;

    /** @type {number} */
    static DUCKING_OFFSET_X = 12;

    /** @type {number} */
    #jumpForce = 600;

    /** @type {boolean} */
    #isJumping = false;

    /** @type {boolean} */
    #isDucking = false;

    /** @type {boolean} */
    #wasInAir = false;

    /** @type {Phaser.Types.Input.Keyboard.CursorKeys} */
    #cursors;

    /**
     * Creates our lovable dino character! 🦖
     *
     * @param {Phaser.Scene} scene - The scene that owns this dino
     * @param {number} x - The dino's starting x position
     * @param {number} y - The dino's starting y position
     */
    constructor(scene, x, y) {
        super(scene, x, y, 'dino-sprites', 'idle-1');

        // Set up the dino's size and origin
        this.setOrigin(0.5, 1);

        // Add to the scene and enable physics
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Set up physics body
        /** @type {Phaser.Physics.Arcade.Body} */
        const body = this.body;
        body.setCollideWorldBounds(true);
        this.#updateHitbox(false);

        // Create the animations
        this.#createAnimations();

        // Set up keyboard controls
        this.#cursors = scene.input.keyboard.createCursorKeys();

        // Start idle animation
        this.play('dino-idle');

        // Listen for animation complete
        this.on('animationcomplete', this.#onAnimationComplete, this);
    }

    /**
     * Updates the dino's position and handles input
     * This runs every frame of the game! 🎮
     */
    update() {
        /** @type {Phaser.Physics.Arcade.Body} */
        const body = this.body;
        const wasJumping = this.#isJumping;
        this.#isJumping = !body.touching.down;

        // Handle jumping
        if ((this.#cursors.up.isDown || this.#cursors.space.isDown) && body.touching.down) {
            this.#jump();
        }

        // Handle ducking
        if (this.#cursors.down.isDown) {
            if (!this.#isDucking) {
                this.#duck();
            }

            // If we're jumping, pause the animation on first frame
            if (this.#isJumping) {
                this.anims.pause();
            }
        }
        else if (this.#isDucking) {
            this.#standUp();
        }

        // Update animations
        if (this.#isJumping) {
            if (!wasJumping) {
                // Just started jumping
                this.play('dino-jump-up');
            }
            else if (this.anims.currentAnim?.key === 'dino-jump-up' && !this.anims.isPlaying) {
                // Hold the peak frame
                this.setFrame('jump-3');
            }
            this.#wasInAir = true;
        }
        else if (this.#wasInAir) {
            // Just landed
            this.play('dino-jump-land');
            this.#wasInAir = false;
        }
        else if (this.#isDucking) {
            // Ducking
            this.play('dino-duck', true);
        }
        else {
            // Running
            this.play('dino-run', true);
        }
    }

    /**
     * Creates all the dino's animations
     * Like a movie director setting up different scenes! 🎬
     */
    #createAnimations() {
        const anims = this.scene.anims;

        // Only create animations if they don't exist
        if (!anims.exists('dino-idle')) {
            anims.create({
                key: 'dino-idle',
                frames: anims.generateFrameNames('dino-sprites', {
                    prefix: 'idle-',
                    start: 1,
                    end: 3,
                }),
                frameRate: 10,
                repeat: -1,
            });
        }

        if (!anims.exists('dino-run')) {
            anims.create({
                key: 'dino-run',
                frames: anims.generateFrameNames('dino-sprites', {
                    prefix: 'run-',
                    start: 1,
                    end: 6,
                }),
                frameRate: 10,
                repeat: -1,
            });
        }

        if (!anims.exists('dino-duck')) {
            anims.create({
                key: 'dino-duck',
                frames: anims.generateFrameNames('dino-sprites', {
                    prefix: 'duck-',
                    start: 1,
                    end: 6,
                }),
                frameRate: 10,
                repeat: -1,
            });
        }

        if (!anims.exists('dino-jump-up')) {
            anims.create({
                key: 'dino-jump-up',
                frames: anims.generateFrameNames('dino-sprites', {
                    prefix: 'jump-',
                    start: 1,
                    end: 3,
                }),
                frameRate: 20,
                repeat: 0,
            });
        }

        if (!anims.exists('dino-jump-land')) {
            anims.create({
                key: 'dino-jump-land',
                frames: anims.generateFrameNames('dino-sprites', {
                    prefix: 'jump-',
                    start: 4,
                    end: 4,
                }),
                frameRate: 20,
                repeat: 0,
            });
        }

        if (!anims.exists('dino-dead')) {
            anims.create({
                key: 'dino-dead',
                frames: anims.generateFrameNames('dino-sprites', {
                    prefix: 'dead-',
                    start: 1,
                    end: 5,
                }),
                frameRate: 10,
                repeat: 0,
            });
        }
    }

    /**
     * Handles animation complete events
     *
     * @param {Phaser.Animations.Animation} animation - The animation that completed
     * @param {Phaser.Animations.AnimationFrame} frame - The final animation frame
     */
    #onAnimationComplete(animation, frame) {
        if (animation.key === 'dino-jump-land') {
            this.play('dino-run', true);
        }
    }

    /**
     * Makes the dino jump! 🦘
     */
    #jump() {
        /** @type {Phaser.Physics.Arcade.Body} */
        const body = this.body;
        body.setVelocityY(-this.#jumpForce);
        this.#isJumping = true;
        this.play('dino-jump-up');
    }

    /**
     * Makes the dino duck down 🦆
     */
    #duck() {
        this.#isDucking = true;
        this.#updateHitbox(true);
        this.play('dino-duck', true);
    }

    /**
     * Makes the dino stand back up 🦖
     */
    #standUp() {
        this.#isDucking = false;
        this.#updateHitbox(false);
    }

    /**
     * Updates the dino's hitbox for ducking/standing
     * Like putting on different sized safety pads! 🛡️
     *
     * @param {boolean} isDucking - Whether the dino is ducking
     */
    #updateHitbox(isDucking) {
        /** @type {Phaser.Physics.Arcade.Body} */
        const body = this.body;

        if (isDucking) {
            // When ducking, make hitbox wider but shorter
            body.setSize(Dino.DUCKING_HITBOX_WIDTH, Dino.DUCKING_HITBOX_HEIGHT);
            body.setOffset(
                ((Dino.WIDTH - Dino.DUCKING_HITBOX_WIDTH) / 2) + Dino.DUCKING_OFFSET_X,
                Dino.HEIGHT - Dino.DUCKING_HITBOX_HEIGHT,
            );
        }
        else {
            // When standing, make hitbox narrower but taller
            body.setSize(Dino.STANDING_HITBOX_WIDTH, Dino.STANDING_HITBOX_HEIGHT);
            body.setOffset(
                (Dino.WIDTH - Dino.STANDING_HITBOX_WIDTH) / 2,
                Dino.HEIGHT - Dino.STANDING_HITBOX_HEIGHT,
            );
        }
    }
}
