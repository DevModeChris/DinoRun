/**
 * ⏱️ The CountdownSystem handles game start and resume countdowns!
 *
 * This system creates a nice countdown display to give players time
 * to get ready before the action starts.
 */
import Phaser from 'phaser';

export class CountdownSystem {
    /** @type {string} */
    static EVENT_COUNTDOWN_START = 'countdown-start';

    /** @type {string} */
    static EVENT_COUNTDOWN_TICK = 'countdown-tick';

    /** @type {string} */
    static EVENT_COUNTDOWN_COMPLETE = 'countdown-complete';

    /** @type {Phaser.Scene} */
    #scene;

    /** @type {Phaser.GameObjects.Container} */
    #container;

    /** @type {Phaser.GameObjects.Text} */
    #countdownText;

    /** @type {number} */
    #currentCount = 5;

    /** @type {boolean} */
    #isCountingDown = false;

    /** @type {Function} */
    #onCompleteCallback;

    /** @type {Phaser.Time.TimerEvent} */
    #countdownTimer;

    /** @type {Phaser.Events.EventEmitter} */
    #events;

    /**
     * Creates a new countdown system
     *
     * @param {Phaser.Scene} scene - The scene this system belongs to
     */
    constructor(scene) {
        this.#scene = scene;
        this.#events = new Phaser.Events.EventEmitter();
        this.#createCountdownDisplay();
    }

    /**
     * Gets the event emitter for this system
     *
     * @returns {Phaser.Events.EventEmitter} The event emitter
     */
    getEvents() {
        return this.#events;
    }

    /**
     * Sets up the visual elements for the countdown
     *
     * @private
     */
    #createCountdownDisplay() {
        this.#container = this.#scene.add.container(0, 0);
        this.#container.setDepth(1000);

        // Countdown text with larger, bolder font
        this.#countdownText = this.#scene.add.text(0, 0, '5', {
            fontFamily: 'grandstander-bold',
            fontSize: '72px',
            color: '#ffffff',
        });
        this.#countdownText.setOrigin(0.5);

        this.#container.add(this.#countdownText);
        this.#container.setVisible(false);
    }

    /**
     * Starts the countdown sequence
     *
     * @param {number} x - X position for the countdown display (unused)
     * @param {number} y - Y position for the countdown display (unused)
     * @param {Function} onComplete - Callback to run when countdown finishes
     */
    startCountdown(x, y, onComplete) {
        // Stop any existing countdown first
        this.stopCountdown();

        this.#isCountingDown = true;
        this.#currentCount = 5;
        this.#onCompleteCallback = onComplete;

        // Position in center of screen
        const { width, height } = this.#scene.scale;
        this.#container.setPosition(width / 2, height / 2);
        this.#container.setVisible(true);
        this.#updateDisplay();

        // Emit countdown start event
        this.#events.emit(CountdownSystem.EVENT_COUNTDOWN_START);

        // Create the countdown timer
        this.#countdownTimer = this.#scene.time.addEvent({
            delay: 1000,
            callback: this.#tick,
            callbackScope: this,
            repeat: 4,
        });
    }

    /**
     * Stops the current countdown if one is active
     */
    stopCountdown() {
        if (this.#countdownTimer) {
            this.#countdownTimer.destroy();
            this.#countdownTimer = null;
        }

        this.#isCountingDown = false;
        this.#container.setVisible(false);
    }

    /**
     * Updates the countdown display with current count
     *
     * @private
     */
    #updateDisplay() {
        this.#countdownText.setText(this.#currentCount.toString());

        // Add a scale animation
        this.#scene.tweens.add({
            targets: this.#countdownText,
            scale: { from: 1.5, to: 1 },
            duration: 300,
            ease: 'Back.easeOut',
        });
    }

    /**
     * Handles each countdown tick
     *
     * @private
     */
    #tick() {
        this.#currentCount--;

        if (this.#currentCount > 0) {
            this.#updateDisplay();

            // Emit countdown tick event
            this.#events.emit(CountdownSystem.EVENT_COUNTDOWN_TICK, this.#currentCount);
        }
        else {
            this.#container.setVisible(false);
            this.#isCountingDown = false;

            // Emit countdown complete event before callback
            this.#events.emit(CountdownSystem.EVENT_COUNTDOWN_COMPLETE);

            if (this.#onCompleteCallback) {
                this.#onCompleteCallback();
            }
        }
    }

    /**
     * Gets the countdown container for UI camera
     *
     * @returns {Phaser.GameObjects.Container} The countdown container
     */
    getCountdownContainer() {
        return this.#container;
    }

    /**
     * Checks if a countdown is currently active
     *
     * @returns {boolean} True if counting down
     */
    isCountingDown() {
        return this.#isCountingDown;
    }
}
