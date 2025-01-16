/**
 * 🦅 The Bird class represents our flying enemy!
 *
 * These pesky birds try to knock our dino out of the sky.
 */
import Phaser from 'phaser';

export class Bird extends Phaser.GameObjects.Sprite {
    /** @type {number} */
    static WIDTH = 32;

    /** @type {number} */
    static HEIGHT = 32;

    /** @type {{min: number, max: number}} */
    static SPEED_RANGE = {
        min: -450,  // Faster birds
        max: -320,  // Slower birds
    };

    /** @type {number[]} */
    static SPAWN_HEIGHTS = [120, 130, 140, 150, 200, 220, 240, 250]; // Heights above ground level

    /** @type {number} */
    #originalVelocityX;

    /**
     * Creates a new bird enemy! 🦅
     *
     * @param {Phaser.Scene} scene - The scene that owns this bird
     * @param {number} x - The bird's starting x position
     * @param {number} y - The bird's starting y position
     * @param {number} speed - The bird's horizontal speed
     */
    constructor(scene, x, y, speed) {
        super(scene, x, y, 'bird-sprites');

        // Set depth above sky,stars,etc but below lighting and ui
        this.setDepth(200);

        // Add to scene and enable physics
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Set up physics body
        /** @type {Phaser.Physics.Arcade.Body} */
        const body = this.body;
        body.setSize(Bird.WIDTH, Bird.HEIGHT);
        body.setVelocityX(speed);
        body.setAllowGravity(false);

        // Create flying animation if it doesn't exist
        if (!scene.anims.exists('bird-fly')) {
            scene.anims.create({
                key: 'bird-fly',
                frames: scene.anims.generateFrameNumbers('bird-sprites', {
                    start: 0,
                    end: 8,
                }),
                frameRate: 12,
                repeat: -1,
            });
        }

        // Start flying!
        this.play('bird-fly');

        // Auto-destroy when off screen
        this.checkDestroy = this.scene.time.addEvent({
            delay: 100,
            callback: this.#checkIfOffScreen,
            callbackScope: this,
            loop: true,
        });

        this.#originalVelocityX = 0;
    }

    /**
     * Checks if the bird has flown off screen and destroys it if so
     */
    #checkIfOffScreen() {
        if (this.x < -Bird.WIDTH) {
            this.destroy();
        }
    }

    /**
     * Pause bird animations and movement
     */
    pause() {
        this.anims.pause();
        this.#originalVelocityX = this.body.velocity.x;
        this.body.setVelocityX(0);
    }

    /**
     * Resume bird animations and movement
     */
    resume() {
        this.anims.resume();
        this.body.setVelocityX(this.#originalVelocityX);
    }

    /**
     * Creates a new bird at a random height above the ground
     *
     * @param {Phaser.Scene} scene - The scene to spawn the bird in
     * @returns {Bird} The newly created bird
     */
    static spawn(scene) {
        const gameWidth = scene.scale.width;
        const groundY = scene.scale.height - 30; // Ground level
        const heightAboveGround = Phaser.Math.RND.pick(Bird.SPAWN_HEIGHTS);
        const spawnY = groundY - heightAboveGround;
        const speed = Phaser.Math.Between(Bird.SPEED_RANGE.min, Bird.SPEED_RANGE.max);

        return new Bird(scene, gameWidth + Bird.WIDTH, spawnY, speed);
    }
}
