/**
 * 🎨 UI Styles - All the colours used in our game's user interface!
 * This file keeps all our colours in one place so they're easy to change.
 */

// Raw Colours not tied to any specific system
export const RAW_COLOURS = {
    WHITE: '#ffffff',
    DARK_GREY: '#444444',
    BLACK: '#000000',
    BRIGHT_RED: '#ff0000',
    BRIGHT_PINK: '#ff00ff',
    BRIGHT_GREEN: '#00ffff',
    BRIGHT_YELLOW: '#ffff00',
};

// Loading Screen Colours
export const LOADING_COLOURS = {
    BACKGROUND_GRADIENT_TOP: '#0a0a2a',
    BACKGROUND_GRADIENT_MIDDLE: '#1a1a4a',
    BACKGROUND_GRADIENT_BOTTOM: '#2e1f5e',
    PROGRESS_BAR: '#4ab54a',
    TEXT: '#ffffff',
};

// Button Colours
export const BUTTON_COLOURS = {
    // Normal state
    BACKGROUND: '#222222',
    TEXT: '#ffffff',

    // Hover state
    HOVER_BACKGROUND: '#4a4a4a',
};

// Tab Colours
export const TAB_COLOURS = {
    // Active tab
    ACTIVE: {
        BACKGROUND: '#4caf50',  // Green
        TEXT: '#ffffff',
    },

    // Inactive tab
    INACTIVE: {
        BACKGROUND: '#222222',
        TEXT: '#cccccc',
    },

    // Hover state for inactive tab
    HOVER: {
        BACKGROUND: '#4a4a4a',
    },
};

// Slider Styles
export const SLIDER_STYLE = {
    TRACK: {
        BACKGROUND_COLOUR: '#222222',
        WIDTH: 300,
        HEIGHT: 10,
        DISABLED_COLOUR: '#555555', // Grey
    },
    HANDLE: {
        BACKGROUND_COLOUR: '#ffffff',
        WIDTH: 20,
        HEIGHT: 20,
        DISABLED_COLOUR: '#999999', // Grey
    },
};

// Toggle Colours
export const TOGGLE_COLOURS = {
    ON: '#4caf50',  // Green
    OFF: '#9e9e9e', // Grey
    TEXT: '#ffffff',
};

// Modal/Overlay Colours
export const MODAL_COLOURS = {
    BACKGROUND: '#00000080', // Semi-transparent black
    TEXT: '#ffffff',
};

// Game UI Colours
export const GAME_UI_COLOURS = {
    TEXT: '#ffffff',
    SCORE_TEXT: '#ffffff',
    COUNTDOWN_TEXT: '#ffd700', // Gold
    COUNTDOWN_TEXT_STROKE: '#ad9203',
    COUNTDOWN_TEXT_SHADOW: '#ffd70080', // Semi-transparent gold
    TEXT_STROKE: '#000000', // Black stroke
};

// Convert hex to 0x format for Phaser
export const hexToPhaser = (hex) => {
    return parseInt(hex.replace('#', '0x'), 16);
};
