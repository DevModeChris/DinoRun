/**
 * 🌌 The SkySystem creates our sky with day and night cycles!
 *
 * It makes our game world feel alive by changing the sky colours and adding
 * twinkling stars and lighting effects.
 */
import Phaser from 'phaser';

export class SkySystem {
    /** @type {Phaser.Scene} */
    #scene;

    /** @type {number} */
    #timeOfDay;

    /** @type {number} */
    #lastUpdateTime;

    /** @type {Phaser.GameObjects.Graphics} */
    #skyGradient;

    /** @type {Phaser.GameObjects.Rectangle} */
    #lighting;

    /** @type {Phaser.GameObjects.Container} */
    #starContainer;

    /** @type {Array<{star: Phaser.GameObjects.Sprite, twinkleSpeed: number, twinkleOffset: number}>} */
    #stars = [];

    /** @type {Phaser.GameObjects.Graphics} */
    #auroraGraphics;

    /** @type {Array<{y: number, offset: number, speed: number}>} */
    #auroraWaves = [];

    /** @type {Phaser.GameObjects.Graphics} */
    #cloudGraphics;

    /** @type {Array<{x: number, y: number, speed: number, size: number}>} */
    #clouds = [];

    /** @type {(gameSize: Phaser.Structs.Size) => void} */
    #resizeListener;

    /** @type {boolean} */
    #isAuroraActive = false;

    /** @type {number} */
    #auroraEndTime = 0;

    /** @type {number} */
    #auroraStartTime = 0;

    /** @type {number} */
    #lastSpawnCheck = 0;

    /**
     * The duration of the day/night cycle in milliseconds.
     *
     * @type {number}
     */
    static DAY_NIGHT_CYCLE_DURATION = 300000; // 5 minutes in milliseconds

    /**
     * The color palettes for the sky during different times of day.
     *
     * @type {Object}
     */
    static PALETTES = {
        DAWN: {
            top: 0x2e5a89,
            middle: 0xeb968e,
            bottom: 0xffbe8b,
        },
        DAY: {
            top: 0x4ab54a,
            middle: 0x83d683,
            bottom: 0xb5e8b5,
        },
        DUSK: {
            top: 0x2e1f5e,
            middle: 0x934277,
            bottom: 0xe36a8f,
        },
        NIGHT: {
            top: 0x0a0a2a,
            middle: 0x1a1a4a,
            bottom: 0x2a2a6a,
        },
    };

    /**
     * Lighting effects for different times of day.
     *
     * @type {Object}
     */
    static LIGHTING = {
        DAWN: {
            colour: 0xff9966,
            alpha: 0.2,
        },
        DAY: {
            colour: 0xffffff,
            alpha: 0,
        },
        DUSK: {
            colour: 0x6633cc,
            alpha: 0.3,
        },
        NIGHT: {
            colour: 0x000033,
            alpha: 0.5,
        },
    };

    /**
     * Configuration for star effects.
     *
     * @type {Object}
     */
    static STAR_CONFIG = {
        ENABLED: true,        // Enable stars
        COUNT: 50,            // Number of stars
        MIN_SIZE: 1,          // Minimum star size in pixels
        MAX_SIZE: 3,          // Maximum star size in pixels
        MIN_ALPHA: 0.3,       // Minimum star brightness
        MAX_ALPHA: 1,         // Maximum star brightness
        TWINKLE_SPEED_MIN: 1, // Minimum twinkle speed multiplier
        TWINKLE_SPEED_MAX: 3, // Maximum twinkle speed multiplier
        Y_SPAWN_AREA: 1.0,    // Percentage of sky the stars spawn in (Full height)
    };

    /**
     * Configuration for aurora effects.
     *
     * @type {Object}
     */
    static AURORA_CONFIG = {
        ENABLED: true,       // Enable aurora
        WAVES: 3,            // Number of overlapping aurora waves
        MIN_WAVELENGTH: 400, // Minimum wavelength in pixels
        MAX_WAVELENGTH: 800, // Maximum wavelength in pixels
        MIN_SPEED: 0.2,    // Minimum wave speed
        MAX_SPEED: 0.4,    // Maximum wave speed
        MIN_AMPLITUDE: 35, // Minimum wave height
        MAX_AMPLITUDE: 55, // Maximum wave height
        COLOURS: [         // Aurora colours
            0x66ffcc,     // Bright cyan
            0x33ccff,     // Bright blue
            0xff99ff,     // Soft pink
        ],
        ALPHA: 0.2,       // Base alpha value
        GLOW_LAYERS: 6,   // Number of glow layers
        SEGMENT_SIZE: 5,  // Segment size for smoothness
        BASE_THICKNESS: 4, // Base thickness
        THICKNESS_STEP: 3, // Thickness increase per layer
        SPAWN_CHANCE: 0.01, // 1% chance per 10-second interval
        SPAWN_CHECK_INTERVAL: 10000, // Check every 10 seconds
        MIN_DURATION: 30,   // Minimum duration in seconds
        MAX_DURATION: 60,   // Maximum duration in seconds
        FADE_DURATION: 5,   // Fade in/out duration in seconds
    };

