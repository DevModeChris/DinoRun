/**
 * 🎮 The Menu scene shows our game's main menu and settings!
 * It lets players start the game or change their settings.
 */
import Phaser from 'phaser';
import { BaseScene } from './base-scene.js';
import { SkySystem } from '../systems/sky-system.js';
import { SoundManager } from '../systems/sound-manager.js';
import { createEventEmitter } from '../systems/event-manager.js';
import { gameConfig } from '../config.js';
import { checkIfMobile } from '../../utils/helpers.js';
import { SettingsManager } from '../systems/settings-manager.js';
import {
    TAB_COLOURS,
    SLIDER_STYLE,
    BUTTON_COLOURS,
    MODAL_COLOURS,
    TOGGLE_COLOURS,
    GAME_UI_COLOURS,
    hexToPhaser,
} from '../constants/ui-styles.js';

export class Menu extends BaseScene {
    /** @type {SkySystem} */
    #skySystem;

    /** @type {SoundManager} */
    #soundManager;

    /** @type {Phaser.GameObjects.Container} */
    #menuContainer;

    /** @type {Phaser.GameObjects.Container} */
    #settingsContainer;

    /** @type {Phaser.GameObjects.Text} */
    #versionText;

    /** @type {boolean} */
    #showingSettings = false;

    /** @type {boolean} */
    #isMobile;

