import fs from 'fs';
import path from 'path';
import process from 'process';
import inquirer from 'inquirer';

/**
 * 🏷️ Generates a dynamic version number for our game!
 * This helps us keep track of our game's versions super easily.
 *
 * @param {Object} versionOptions - Version configuration options
 * @returns {string} A version number that tells us exactly when this build happened
 */
function generateVersion(versionOptions) {
    const now = new Date();
    const { major, minor, patch } = versionOptions;

    // Create a date string that shows exactly when we built the game
    const dateString = `${now.getDate()}${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getFullYear()}`;

    return `${major}.${minor}.${patch}-b${dateString}`;
}

/**
 * 🔍 Reads the current version from the config file
 * @returns {Object} Current version details
 */
function readCurrentVersion() {
    const configPath = path.join(process.cwd(), 'src', 'game', 'config.js');
    const configContent = fs.readFileSync(configPath, 'utf8');
    const versionMatch = configContent.match(/version:\s*'([^']*)'/).pop().split('.');

    return {
        major: parseInt(versionMatch[0], 10),
        minor: parseInt(versionMatch[1], 10),
        patch: parseInt(versionMatch[2].split('-')[0], 10),
    };
}

/**
 * 🔧 Updates the game's version in the configuration file
 */
async function updateGameVersion() {
    try {
        // Get current version
        const currentVersion = readCurrentVersion();

        // Prompt for version update type
        const { versionType } = await inquirer.prompt([{
            type: 'list',
            name: 'versionType',
            message: '🚀 How would you like to update the version?',
            choices: [
                'Patch (bug fixes)',
                'Minor (new features)',
                'Major (breaking changes)',
                'Custom version',
            ],
        }]);

        let newVersion = { ...currentVersion };

        // Determine version increment
        switch (versionType) {
            case 'Patch (bug fixes)': {
                newVersion.patch += 1;

                break;
            }
            case 'Minor (new features)': {
                newVersion.minor += 1;
                newVersion.patch = 0;

                break;
            }
            case 'Major (breaking changes)': {
                newVersion.major += 1;
                newVersion.minor = 0;
                newVersion.patch = 0;

                break;
            }
            case 'Custom version': {
                const customVersion = await inquirer.prompt([
                    {
                        type: 'number',
                        name: 'major',
                        message: 'Enter major version:',
                        default: currentVersion.major,
                    },
                    {
                        type: 'number',
                        name: 'minor',
                        message: 'Enter minor version:',
                        default: currentVersion.minor,
                    },
                    {
                        type: 'number',
                        name: 'patch',
                        message: 'Enter patch version:',
                        default: currentVersion.patch,
                    },
                ]);
                newVersion = customVersion;

                break;
            }
        }

        // Generate full version string
        const finalVersion = generateVersion(newVersion);

        // Update config file
        const configPath = path.join(process.cwd(), 'src', 'game', 'config.js');
        let configContent = fs.readFileSync(configPath, 'utf8');
        configContent = configContent.replace(
            /version:\s*'[^']*'/,
            `version: '${finalVersion}'`,
        );
        fs.writeFileSync(configPath, configContent, 'utf8');

        console.log(`🚀 Game version updated to: ${finalVersion}`);
    }
    catch (error) {
        console.error('❌ Couldn\'t update game version:', error);
        process.exit(1);
    }
}

// Run the version update when the script is called
updateGameVersion();
