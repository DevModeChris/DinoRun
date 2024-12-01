// Welcome to our special effects workshop!
// This is where we create all the cool visual effects in our game, like:
// - Dust clouds when the dino runs and jumps
// - Sparkles when hitting obstacles
// - Impact effects during collisions

/**
 * The Particle class is like a tiny artist that creates one sparkle or dust cloud
 */
class Particle {
    /**
     * Create a new particle with its own special look and movement
     * @param {number} x - Where to put it (left/right)
     * @param {number} y - Where to put it (up/down)
     * @param {string} type - What kind of particle ('dust' or 'impact')
     */
    constructor(x, y, type = 'dust', lifetime = (Math.random() * 1000) + 500) {
        // Remember where to put this particle
        this.x = x;
        this.y = y;
        this.type = type;

        // Create the particle's look
        this.element = document.createElement('div');
        this.element.className = `particle ${type}`;
        this.element.style.left = `${x}px`;
        this.element.style.top = `${y}px`;
        this.element.style.position = 'absolute';

        // Set how long this particle should last
        this.lifetime = lifetime;
        this.born = Date.now(); // Remember when we created it

        // Give it random movement, like confetti in the wind
        this.velocity = {
            x: (Math.random() - 0.5) * 5,  // Move left or right randomly
            y: (Math.random() * -5) - 2,   // Always start moving up a bit
        };

        // Add gravity so it falls down naturally
        this.gravity = 0.2;

        // Make it slowly fade away
        this.opacity = 1;

        // Give it a random size
        this.scale = (Math.random() * 0.5) + 0.5;
        this.element.style.transform = `scale(${this.scale})`;
    }

    /**
     * Update this particle's position and look
     */
    update() {
        // Check if particle should die
        if (Date.now() - this.born > this.lifetime) {
            return false;
        }

        // Update position with delta time (assuming 60 FPS as base)
        const deltaTime = 1 / 60;  // Fixed time step for consistent movement
        this.x += this.velocity.x * deltaTime * 60;
        this.y += this.velocity.y * deltaTime * 60;
        this.velocity.y += this.gravity * deltaTime * 60;  // Gravity increases Y (moves down)

        // Update visual properties
        this.element.style.left = `${this.x}px`;
        this.element.style.top = `${this.y}px`;

        // Fade out over time
        const age = (Date.now() - this.born) / this.lifetime;
        this.opacity = 1 - age;
        this.element.style.opacity = this.opacity;

        return true;
    }
}

/**
 * The ParticleSystem is like a special effects machine in a movie!
 * It creates and controls all the particles in our game.
 */
class ParticleSystem {
    constructor() {
        // Keep track of all active particles
        this.particles = [];
        this.container = document.getElementById('game-container');
    }

    /**
     * Create new particles at a specific spot
     * Like throwing a handful of confetti!
     */
    emit(x, y, type, count = 5) {
        for (let i = 0; i < count; i++) {
            const particle = new Particle(x, y, type);
            this.container.appendChild(particle.element);
            this.particles.push(particle);
        }
    }

    /**
     * Update all particles and remove the ones that are done
     */
    update() {
        this.particles = this.particles.filter((particle) => {
            const alive = particle.update();
            if (!alive) {
                particle.element.remove();
            }
            return alive;
        });
    }

    // Special effect methods for different game events

    /**
     * Create dust effect when dino jumps
     */
    emitJump(x, y) {
        // Create more particles and spread them out horizontally
        for (let i = 0; i < 6; i++) {
            const particle = new Particle(
                x + ((Math.random() - 0.5) * 20),
                y,
                'dust',
                800,
            );
            particle.velocity.y = (Math.random() * -3) - 1;
            this.container.appendChild(particle.element);
            this.particles.push(particle);
        }
    }

    /**
     * Create dust particles when the dino lands
     * Like kicking up dust when you jump off a swing!
     * @param {number} x - Where to create the particles (left/right)
     * @param {number} y - Where to create the particles (up/down)
     */
    emitLand(x, y) {
        // Create more particles for a bigger landing effect
        for (let i = 0; i < 8; i++) {
            const particle = new Particle(
                x + ((Math.random() - 0.5) * 30),
                y,
                'dust',
                800,
            );
            particle.velocity.y = (Math.random() * -3) - 1;
            this.container.appendChild(particle.element);
            this.particles.push(particle);
        }
    }

    /**
     * Create impact effect when hitting something
     */
    emitCollision(x, y) {
        this.emit(x, y, 'impact', 12);
    }
}

// Create our particle system and make it available to the game
export const particleSystem = new ParticleSystem();