    /**
     * Tabs for the settings menu
     */
    #tabs = {
        audio: null,
        developer: null,
    };

    /**
     * The currently active tab
     */
    #activeTab = null;

    /**
     * The tab content container
     */
    #tabContent = null;

    /**
     * The width of each tab
     */
    #tabWidth = 200;

    /**
     * The height of each tab
     */
    #tabHeight = 50;

    /** @type {Object} References to volume slider elements for dynamic updates */
    #volumeSliderElements = null;

    /**
     * Creates our menu scene! 🎮
     */
    constructor() {
        super({ key: 'Menu' });
    }

    /**
     * Handles window resize events! 📱
     *
     * @param {number} width - New game width
     * @param {number} height - New game height
     */
    resize(width, height) {
        // Recheck mobile status
        this.#isMobile = checkIfMobile();

        // Resize sky system
        if (this.#skySystem) {
            this.#skySystem.resize({ width, height });
        }

        // Recheck mobile status
        this.#isMobile = checkIfMobile();

        // Update positions of our containers
        if (this.#menuContainer) {
            this.#menuContainer.setPosition(width / 2, height / 2);
        }

        if (this.#settingsContainer) {
            if (this.#isMobile) {
                this.#tabWidth = 150;  // Smaller tabs
                this.#tabHeight = 40;

                // Smaller sliders
                SLIDER_STYLE.TRACK.WIDTH = 200;
                SLIDER_STYLE.HANDLE.WIDTH = 15;
                SLIDER_STYLE.HANDLE.HEIGHT = 15;
            }

            // Reposition title
            const title = this.#settingsContainer.list.find((item) => item.type === 'Text' && item.text === 'Settings');
            if (title) {
                title.setPosition(width / 2, this.#isMobile ? 30 : 50);
            }

            // Reposition back button
            const backButton = this.#settingsContainer.list.find((item) =>
                item.type === 'Text' && item.text.includes('Back'),
            );
            if (backButton) {
                backButton.setPosition(this.#isMobile ? 30 : 50, this.#isMobile ? 30 : 50);
            }

            // Reposition tabs container
            const tabsContainer = this.#settingsContainer.list.find((item) =>
                item.type === 'Container' && item !== this.#tabContent,
            );
            if (tabsContainer) {
                tabsContainer.setPosition(width / 2, this.#isMobile ? 80 : 120);
            }

            // Reposition tab content
            if (this.#tabContent) {
                this.#tabContent.setPosition(width / 2, this.#isMobile ? 140 : 200);
            }

            // Reposition version text if it exists
            if (this.#versionText) {
                this.#versionText
                    .setPosition(0, height - 14)
                    .setWordWrapWidth(width, true)
                    .setAlign('center')  // Ensure text stays centered
                    .setStyle({ fixedWidth: width });  // Update the background width
            }
        }
    }

    /**
     * Creates a menu button with consistent styling
     *
     * @param {string} text - The button text
     * @param {number} width - Fixed width for the button
     * @returns {Phaser.GameObjects.Text} The created button
     */
    #createMenuButton(text, width) {
        const button = this.add.text(
            0,
            0,
            text,
            {
                fontSize: '26px',
                fontFamily: 'grandstander',
                color: BUTTON_COLOURS.TEXT,
                align: 'center',
                backgroundColor: BUTTON_COLOURS.BACKGROUND,
                padding: { x: 20, y: 10 },
                fixedWidth: width,
            },
        )
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => button.setBackgroundColor(BUTTON_COLOURS.HOVER_BACKGROUND))
            .on('pointerout', () => button.setBackgroundColor(BUTTON_COLOURS.BACKGROUND));

        return button;
    }

    /**
     * Sets up our menu scene with all its lovely bits! ✨
     */
    create() {
        // Call base class method first
        super.create();

        const events = createEventEmitter();

        // Make sure we clean up properly when the scene shuts down
        this.events.once('shutdown', this.shutdown, this);

        // Check if we're on mobile and adjust sizes
        this.#isMobile = checkIfMobile();
        if (this.#isMobile) {
            this.#tabWidth = 150;  // Smaller tabs
            this.#tabHeight = 40;

            // Smaller sliders
            SLIDER_STYLE.TRACK.WIDTH = 200;
            SLIDER_STYLE.HANDLE.WIDTH = 15;
            SLIDER_STYLE.HANDLE.HEIGHT = 15;
        }

        // Create our magical sky background
        this.#skySystem = new SkySystem(this);

        // Set up our sound system
        this.#soundManager = new SoundManager(this, events);

        // Create our menus
        this.#createMainMenu();
        this.#createSettingsMenu();

        // Create version text
        this.#versionText = this.add.text(
            0,  // Start from left edge
            this.scale.height - 14,
            `Version: ${gameConfig.version}`,
            {
                fontSize: this.#isMobile ? '16px' : '20px',
                fontFamily: 'grandstander',
                color: MODAL_COLOURS.TEXT,
                backgroundColor: MODAL_COLOURS.BACKGROUND,
                padding: { x: 10, y: 5 },
                fixedWidth: this.scale.width,  // Make background full width
                align: 'center',  // Center the text
            },
        ).setOrigin(0, 0.5).setDepth(1000);  // Origin at left edge, vertically centered

        // Start with main menu visible
        this.#settingsContainer.setAlpha(0);

        // Start playing our menu music
        this.#soundManager.playMenuMusic();
    }

    /**
     * Creates our main menu with all its buttons! 🎮
     *
     * @private
     */
    #createMainMenu() {
        // Create a nice container for our menu items
        this.#menuContainer = this.add
            .container(this.scale.width / 2, this.scale.height / 2)
            .setDepth(900)
            .setAlpha(1);

        // Add our game title at the top
        const titleText = this.add.text(0, -120, 'DinoRun', {
            fontSize: '72px',
            fontFamily: 'grandstander-bold',
            color: GAME_UI_COLOURS.TEXT,
            align: 'center',
            stroke: GAME_UI_COLOURS.TEXT_STROKE,
            strokeThickness: 5,
        }).setOrigin(0.5);

        // Create temporary buttons to measure their widths
        const tempPlay = this.add.text(
            0,
            0,
            'Play Game',
            {
                fontSize: '32px',
                fontFamily: 'grandstander',
                padding: { x: 20, y: 10 },
            },
        );

        const tempSettings = this.add.text(
            0,
            0,
            'Settings',
            {
                fontSize: '32px',
                fontFamily: 'grandstander',
                padding: { x: 20, y: 10 },
            },
        );

        // Calculate the maximum width needed
        const maxButtonWidth = Math.max(tempPlay.width, tempSettings.width);

        // Destroy temporary text objects
        tempPlay.destroy();
        tempSettings.destroy();

        // Create our buttons
        const playButton = this.#createMenuButton('Play Game', maxButtonWidth)
            .on('pointerup', () => {
                this.#soundManager.playButtonSound();
                this.#soundManager.stopMenuMusic();

                // Stop the current scene and clean up
                this.scene.stop();

                // Start the game scene
                this.scene.start('Game', { events: this.#soundManager.events });
            });

        const settingsButton = this.#createMenuButton('Settings', maxButtonWidth)
            .on('pointerup', () => {
                this.#soundManager.playButtonSound();
                this.#showSettingsMenu();
            });

        // Position our buttons
        playButton.setPosition(0, 0);
        settingsButton.setPosition(0, 80);

        // Add everything to our container
        this.#menuContainer.add([titleText, playButton, settingsButton]);
    }

    /**
     * Creates our settings menu with all its controls! ⚙️
     *
     * @private
     */
    #createSettingsMenu() {
        // Create our settings container
        this.#settingsContainer = this.add.container(0, 0).setDepth(900);

        // Create title
        const titleText = this.add.text(
            this.scale.width / 2,
            this.#isMobile ? 30 : 50,
            'Settings',
            {
                fontSize: this.#isMobile ? '36px' : '48px',
                fontFamily: 'grandstander-bold',
                color: GAME_UI_COLOURS.TEXT,
                stroke: GAME_UI_COLOURS.TEXT_STROKE,
                strokeThickness: 5,
            },
        ).setOrigin(0.5);
        this.#settingsContainer.add(titleText);

        // Create tab content container first
        this.#tabContent = this.add.container(this.scale.width / 2, this.#isMobile ? 140 : 200);
        this.#settingsContainer.add(this.#tabContent);

        // Create tabs
        const tabsContainer = this.#createTabs();
        tabsContainer.setPosition(this.scale.width / 2, this.#isMobile ? 80 : 120);
        this.#settingsContainer.add(tabsContainer);

        // Create back button
        const backButton = this.add.text(
            this.#isMobile ? 30 : 50,
            this.#isMobile ? 30 : 50,
            '← Back',
            {
                fontSize: this.#isMobile ? '20px' : '24px',
                fontFamily: 'grandstander',
                color: BUTTON_COLOURS.TEXT,
                backgroundColor: BUTTON_COLOURS.BACKGROUND,
                padding: { x: this.#isMobile ? 10 : 15, y: this.#isMobile ? 8 : 10 },
            },
        )
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => backButton.setBackgroundColor(BUTTON_COLOURS.HOVER_BACKGROUND))
            .on('pointerout', () => backButton.setBackgroundColor(BUTTON_COLOURS.BACKGROUND))
            .on('pointerup', () => {
                this.#soundManager.playButtonSound();
                this.#showMainMenu();
            });
        this.#settingsContainer.add(backButton);

        // Move version text to the bottom
        if (this.#versionText) {
            this.#versionText.setPosition(
                0,  // Keep at left edge
                this.scale.height - (this.#isMobile ? 20 : 30),
            );
        }
    }

    /**
     * Creates a slider control
     *
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} initialValue - Initial value (0-1)
     * @param {function} onChange - Callback when value changes
     * @param {boolean} [disabled=false] - Whether the slider is disabled
     * @returns {Object} Slider objects
     */
    #createSlider(x, y, initialValue, onChange, disabled = false) {
        const container = this.add.container((x - SLIDER_STYLE.TRACK.WIDTH) / 2, y);

        // Create track
        const track = this.add.rectangle(
            0,
            0,
            SLIDER_STYLE.TRACK.WIDTH,
            SLIDER_STYLE.TRACK.HEIGHT,
            hexToPhaser(disabled ? SLIDER_STYLE.TRACK.DISABLED_COLOUR : SLIDER_STYLE.TRACK.BACKGROUND_COLOUR),
        ).setOrigin(0);

        // Create handle
        const handle = this.add.rectangle(
            initialValue * SLIDER_STYLE.TRACK.WIDTH,
            SLIDER_STYLE.TRACK.HEIGHT / 2,
            SLIDER_STYLE.HANDLE.WIDTH,
            SLIDER_STYLE.HANDLE.HEIGHT,
            hexToPhaser(disabled ? SLIDER_STYLE.HANDLE.DISABLED_COLOUR : SLIDER_STYLE.HANDLE.BACKGROUND_COLOUR),
        ).setOrigin(0.5);

        // Make handle interactive if not disabled
        if (!disabled) {
            handle.setInteractive({ draggable: true, useHandCursor: true });

            handle.on('drag', (pointer, dragX) => {
                // Clamp handle position to track bounds
                const minX = 0;
                const maxX = SLIDER_STYLE.TRACK.WIDTH;
                const newX = Phaser.Math.Clamp(dragX, minX, maxX);

                handle.x = newX;

                // Calculate and invoke callback with normalized value (0-1)
                const value = newX / SLIDER_STYLE.TRACK.WIDTH;
                onChange(value);
            });
        }

        container.add([track, handle]);

        return { container, track, handle, disabled };
    }

    /**
     * Creates a fun toggle switch! 🔄
     *
     * @param {number} x - Where to put it left-to-right
     * @param {number} y - Where to put it up-and-down
     * @param {boolean} initialValue - Should it start as on or off?
     * @param {function} onChange - What to do when it's clicked
     * @returns {Object} All the parts of our toggle
     */
    #createToggle(x, y, initialValue, onChange) {
        const width = 60;
        const height = 30;
        const handleSize = height - 6;
        const container = this.add.container(x - (width / 2), y);

        // Create background with rounded corners for a nicer look
        const background = this.add.rectangle(
            0,
            0,
            width,
            height,
            hexToPhaser(initialValue ? TOGGLE_COLOURS.ON : TOGGLE_COLOURS.OFF),
            1,
            15,  // Adding corner radius for a friendlier look
        ).setOrigin(0);

        // Create square handle
        const handle = this.add.rectangle(
            initialValue ? width - height + 3 : 3,
            3,
            handleSize,
            handleSize,
            hexToPhaser(TOGGLE_COLOURS.TEXT),
            1,
            8,  // Slightly rounded corners on handle too
        ).setOrigin(0);

        container.add([background, handle]);

        // Make the background interactive instead of the container
        background.setInteractive({ useHandCursor: true })
            .on('pointerup', () => {
                this.#soundManager.playButtonSound();
                const newValue = handle.x === 3;
                background.setFillStyle(hexToPhaser(newValue ? TOGGLE_COLOURS.ON : TOGGLE_COLOURS.OFF));

                // Move handle
                handle.x = newValue ? width - height + 3 : 3;

                onChange(newValue);
            });

        return { container, background, handle };
    }

    /**
     * Creates the audio settings tab content
     */
    #createAudioTab() {
        const spacing = this.#isMobile ? 35 : 45;
        let y = 0;
        const labelOffset = this.#isMobile ? -120 : -200;
        const controlOffset = this.#isMobile ? 100 : 150;
        const fontSize = this.#isMobile ? '20px' : '24px';

        // Get current audio settings
        const settings = SettingsManager.getSettings();
        const { masterVolume, musicEnabled, sfxEnabled } = settings.audio;

        // Check if slider should be disabled (both music and sound effects are off)
        const sliderDisabled = !musicEnabled && !sfxEnabled;

        // Master volume label and value
        const volumeLabel = this.add.text(
            labelOffset,
            y,
            'Master Volume',
            {
                fontSize,
                fontFamily: 'grandstander',
                colour: sliderDisabled ? SLIDER_STYLE.HANDLE.DISABLED_COLOUR : GAME_UI_COLOURS.TEXT,
            },
        );
        this.#tabContent.add(volumeLabel);

        const volumeValue = this.add.text(
            controlOffset,
            y,
            `${Math.round(masterVolume * 100)}%`,
            {
                fontSize,
                fontFamily: 'grandstander',
                colour: sliderDisabled ? SLIDER_STYLE.HANDLE.DISABLED_COLOUR : GAME_UI_COLOURS.TEXT,
            },
        );
        this.#tabContent.add(volumeValue);

        y += spacing;

        // Add slider with slightly more space after it
        const volumeSlider = this.#createSlider(0, y, masterVolume, (value) => {
            this.#soundManager.setMasterVolume(value);
            volumeValue.setText(`${Math.round(value * 100)}%`);
            SettingsManager.updateSetting('audio', 'masterVolume', value);
        }, sliderDisabled);
        this.#tabContent.add(volumeSlider.container);

        y += spacing * 1.5;  // More space after the slider

        // Music toggle
        const musicLabel = this.add.text(
            labelOffset,
            y,
            'Music',
            {
                fontSize,
                fontFamily: 'grandstander',
                colour: GAME_UI_COLOURS.TEXT,
            },
        );
        this.#tabContent.add(musicLabel);

        const musicToggle = this.#createToggle(controlOffset, y, musicEnabled, (value) => {
            this.#soundManager.setMusicEnabled(value);

            // Start menu music again if we're enabling music
            if (value) {
                this.#soundManager.playMenuMusic();
            }

            // Update slider state based on new toggle values
            this.#updateVolumeSliderState();
        });
        this.#tabContent.add(musicToggle.container);

        y += spacing;

        // Sound effects toggle
        const sfxLabel = this.add.text(
            labelOffset,
            y,
            'Sound Effects',
            {
                fontSize,
                fontFamily: 'grandstander',
                colour: GAME_UI_COLOURS.TEXT,
            },
        );
        this.#tabContent.add(sfxLabel);

        const sfxToggle = this.#createToggle(controlOffset, y, sfxEnabled, (value) => {
            this.#soundManager.setSfxEnabled(value);

            // Update slider state based on new toggle values
            this.#updateVolumeSliderState();
        });
        this.#tabContent.add(sfxToggle.container);

        // Store references to the volume slider elements for later updates
        this.#volumeSliderElements = {
            slider: volumeSlider,
            label: volumeLabel,
            value: volumeValue,
        };
    }

    /**
     * Creates the developer settings tab content
     */
    #createDeveloperTab() {
        const spacing = this.#isMobile ? 35 : 45;  // Slightly reduced spacing
        let y = 0;
        const labelOffset = this.#isMobile ? -120 : -200;
        const controlOffset = this.#isMobile ? 100 : 150;
        const fontSize = this.#isMobile ? '20px' : '24px';

        // Get current developer settings
        const settings = SettingsManager.getSettings();
        const { debugMode, loggingEnabled } = settings.developer;

        // Debug mode toggle
        const debugLabel = this.add.text(
            labelOffset,
            y,
            'Debug Mode',
            {
                fontSize,
                fontFamily: 'grandstander',
                colour: GAME_UI_COLOURS.TEXT,
            },
        );
        this.#tabContent.add(debugLabel);

        const debugToggle = this.#createToggle(controlOffset, y, debugMode, (value) => {
            SettingsManager.updateSetting('developer', 'debugMode', value);
        });
        this.#tabContent.add(debugToggle.container);

        y += spacing;

        // Logging toggle
        const loggingLabel = this.add.text(
            labelOffset,
            y,
            'Enable Logging',
            {
                fontSize,
                fontFamily: 'grandstander',
                colour: GAME_UI_COLOURS.TEXT,
            },
        );
        this.#tabContent.add(loggingLabel);

        const loggingToggle = this.#createToggle(controlOffset, y, loggingEnabled, (value) => {
            SettingsManager.updateSetting('developer', 'loggingEnabled', value);
        });
        this.#tabContent.add(loggingToggle.container);
    }

    /**
     * Updates the volume slider state based on current audio settings
     * Disables the slider when both music and sound effects are turned off
     */
    #updateVolumeSliderState() {
        // Only proceed if we have the volume slider elements
        if (!this.#volumeSliderElements) {
            return;
        }

        // Get current audio settings
        const settings = SettingsManager.getSettings();
        const { musicEnabled, sfxEnabled } = settings.audio;

        // Check if slider should be disabled (both music and sound effects are off)
        const sliderDisabled = !musicEnabled && !sfxEnabled;

        // Get references to the elements
        const { slider, label, value } = this.#volumeSliderElements;

        // If the disabled state hasn't changed, no need to update
        if (slider.disabled === sliderDisabled) {
            return;
        }

        // Update the slider visuals
        slider.track.setFillStyle(hexToPhaser(
            sliderDisabled ? SLIDER_STYLE.TRACK.DISABLED_COLOUR : SLIDER_STYLE.TRACK.BACKGROUND_COLOUR,
        ));
        slider.handle.setFillStyle(hexToPhaser(
            sliderDisabled ? SLIDER_STYLE.HANDLE.DISABLED_COLOUR : SLIDER_STYLE.HANDLE.BACKGROUND_COLOUR,
        ));

        // Update text colours
        label.setColor(sliderDisabled ? SLIDER_STYLE.HANDLE.DISABLED_COLOUR : GAME_UI_COLOURS.TEXT);
        value.setColor(sliderDisabled ? SLIDER_STYLE.HANDLE.DISABLED_COLOUR : GAME_UI_COLOURS.TEXT);

        // Update interactivity
        if (sliderDisabled) {
            slider.handle.disableInteractive();
        }
        else {
            slider.handle.setInteractive({ draggable: true, useHandCursor: true });

            // Re-add the drag event listener
            slider.handle.on('drag', (pointer, dragX) => {
                // Clamp handle position to track bounds
                const minX = 0;
                const maxX = SLIDER_STYLE.TRACK.WIDTH;
                const newX = Phaser.Math.Clamp(dragX, minX, maxX);

                slider.handle.x = newX;

                // Calculate and invoke callback with normalized value (0-1)
                const value = newX / SLIDER_STYLE.TRACK.WIDTH;
                this.#soundManager.setMasterVolume(value);
                this.#volumeSliderElements.value.setText(`${Math.round(value * 100)}%`);
                SettingsManager.updateSetting('audio', 'masterVolume', value);
            });
        }

        // Update the disabled flag
        slider.disabled = sliderDisabled;
    }

    /**
     * Creates a tab for our settings menu! 📑
     */
    #createTabs() {
        const tabContainer = this.add.container(0, 0);
        const tabKeys = Object.keys(this.#tabs);
        const totalWidth = this.#tabWidth * tabKeys.length;
        const startX = -totalWidth / 2;
        const fontSize = this.#isMobile ? '20px' : '26px';

        tabKeys.forEach((tabKey, index) => {
            const x = startX + (index * this.#tabWidth);
            const tab = this.add.container(x, 0);

            // Create background
            const tabBg = this.add.rectangle(
                0,
                0,
                this.#tabWidth,
                this.#tabHeight,
                hexToPhaser(TAB_COLOURS.INACTIVE.BACKGROUND),
            ).setOrigin(0);

            // Create text
            const tabText = this.add.text(
                this.#tabWidth / 2,
                this.#tabHeight / 2,
                tabKey.charAt(0).toUpperCase() + tabKey.slice(1),
                {
                    fontSize,
                    fontFamily: 'grandstander',
                    color: TAB_COLOURS.INACTIVE.TEXT,
                },
            ).setOrigin(0.5);

            tab.add([tabBg, tabText]);
            tabContainer.add(tab);

            // Make the background interactive
            tabBg.setInteractive({ useHandCursor: true })
                .on('pointerover', () => {
                    if (this.#activeTab !== tabKey) {
                        tabBg.setFillStyle(hexToPhaser(TAB_COLOURS.HOVER.BACKGROUND));
                    }
                })
                .on('pointerout', () => {
                    if (this.#activeTab !== tabKey) {
                        tabBg.setFillStyle(hexToPhaser(TAB_COLOURS.INACTIVE.BACKGROUND));
                        tabText.setColor(TAB_COLOURS.INACTIVE.TEXT);
                    }
                })
                .on('pointerup', () => {
                    this.#soundManager.playButtonSound();
                    this.#switchTab(tabKey);
                });

            this.#tabs[tabKey] = { container: tab, background: tabBg, text: tabText };
        });

        // Switch to first tab by default
        this.#switchTab(tabKeys[0]);

        return tabContainer;
    }

    /**
     * Switches to the specified tab! 🔄
     */
    #switchTab(tabKey) {
        // Clear old tab content
        this.#tabContent.removeAll(true);

        // Update tab styles
        Object.entries(this.#tabs).forEach(([key, tab]) => {
            const isActive = key === tabKey;
            tab.background.setFillStyle(hexToPhaser(
                isActive ? TAB_COLOURS.ACTIVE.BACKGROUND : TAB_COLOURS.INACTIVE.BACKGROUND,
            ));
            tab.text.setColor(
                isActive ? TAB_COLOURS.ACTIVE.TEXT : TAB_COLOURS.INACTIVE.TEXT,
            );
        });

        this.#activeTab = tabKey;

        // Create new tab content
        if (tabKey === 'audio') {
            this.#createAudioTab();
        }
        else if (tabKey === 'developer') {
            this.#createDeveloperTab();
        }
    }

    /**
     * Shows the main menu and hides settings! 🎯
     *
     * @private
     */
    #showMainMenu() {
        if (this.#showingSettings) {
            this.#showingSettings = false;
            this.tweens.add({
                targets: this.#settingsContainer,
                alpha: 0,
                duration: 200,
                ease: 'Power2',
            });
            this.tweens.add({
                targets: this.#menuContainer,
                alpha: 1,
                duration: 200,
                ease: 'Power2',
            });
        }
    }

    /**
     * Shows the settings menu and hides main menu! ⚙️
     *
     * @private
     */
    #showSettingsMenu() {
        if (!this.#showingSettings) {
            this.#showingSettings = true;
            this.tweens.add({
                targets: this.#menuContainer,
                alpha: 0,
                duration: 200,
                ease: 'Power2',
            });
            this.tweens.add({
                targets: this.#settingsContainer,
                alpha: 1,
                duration: 200,
                ease: 'Power2',
            });
        }
    }

    /**
     * Updates our magical sky! ✨
     *
     * @param {number} time - The current time
     * @param {number} delta - The delta time in ms since the last frame
     */
    update(time, delta) {
        this.#skySystem.update(time, delta);
    }

    /**
     * Cleans up our scene when we're done! 🧹
     */
    shutdown() {
        // Clean up the sky system
        if (this.#skySystem) {
            this.#skySystem.destroy();
            this.#skySystem = null;
        }

        // Clean up sound manager
        if (this.#soundManager) {
            this.#soundManager.destroy();
            this.#soundManager = null;
        }

        // Clean up all tweens
        this.tweens.killAll();

        // Remove shutdown listener
        this.events.off('shutdown', this.shutdown, this);

        // Call parent shutdown
        super.shutdown();
    }
}
