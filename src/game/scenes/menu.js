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

    /** @type {Object} Our UI style configuration */
    #styles = {
        tab: {
            active: {
                backgroundColour: '#4CAF50',  // Green colour for active tab
                colour: '#ffffff',
            },
            inactive: {
                backgroundColour: '#222222',
                colour: '#cccccc',
            },
            hover: {
                backgroundColour: '#4a4a4a',
            },
        },
        slider: {
            track: {
                backgroundColour: '#222222',
                width: 300,
                height: 10,
            },
            handle: {
                backgroundColour: '#ffffff',
                width: 20,
                height: 20,
            },
        },
    };

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
                color: '#ffffff',
                align: 'center',
                backgroundColor: '#222222',
                padding: { x: 20, y: 10 },
                fixedWidth: width,
            },
        )
            .setOrigin(0.5)
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => button.setBackgroundColor('#4a4a4a'))
            .on('pointerout', () => button.setBackgroundColor('#222222'));

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
            this.#styles.slider.track.width = 200;
            this.#styles.slider.handle.width = 15;
            this.#styles.slider.handle.height = 15;
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
                color: '#ffffff',
                backgroundColor: '#00000080',
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
            color: '#ffffff',
            align: 'center',
            stroke: '#000000',
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
                color: '#ffffff',
                stroke: '#000000',
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
                color: '#ffffff',
                backgroundColor: '#222222',
                padding: { x: this.#isMobile ? 10 : 15, y: this.#isMobile ? 8 : 10 },
            },
        )
            .setInteractive({ useHandCursor: true })
            .on('pointerover', () => backButton.setBackgroundColor('#4a4a4a'))
            .on('pointerout', () => backButton.setBackgroundColor('#222222'))
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

            // Create background with rounded top corners
            const tabBg = this.add.rectangle(
                0,
                0,
                this.#tabWidth,
                this.#tabHeight,
                parseInt(this.#styles.tab.inactive.backgroundColour.replace('#', '0x'), 16),
            ).setOrigin(0);

            // Create text
            const tabText = this.add.text(
                this.#tabWidth / 2,
                this.#tabHeight / 2,
                tabKey.charAt(0).toUpperCase() + tabKey.slice(1),
                {
                    fontSize,
                    fontFamily: 'grandstander',
                    color: this.#styles.tab.inactive.colour,
                },
            ).setOrigin(0.5);

            tab.add([tabBg, tabText]);
            tabContainer.add(tab);

            // Make the background interactive
            tabBg.setInteractive({ useHandCursor: true })
                .on('pointerover', () => {
                    if (this.#activeTab !== tabKey) {
                        tabBg.setFillStyle(parseInt(this.#styles.tab.hover.backgroundColour.replace('#', '0x'), 16));
                    }
                })
                .on('pointerout', () => {
                    if (this.#activeTab !== tabKey) {
                        tabBg.setFillStyle(parseInt(this.#styles.tab.inactive.backgroundColour.replace('#', '0x'), 16));
                        tabText.setColor(this.#styles.tab.inactive.colour);
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
            tab.background.setFillStyle(parseInt(
                this.#styles.tab[isActive ? 'active' : 'inactive'].backgroundColour.replace('#', '0x'),
                16,
            ));
            tab.text.setColor(this.#styles.tab[isActive ? 'active' : 'inactive'].colour);
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
     * Creates a slider control
     *
     * @param {number} x - X position
     * @param {number} y - Y position
     * @param {number} initialValue - Initial value (0-1)
     * @param {function} onChange - Callback when value changes
     * @returns {Object} Slider objects
     */
    #createSlider(x, y, initialValue, onChange) {
        const container = this.add.container((x - this.#styles.slider.track.width) / 2, y);

        // Create track
        const track = this.add.rectangle(
            0,
            0,
            this.#styles.slider.track.width,
            this.#styles.slider.track.height,
            parseInt(this.#styles.slider.track.backgroundColour.replace('#', '0x'), 16),
        ).setOrigin(0);

        // Create handle
        const handle = this.add.rectangle(
            initialValue * this.#styles.slider.track.width,
            this.#styles.slider.track.height / 2,
            this.#styles.slider.handle.width,
            this.#styles.slider.handle.height,
            parseInt(this.#styles.slider.handle.backgroundColour.replace('#', '0x'), 16),
        ).setOrigin(0.5);

        // Make handle interactive
        handle.setInteractive({ draggable: true, useHandCursor: true });

        handle.on('drag', (pointer, dragX) => {
            // Clamp handle position to track bounds
            const minX = 0;
            const maxX = this.#styles.slider.track.width;
            const newX = Phaser.Math.Clamp(dragX, minX, maxX);

            handle.x = newX;

            // Calculate and invoke callback with normalized value (0-1)
            const value = newX / this.#styles.slider.track.width;
            onChange(value);
        });

        container.add([track, handle]);

        return { container, track, handle };
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
            initialValue ? 0x4CAF50 : 0x9e9e9e,
            1,
            15,  // Adding corner radius for a friendlier look
        ).setOrigin(0);

        // Create square handle
        const handle = this.add.rectangle(
            initialValue ? width - height + 3 : 3,
            3,
            handleSize,
            handleSize,
            0xffffff,
            1,
            8,  // Slightly rounded corners on handle too
        ).setOrigin(0);

        container.add([background, handle]);

        // Make the background interactive instead of the container
        background.setInteractive({ useHandCursor: true })
            .on('pointerup', () => {
                this.#soundManager.playButtonSound();
                const newValue = handle.x === 3;
                background.setFillStyle(newValue ? 0x4CAF50 : 0x9e9e9e);

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
        const spacing = this.#isMobile ? 35 : 45;  // Slightly reduced spacing
        let y = 0;
        const labelOffset = this.#isMobile ? -120 : -200;
        const controlOffset = this.#isMobile ? 100 : 150;
        const fontSize = this.#isMobile ? '20px' : '24px';

        // Get current audio settings
        const settings = SettingsManager.getSettings();
        const { masterVolume, musicEnabled, sfxEnabled } = settings.audio;

        // Master volume label and value
        const volumeLabel = this.add.text(
            labelOffset,
            y,
            'Master Volume',
            {
                fontSize,
                fontFamily: 'grandstander',
                colour: '#ffffff',
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
                colour: '#ffffff',
            },
        );
        this.#tabContent.add(volumeValue);

        y += spacing;

        // Add slider with slightly more space after it
        const volumeSlider = this.#createSlider(0, y, masterVolume, (value) => {
            this.#soundManager.setMasterVolume(value);
            volumeValue.setText(`${Math.round(value * 100)}%`);
            SettingsManager.updateSetting('audio', 'masterVolume', value);
        });
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
                colour: '#ffffff',
            },
        );
        this.#tabContent.add(musicLabel);

        const musicToggle = this.#createToggle(controlOffset, y, musicEnabled, (value) => {
            this.#soundManager.setMusicEnabled(value);

            // Start menu music again if we're enabling music
            if (value) {
                this.#soundManager.playMenuMusic();
            }
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
                colour: '#ffffff',
            },
        );
        this.#tabContent.add(sfxLabel);

        const sfxToggle = this.#createToggle(controlOffset, y, sfxEnabled, (value) => {
            this.#soundManager.setSfxEnabled(value);
        });
        this.#tabContent.add(sfxToggle.container);
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
                colour: '#ffffff',
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
                colour: '#ffffff',
            },
        );
        this.#tabContent.add(loggingLabel);

        const loggingToggle = this.#createToggle(controlOffset, y, loggingEnabled, (value) => {
            SettingsManager.updateSetting('developer', 'loggingEnabled', value);
        });
        this.#tabContent.add(loggingToggle.container);
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
