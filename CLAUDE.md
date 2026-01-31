# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

TRINVADERS is an Asteroids-style space shooter game built with Phaser 3 and Next.js. It features AI-controlled bots with configurable difficulty levels, mobile touch controls, and is prepared for future multiplayer support via Socket.io.

## Commands

```bash
npm install          # Install dependencies
npm run dev          # Start development server on http://localhost:8080
npm run build        # Production build to dist/
npm run dev-nolog    # Dev server without analytics
npm run build-nolog  # Build without analytics
```

## Architecture

### Tech Stack
- **Phaser 3.90** - Game engine with arcade physics
- **Next.js 15** - React framework for hosting
- **TypeScript 5** - Type safety

### React-Phaser Bridge
- `src/PhaserGame.tsx` - React component that initializes Phaser and exposes game/scene refs
- `src/game/EventBus.ts` - Event emitter for React↔Phaser communication
- Scenes emit `'current-scene-ready'` to notify React when ready

### Scene Flow
`Boot` → `Preloader` → `MainMenu` → `Game` → `GameOver`

### Game Entity System

**Player** (`src/game/entities/Player.ts`)
- Physics-based ship with thrust, rotation, brake, screen-wrap
- Ship sprite points UP at angle 0; direction calculations use `-90°` offset

**Bot** (`src/game/entities/Bot.ts`)
- Extends Player with AI behavior
- Health system with visual health bars
- Tinted by difficulty (green=easy, yellow=medium, red=hard)

**Bullet** (`src/game/entities/Bullet.ts`)
- Owned by playerId for collision tracking
- Screen-wrapping enabled

### AI System

**BotAI** (`src/game/ai/BotAI.ts`)
- Finite State Machine: IDLE → WANDER → CHASE → ATTACK → EVADE
- Wrap-aware distance/angle calculations
- Lead-target prediction for shooting
- Bullet danger detection and evasion

**BotConfig** (`src/game/ai/BotConfig.ts`)
- Defines `easy`, `medium`, `hard` difficulty presets
- Parameters: accuracy, reactionTime, fireRate, detectionRange, dodgeChance, etc.

**BotManager** (`src/game/systems/BotManager.ts`)
- Spawns/destroys bots, manages fire rate cooldowns
- Provides physics group for collision detection
- Tracks which bullets belong to bots

### Game Scene Key Systems
- Ammo regeneration (10 max, 500ms per ammo)
- Health regeneration (100 max, 2000ms per 5hp)
- UI bars for speed, ammo, health
- Mobile virtual joystick and fire button
- ESC or quit button returns to menu

### Assets
Located in `public/assets/`:
- Ship sprites: `{color}_ship.png`, `{color}_blaster_ship.png` (blue, red, green, yellow)
- `basic_bullet.png`, `blaster_bullet.png`
- `bg.png`, `star.png`
