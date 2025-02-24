/**
 * 🦖 The Dino class is like our game's main character creator!
 *
 * This is where all the dino's special moves come from.
 */
import Phaser from 'phaser';
import { checkIfMobile } from '../../utils/helpers.js';
import { logger } from '../../utils/logger.js';
import { InputLogger } from '../../utils/input-logger.js';

/**
 * @typedef {import('../systems/event-manager.js').IEventEmitter} IEventEmitter
 */

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
    static MAX_JUMPS = 2;

    /** @type {number} */
    #jumpForce = 600;

    /** @type {number} */
    #remainingJumps = Dino.MAX_JUMPS;

    /** @type {boolean} */
    #isJumping = false;

    /** @type {boolean} */
    #isDucking = false;

    /** @type {boolean} */
    #wasInAir = false;

    /** @type {boolean} */
    #controlsEnabled = true;

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

    /** @type {boolean} */
    #keyJumpPressed = false;

    /** @type {boolean} */
    #touchJumpPressed = false;

    /** @type {boolean} */
    #justDoubleJumped = false;

    /** @type {CameraManager} */
    #cameraManager;

    /** @type {InputLogger} */
    #inputLogger;

    /** @type {IEventEmitter} */
    #events;

    /** @type {SoundManager} */
    #soundManager;

    /**
     * Creates our lovable dino character! 🦖
     *
     * @param {Phaser.Scene} scene - The scene that owns this dino
     * @param {number} x - The dino's starting x position
     * @param {number} y - The dino's starting y position
     * @param {IEventEmitter} events - The event emitter to use
     */
    constructor(scene, x, y, events) {
        super(scene, x, y, 'dino-sprites', 'idle-1');

        // Store event emitter
        this.#events = events;

        // Get camera manager reference
        this.#cameraManager = scene.getCameraManager();

        // Get sound manager reference
        this.#soundManager = scene.getSoundManager();

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

        // Set up controls
        this.#setupControls();

        // Start idle animation
        this.play('dino-idle');

        // Listen for animation complete
        this.on('animationcomplete', this.#onAnimationComplete, this);
    }

    /**
     * Updates the dino's position and handles input
     * This runs every frame of the game! 🎮
     *
     * @param {number} _time - The current time
     * @param {number} _delta - The time since the last frame in milliseconds
     */
    update(_time, _delta) {
        /** @type {Phaser.Physics.Arcade.Body} */
        const body = this.body;
        const wasJumping = this.#isJumping;
        const wasTouchingGround = body.touching.down;

        // Update jumping state
        this.#isJumping = !body.touching.down;

        // Check if we landed
        if (wasTouchingGround) {
            if (!wasJumping) {
                // Reset jumps when touching ground
                this.#remainingJumps = Dino.MAX_JUMPS;
            }
            else {
                // Just landed
                this.land();
            }
        }

        // Don't process controls if disabled
        if (!this.#controlsEnabled) {
            return;
        }

        // Update input states
        const jumpPressed = (this.#keys.UP.isDown || this.#keys.SPACE.isDown) // Keyboard
                          || this.#activeJumpPointers.size > 0; // Mobile
        const jumpPressedState = this.#isMobile ? '#touchJumpPressed' : '#keyJumpPressed';

        const duckPressed = (this.#keys.DOWN.isDown || this.#keys.CTRL.isDown) // Keyboard
                          || this.#activeDuckPointers.size > 0; // Mobile

        // Handle jump
        if (jumpPressed && !this.#isDucking && this.#remainingJumps > 0) {
            if (!this[jumpPressedState]) {
                this[jumpPressedState] = true;

                this.jump();
            }
        }
        else {
            this[jumpPressedState] = false;
        }

        // Handle duck
        if (duckPressed) {
            if (!this.#isDucking) {
                this.duck();
            }
        }
        else if (this.#isDucking) {
            this.standUp();
        }

        // Update animations
        this.#updateAnimations(wasJumping);
    }

    /**
     * Enables or disables dino controls
     *
     * @param {boolean} enabled - Whether controls should be enabled
     */
    setControlsEnabled(enabled) {
        this.#controlsEnabled = enabled;
    }

    /**
     * Makes our dino land gracefully! 🦖
     */
    land() {
        if (this.#wasInAir) {
            this.#wasInAir = false;
            this.#cameraManager.playLandEffect();
            this.#soundManager.playPlayerLandSound();

            // Reset slow motion if we were ducking when we landed
            if (this.#isDucking) {
                this.#cameraManager.resetDuckEffect(false, true);
            }
        }
    }

    /**
     * Updates the dino's animations based on its current state
     * Like a puppeteer pulling the right strings! 🎭
     *
     * @param {boolean} wasJumping - Whether the dino was jumping in the previous frame
     */
    #updateAnimations(wasJumping) {
        if (this.#isJumping) {
            // If we just started jumping or just performed a double jump
            if (!wasJumping || this.#justDoubleJumped) {
                this.play('dino-jump-up');
                this.#justDoubleJumped = false;
            }

            // If ducking while jumping, pause the duck animation
            else if (this.#isDucking) {
                this.play('dino-duck', true);
                this.anims.pause();
            }

            // Hold the peak frame once the jump-up animation completes
            else if (this.anims.currentAnim?.key === 'dino-jump-up' && !this.anims.isPlaying) {
                // Check if we're falling (negative velocity means going up)
                /** @type {Phaser.Physics.Arcade.Body} */
                const body = this.body;
                if (body.velocity.y > 0) {
                    // Use frame 4 for falling
                    this.setFrame('jump-4');
                }
                else {
                    // Use frame 3 for peak/rising
                    this.setFrame('jump-3');
                }
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
        if (!this.#isMobile || !this.scene) {
            return;
        }

        const gameSize = this.scene.scale.gameSize;
        const padding = 20;

        if (this.#jumpButton) {
            this.#jumpButton.setPosition(padding, gameSize.height - padding);
        }
        if (this.#duckButton) {
            this.#duckButton.setPosition(gameSize.width - padding, gameSize.height - padding);
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
     * Makes the dino jump! 🦘
     * The dino can jump twice before needing to touch the ground again! ✨
     */
    jump() {
        /** @type {Phaser.Physics.Arcade.Body} */
        const body = this.body;
        if (this.#remainingJumps > 0) {
            body.setVelocityY(-this.#jumpForce);
            this.#isJumping = true;
            this.#soundManager.playPlayerJumpSound();

            // Flag if this is a double jump (not the first jump)
            if (this.#remainingJumps < Dino.MAX_JUMPS) {
                this.#justDoubleJumped = true;
            }

            this.#remainingJumps--;
        }
    }

    /**
     * Makes the dino duck down 🦆
     */
    duck() {
        if (!this.#isDucking) {
            this.#isDucking = true;
            this.#updateHitbox(true);
            this.#cameraManager.playDuckEffect(this.#isJumping);
        }
    }

    /**
     * Makes the dino stand back up 🦖
     */
    standUp() {
        if (this.#isDucking) {
            this.#isDucking = false;
            this.#updateHitbox(false);
            this.#cameraManager.resetDuckEffect(this.#isJumping);
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

    /**
     * Pause dino animations and movement
     */
    pause() {
        this.anims.pause();
        this.body.setVelocityX(0);
        this.body.setVelocityY(0);

        // Hide mobile controls
        this.toggleButtonVisibility();
    }

    /**
     * Resume dino animations and movement
     */
    resume() {
        this.anims.resume();
    }

    /**
     * Toggles the visibility of the jump and duck buttons
     */
    toggleButtonVisibility() {
        if (this.#jumpButton) {
            this.#jumpButton.setVisible(!this.#jumpButton.visible);
        }
        if (this.#duckButton) {
            this.#duckButton.setVisible(!this.#duckButton.visible);
        }
    }

    /**
     * Gets the mobile control buttons for UI camera
     *
     * @returns {Array<Phaser.GameObjects.Sprite>} Array of mobile control buttons
     */
    getMobileControls() {
        if (!this.#isMobile) {
            return null;
        }

        return [this.#jumpButton, this.#duckButton];
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
     * 🎮 Sets up all the dino's controls and input logging
     */
    #setupControls() {
        // Create an input logger for the dino
        this.#inputLogger = new InputLogger(this.scene, 'Dino');

        // Set up keyboard controls
        this.#keys = this.scene.input.keyboard.addKeys('UP,DOWN,SPACE,CTRL');

        // Check if we're on mobile and set up mobile controls if needed
        this.#isMobile = checkIfMobile();
        if (this.#isMobile) {
            // Enable multi-touch
            this.scene.input.addPointer(2);
            this.#setupMobileControls();
        }

        // Add input logging
        this.#setupInputLogging();
    }

    /**
     * 📝 Sets up input logging for all controls
     *
     * @private
     */
    #setupInputLogging() {
        try {
            // Only set up logging if we have a logger
            if (!this.#inputLogger) {
                return;
            }

            // Log keyboard events if keys are available
            if (this.#keys) {
                const keyMap = {
                    UP: { key: this.#keys.UP, description: '⬆️ Jump', keyCode: Phaser.Input.Keyboard.KeyCodes.UP },
                    SPACE: { key: this.#keys.SPACE, description: '⬆️ Jump', keyCode: Phaser.Input.Keyboard.KeyCodes.SPACE },
                    DOWN: { key: this.#keys.DOWN, description: '⬇️ Duck', keyCode: Phaser.Input.Keyboard.KeyCodes.DOWN },
                    CTRL: { key: this.#keys.CTRL, description: '⬇️ Duck', keyCode: Phaser.Input.Keyboard.KeyCodes.CTRL },
                };

                // Add listeners to each key
                Object.entries(keyMap).forEach(([keyName, { key, description, keyCode }]) => {
                    if (key?.on) {
                        key.on('down', () => {
                            this.#inputLogger.logKeyboard({
                                key: keyName,
                                keyCode,
                                repeat: key.isDown && key.isDown,
                                action: description,
                                type: 'keydown',
                            });
                        });
                        key.on('up', () => {
                            this.#inputLogger.logKeyboard({
                                key: keyName,
                                keyCode,
                                repeat: false,
                                action: description,
                                type: 'keyup',
                            });
                        });
                    }
                });
            }

            // Log pointer events for mobile
            if (this.#isMobile && this.scene?.input?.on) {
                // Track pointer down events
                this.scene.input.on('pointerdown', (pointer) => {
                    const isBelowCentre = pointer.y > this.scene.cameras.main.centerY;
                    this.#inputLogger.logPointer({
                        x: pointer.x,
                        y: pointer.y,
                        id: pointer.id,
                        isDown: true,
                        button: pointer.button,
                        action: isBelowCentre ? '⬇️ Duck' : '⬆️ Jump',
                    });
                });

                // Track pointer up events
                this.scene.input.on('pointerup', (pointer) => {
                    this.#inputLogger.logPointer({
                        x: pointer.x,
                        y: pointer.y,
                        id: pointer.id,
                        isDown: false,
                        button: pointer.button,
                        action: this.#isDucking ? '⬆️ Stand' : '🔄 Release',
                    });
                });
            }

            // Log gamepad events if available
            const gamepad = this.scene?.input?.gamepad;
            if (gamepad?.on) {
                gamepad.on('down', (pad, button) => {
                    this.#inputLogger.logGamepad({
                        pad: {
                            index: pad.index,
                            id: pad.id,
                        },
                        button: {
                            index: button.index,
                            value: button.value,
                            action: button.index === 0 ? '⬆️ Jump' : '⬇️ Duck',
                        },
                    });
                });

                gamepad.on('up', (pad, button) => {
                    this.#inputLogger.logGamepad({
                        pad: {
                            index: pad.index,
                            id: pad.id,
                        },
                        button: {
                            index: button.index,
                            value: button.value,
                            action: button.index === 1 && this.#isDucking ? '⬆️ Stand' : '🔄 Release',
                        },
                    });
                });
            }
        }
        catch (error) {
            // If logging setup fails, log the error but don't break the game
            logger.error('Failed to set up input logging', error);
        }
    }

    /**
     * Called when the dino dies! 💀
     * Time to play a sad tune...
     */
    die() {
        // Play death animation and sound
        this.play('dino-dead');
        this.#soundManager.playPlayerDeathSound();

        // Disable controls
        this.setControlsEnabled(false);

        // Stop any current movement
        /** @type {Phaser.Physics.Arcade.Body} */
        const body = this.body;
        body.setVelocity(0);
        body.setAcceleration(0);
    }

    /**
     * 🧹 Clean up when the dino is destroyed
     */
    destroy() {
        if (this.#inputLogger) {
            this.#inputLogger.destroy();
        }
        super.destroy();
    }
}
