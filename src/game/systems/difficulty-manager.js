/**
 * 📈 The DifficultyManager makes the game more challenging as you play!
 *
 * Think of it like a friendly coach that gradually increases how tricky
 * things get - the longer you play, the faster and more frequent the
 * obstacles become!
 */
export class DifficultyManager {
    /** @type {number} */
    #currentLevel = 1;

    /** @type {number} */
    #maxLevel = 10;

    /** @type {number} */
    #scoreThreshold = 100;

    /** @type {number} */
    #baseSpeed = 300;

    /** @type {number} */
    #speedIncrement = 50;

    /** @type {number} */
    #baseSpawnRate = 1.0;

    /** @type {number} */
    #spawnRateMultiplier = 0.9;

    /**
     * Calculates how fast things should move based on your current level
     *
     * @returns {number} The current movement speed
     */
    getCurrentSpeed() {
        return this.#baseSpeed + ((this.#currentLevel - 1) * this.#speedIncrement);
    }

    /**
     * Figures out how often obstacles should appear
     *
     * @param {number} baseTime - The normal time between obstacles
     * @returns {number} The adjusted spawn time
     */
    getSpawnInterval(baseTime) {
        return baseTime * Math.pow(this.#spawnRateMultiplier, this.#currentLevel - 1);
    }

    /**
     * Updates the difficulty based on your current score
     *
     * @param {number} score - Your current game score
     * @returns {boolean} True if the difficulty level changed
     */
    update(score) {
        const newLevel = Math.min(
            this.#maxLevel,
            Math.floor(score / this.#scoreThreshold) + 1,
        );

        if (newLevel !== this.#currentLevel) {
            this.#currentLevel = newLevel;

            return true;
        }

        return false;
    }

    /**
     * Gets the current difficulty level
     *
     * @returns {number} Current level (1 to maxLevel)
     */
    getCurrentLevel() {
        return this.#currentLevel;
    }

    /**
     * Resets the difficulty back to the beginning
     */
    reset() {
        this.#currentLevel = 1;
    }
}
