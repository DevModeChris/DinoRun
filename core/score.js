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
        this.updateDisplay(); // Show initial scores
    }

    /**
     * Increases the score by 1 point
     */
    increment() {
        this.score++;

        // If we beat the high score, update it!
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('highScore', this.highScore); // Save the new high score
        }

        this.updateDisplay(); // Show the new scores
    }

    /**
     * Gets the current score
     * @returns {number} The current score
     */
    getScore() {
        return this.score;
    }

    /**
     * Resets the score back to 0 for a new game
     */
    reset() {
        this.score = 0;
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
