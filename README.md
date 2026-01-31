# TRINVADERS

An Asteroids-style space shooter game built with Phaser 3 and Next.js. Features AI-controlled bots with configurable difficulty levels, mobile touch controls, and real-time multiplayer support via Socket.io.

![TRINVADERS Screenshot](screenshot.png)

## Project History

This project started as a side project in **2019** - about 6 years ago. After sitting incomplete for years, it was finally finished in **2025** with the help of [Claude Code](https://claude.ai/code). The original archived code can be found in the `archived/` folder.

## Features

- **Single Player Mode**: Battle against AI bots with easy, medium, and hard difficulty levels
- **Multiplayer Mode**: 1v1 PvP battles with real-time synchronization
- **Mobile Support**: Virtual joystick and fire button for touch devices
- **Physics-based Movement**: Thrust, rotation, braking, and screen-wrap mechanics
- **Health & Ammo Systems**: Regenerating health and ammo with visual UI bars

## Tech Stack

- **[Phaser 3.90](https://phaser.io/)** - Game engine with arcade physics
- **[Next.js 15](https://nextjs.org/)** - React framework
- **[TypeScript 5](https://www.typescriptlang.org/)** - Type safety
- **[Socket.io](https://socket.io/)** - Real-time multiplayer communication

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Bun](https://bun.sh/) (recommended) or npm

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/trinvaders.git
cd trinvaders

# Install dependencies
npm install

# Install server dependencies
cd server && npm install && cd ..
```

### Running the Game

**Single Player (development):**
```bash
npm run dev
```
Open [http://localhost:8080](http://localhost:8080)

**Multiplayer:**
```bash
npm run multiplayer
```
This starts both the game server (port 3001) and dev server (port 8080).

### Available Commands

| Command | Description |
|---------|-------------|
| `npm install` | Install project dependencies |
| `npm run dev` | Launch development server on port 8080 |
| `npm run build` | Create production build |
| `npm run server` | Start multiplayer game server only |
| `npm run multiplayer` | Start both game server and dev server |

## How to Play

### Controls

**Keyboard:**
- `W` / `↑` - Thrust forward
- `S` / `↓` - Brake
- `A` / `←` - Rotate left
- `D` / `→` - Rotate right
- `SPACE` - Fire
- `ESC` - Return to menu

**Mobile:**
- Left side: Virtual joystick for movement
- Right side: Fire button

### Game Modes

**Single Player:**
1. Select difficulty (Easy, Medium, Hard)
2. Destroy AI bots to earn points
3. Survive as long as possible

**Multiplayer:**
1. Click "Multiplayer" from main menu
2. Create a room or join with a 4-character code
3. Both players click "Ready"
4. First to eliminate the opponent wins

## Project Structure

```
trinvaders/
├── src/
│   ├── game/
│   │   ├── entities/      # Player, Bot, Bullet classes
│   │   ├── ai/            # Bot AI system and configs
│   │   ├── systems/       # BotManager, SoundManager
│   │   ├── network/       # NetworkManager, Interpolation
│   │   └── scenes/        # Game scenes (Menu, Game, Lobby, etc.)
│   ├── pages/             # Next.js pages
│   └── styles/            # Global CSS
├── server/
│   └── gameServer.js      # Socket.io multiplayer server
├── public/
│   └── assets/            # Game sprites and images
└── archived/              # Original 2019 code (legacy reference)
```

## Architecture

### Single Player
- Local player controls ship with keyboard/touch
- BotManager spawns and controls AI opponents
- BotAI uses finite state machine: IDLE → WANDER → CHASE → ATTACK → EVADE

### Multiplayer
- Socket.io server relays game state between players
- Client sends position updates at 30Hz
- Interpolation smooths remote player movement
- Server handles room creation, matchmaking, and ready states

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built with the [Phaser Next.js Template](https://github.com/phaserjs/template-nextjs)
- Completed with the assistance of [Claude Code](https://claude.ai/code)
- Ship sprites and game assets included in `public/assets/`
