/**
 * 📸 The CameraManager handles all our camera effects!
 *
 * It makes the game feel more alive with shakes, zooms, and bounces.
 */
import { logger } from '../../utils/logger.js';
import { GameEvents } from '../constants/game-events.js';

/**
 * @typedef {import('./event-manager.js').IEventEmitter} IEventEmitter
 */

export class CameraManager {
    /** @type {number} */
    static LAND_SHAKE_DURATION = 200;

    /** @type {number} */
    static SHAKE_INTENSITY = 0.004;

    /** @type {number} */
    static DUCK_ZOOM_DURATION = 200;

    /** @type {number} */
    static EFFECT_SCALE = 1.15;

    /** @type {number} */
    static SLOW_MOTION_SCALE = 0.5;

    /** @type {Phaser.Scene} */
    #scene;

    /** @type {Phaser.Cameras.Scene2D.Camera} */
    #mainCamera;

    /** @type {Phaser.Cameras.Scene2D.Camera} */
    #uiCamera;

    /** @type {Phaser.Tweens.Tween} */
    #duckTween = null;

    /** @type {boolean} */
    #isDuckEffectPlaying = false;

    /** @type {Set<Phaser.GameObjects.GameObject>} */
    #uiElements = new Set();

    /** @type {Set<Phaser.GameObjects.GameObject>} */
    #gameElements = new Set();

    /** @type {boolean} */
    #isSlowMotionActive = false;

    /** @type {IEventEmitter} */
    #events;

    /**
     * Creates our camera effects system! 🎥
     *
     * @param {Phaser.Scene} scene - The scene that owns this camera system
     * @param {IEventEmitter} events - The event emitter to use
     */
    constructor(scene, events) {
        this.#scene = scene;
        this.#events = events;
        this.#setupCameras(); // Set up both main and UI cameras
    }

    /**
     * Sets up our main and UI cameras
     * Main camera is for the game world, UI camera is for UI elements! 🌍 🖼️
     */
    #setupCameras() {
        const { width, height } = this.#scene.scale;

        // Configure padding for camera bounds
        const CAMERA_PADDING = {
            x: Math.ceil(width * 0.1),  // 10% padding on each side
            y: Math.ceil(height * 0.1),  // 10% padding on top and bottom
        };

        // Configure main camera for game world
        this.#mainCamera = this.#scene.cameras.main;

        // Set viewport to match window exactly
        this.#mainCamera.setViewport(0, 0, width, height);

