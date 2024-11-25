/**
 * 🌟 PowerUp Class: Special Magic Items! ✨
 *
 * PowerUps are like magic potions in our game that give our player special abilities!
 * When the player catches one, amazing things happen - like making time move slower
 */
export class PowerUp {
    /**
     * 🎁 Creating a New Power-Up
     *
     * We need to:
     * 1. Create the magic item
     * 2. Make it look fancy pants
     * 3. Put it somewhere in our game for the player to find!
     *
     * @param {HTMLElement} gameContainer - The magical game world where we put our power-up
     * @param {number} speed - How fast it floats through the air
     * @param {string} type - What kind of magic power it gives (right now it's 'slowmo' - like having time powers!)
     */
    constructor(gameContainer, speed, type = 'slowmo') {
        // 🎨 Create our magical power-up
        this.element = document.createElement('div');
        this.element.className = 'power-up slow-motion';

        // ⌛ Add an hourglass emoji to show it controls time!
        this.element.innerHTML = '⌛';

        // 🎯 Place the power-up in our game world
        gameContainer.appendChild(this.element);

        // 📍 Start at the right side of the screen
        this.position = gameContainer.offsetWidth;
        this.element.style.left = `${this.position}px`;
        this.element.style.bottom = '100px'; // Make it float in the air like magic! ✨

        // 🏃‍♂️ Set up how fast it moves
        this.type = type;
        this.speed = speed;
    }

    /**
     * 🔄 Moving the Power-Up
     *
     * Like a magical floating balloon, we need to keep
     * updating where our power-up is floating in the game!
     *
     * @param {number} speedMultiplier - Changes how fast it moves
     * @returns {boolean} - Tells us if the power-up is still visible
     */
    update(speedMultiplier = 1) {
        // Move the power-up to the left
        this.position -= this.speed * speedMultiplier;

        // Update position on screen
        this.element.style.left = `${this.position}px`;

        // Return true if power-up is still visible on screen
        return this.position > -this.element.offsetWidth;
    }

    /**
     * 🎯 Getting the Power-Up's Hitbox
     *
     * We need to know where our power-up is so we can check if the player caught it!
     * It's like drawing a box around the power-up to see where it is.
     */
    getHitbox() {
        const rect = this.element.getBoundingClientRect();
        return {
            x: rect.left,
            y: rect.top,
            width: rect.width,
            height: rect.height,
        };
    }

    /**
     * 🚫 Removing the Power-Up
     *
     * When the player catches the power-up or it floats away, we need to remove it from the game!
     * This helps keep the game running smoothly by freeing up memory and resources!
     */
    remove() {
        this.element.remove();
    }
}
