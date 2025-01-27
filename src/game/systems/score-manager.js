/**
 * The ScoreManager manages and shows your points in the game!
 *
 * It keeps track of how well you're doing and remembers your best score ever!
 */
export class ScoreManager {
    /** @type {number} */
    #currentScore = 0;

    /** @type {number} */
    #highScore = 0;

    /** @type {number} */
    #accumulatedTime = 0;

    /** @type {Phaser.GameObjects.Text} */
    #currentScoreText;

    /** @type {Phaser.GameObjects.Text} */
    #highScoreText;

    /** @type {number} */
    #baseFontSize;

    /**
     * Creates our scoreboard!
     *
     * @param {Phaser.Scene} scene - The game scene where we'll show the score
     * @param {number} x - Where to put the score on the screen (left to right)
     * @param {number} y - Where to put the score on the screen (top to bottom)
     * @param {number} [fontSize=24] - Size of the score text
     */
    constructor(scene, x, y, fontSize = 24) {
        this.#baseFontSize = fontSize;
        this.#loadHighScore();

        const textConfig = {
            fontSize: `${fontSize}px`,
            fontFamily: 'grandstander-thin',
            fill: '#FFFFFF',
            align: 'right',
        };

        // Create high score text
        this.#highScoreText = scene.add.text(x, y, `Best: ${this.#highScore}m`, textConfig)
            .setDepth(1000)
            .setScrollFactor(0)
            .setOrigin(1, 0); // Align to right edge

        // Create current score text (left of high score with padding)
        const padding = 20;
        this.#currentScoreText = scene.add.text(
            x - this.#highScoreText.width - padding,
            y,
            'Score: 0m',
            textConfig,
        )
            .setDepth(1000)
            .setScrollFactor(0)
            .setOrigin(1, 0); // Align to right edge
    }

    /**
     * Loads your best score from the game's memory
     *
     * @private
     */
    #loadHighScore() {
        const savedScore = localStorage.getItem('dinoRunHighScore');
        this.#highScore = savedScore ? parseInt(savedScore, 10) : 0;
    }

    /**
     * Saves your best score to the game's memory
     *
     * @private
     */
    #saveHighScore() {
        localStorage.setItem('dinoRunHighScore', this.#highScore.toString());
    }

    /**
     * Updates the position of the high score text based on current score width
     *
     * @private
     */
    #updateScorePosition() {
        const padding = 20;
        this.#currentScoreText.x = this.#highScoreText.x - this.#highScoreText.width - padding;
    }

    /**
     * Adds points to your current score
     *
     * @param {number} points - How many points to add
     */
    addScore(points) {
        this.#currentScore += points;
        this.#currentScoreText.setText(`Score: ${this.#currentScore}m`);
        this.#updateScorePosition(); // Update position as current score width may change

        if (this.#currentScore > this.#highScore) {
            this.#highScore = this.#currentScore;
            this.#highScoreText.setText(`Best: ${this.#highScore}m`);
            this.#saveHighScore();
        }
    }

    /**
     * Gets your current score
     *
     * @returns {number} Your current score
     */
    getCurrentScore() {
        return this.#currentScore;
    }

    /**
     * Gets your highest score ever
     *
     * @returns {number} Your best score
     */
    getHighScore() {
        return this.#highScore;
    }

    /**
     * Resets your current score back to zero
     */
    reset() {
        this.#currentScore = 0;
        this.#accumulatedTime = 0;
        this.#currentScoreText.setText('Score: 0m');
        this.#updateScorePosition();
    }

    /**
     * Updates the display position and scale
     *
     * @param {number} x - New x position
     * @param {number} y - New y position
     * @param {number} scale - New scale factor
     */
    updatePosition(x, y, scale = 1) {
        // Update font size
        const fontSize = Math.round(this.#baseFontSize * scale);
        this.#highScoreText.setFontSize(`${fontSize}px`);
        this.#currentScoreText.setFontSize(`${fontSize}px`);

        // Update positions
        this.#highScoreText.setPosition(x, y);
        const padding = 20 * scale;
        this.#currentScoreText.setPosition(x - this.#highScoreText.width - padding, y);
    }

    /**
     * Updates the font size of both score texts
     *
     * @param {number} size - New font size in pixels
     */
    updateFontSize(size) {
        const textConfig = {
            fontSize: `${size}px`,
            fontFamily: 'grandstander-thin',
            fill: '#FFFFFF',
            align: 'right',
        };

        this.#highScoreText.setStyle(textConfig);
        this.#currentScoreText.setStyle(textConfig);
        this.#updateScorePosition();
    }

    /**
     * Hides or shows the score text
     */
    toggleScoreTextVisibility() {
        this.#highScoreText.setVisible(!this.#highScoreText.visible);
        this.#currentScoreText.setVisible(!this.#currentScoreText.visible);
    }

    /**
     * Gets the text elements for UI camera
     *
     * @returns {Phaser.GameObjects.Text[]} Array of score text elements
     */
    getScoreTextElms() {
        return [this.#currentScoreText, this.#highScoreText].filter((text) => text !== undefined);
    }

    /**
     * Updates the score based on time played
     * The longer you survive, the higher your score! 🏆
     *
     * @param {number} _time - The current time
     * @param {number} delta - The delta time in ms since the last frame
     */
    update(_time, delta) {
        // Accumulate time played (using delta to account for game speed)
        this.#accumulatedTime += delta;

        // Update score (1 point per 200ms of scaled time)
        const newScore = Math.floor(this.#accumulatedTime / 200);

        if (newScore !== this.#currentScore) {
            this.#currentScore = newScore;
            this.#currentScoreText.setText(`Score: ${this.#currentScore}m`);
            this.#updateScorePosition();

            // Check for new high score
            if (this.#currentScore > this.#highScore) {
                this.#highScore = this.#currentScore;
                this.#highScoreText.setText(`Best: ${this.#highScore}m`);
                this.#saveHighScore();
            }
        }
    }
}
