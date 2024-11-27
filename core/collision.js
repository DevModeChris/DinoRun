/**
 * 📏 checkCollision checks if two rectangles are touching each other
 * This is a helper function for isColliding
 *
 * @param {Object} rect1 - First rectangle
 * @param {Object} rect2 - Second rectangle
 * @param {Object} options - Collision check options
 * @returns {boolean} - True if the rectangles are touching, False if they're not
 */
function checkCollision(rect1, rect2, options) {
    const {
        overlapThreshold = 0.5,
        isHole = false,
        isJumping = false,
        isCrouching = false,
    } = options;

    // For holes, we only care about horizontal overlap when the dino is on the ground
    if (isHole) {
        // If the dino is jumping, no hole collision
        if (isJumping) {
            return false;
        }

        // Check horizontal overlap for holes
        const overlapX = Math.min(rect1.x + rect1.width, rect2.x + rect2.width) - Math.max(rect1.x, rect2.x);
        const minWidth = Math.min(rect1.width, rect2.width);
        return overlapX >= minWidth * overlapThreshold;
    }

    // For regular collisions, check if there's any overlap at all
    const overlapX = Math.min(rect1.x + rect1.width, rect2.x + rect2.width) - Math.max(rect1.x, rect2.x);
    const overlapY = Math.min(rect1.y + rect1.height, rect2.y + rect2.height) - Math.max(rect1.y, rect2.y);

    // If there's no overlap at all, no collision
    if (overlapX <= 0 || overlapY <= 0) {
        return false;
    }

    // Calculate overlap percentages
    const overlapPercentX = overlapX / Math.min(rect1.width, rect2.width);
    const overlapPercentY = overlapY / Math.min(rect1.height, rect2.height);

    // When crouching, we need significant horizontal overlap
    if (isCrouching) {
        // Require at least 40% horizontal overlap when crouching
        return overlapPercentX >= 0.4 && overlapPercentY > 0;
    }

    // For normal collisions, require decent overlap in both directions
    return overlapPercentX >= overlapThreshold && overlapPercentY >= overlapThreshold;
}

/**
 * 💥 isColliding checks if two objects in our game are touching each other
 * Just like in real games, we need to know when:
 * - 🦖 Our dino hits an obstacle (ouch!)
 * - ⭐ Our dino collects a power-up (yay!)
 * - 🦊 Our dino runs into a mob (watch out!)
 *
 * @param {Object} entity1 - First game object (usually the dino)
 * @param {Object} entity2 - Second game object (like an obstacle or power-up)
 * @param {Object} [options] - Extra settings for checking collisions
 * @param {number} [options.overlapThreshold] - How much overlap needed (0 to 1)
 * @param {boolean} [options.isHole] - Whether this is a hole collision check
 * @returns {boolean} - True if they're touching, false if they're not
 */
export function isColliding(entity1, entity2, options = {}) {
    // Get the exact position and size of both objects
    const hitbox1 = entity1.getHitbox();
    const hitbox2 = entity2.getHitbox();

    // For holes, we need more overlap to trigger the fall
    const overlapThreshold = options.isHole ? 0.7 : (options.overlapThreshold || 0.5);

    // Check if the dino is jumping (only matters for holes)
    const isJumping = entity1.isJumping;
    const isCrouching = entity1.isCrouching;

    // Merge default options with provided options
    const collisionOptions = {
        overlapThreshold,
        isHole: options.isHole || false,
        isJumping,
        isCrouching,
        ...options,
    };

    return checkCollision(hitbox1, hitbox2, collisionOptions);
}
