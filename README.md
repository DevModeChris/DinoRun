# 🦖 Dino Run Game

![HTML5](https://img.shields.io/badge/html5-%23E34F26.svg?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/css3-%231572B6.svg?style=for-the-badge&logo=css3&logoColor=white)
![JavaScript](https://img.shields.io/badge/javascript-%23323330.svg?style=for-the-badge&logo=javascript&logoColor=%23F7DF1E)
![ESModules](https://img.shields.io/badge/ES%20Modules-%23F7DF1E.svg?style=for-the-badge&logo=javascript&logoColor=black)
![Node.js](https://img.shields.io/badge/node.js-6DA55F?style=for-the-badge&logo=node.js&logoColor=white)
![ESLint](https://img.shields.io/badge/ESLint-4B3263?style=for-the-badge&logo=eslint&logoColor=white)

Welcome to Dino Run! This is a fun browser game where you help a brave little dinosaur run and jump over obstacles. But this isn't just any game - it's also a cool way to learn about coding!

Try the live demo here: [Play DinoRun](https://devmodechris.github.io/DinoRun/)

## 🎮 About This Project

This project was created to teach my kids about programming in a fun and engaging way.

The kids really enjoy playing the Chrome Dino Run game you get when you have no internet connection, so much so they'd often purposefully disable their wifi to play the game... before realising they could just go to `chrome://dino` 😅. So naturally when I asked them what type of game they'd like to make to learn code they said Chrome Dino Run.

While this project is based on the Chrome Dino Run game core mechanics, it'll likely end up evolving into a much different game in the future.

The code is written with lots of helpful comments that explain what's happening in simple terms (like we're explaining it to a 5-year-old). You'll find hopefully easy-to-understand explanations throughout the code.

### ✨ Features

- 🎮 Menu system
- 🦖 Control a cute dinosaur character
- 🌵 Jump over obstacles like cacti, rocks, and holes
- 🦅 Duck under flying birds
- ⭐ Collect power-ups with special abilities:
  - ⏳ Slow Motion: Makes everything move slower
  - ⚡ Speed Boost: Makes everything move faster
- 🎵 Sound effects
- 💫 Kid-friendly code comments to learn programming
- 📊 High score tracking

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

Game Controls:
- On Desktop:
  - Press `SPACE` or `UP ARROW` to jump (hold longer to jump higher!)
  - Press `CTRL` or `DOWN ARROW` to duck
- On Mobile:
  - Swipe up or tap left side of screen to jump
  - Swipe down or tap right side of screen to crouch

Tips:
- 📖 Check the How to Play screen for detailed instructions
- ⭐ Collect power-ups to get special abilities
- 🏆 Try to beat your high score!

When you're done playing:
1. 🛑 Go back to the terminal
2. ⌨️ Press `Ctrl + C` to stop the game server

## 📁 Project Structure

Here's how our game files are organised:

```
DinoRun/
├── index.html            # The main game page
├── styles.css            # Makes the game look pretty
├── core/
│   ├── game.js           # The main game engine 🎮
│   ├── input.js          # Handles keyboard and touch controls 🎮
│   ├── score.js          # Keeps track of your score 📊
│   └── collision.js      # Checks when things bump into each other 💥
├── entities/
│   ├── dino.js           # Our dinosaur hero! 🦖
│   ├── obstacle.js       # Things to jump over 🌵
│   ├── powerup.js        # Special power-ups ⭐
│   └── mob.js            # Moving creatures to avoid 🦅
├── effects/
│   └── particles.js      # Particle effects! 💨
├── config/
│   ├── obstacles.js      # Obstacle types and settings
│   ├── powerups.js       # Power-up types and settings
│   └── mobs.js           # Mob types and settings
└── utils/
    ├── constants.js      # Game settings and constants
    ├── audio.js          # Sound effects and music 🎵
    └── entity-helpers.js # Helper functions for game objects
```

## 🎓 Learning from the Code

Want to learn how the game works? Start by looking at these files:

1. First, check out `index.html` - it's like the game's skeleton
2. Then look at `core/game.js` - it's the brain of our game!
3. Look at `core/input.js` - it handles all the controls
4. Check out `entities/dino.js` - it controls our dinosaur character
5. Try reading `entities/obstacle.js` and `config/obstacles.js` to see how obstacles work
6. Look at `entities/powerup.js` and `config/powerups.js` to learn about special abilities
7. Finally, explore `entities/mob.js` and `config/mobs.js` to see how creatures work

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
   npm run format
   ```
   Both commands will check your code style, but `format` will try to fix issues automatically!
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