    /**
     * Configuration for cloud effects.
     *
     * @type {Object}
     */
    static CLOUD_CONFIG = {
        ENABLED: false,    // Enable clouds
        MIN_CLOUDS: 2,     // Fewer clouds for cleaner look
        MAX_CLOUDS: 6,     // Maximum number of clouds
        MIN_WIDTH: 30,     // Smaller base width
        MAX_WIDTH: 60,     // Maximum base width
        MIN_HEIGHT: 15,    // Smaller base height
        MAX_HEIGHT: 25,    // Maximum base height
        MIN_SPEED: 0.1,    // Slower movement
        MAX_SPEED: 0.3,    // Maximum movement speed
        SPAWN_MARGIN: 50,  // Margin for spawning clouds off-screen
        COLOURS: {
            DAY: 0xffffff,    // Pure white clouds during day
            DAWN: 0xffdddd,   // Light pink clouds at dawn
            DUSK: 0xffbb99,   // Light orange clouds at dusk
            NIGHT: 0x9999cc,  // Light purple clouds at night
        },
        ALPHA: {
            DAY: 1.0,      // Fully visible during day
            DAWN: 0.9,     // Slightly less visible during transitions
            DUSK: 0.9,     // Slightly less visible during transitions
            NIGHT: 0.7,    // Less visible at night
        },
        BLOCKS: {
            MIN: 3,        // Minimum blocks per cloud
            MAX: 5,        // Maximum blocks per cloud
        },
    };

    /**
     * Configuration for weather effects.
     *
     * @type {Object}
     */
    static WEATHER_CONFIG = {
        ENABLED: false,             // Enable weather system
        RAIN: {
            ENABLED: true,          // Enable rain
            CHANCE: 0.001,          // Chance per frame to start rain
            DURATION: 10000,        // Duration in ms
            COLOUR: 0xffffff,
            ALPHA: { MIN: 0.3, MAX: 0.6 },
            SPEED: { MIN: 300, MAX: 400 },
            ANGLE: { MIN: 120, MAX: 120 },
            SCALE: { MIN: 0.1, MAX: 0.4 },
            QUANTITY: 4,            // Particles per emission
            FREQUENCY: 5,           // Ms between emissions
            LIFETIME: { MIN: 2000, MAX: 3000 },
        },
        DUST: {
            ENABLED: true,          // Enable dust
            CHANCE: 0.0005,         // Chance per frame to start dust storm
            DURATION: 15000,        // Duration in ms
            COLOUR: 0xccaa66,       // Sandy colour
            ALPHA: { MIN: 0.2, MAX: 0.4 },
            SPEED: { MIN: 100, MAX: 200 },
            ANGLE: { MIN: -20, MAX: 20 },
            SCALE: { MIN: 0.2, MAX: 0.5 },
            QUANTITY: 2,            // Particles per emission
            FREQUENCY: 50,          // Ms between emissions
            LIFETIME: { MIN: 4000, MAX: 6000 },
        },
    };

    /** @type {Phaser.GameObjects.Particles.ParticleEmitter} */
    #rainEmitter;

    /** @type {Phaser.GameObjects.Particles.ParticleEmitter} */
    #dustEmitter;

    /** @type {number} */
    #weatherTimer = 0;

    /** @type {number} */
    #initialSceneWidth = 0;

    /** @type {number} */
    #initialSceneHeight = 0;

    /**
     * Creates our magical sky system! ✨
     *
     * @param {Phaser.Scene} scene - The scene to add the sky system to
     */
    constructor(scene) {
        this.#scene = scene;
        this.#timeOfDay = Math.random(); // Start at a random time of day
        this.#lastUpdateTime = 0;

        // Get initial scene dimensions
        this.#initialSceneWidth = this.#scene.scale.width || window.innerWidth;
        this.#initialSceneHeight = this.#scene.scale.height || window.innerHeight;

        // Create all components first
        this.#createSkyGradient();
        this.#createLighting();
        this.#createStars();
        this.#createAurora();
        this.#createClouds();
        this.#createWeatherEffects();

        // Now bind resize event after all components are created
        this.#resizeListener = this.resize.bind(this);
        this.#scene.scale.on('resize', this.#resizeListener);

        // Clean up when scene shuts down
        this.#scene.events.once('shutdown', this.destroy, this);
    }

