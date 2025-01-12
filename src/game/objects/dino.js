/**
 * 🦖 The Dino class is like our game's main character creator!
 *
 * This is where all the dino's special moves come from.
 */
import Phaser from 'phaser';
import { checkIfMobile } from '../../utils/helpers.js';

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

    /** @type {Object} */
    #keys;

    /** @type {boolean} */
    #isMobile;

    /** @type {Set<number>} */
    #activeJumpPointers = new Set();

    /** @type {Set<number>} */
    #activeDuckPointers = new Set();

    /** @type {Phaser.GameObjects.Sprite} */
    #jumpButton;

    /** @type {Phaser.GameObjects.Sprite} */
    #duckButton;

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

        // Set depth above sky,stars,etc but below lighting and ui
        this.setDepth(200);

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
        this.#keys = scene.input.keyboard.addKeys('UP, DOWN, SPACE, CTRL');

        // Check if we're on mobile and set up mobile controls if needed
        this.#isMobile = checkIfMobile();
        if (this.#isMobile) {
            // Enable multi-touch
            scene.input.addPointer(2);
            this.#setupMobileControls();
        }

        // Start idle animation
        this.play('dino-idle');

        // Listen for animation complete
        this.on('animationcomplete', this.#onAnimationComplete, this);
    }

    /**
     * Sets up mobile control buttons
     * Like adding touch-screen magic to our game! 📱
     */
    #setupMobileControls() {
        const { width, height } = this.scene.scale;
        const buttonAlpha = 0.5; // 50% opacity
        const padding = 20;

        // Create jump button in bottom left
        this.#jumpButton = this.scene.add.sprite(
            padding,
            height - padding,
            'ui-elements-sprites',
            'mobileJumpBtn',
        )
            .setOrigin(0, 1)
            .setDepth(1000)
            .setAlpha(buttonAlpha)
            .setScrollFactor(0)
            .setInteractive();

        // Create duck button in bottom right
        this.#duckButton = this.scene.add.sprite(
            width - padding,
            height - padding,
            'ui-elements-sprites',
            'mobileDuckBtn',
        )
            .setOrigin(1, 1)
            .setDepth(1000)
            .setAlpha(buttonAlpha)
            .setScrollFactor(0)
            .setInteractive();

        // Set up touch handlers for jump button
        this.#jumpButton.on('pointerdown', (pointer) => {
            this.#activeJumpPointers.add(pointer.id);
        });

        this.#jumpButton.on('pointerup', (pointer) => {
            this.#activeJumpPointers.delete(pointer.id);
        });

        this.#jumpButton.on('pointerout', (pointer) => {
            this.#activeJumpPointers.delete(pointer.id);
        });

        // Set up touch handlers for duck button
        this.#duckButton.on('pointerdown', (pointer) => {
            this.#activeDuckPointers.add(pointer.id);
        });

        this.#duckButton.on('pointerup', (pointer) => {
            this.#activeDuckPointers.delete(pointer.id);
        });

        this.#duckButton.on('pointerout', (pointer) => {
            this.#activeDuckPointers.delete(pointer.id);
        });

        // Listen for resize events to update button positions
        this.scene.scale.on('resize', this.#updateMobileControlPositions, this);
    }

    /**
     * Updates mobile control button positions after resize
     * Like rearranging furniture in a room! 🏠
     */
    #updateMobileControlPositions() {
        if (!this.#isMobile) {
            return;
        }

        const { width, height } = this.scene.scale;
        const padding = 20;

        if (this.#jumpButton) {
            this.#jumpButton.setPosition(padding, height - padding);
        }

        if (this.#duckButton) {
            this.#duckButton.setPosition(width - padding, height - padding);
        }
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

        // Handle keyboard controls
        if ((this.#keys.UP.isDown || this.#keys.SPACE.isDown) && body.touching.down) {
            this.jump();
        }

        if (this.#keys.DOWN.isDown || this.#keys.CTRL.isDown) {
            this.duck();
        }
        else if (this.#activeDuckPointers.size === 0 && this.#isDucking) {
            this.stand();
        }

        // Handle mobile controls
        if (this.#isMobile) {
            if (this.#activeJumpPointers.size > 0 && body.touching.down) {
                this.jump();
            }

            if (this.#activeDuckPointers.size > 0) {
                this.duck();
            }
        }

        // Update animations
        this.#updateAnimations(wasJumping);
    }

    /**
     * Updates the dino's animations based on its current state
     * Like a puppeteer pulling the right strings! 🎭
     *
     * @param {boolean} wasJumping - Whether the dino was jumping in the previous frame
     */
    #updateAnimations(wasJumping) {
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

            // If ducking while jumping, pause the animation
            if (this.#isDucking) {
                this.anims.pause();
            }
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
     * @param {Phaser.Animations.AnimationFrame} _frame - The final animation frame
     */
    #onAnimationComplete(animation, _frame) {
        if (animation.key === 'dino-jump-land') {
            this.play('dino-run', true);
        }
    }

    /**
     * Makes the dino jump! 🦘
     */
    jump() {
        /** @type {Phaser.Physics.Arcade.Body} */
        const body = this.body;
        if (body.touching.down) {
            body.setVelocityY(-this.#jumpForce);
            this.#isJumping = true;
            this.play('dino-jump-up');
        }
    }

    /**
     * Makes the dino duck down 🦆
     */
    duck() {
        if (!this.#isDucking) {
            this.#isDucking = true;
            this.#updateHitbox(true);
            this.play('dino-duck', true);
        }
    }

    /**
     * Makes the dino stand back up 🦖
     */
    stand() {
        if (this.#isDucking) {
            this.#isDucking = false;
            this.#updateHitbox(false);
        }
    }

    /**
     * Checks if the dino is currently ducking
     *
     * @returns {boolean} True if the dino is ducking
     */
    isDucking() {
        return this.#isDucking;
    }

    /**
     * Checks if the dino is currently jumping
     *
     * @returns {boolean} True if the dino is jumping
     */
    isJumping() {
        return this.#isJumping;
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
