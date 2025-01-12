/**
 * The ScoreDisplay shows your points in the game!
 *
 * Think of it like a magical scoreboard that keeps track of how well
 * you're doing and remembers your best score ever!
 */
export class ScoreDisplay {
    /** @type {number} */
    #currentScore = 0;

    /** @type {number} */
    #highScore = 0;

    /** @type {Phaser.GameObjects.Text} */
    #currentScoreText;

    /** @type {Phaser.GameObjects.Text} */
    #highScoreText;

    /**
     * Creates our scoreboard!
     *
     * @param {Phaser.Scene} scene - The game scene where we'll show the score
     * @param {number} x - Where to put the score on the screen (left to right)
     * @param {number} y - Where to put the score on the screen (top to bottom)
     * @param {number} [fontSize=28] - Size of the score text
     */
    constructor(scene, x, y, fontSize = 28) {
        this.#loadHighScore();

        const textConfig = {
            fontSize: `${fontSize}px`,
            fontFamily: 'annie-use-your-telescope',
            fill: '#FFFFFF',
            align: 'right',
        };

        // Create high score text
        this.#highScoreText = scene.add.text(x, y, `Best: ${this.#highScore}`, textConfig)
            .setDepth(1000)
            .setScrollFactor(0)
            .setOrigin(1, 0); // Align to right edge

        // Create current score text (left of high score with padding)
        const padding = 20;
        this.#currentScoreText = scene.add.text(
            x - this.#highScoreText.width - padding,
            y,
            'Score: 0',
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
        this.#currentScoreText.setText(`Score: ${this.#currentScore}`);
        this.#updateScorePosition(); // Update position as current score width may change

        if (this.#currentScore > this.#highScore) {
            this.#highScore = this.#currentScore;
            this.#highScoreText.setText(`Best: ${this.#highScore}`);
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
        this.#currentScoreText.setText(`Score: ${this.#currentScore}`);
    }

    /**
     * Updates the position of both score texts
     *
     * @param {number} x - New x position
     * @param {number} y - New y position
     */
    updatePosition(x, y) {
        // Update high score position
        this.#highScoreText.setPosition(x, y);

        // Update current score position relative to high score
        const padding = 20;
        this.#currentScoreText.setPosition(
            x - this.#highScoreText.width - padding,
            y,
        );
    }

    /**
     * Updates the font size of both score texts
     *
     * @param {number} size - New font size in pixels
     */
    updateFontSize(size) {
        const textConfig = {
            fontSize: `${size}px`,
            fontFamily: 'annie-use-your-telescope',
            fill: '#FFFFFF',
            align: 'right',
        };

        this.#highScoreText.setStyle(textConfig);
        this.#currentScoreText.setStyle(textConfig);
        this.#updateScorePosition();
    }
}