    /**
     * Sets up our beautiful gradient sky
     */
    #createSkyGradient() {
        this.#skyGradient = this.#scene.add.graphics();
        this.#updateSkyGradient(this.#initialSceneWidth, this.#initialSceneHeight);
    }

    /**
     * Creates the lighting effects system
     */
    #createLighting() {
        // Create a full-screen rectangle for lighting effects
        this.#lighting = this.#scene.add.rectangle(
            -5, 0,
            this.#initialSceneWidth + 10,
            this.#initialSceneHeight,
            0x000000,
            0,
        )
            .setOrigin(0, 0)
            .setScrollFactor(0)
            .setDepth(500);  // Above game objects but below UI
    }

    /**
     * Gets the main camera bounds and adjusts them for our sky elements! 🎥
     *
     * @returns {Phaser.Geom.Rectangle} The camera bounds to use for sky elements
     */
    #getCameraBounds() {
        const cameraManager = this.#scene.getCameraManager?.();
        const mainCamera = cameraManager?.getMainCamera();

        if (mainCamera) {
            return mainCamera.getBounds();
        }

        // Fallback to scene dimensions if no camera manager
        return {
            x: 0,
            y: 0,
            width: this.#scene.scale.width,
            height: this.#scene.scale.height,
        };
    }

    /**
     * Updates sizes and positions of all sky elements! ✨
     * Makes sure our beautiful sky follows the camera properly.
     *
     * @param {Phaser.Structs.Size} gameSize - New game size
     */
    resize(gameSize) {
        const { width, height } = gameSize;
        const bounds = this.#getCameraBounds();

        // Update sky gradient to match camera bounds exactly
        if (this.#skyGradient && !this.#skyGradient.destroyed) {
            this.#updateSkyGradient(bounds);
        }

        // Update lighting to match viewport exactly (no padding needed)
        if (this.#lighting && !this.#lighting.destroyed) {
            this.#lighting.setPosition(-5, 0);
            this.#lighting.setSize(width + 10, height);
        }

        // Update star container to match camera bounds
        if (this.#starContainer && !this.#starContainer.destroyed) {
            this.#starContainer.setPosition(bounds.x, bounds.y);
            this.#starContainer.width = bounds.width;
            this.#starContainer.height = bounds.height;

            // Reposition stars within new bounds
            this.#stars.forEach(({ star }) => {
                if (star && !star.destroyed) {
                    star.setPosition(
                        bounds.x + (Math.random() * bounds.width),
                        bounds.y + (Math.random() * (bounds.height * SkySystem.STAR_CONFIG.Y_SPAWN_AREA)),
                    );
                }
            });
        }

        // Update aurora to match camera bounds
        if (this.#auroraGraphics && !this.#auroraGraphics.destroyed) {
            this.#auroraGraphics.clear();
            this.#auroraGraphics.setPosition(bounds.x, bounds.y);

            // Update aurora wave positions relative to bounds
            for (let i = 0; i < this.#auroraWaves.length; i++) {
                this.#auroraWaves[i].y = bounds.y + (bounds.height * 0.2) + (i * 30);
            }
        }
    }

    /**
     * Updates our sky gradient with current colours! 🌈
     * Creates a smooth transition between our sky colours.
     *
     * @param {Phaser.Geom.Rectangle} bounds - The bounds to draw the sky gradient within
     */
    #updateSkyGradient(bounds = this.#getCameraBounds()) {
        if (!this.#skyGradient) {
            return;
        }

        const currentPalette = this.#getCurrentPalette();
        this.#skyGradient.clear();

        // Draw top gradient (top to middle) - like painting the upper sky! 🎨
        this.#skyGradient.fillGradientStyle(
            currentPalette.top,    // Top left
            currentPalette.top,    // Top right
            currentPalette.middle, // Bottom left
            currentPalette.middle, // Bottom right
            1,  // Alpha
        );
        this.#skyGradient.fillRect(
            bounds.x - 5,
            bounds.y,
            bounds.width + 10,  // Add 10 to compensate for the -5 offset
            bounds.height / 2,
        );

        // Draw bottom gradient (middle to bottom) - like painting the lower sky! 🎨
        this.#skyGradient.fillGradientStyle(
            currentPalette.middle, // Top left
            currentPalette.middle, // Top right
            currentPalette.bottom, // Bottom left
            currentPalette.bottom, // Bottom right
            1,  // Alpha
        );
        this.#skyGradient.fillRect(
            bounds.x - 5,
            bounds.y + (bounds.height / 2),
            bounds.width + 10,  // Add 10 to compensate for the -5 offset
            bounds.height / 2,
        );
    }

    /**
     * Creates the star system
     */
    #createStars() {
        if (!SkySystem.STAR_CONFIG.ENABLED) {
            return;
        }

        // Create a container for all stars
        this.#starContainer = this.#scene.add.container(0, 0)
            .setDepth(100)  // Between sky and lighting
            .setScrollFactor(0);

        // Create our twinkling stars
        for (let i = 0; i < SkySystem.STAR_CONFIG.COUNT; i++) {
            // Random position within the screen bounds
            const x = Math.random() * this.#scene.scale.width;
            const y = Math.random() * (this.#scene.scale.height * SkySystem.STAR_CONFIG.Y_SPAWN_AREA);

            // Random size between min and max
            const size = Phaser.Math.Between(
                SkySystem.STAR_CONFIG.MIN_SIZE,
                SkySystem.STAR_CONFIG.MAX_SIZE,
            );

            // Create the star
            const star = this.#scene.add.rectangle(x, y, size, size, 0xffffff, 1)
                .setOrigin(0.5);

            // Add random twinkle properties
            const twinkleSpeed = Phaser.Math.FloatBetween(
                SkySystem.STAR_CONFIG.TWINKLE_SPEED_MIN,
                SkySystem.STAR_CONFIG.TWINKLE_SPEED_MAX,
            );
            const twinkleOffset = Math.random() * Math.PI * 2; // Random start phase

            // Add to container and tracking array
            this.#starContainer.add(star);
            this.#stars.push({ star, twinkleSpeed, twinkleOffset });
        }
    }

    /**
     * Creates the aurora effect system
     */
    #createAurora() {
        if (!SkySystem.AURORA_CONFIG.ENABLED) {
            return;
        }

        // Create graphics object for aurora
        this.#auroraGraphics = this.#scene.add.graphics()
            .setDepth(150)  // Above stars but below lighting
            .setScrollFactor(0);

        // Create our aurora waves
        for (let i = 0; i < SkySystem.AURORA_CONFIG.WAVES; i++) {
            this.#auroraWaves.push({
                x: 0,
                y: (this.#scene.scale.height * 0.2) + (i * 30), // Stagger height
                wavelength: Phaser.Math.Between(
                    SkySystem.AURORA_CONFIG.MIN_WAVELENGTH,
                    SkySystem.AURORA_CONFIG.MAX_WAVELENGTH,
                ),
                speed: Phaser.Math.FloatBetween(
                    SkySystem.AURORA_CONFIG.MIN_SPEED,
                    SkySystem.AURORA_CONFIG.MAX_SPEED,
                ),
                amplitude: Phaser.Math.Between(
                    SkySystem.AURORA_CONFIG.MIN_AMPLITUDE,
                    SkySystem.AURORA_CONFIG.MAX_AMPLITUDE,
                ),
            });
        }
    }

    /**
     * Creates the cloud system
     */
    #createClouds() {
        if (!SkySystem.CLOUD_CONFIG.ENABLED) {
            return;
        }

        // Create graphics object for clouds
        this.#cloudGraphics = this.#scene.add.graphics()
            .setDepth(160)  // Below stars but above aurora
            .setScrollFactor(0);
    }

    /**
     * Smoothly blends between two colour palettes
     *
     * @param {Object} palette1 - Starting palette
     * @param {Object} palette2 - Ending palette
     * @param {number} t - Blend amount (0-1)
     * @returns {Object} The blended palette
     */
    #lerpPalette(palette1, palette2, t) {
        // Helper function to interpolate between two hex colours
        const lerpColour = (colour1, colour2, t) => {
            const r1 = (colour1 >> 16) & 0xff;
            const g1 = (colour1 >> 8) & 0xff;
            const b1 = colour1 & 0xff;

            const r2 = (colour2 >> 16) & 0xff;
            const g2 = (colour2 >> 8) & 0xff;
            const b2 = colour2 & 0xff;

            const r = Math.round(r1 + ((r2 - r1) * t));
            const g = Math.round(g1 + ((g2 - g1) * t));
            const b = Math.round(b1 + ((b2 - b1) * t));

            return (r << 16) | (g << 8) | b;
        };

        return {
            top: lerpColour(palette1.top, palette2.top, t),
            middle: lerpColour(palette1.middle, palette2.middle, t),
            bottom: lerpColour(palette1.bottom, palette2.bottom, t),
        };
    }

    /**
     * Interpolates between two lighting configurations
     *
     * @param {Object} config1 - Starting lighting config
     * @param {Object} config2 - Ending lighting config
     * @param {number} t - Interpolation amount (0-1)
     * @returns {Object} Interpolated lighting config
     */
    #lerpLighting(config1, config2, t) {
        // Helper function to interpolate colours
        const lerpColour = (colour1, colour2, t) => {
            const r1 = (colour1 >> 16) & 0xff;
            const g1 = (colour1 >> 8) & 0xff;
            const b1 = colour1 & 0xff;

            const r2 = (colour2 >> 16) & 0xff;
            const g2 = (colour2 >> 8) & 0xff;
            const b2 = colour2 & 0xff;

            const r = Math.round(r1 + ((r2 - r1) * t));
            const g = Math.round(g1 + ((g2 - g1) * t));
            const b = Math.round(b1 + ((b2 - b1) * t));

            return (r << 16) | (g << 8) | b;
        };

        return {
            colour: lerpColour(config1.colour, config2.colour, t),
            alpha: config1.alpha + ((config2.alpha - config1.alpha) * t),
        };
    }

    /**
     * Gets the current colour palette based on time of day
     *
     * @returns {Object} The current colour palette
     */
    #getCurrentPalette() {
        // Interpolate between palettes based on time of day
        const time = this.#timeOfDay;
        if (time < 0.25) { // Dawn
            return this.#lerpPalette(SkySystem.PALETTES.NIGHT, SkySystem.PALETTES.DAWN, time * 4);
        }
        else if (time < 0.5) { // Day
            return this.#lerpPalette(SkySystem.PALETTES.DAWN, SkySystem.PALETTES.DAY, (time - 0.25) * 4);
        }
        else if (time < 0.75) { // Dusk
            return this.#lerpPalette(SkySystem.PALETTES.DAY, SkySystem.PALETTES.DUSK, (time - 0.5) * 4);
        }
        else { // Night
            return this.#lerpPalette(SkySystem.PALETTES.DUSK, SkySystem.PALETTES.NIGHT, (time - 0.75) * 4);
        }
    }

    /**
     * Updates our sky gradient with current colours
     *
     * @param {number} width - The width of the game
     * @param {number} height - The height of the game
     */
    /* #updateSkyGradient(width = this.#initialSceneWidth, height = this.#initialSceneHeight) {
        const paddedWidth = width + (this.#cameraPadding.x * 2);
        const paddedHeight = height + (this.#cameraPadding.y * 4);
        const currentPalette = this.#getCurrentPalette();

        this.#skyGradient.clear();

        // Create our three-colour gradient by drawing two gradients
        // First gradient: top to middle
        this.#skyGradient.fillGradientStyle(
            currentPalette.top,    // Top left
            currentPalette.top,    // Top right
            currentPalette.middle, // Bottom left
            currentPalette.middle, // Bottom right
            1,  // Alpha
        );
        this.#skyGradient.fillRect(-this.#cameraPadding.x, -(this.#cameraPadding.y * 3), paddedWidth, paddedHeight / 2);

        // Second gradient: middle to bottom
        this.#skyGradient.fillGradientStyle(
            currentPalette.middle, // Top left
            currentPalette.middle, // Top right
            currentPalette.bottom, // Bottom left
            currentPalette.bottom, // Bottom right
            1,  // Alpha
        );
        this.#skyGradient.fillRect(-this.#cameraPadding.x, -(this.#cameraPadding.y * 3) + (paddedHeight / 2), paddedWidth, paddedHeight / 2);
    } */

    /**
     * Updates the lighting based on time of day
     */
    #updateLighting() {
        const time = this.#timeOfDay;
        let lightingConfig;

        if (time < 0.25) { // Dawn
            lightingConfig = this.#lerpLighting(
                SkySystem.LIGHTING.NIGHT,
                SkySystem.LIGHTING.DAWN,
                time * 4,
            );
        }
        else if (time < 0.5) { // Day
            lightingConfig = this.#lerpLighting(
                SkySystem.LIGHTING.DAWN,
                SkySystem.LIGHTING.DAY,
                (time - 0.25) * 4,
            );
        }
        else if (time < 0.75) { // Dusk
            lightingConfig = this.#lerpLighting(
                SkySystem.LIGHTING.DAY,
                SkySystem.LIGHTING.DUSK,
                (time - 0.5) * 4,
            );
        }
        else { // Night
            lightingConfig = this.#lerpLighting(
                SkySystem.LIGHTING.DUSK,
                SkySystem.LIGHTING.NIGHT,
                (time - 0.75) * 4,
            );
        }

        this.#lighting.setFillStyle(lightingConfig.colour, lightingConfig.alpha);
    }

    /**
     * Updates the star system
     *
     * @param {number} time - Current game time in milliseconds
     */
    #updateStars(time) {
        if (!SkySystem.STAR_CONFIG.ENABLED) {
            return;
        }

        const timeOfDay = this.getTimeOfDay();

        // Calculate star visibility based on time of day
        // Stars are visible from dusk to dawn (0.75 to 0.25)
        let starVisibility = 0;

        if (timeOfDay > 0.75 || timeOfDay < 0.25) {
            // Full visibility at midnight (0/1), fading at dawn/dusk
            starVisibility = timeOfDay > 0.75
                ? Phaser.Math.Clamp((timeOfDay - 0.75) * 4, 0, 1)
                : Phaser.Math.Clamp((0.25 - timeOfDay) * 4, 0, 1);
        }

        // Update each star's twinkle effect
        for (const { star, twinkleSpeed, twinkleOffset } of this.#stars) {
            const twinkle = Math.sin((time * 0.001 * twinkleSpeed) + twinkleOffset);
            const alpha = Phaser.Math.Linear(
                SkySystem.STAR_CONFIG.MIN_ALPHA,
                SkySystem.STAR_CONFIG.MAX_ALPHA,
                (twinkle + 1) * 0.5,
            ) * starVisibility;

            star.setAlpha(alpha);
        }
    }

    /**
     * Updates the aurora effect
     *
     * @param {number} time - Current game time in milliseconds
     */
    #updateAurora(time) {
        if (!SkySystem.AURORA_CONFIG.ENABLED) {
            return;
        }

        const timeOfDay = this.getTimeOfDay();

        // Only allow aurora during night time
        const isNightTime = timeOfDay > 0.75 || timeOfDay < 0.25;

        if (!isNightTime) {
            this.#isAuroraActive = false;
            this.#auroraGraphics.clear();

            return;
        }

        // Check if we should spawn a new aurora
        if (!this.#isAuroraActive) {
            // Only check every SPAWN_CHECK_INTERVAL milliseconds
            if (time - this.#lastSpawnCheck >= SkySystem.AURORA_CONFIG.SPAWN_CHECK_INTERVAL) {
                this.#lastSpawnCheck = time;

                // Random chance to spawn aurora each interval
                if (Math.random() < SkySystem.AURORA_CONFIG.SPAWN_CHANCE) {
                    this.#isAuroraActive = true;
                    this.#auroraStartTime = time;
                    const duration = Phaser.Math.Between(
                        SkySystem.AURORA_CONFIG.MIN_DURATION * 1000,
                        SkySystem.AURORA_CONFIG.MAX_DURATION * 1000,
                    );
                    this.#auroraEndTime = time + duration;
                }
            }

            if (!this.#isAuroraActive) {
                this.#auroraGraphics.clear();

                return;
            }
        }

        // Check if aurora should end
        if (time > this.#auroraEndTime) {
            this.#isAuroraActive = false;
            this.#auroraGraphics.clear();

            return;
        }

        // Calculate visibility including fade in/out
        let auroraVisibility = 1;
        const fadeDuration = SkySystem.AURORA_CONFIG.FADE_DURATION * 1000;

        // Fade in
        if (time - this.#auroraStartTime < fadeDuration) {
            auroraVisibility = (time - this.#auroraStartTime) / fadeDuration;
        }

        // Fade out
        else if (this.#auroraEndTime - time < fadeDuration) {
            auroraVisibility = (this.#auroraEndTime - time) / fadeDuration;
        }

        this.#auroraGraphics.clear();

        // Draw each wave
        for (let waveIndex = 0; waveIndex < this.#auroraWaves.length; waveIndex++) {
            const wave = this.#auroraWaves[waveIndex];
            const colour = SkySystem.AURORA_CONFIG.COLOURS[waveIndex % SkySystem.AURORA_CONFIG.COLOURS.length];
            const baseAlpha = SkySystem.AURORA_CONFIG.ALPHA * auroraVisibility;

            // Draw multiple layers with decreasing alpha for a glow effect
            for (let layer = 0; layer < SkySystem.AURORA_CONFIG.GLOW_LAYERS; layer++) {
                const layerAlpha = baseAlpha * (1 - (layer * 0.12));
                const thickness = SkySystem.AURORA_CONFIG.BASE_THICKNESS +
                                (layer * SkySystem.AURORA_CONFIG.THICKNESS_STEP);

                this.#auroraGraphics.beginPath();
                this.#auroraGraphics.lineStyle(thickness, colour, layerAlpha);

                // Draw the wave with smaller segments for smoothness
                let isFirst = true;
                const amplitude = wave.amplitude * (1 + (layer * 0.15));

                for (let x = -20; x <= this.#scene.scale.width + 20; x += SkySystem.AURORA_CONFIG.SEGMENT_SIZE) {
                    const normalisedTime = time * 0.001 * wave.speed;
                    const secondaryWave = Math.sin((x / (wave.wavelength * 0.4)) + (normalisedTime * 1.5)) * (amplitude * 0.3);
                    const y = wave.y +
                            (Math.sin((x / wave.wavelength) + normalisedTime) * amplitude) +
                            secondaryWave;

                    if (isFirst) {
                        this.#auroraGraphics.moveTo(x, y);
                        isFirst = false;
                    }
                    else {
                        this.#auroraGraphics.lineTo(x, y);
                    }
                }

                this.#auroraGraphics.strokePath();
            }
        }
    }

    /**
     * Creates a new cloud object
     *
     * @param {boolean} [offScreen=true] - Whether to create the cloud off screen
     * @returns {Object} The new cloud object
     */
    #createCloud(offScreen = true) {
        const width = Phaser.Math.Between(
            SkySystem.CLOUD_CONFIG.MIN_WIDTH,
            SkySystem.CLOUD_CONFIG.MAX_WIDTH,
        );
        const height = Phaser.Math.Between(
            SkySystem.CLOUD_CONFIG.MIN_HEIGHT,
            SkySystem.CLOUD_CONFIG.MAX_HEIGHT,
        );
        const speed = Phaser.Math.FloatBetween(
            SkySystem.CLOUD_CONFIG.MIN_SPEED,
            SkySystem.CLOUD_CONFIG.MAX_SPEED,
        );
        const blocks = Phaser.Math.Between(
            SkySystem.CLOUD_CONFIG.BLOCKS.MIN,
            SkySystem.CLOUD_CONFIG.BLOCKS.MAX,
        );

        // Position cloud either off-screen or randomly on-screen
        const x = offScreen
            ? -width - SkySystem.CLOUD_CONFIG.SPAWN_MARGIN
            : Phaser.Math.Between(0, this.#scene.scale.width);

        const y = Phaser.Math.Between(20, 80); // Keep clouds higher in the sky

        return {
            x,
            y,
            width,
            height,
            speed,
            blocks,
        };
    }

    /**
     * Draws a single cloud
     * @param {Object} cloud - Cloud object to draw
     * @param {Phaser.Display.Color} colour - Cloud colour
     * @param {number} alpha - Cloud alpha
     */
    #drawCloud(cloud, colour, alpha) {
        // Convert colour object to hex integer
        const hexColour = Phaser.Display.Color.GetColor(colour.r, colour.g, colour.b);

        // Set fill style with hex colour and alpha
        this.#cloudGraphics.fillStyle(hexColour, alpha);

        // Begin cloud path
        this.#cloudGraphics.beginPath();

        // Calculate dimensions for a more pixel-art style
        const blockSize = cloud.height * 0.8; // Square blocks
        const maxBlocks = cloud.blocks;

        // Create a grid of positions for blocks
        const positions = [];

        // Add base row blocks (always present)
        for (let i = 0; i < maxBlocks; i++) {
            positions.push({
                x: cloud.x + (i * blockSize),
                y: cloud.y + blockSize,
            });
        }

        // Add top row blocks (alternating)
        for (let i = 0; i < maxBlocks - 1; i++) {
            if (i % 2 === 0) {
                positions.push({
                    x: cloud.x + (i * blockSize) + (blockSize * 0.5),
                    y: cloud.y,
                });
            }
        }

        // Draw all blocks
        positions.forEach((pos) => {
            this.#cloudGraphics.fillRect(
                pos.x,
                pos.y,
                blockSize,
                blockSize,
            );
        });
    }

    /**
     * Updates cloud positions and spawns new clouds as needed
     *
     * @param {number} _time - Current game time
     */
    #updateClouds(_time) {
        if (!SkySystem.CLOUD_CONFIG.ENABLED) {
            return;
        }

        // Initialise clouds if needed
        if (this.#clouds.length === 0) {
            const numClouds = Phaser.Math.Between(
                SkySystem.CLOUD_CONFIG.MIN_CLOUDS,
                SkySystem.CLOUD_CONFIG.MAX_CLOUDS,
            );
            for (let i = 0; i < numClouds; i++) {
                this.#clouds.push(this.#createCloud(false));
            }
        }

        // Get current time-based properties
        const timeOfDay = this.getTimeOfDay();
        let cloudColour, cloudAlpha;

        if (timeOfDay < 0.25) { // Dawn
            const t = timeOfDay / 0.25;
            const nightColour = new Phaser.Display.Color().setFromRGB(
                Phaser.Display.Color.IntegerToRGB(SkySystem.CLOUD_CONFIG.COLOURS.NIGHT),
            );
            const dawnColour = new Phaser.Display.Color().setFromRGB(
                Phaser.Display.Color.IntegerToRGB(SkySystem.CLOUD_CONFIG.COLOURS.DAWN),
            );
            cloudColour = Phaser.Display.Color.Interpolate.ColorWithColor(
                nightColour,
                dawnColour,
                100,
                t * 100,
            );
            cloudAlpha = Phaser.Math.Linear(
                SkySystem.CLOUD_CONFIG.ALPHA.NIGHT,
                SkySystem.CLOUD_CONFIG.ALPHA.DAWN,
                t,
            );
        }
        else if (timeOfDay < 0.5) { // Day transition
            const t = (timeOfDay - 0.25) / 0.25;
            const dawnColour = new Phaser.Display.Color().setFromRGB(
                Phaser.Display.Color.IntegerToRGB(SkySystem.CLOUD_CONFIG.COLOURS.DAWN),
            );
            const dayColour = new Phaser.Display.Color().setFromRGB(
                Phaser.Display.Color.IntegerToRGB(SkySystem.CLOUD_CONFIG.COLOURS.DAY),
            );
            cloudColour = Phaser.Display.Color.Interpolate.ColorWithColor(
                dawnColour,
                dayColour,
                100,
                t * 100,
            );
            cloudAlpha = Phaser.Math.Linear(
                SkySystem.CLOUD_CONFIG.ALPHA.DAWN,
                SkySystem.CLOUD_CONFIG.ALPHA.DAY,
                t,
            );
        }
        else if (timeOfDay < 0.75) { // Dusk transition
            const t = (timeOfDay - 0.5) / 0.25;
            const dayColour = new Phaser.Display.Color().setFromRGB(
                Phaser.Display.Color.IntegerToRGB(SkySystem.CLOUD_CONFIG.COLOURS.DAY),
            );
            const duskColour = new Phaser.Display.Color().setFromRGB(
                Phaser.Display.Color.IntegerToRGB(SkySystem.CLOUD_CONFIG.COLOURS.DUSK),
            );
            cloudColour = Phaser.Display.Color.Interpolate.ColorWithColor(
                dayColour,
                duskColour,
                100,
                t * 100,
            );
            cloudAlpha = Phaser.Math.Linear(
                SkySystem.CLOUD_CONFIG.ALPHA.DAY,
                SkySystem.CLOUD_CONFIG.ALPHA.DUSK,
                t,
            );
        }
        else { // Night transition
            const t = (timeOfDay - 0.75) / 0.25;
            const duskColour = new Phaser.Display.Color().setFromRGB(
                Phaser.Display.Color.IntegerToRGB(SkySystem.CLOUD_CONFIG.COLOURS.DUSK),
            );
            const nightColour = new Phaser.Display.Color().setFromRGB(
                Phaser.Display.Color.IntegerToRGB(SkySystem.CLOUD_CONFIG.COLOURS.NIGHT),
            );
            cloudColour = Phaser.Display.Color.Interpolate.ColorWithColor(
                duskColour,
                nightColour,
                100,
                t * 100,
            );
            cloudAlpha = Phaser.Math.Linear(
                SkySystem.CLOUD_CONFIG.ALPHA.DUSK,
                SkySystem.CLOUD_CONFIG.ALPHA.NIGHT,
                t,
            );
        }

        // Clear previous frame
        this.#cloudGraphics.clear();

        // Update and draw clouds
        for (let i = this.#clouds.length - 1; i >= 0; i--) {
            const cloud = this.#clouds[i];

            // Move cloud
            cloud.x += cloud.speed;

            // Remove cloud if it's off screen
            if (cloud.x > this.#scene.scale.width + SkySystem.CLOUD_CONFIG.SPAWN_MARGIN) {
                this.#clouds.splice(i, 1);

                continue;
            }

            // Draw cloud
            this.#drawCloud(cloud, cloudColour, cloudAlpha);
        }

        // Spawn new clouds if needed
        while (this.#clouds.length < SkySystem.CLOUD_CONFIG.MIN_CLOUDS) {
            this.#clouds.push(this.#createCloud(true));
        }
    }

    /**
     * Creates our weather particle systems
     */
    #createWeatherEffects() {
        if (!SkySystem.WEATHER_CONFIG.ENABLED) {
            return;
        }

        // Create rain emitter
        this.#rainEmitter = this.#scene.add.particles(0, 0, 'particle', {
            x: { min: 0, max: this.#scene.scale.width },
            y: 0,
            lifespan: { min: SkySystem.WEATHER_CONFIG.RAIN.LIFETIME.MIN,
                max: SkySystem.WEATHER_CONFIG.RAIN.LIFETIME.MAX },
            speed: { min: SkySystem.WEATHER_CONFIG.RAIN.SPEED.MIN,
                max: SkySystem.WEATHER_CONFIG.RAIN.SPEED.MAX },
            angle: { min: SkySystem.WEATHER_CONFIG.RAIN.ANGLE.MIN,
                max: SkySystem.WEATHER_CONFIG.RAIN.ANGLE.MAX },
            scale: { start: SkySystem.WEATHER_CONFIG.RAIN.SCALE.MIN,
                end: SkySystem.WEATHER_CONFIG.RAIN.SCALE.MAX },
            alpha: { start: SkySystem.WEATHER_CONFIG.RAIN.ALPHA.MIN,
                end: SkySystem.WEATHER_CONFIG.RAIN.ALPHA.MAX },
            tint: SkySystem.WEATHER_CONFIG.RAIN.COLOUR,
            frequency: SkySystem.WEATHER_CONFIG.RAIN.FREQUENCY,
            quantity: SkySystem.WEATHER_CONFIG.RAIN.QUANTITY,
            emitting: false,
            depth: 150,
        });

        // Create dust emitter
        this.#dustEmitter = this.#scene.add.particles(-50, 0, 'particle', {
            y: { min: 0, max: this.#scene.scale.height * 0.7 },
            lifespan: { min: SkySystem.WEATHER_CONFIG.DUST.LIFETIME.MIN,
                max: SkySystem.WEATHER_CONFIG.DUST.LIFETIME.MAX },
            speedX: { min: SkySystem.WEATHER_CONFIG.DUST.SPEED.MIN,
                max: SkySystem.WEATHER_CONFIG.DUST.SPEED.MAX },
            speedY: { min: -20, max: 20 },
            angle: { min: SkySystem.WEATHER_CONFIG.DUST.ANGLE.MIN,
                max: SkySystem.WEATHER_CONFIG.DUST.ANGLE.MAX },
            scale: { start: SkySystem.WEATHER_CONFIG.DUST.SCALE.MIN,
                end: SkySystem.WEATHER_CONFIG.DUST.SCALE.MAX },
            alpha: { start: SkySystem.WEATHER_CONFIG.DUST.ALPHA.MIN,
                end: SkySystem.WEATHER_CONFIG.DUST.ALPHA.MAX },
            tint: SkySystem.WEATHER_CONFIG.DUST.COLOUR,
            frequency: SkySystem.WEATHER_CONFIG.DUST.FREQUENCY,
            quantity: SkySystem.WEATHER_CONFIG.DUST.QUANTITY,
            emitting: false,
            depth: 150,
        });
    }

    /**
     * Starts a rain effect
     */
    #startRain() {
        this.#rainEmitter.start();
        this.#weatherTimer = SkySystem.WEATHER_CONFIG.RAIN.DURATION;
    }

    /**
     * Starts a dust storm effect
     */
    #startDustStorm() {
        this.#dustEmitter.start();
        this.#weatherTimer = SkySystem.WEATHER_CONFIG.DUST.DURATION;
    }

    /**
     * Updates weather effects
     *
     * @param {number} delta - Time in ms since last update
     */
    #updateWeather(delta) {
        if (!SkySystem.WEATHER_CONFIG.ENABLED) {
            return;
        }

        // Update weather timer
        if (this.#weatherTimer > 0) {
            this.#weatherTimer -= delta;
            if (this.#weatherTimer <= 0) {
                this.#rainEmitter.stop();
                this.#dustEmitter.stop();
            }
        }
        else {
            // Check for new weather
            if (Math.random() < SkySystem.WEATHER_CONFIG.RAIN.CHANCE) {
                this.#startRain();
            }
            else if (Math.random() < SkySystem.WEATHER_CONFIG.DUST.CHANCE) {
                this.#startDustStorm();
            }
        }
    }

    /**
     * Gets the current time of day as a percentage (0-1)
     *
     * @returns {number} Current time of day
     */
    getTimeOfDay() {
        return this.#timeOfDay;
    }

    /**
     * Updates the sky system! ☀️
     *
     * @param {number} time - Current game time in milliseconds
     * @param {number} delta - Time since last update in milliseconds, adjusted for slow motion
     */
    update(time, delta) {
        // Update time of day using the provided delta which already accounts for slow motion
        this.#timeOfDay = (this.#timeOfDay + (delta / SkySystem.DAY_NIGHT_CYCLE_DURATION)) % 1;

        // Update sky gradient and effects
        this.#updateSkyGradient();
        this.#updateLighting();
        this.#updateStars(time);
        this.#updateAurora(time);
        this.#updateClouds(time);
        this.#updateWeather(delta);
    }

    /**
     * Cleans up the sky system
     */
    destroy() {
        // Remove resize listener
        if (this.#scene && this.#scene.scale) {
            this.#scene.scale.off('resize', this.#resizeListener);
        }

        // Stop all weather effects
        if (this.#rainEmitter) {
            this.#rainEmitter.stop();
            this.#rainEmitter.remove();
        }
        if (this.#dustEmitter) {
            this.#dustEmitter.stop();
            this.#dustEmitter.remove();
        }

        // Clean up all components
        if (this.#skyGradient && !this.#skyGradient.destroyed) {
            this.#skyGradient.destroy();
            this.#skyGradient = null;
        }
        if (this.#lighting && !this.#lighting.destroyed) {
            this.#lighting.destroy();
            this.#lighting = null;
        }
        if (this.#starContainer && !this.#starContainer.destroyed) {
            // Destroy all star sprites first
            this.#stars.forEach(({ star }) => star.destroy());
            this.#starContainer.destroy();
            this.#starContainer = null;
        }
        if (this.#auroraGraphics && !this.#auroraGraphics.destroyed) {
            this.#auroraGraphics.destroy();
            this.#auroraGraphics = null;
        }
        if (this.#cloudGraphics && !this.#cloudGraphics.destroyed) {
            this.#cloudGraphics.destroy();
            this.#cloudGraphics = null;
        }

        // Clear arrays
        this.#stars = [];
        this.#auroraWaves = [];
        this.#clouds = [];

        // Clear timers
        this.#weatherTimer = 0;
        this.#lastSpawnCheck = 0;

        // Remove scene shutdown listener
        if (this.#scene && this.#scene.events) {
            this.#scene.events.off('shutdown', this.destroy, this);
        }

        // Clear scene reference
        this.#scene = null;
    }

    /**
     * Gets all the sky elements that need to be registered with the camera 🎥
     *
     * @returns {Phaser.GameObjects.GameObject[]} Array of sky elements
     */
    getSkyElements() {
        const elements = [];

        if (this.#skyGradient) {
            elements.push(this.#skyGradient);
        }
        if (this.#lighting) {
            elements.push(this.#lighting);
        }
        if (this.#starContainer) {
            elements.push(this.#starContainer);
        }
        if (this.#auroraGraphics) {
            elements.push(this.#auroraGraphics);
        }
        if (this.#cloudGraphics) {
            elements.push(this.#cloudGraphics);
        }

        return elements;
    }
}
