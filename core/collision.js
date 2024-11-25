/**
 * checkCollision checks if two rectangles are touching each other.
 * This is a helper function for isColliding.
 *
 * @param {Object} rect1 - First rectangle
 * @param {Object} rect2 - Second rectangle
 * @returns {boolean} - True if the rectangles are touching, False if they're not
 */
export function checkCollision(rect1, rect2) {
    // Check if the rectangles overlap in both directions (x and y)
    // This is like checking if two rectangles are touching
    return !(
        (
            rect1.x + rect1.width < rect2.x // rect1 is completely to the left of rect2
            || rect2.x + rect2.width < rect1.x // rect1 is completely to the right of rect2
            || rect1.y + rect1.height < rect2.y // rect1 is completely above rect2
            || rect2.y + rect2.height < rect1.y
        ) // rect1 is completely below rect2
    );
}

/**
 * isColliding checks if two game objects (like the player and an obstacle) are touching each other.
 * This is how we know when the player hits something!
 *
 * @param {Object} entity1 - First game object (usually the player)
 * @param {Object} entity2 - Second game object (like an obstacle or power-up)
 * @returns {boolean} - True if the objects are touching, False if they're not
 */
export function isColliding(entity1, entity2) {
    // Get the exact position and size of both objects
    const hitbox1 = entity1.getHitbox();
    const hitbox2 = entity2.getHitbox();

    // Check if the objects overlap in both directions (x and y)
    // This is like checking if two rectangles are touching
    return checkCollision(hitbox1, hitbox2);
}