        // Set bounds with padding, centered on the viewport
        this.#mainCamera.setBounds(
            0,
            -(CAMERA_PADDING.y * 2) - 5, // Extra adjustment for padding at the top
            width + (CAMERA_PADDING.x * 2),
            height + (CAMERA_PADDING.y * 2),
        );
        this.#mainCamera.setRoundPixels(false);

        // Create a separate camera for UI elements that stays fixed
        this.#uiCamera = this.#scene.cameras.add(0, 0, width, height, false, 'uiCamera');
        this.#uiCamera.setScroll(0, 0);
        this.#uiCamera.setRoundPixels(false);

        // Store padding for other systems to use
        this.cameraPadding = CAMERA_PADDING;
    }

    /**
     * Registers a UI element with our camera system 🎯
     * This ensures it's only rendered by the UI camera
     *
     * @param {Phaser.GameObjects.GameObject} element - The UI element to register
     */
    registerUIElement(element) {
        if (!element) {
            return;
        }

        // Remove from game elements if it was there
        this.#gameElements.delete(element);

        // Add to UI elements
        this.#uiElements.add(element);

        // Update camera settings for this element
        this.#mainCamera.ignore(element);
        this.#uiCamera.ignore([...this.#gameElements]); // Ignore all game elements
    }

    /**
     * Registers a game element with our camera system 🎮
     * This ensures it's only rendered by the main camera
     *
     * @param {Phaser.GameObjects.GameObject} element - The game element to register
     */
    registerGameElement(element) {
        if (!element) {
            return;
        }

        // Remove from UI elements if it was there
        this.#uiElements.delete(element);

        // Add to game elements
        this.#gameElements.add(element);

        // Update camera settings for this element
        this.#uiCamera.ignore(element);
    }

    /**
     * Updates which objects each camera should ignore
     * This keeps our UI and game elements properly separated! 🎯
     */
    #updateCameraIgnores() {
        // Reset camera ignores
        this.#mainCamera.resetIgnore();
        this.#uiCamera.resetIgnore();

        // UI elements should only be visible to UI camera
        this.#uiElements.forEach((element) => {
            if (element && element.active !== false) {
                this.#mainCamera.ignore(element);
            }
        });

        // Game elements should only be visible to main camera
        this.#gameElements.forEach((element) => {
            if (element && element.active !== false) {
                this.#uiCamera.ignore(element);
            }
        });
    }

    /**
     * Unregisters a UI element from our camera system 🎯
     *
     * @param {Phaser.GameObjects.GameObject} element - The UI element to unregister
     */
    unregisterUIElement(element) {
        if (!element) {
            return;
        }

        this.#uiElements.delete(element);
        this.#updateCameraIgnores();
    }

    /**
     * Makes the main camera follow a game object
     *
     * @param {Phaser.GameObjects.GameObject} target - The object to follow
     */
    cameraFollow(target) {
        this.#mainCamera.startFollow(target, true, 0.5, 0.5); // Follow target with some smoothing
    }

    /**
     * Cleans up any active camera effects
     * Like tidying up after playtime! 🧹
     *
     * @param {boolean} cleanDuck - Whether to clean up duck effects
     */
    #cleanupEffects(cleanDuck = true) {
        if (cleanDuck) {
            if (this.#duckTween) {
                this.#duckTween.stop();
                this.#duckTween = null;
            }
            this.#mainCamera.zoom = 1;
            this.#isDuckEffectPlaying = false;
        }
    }

    /**
     * Shakes the main camera when landing!
     * Like feeling the impact of the ground! 💥
     */
    playLandEffect() {
        this.#mainCamera.shake(
            CameraManager.LAND_SHAKE_DURATION,
            CameraManager.SHAKE_INTENSITY,
            true,

            /* (camera, progress) => {
                // When shake is complete
                if (progress === 1) {
                    this.#cleanupEffects();
                }
            }, */
        );
    }

    /**
     * @private
     * Sets the slow motion state for the game
     *
     * @param {boolean} active - Whether to enable slow motion
     * @param {boolean} inMidair - Whether the dino is in midair
     */
    #setSlowMotion(active, inMidair) {
        // Always allow deactivation, but only activate if in midair
        if (active && (!inMidair || this.#isSlowMotionActive)) {
            logger.debug('Skipping slow motion activation', {
                reason: !inMidair ? 'not in midair' : 'already active',
                active,
                inMidair,
                currentState: this.#isSlowMotionActive,
            });

            return;
        }

        // Only log state changes
        if (this.#isSlowMotionActive !== active) {
            logger.debug('Slow motion state changed', {
                from: this.#isSlowMotionActive,
                to: active,
                inMidair,
                timeScale: active ? CameraManager.SLOW_MOTION_SCALE : 1,
            });
        }

        this.#isSlowMotionActive = active;
        const targetTimeScale = active ? CameraManager.SLOW_MOTION_SCALE : 1;

        // Slow down physics
        this.#scene.physics.world.timeScale = 1 / targetTimeScale;

        // Slow down animations globally
        this.#scene.anims.globalTimeScale = targetTimeScale;

        // Trigger slow motion event
        this.#events.emit(GameEvents.SLOW_MOTION_ACTIVE, active);
    }

    /**
     * Zooms in slightly on the main camera when ducking!
     * Like focusing in on our dino friend! 🔍
     *
     * @param {boolean} inMidair - Whether the dino is in midair
     */
    playDuckEffect(inMidair = false) {
        // If we're already at the target zoom or transitioning to it, don't restart
        if (this.#isDuckEffectPlaying && this.#mainCamera.zoom >= CameraManager.EFFECT_SCALE) {
            return;
        }

        this.#isDuckEffectPlaying = true;

        // Stop any existing duck tween but keep current zoom as starting point
        if (this.#duckTween) {
            this.#duckTween.stop();
        }

        // Create a new tween for the duck effect
        this.#duckTween = this.#scene.tweens.add({
            targets: this.#mainCamera,
            zoom: CameraManager.EFFECT_SCALE,
            duration: CameraManager.DUCK_ZOOM_DURATION,
            ease: 'Quad.easeOut',
            onComplete: () => {
                this.#duckTween = null;
            },
        });

        // Enable slow motion if in midair
        this.#setSlowMotion(true, inMidair);
    }

    /**
     * Resets the camera zoom when standing up
     * Like stretching back up after ducking! 🦖
     *
     * @param {boolean} inMidair - Whether the dino is in midair
     * @param {boolean} slowMotionOnly - Whether to only reset slow motion
     */
    resetDuckEffect(inMidair = false, slowMotionOnly = false) {
        // If we're already at normal zoom or transitioning to it, don't restart
        if (!this.#isDuckEffectPlaying || this.#mainCamera.zoom <= 1) {
            return;
        }

        // Disable slow motion if requested
        if (slowMotionOnly) {
            this.#setSlowMotion(false, inMidair);

            return;
        }

        // Stop any existing duck tween but keep current zoom as starting point
        if (this.#duckTween) {
            this.#duckTween.stop();
        }

        // Create a new tween to reset zoom, keeping the current zoom as starting point
        this.#duckTween = this.#scene.tweens.add({
            targets: this.#mainCamera,
            zoom: 1,
            duration: CameraManager.DUCK_ZOOM_DURATION,
            ease: 'Quad.easeOut',
            onComplete: () => {
                this.#cleanupEffects(false, true);
            },
        });

        // Always disable slow motion when resetting duck effect
        this.#setSlowMotion(false, inMidair);
    }

    getMainCamera() {
        return this.#mainCamera;
    }

    getUICamera() {
        return this.#uiCamera;
    }

    /**
     * Resets both cameras to their default states
     * Like hitting the reset button for everything! 🔄
     */
    reset() {
        this.#cleanupEffects(true, true);
        this.#mainCamera.resetFX();
        this.#uiCamera.resetFX();
    }
}
