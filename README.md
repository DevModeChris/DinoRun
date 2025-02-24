# 🦖 Dino Run Game

![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white)
![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)
![ESModules](https://img.shields.io/badge/ES%20Modules-%23F7DF1E.svg?style=for-the-badge&logo=javascript&logoColor=black)
![Node.js](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![Phaser](https://img.shields.io/badge/Phaser-263d6c?style=for-the-badge&logo=data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAABmJLR0QAAAAAAAD5Q7t/AAAACXBIWXMAAABIAAAASABGyWs+AAAACXZwQWcAAAAQAAAAEABcxq3DAAABJ0lEQVQ4y6WTP0sDQRDF30hSXoqxuS9gLwoWAQmYwsIIQtCrDdho4LrEgJXNql3Aa43YGVuvSOE16dPlO6Q6OzsZi1z2suxeAubBNLv7fsyfHRIRbCzFLIr5X6SSYpbb622g5gPBVHppSvp2MDShlxdkERSziOfN424nz2QwlPBHjLCAFiCDVKpNbVqoCLLVS1OT2J85a+2/f7h7AACnu/vm6e/cEAbnoFe3cVniUqfbElcfKtWmANBlUAZwkpM4wmg8Mc6OD/dwdHIDIgIAIgDS6bacj1YpiSPUG217jOJ5ophlnb4+nwWAlAAAoQ/UfDwEU6BcxsHbPZI4WplBvdHOS8j+A76vznQJRRqNJ3h6fFn0D1YPisxLRm3WgLWDzmXtAm26zn+ZquF6a4ZkbAAAACJ6VFh0U29mdHdhcmUAAHjac0zJT0pV8MxNTE8NSk1MqQQAL5wF1K4MqU0AAAAASUVORK5CYII=)
![Vite](https://img.shields.io/badge/vite-%23646CFF.svg?style=for-the-badge&logo=vite&logoColor=white)
![WebGL](https://img.shields.io/badge/WebGL-990000?style=for-the-badge&logo=webgl&logoColor=white)
![ESLint](https://img.shields.io/badge/ESLint-4B3263?style=for-the-badge&logo=eslint&logoColor=white)

Welcome to Dino Run! This is a fun browser game where you help a brave little dinosaur run and jump over obstacles. But this isn't just any game - it's also a cool way to learn about coding!

Try the live demo here: [Play DinoRun](https://devmodechris.github.io/DinoRun/)

## 🎮 About This Project

This project was created to teach my kids about programming in a fun and engaging way.

The kids really enjoy playing the Chrome Dino Run game you get when you have no internet connection, so much so they'd often purposefully disable their wifi to play the game... before realising they could just go to `chrome://dino` 😅. So naturally when I asked them what type of game they'd like to make to learn code they said Chrome Dino Run.

While this project is based on the Chrome Dino Run game core mechanics, it'll likely end up evolving into a much different game in the future.

The code is written with lots of helpful comments that explain what's happening in simple terms (like we're explaining it to a 5-year-old). You'll find hopefully easy-to-understand explanations throughout the code.

Originally this project was using DOM based rendering (See branches), after getting to a point where we wanted to make the game more interactive and visually appealing, we decided to make the switch to a Canvas based rendering.
During the rewrite to Canvas though I ended up playing around with Phaser.js separately and ultimately decided to use it for the game engine with the built-in WebGL based rendering support for DinoRun.

The move to Phaser.js was a big decision for us, but it allowed us to focus on the game logic and gameplay much more, rather than the game engine itself - which for the kids has made this project a lot more fun to work on.

### ✨ Features

- 🖼️ Phaser.js Engine with WebGL rendering pipeline
- 🎮 Menu system
- 🌞 Day and night cycle
- 🌌 Sky system with stars and auroras
- 🌤️ Cloud system
- 🌡️ Weather system
- 🦖 Control a cute dinosaur character
- 🌳 Jump over obstacles like fauna, rocks, and holes
- 🦅 Duck under flying birds
- ⭐ Collect power-ups with special abilities:
  - ⏳ Slow Motion: Makes everything move slower
  - ⚡ Speed Boost: Makes everything move faster
- 🎵 Sound effects
- 💫 Kid-friendly code comments to learn programming
- 📊 Score system with high score tracking

## 📋 Prerequisites

Hey there, future programmer! Before you start, you'll need a few things installed on your computer:

1. 💻 **Node.js**: This helps run our game server
   - Download it from [nodejs.org](https://nodejs.org/)
   - Choose the "LTS" version (that means it's stable!)
   - Follow the installation steps (just click "Next" a few times)

2. 📝 **A Code Editor**: To look at and change the game's code
   - I'd recommend [Visual Studio Code](https://code.visualstudio.com/)
   - It's free and super easy to use!

## 📥 Getting the Code

Before you can play, you'll need to get a copy of the game on your computer:

1. 🔱 Fork the repository:
   - Go to [github.com/DevModeChris/DinoRun](https://github.com/DevModeChris/DinoRun)
   - Click the "Fork" button in the top-right corner
   - This creates your own copy of the game!

2. 💾 Clone the code in VS Code:
   - Open Visual Studio Code
   - Press `Ctrl + Shift + P` to open the Command Palette
   - Type "Git: Clone" and select it
   - Paste your forked repository URL
   - Choose where to save it on your computer
   - Click "Open" when it asks to open the repository

Now you have your own copy of the game that you can play with and modify! 🎮

## 🎯 How to play the game

Ready to play? Here's how to get started:

1. 📦 First, open a terminal (Command Prompt) in the game folder, or in VS Code
2. 🚀 Type `npm install` and press Enter (this gets everything ready)
3. 🎮 Type `npm run start-server` and press Enter (this starts the game)
4. 🌐 Open your web browser and go to `http://localhost:8000`
5. 🎮 Click 'Play' to start the game!

Tips:
- When you make changes to the code, save them and the game will automatically reload (called "hot reloading") without needing to restart the server or manually refresh the page.
- When you start the server, the output in the terminal will show the URL for your local server (i.e. `http://localhost:8000`), and also a `network` URL (i.e. `http://192.168.1.XXX:8000`). The `network` URL can be used to play the game on your mobile device or another computer. You can also see these URLs at any time by typing `u` and then pressing `Enter` in the terminal while the server is running.

Game Controls:
- On Computer:
  - Press `SPACE` or `UP ARROW` to jump (hold longer to jump higher!)
  - Press `CTRL` or `DOWN ARROW` to duck
- On Mobile:
  - Swipe up or tap left side of screen to jump
  - Swipe down or tap right side of screen to crouch

When you're done playing:
1. 🛑 Go back to the terminal
2. ⌨️ Press `q` then `Enter` to stop the game server

## 📁 Project Structure

Here's how our game files are organised:

```
DinoRun/
├── src/
│   ├── assets/           # Game resources (images, sounds, etc.)
│   │   ├── sprites/      # Sprite sheets and images
│   │   ├── audio/        # Sound effects and music
│   │   └── fonts/        # Custom game fonts
│   ├── game/
│   │   ├── constants/    # Game constants
│   │   ├── scenes/       # Game scenes
│   │   ├── objects/      # Game object classes
│   │   ├── systems/      # Game system classes, managers, etc.
│   │   └── config.js     # Game configuration
│   ├── utils/            # Utility classes
│   │   ├── helpers.js    # Helper functions
│   └── main.js           # Entry point
├── index.html            # Main HTML file
├── vite.config.js        # Vite configuration
└── package.json          # Project dependencies
```

## 🎓 Learning from the Code

Want to learn how the game works? Start by looking at these files:

1. First, check out `index.html` - it's like the game's skeleton
2. Then look at `src/main.js` and `src/game/config.js` - They're the entry point and config for our game
3. Look at `src/game/objects/` - it handles all the game objects
4. Check out `src/game/scenes/` - it controls our game scenes
5. Try reading `src/game/ui/` to see how the UI works

All the code has comments that explain what's happening!

## 🛠️ For Others

I created this project for my kids to learn programming but others may also find it useful so here's an overview of what it's about.

This project is designed to teach programming concepts through game development. The code is heavily commented with kid-friendly explanations, using:

- Simple language and analogies
- Emoji icons for visual engagement
- Step-by-step explanations
- Real-world comparisons

Feel free to use this as a teaching tool! The comments are written in an "Explain Like I'm 5" (ELI5) style to make programming concepts accessible to young learners.

## 🤝 Contributing

Found a way to make the game better? Want to add more kid-friendly comments? Here's how you can help:

1. Fork the project
2. Create your feature branch
3. Install the development dependencies:
   ```bash
   npm install
   ```
4. Make sure your code follows our style guide by running ESLint:
   ```bash
   npm run lint
   ```
   Or to automatically fix issues:
   ```bash
   npm run lint:fix
   ```
   Both commands will check your code style, but `lint:fix` will try to fix issues automatically!
5. Add your changes
6. Submit a pull request

### 📝 Code Style Guidelines

I'm using ESLint to maintain consistent code style. The configuration includes:

- Proper spacing and indentation
- Consistent use of ES Modules (`import`/`export`)
- JSDoc comment formatting
- Kid-friendly comment requirements

The ESLint configuration can be found in `.eslintrc.json`. Some key rules include:
- Use of ES Modules for all imports/exports
- Descriptive variable names
- Clear and educational comments
- Consistent spacing and formatting

Remember to:
- Keep the code and comments kid-friendly! 😊
- Run ESLint before submitting your changes
- Add educational comments that explain the code
- Use ES Modules syntax for all imports/exports

## 📝 License

This project is open source and available under the MIT License. Feel free to use it to teach and learn!
