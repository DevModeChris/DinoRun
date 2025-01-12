/**
 * This file contains helper functions that help us reduce
 * code duplication on common/shared tasks
 */

/**
 * Checks if the user is on a mobile device
 *
 * @returns {boolean} True if the user is on a mobile device
 */
export function checkIfMobile() {
    // Check for mobile OS
    const isMobileOS = /Android|webOS|iPhone|iPad|iPod|Opera Mini/i.test(navigator.userAgent);

    // Check for touch screen capabilities
    const isTouchScreen = ('ontouchstart' in window)
        || (navigator.maxTouchPoints > 0)
        || (navigator.msMaxTouchPoints > 0);

    // Check screen size - typical mobile breakpoint
    const isSmallScreen = window.innerWidth <= 768;

    // Consider it a mobile device if it has a mobile OS or both touch screen and small screen
    return isMobileOS || (isTouchScreen && isSmallScreen);
}
