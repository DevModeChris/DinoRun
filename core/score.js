/**
 * ScoreManager handles everything related to keeping track of the player's score
 * and managing the high score.
 */
export class ScoreManager {
    /**
     * Initialises the score manager with the elements that show the scores
     * @param {HTMLElement} scoreElement - Where to show the current score
     * @param {HTMLElement} highScoreElement - Where to show the highest score ever achieved
     */
    constructor(scoreElement, highScoreElement) {
        this.scoreElement = scoreElement;
        this.highScoreElement = highScoreElement;
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('highScore')) || 0; // Load saved high score
        this._hasNewHighScore = false;
        this.updateDisplay(); // Show initial scores
    }

    /**
     * Increases the score by 1 point
     */
    increment() {
        this.score++;

        // Check if we've beaten the high score
        if (this.score > this.highScore) {
            this._hasNewHighScore = true;
        }

        this.updateDisplay(); // Show the new scores
    }

    /**
     * Gets the current score, formatted with leading zeros
     * @param {boolean} [formatted=true] - Whether to format the score with leading zeros
     * @returns {string|number} The current score, formatted if requested
     */
    getScore(formatted = true) {
        return formatted ? String(this.score).padStart(5, '0') : this.score;
    }

    /**
     * Checks if the current score is a new high score
     * @returns {boolean} True if current score is higher than the previous high score
     */
    isNewHighScore() {
        return this._hasNewHighScore;
    }

    /**
     * Updates the high score if we've beaten it
     */
    updateHighScore() {
        if (this._hasNewHighScore) {
            this.highScore = this.score;
            localStorage.setItem('highScore', this.highScore);
            this._hasNewHighScore = false;
            this.updateDisplay();
        }
    }

    /**
     * Resets the score back to 0 for a new game
     */
    reset() {
        this.score = 0;
        this._hasNewHighScore = false;
        this.updateDisplay();
    }

    /**
     * Updates what's shown on the screen for both current score and high score
     * Makes sure scores always show with 5 digits (like 00042 instead of just 42)
     */
    updateDisplay() {
        // Add leading zeros to make scores 5 digits long
        const formattedScore = String(this.score).padStart(5, '0');
        const formattedHighScore = String(this.highScore).padStart(5, '0');

        // Update the display elements
        this.scoreElement.textContent = formattedScore;
        this.highScoreElement.textContent = formattedHighScore;
    }
}
