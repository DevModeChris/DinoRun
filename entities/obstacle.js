/**
 * 🌵 Obstacle Class: The Things Our Player Character Has to Avoid! 🪨
 *
 * Think of obstacles like hurdles in a race - they're the tricky things
 * our player character needs to jump over or duck under to stay safe!
 *
 * We have different types: cacti (like in a desert), rocks, and even flying birds!
 */
export class Obstacle {
    /**
     * 🎮 Initialising a New Obstacle
     *
     * We need to:
     * 1. Create the obstacle
     * 2. Choose what kind it will be
     * 3. Put it in the right spot in our game!
     *
     * @param {HTMLElement} gameContainer - The game's playground where we put our obstacle
     * @param {number} speed - How fast the obstacle moves
     */
    constructor(gameContainer, speed) {
        // 🎨 Create the obstacle's look
        this.element = document.createElement('div');

        // 🎲 Let's randomly pick what our obstacle will be - it's like rolling a dice!
        const types = ['cactus', 'rock', 'bird'];  // Different types of obstacles
        const sizes = ['small', 'medium', 'large']; // Different sizes (like S, M, L t-shirts!)
        const type = types[Math.floor(Math.random() * types.length)];
        const size = sizes[Math.floor(Math.random() * sizes.length)];

        // 🎭 Give our obstacle its costume (like dressing up for Halloween!)
        this.element.className = `obstacle ${type} ${size}`;

        // 📍 Place the obstacle at the starting position
        this.position = gameContainer.offsetWidth;
        if (type === 'bird') {
            this.element.style.bottom = '100px'; // Birds fly high in the sky! 🦅
        }

        // 🏃‍♂️ Set how fast it moves
        this.speed = speed;
        this.element.style.left = `${this.position}px`;
        gameContainer.appendChild(this.element);
    }

    /**
     * 🔄 Moving the Obstacle
     *
     * Like a train moving along its track, we need to keep
     * updating where our obstacle is on the screen!
     *
     * @param {number} speedMultiplier - Changes how fast things move (like a speed boost or slow-motion!)
     * @returns {boolean} - Tells us if the obstacle is still visible on screen
     */
    update(speedMultiplier = 1) {
        // Move the obstacle to the left
        this.position -= this.speed * speedMultiplier;
        this.element.style.left = `${this.position}px`;

        // Return true if obstacle is still visible on screen
        return this.position > -this.element.offsetWidth;
    }

    /**
     * 📏 Getting the Obstacle's Size and Position
     *
     * We need to know exactly where our obstacle is and how big it is
     * so we can check if our player character bumps into it!
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
     * 🚮 Removing the Obstacle
     *
     * When our obstacle is no longer needed, we tidy up and remove it
     * from the game, this helps keep the game running smoothly by freeing up
     * memory and resources!
     */
    remove() {
        this.element.remove();
    }
}
