/**
 * BotManager - Manages bot lifecycle, spawning, updates, and firing
 */

import { Scene, Physics } from 'phaser';
import { Bot } from '../entities/Bot';
import { Bullet } from '../entities/Bullet';
import { Player } from '../entities/Player';
import { BotDifficulty, BOT_CONFIGS } from '../ai/BotConfig';

// Ship colors available for bots
const BOT_SHIP_COLORS = ['blue', 'red', 'green', 'yellow'];

export class BotManager {
    private scene: Scene;
    private bots: Bot[] = [];
    private botGroup: Physics.Arcade.Group;
    private bullets: Physics.Arcade.Group;
    private player: Player;

    // Fire rate tracking per bot
    private lastFiredTimes: Map<string, number> = new Map();

    // Callbacks
    private onBotFire?: (bot: Bot, bullet: Bullet) => void;

    constructor(scene: Scene, player: Player, bullets: Physics.Arcade.Group) {
        this.scene = scene;
        this.player = player;
        this.bullets = bullets;

        // Create physics group for bots
        this.botGroup = scene.physics.add.group();
    }

    /**
     * Get the physics group containing all bots (for collision detection)
     */
    getBotGroup(): Physics.Arcade.Group {
        return this.botGroup;
    }

    /**
     * Spawn a bot at specified position
     */
    spawnBot(x: number, y: number, difficulty: BotDifficulty): Bot {
        const botId = 'bot_' + Math.random().toString(36).substr(2, 9);
        const shipColor = BOT_SHIP_COLORS[Math.floor(Math.random() * BOT_SHIP_COLORS.length)];

        const bot = new Bot(this.scene, {
            x,
            y,
            texture: `ship_${shipColor}`,
            playerId: botId,
            difficulty,
        });

        // Set target and bullet getter
        bot.setTarget(this.player);
        bot.setBulletGetter(() => this.getBulletsForBot(botId));

        // Initialize fire time
        this.lastFiredTimes.set(botId, 0);

        // Add to physics group for collision detection
        this.botGroup.add(bot);

        // Re-apply physics constraints AFTER adding to group (group can override them)
        const body = bot.body as Physics.Arcade.Body;
        body.setMaxVelocity(400);
        body.setDrag(50);

        this.bots.push(bot);
        return bot;
    }

    /**
     * Spawn a bot at a random position away from player
     */
    spawnBotRandom(difficulty: BotDifficulty, minDistanceFromPlayer: number = 200): Bot {
        const { width, height } = this.scene.scale;
        let x: number, y: number;
        let attempts = 0;
        const maxAttempts = 50;

        do {
            x = Phaser.Math.Between(50, width - 50);
            y = Phaser.Math.Between(50, height - 50);
            attempts++;

            const dx = x - this.player.x;
            const dy = y - this.player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance >= minDistanceFromPlayer || attempts >= maxAttempts) {
                break;
            }
        } while (true);

        return this.spawnBot(x, y, difficulty);
    }

    /**
     * Get all bullets except those owned by the specified bot
     */
    private getBulletsForBot(botId: string): Bullet[] {
        const result: Bullet[] = [];
        this.bullets.getChildren().forEach((obj) => {
            const bullet = obj as Bullet;
            if (bullet.active && bullet.ownerId !== botId) {
                result.push(bullet);
            }
        });
        return result;
    }

    /**
     * Update all bots
     */
    update(time: number, delta: number) {
        const { width, height } = this.scene.scale;

        for (const bot of this.bots) {
            if (!bot.active) continue;

            // Update AI and get actions
            const action = bot.updateAI(time, delta);

            // Handle firing (with fire rate limiting)
            if (action.fire) {
                this.tryFire(bot, time);
            }

            // Screen wrap
            bot.wrapBounds(width, height);
        }
    }

    /**
     * Try to fire for a bot (respects fire rate)
     */
    private tryFire(bot: Bot, time: number) {
        const lastFired = this.lastFiredTimes.get(bot.playerId) || 0;
        const fireRate = bot.difficultyConfig.fireRate;

        if (time - lastFired < fireRate) {
            return; // Fire rate cooldown
        }

        // Create bullet
        const spawnPoint = bot.getBulletSpawnPoint();

        // Apply aim variance
        const variance = bot.getAimVariance();
        const adjustedAngle = spawnPoint.angle + variance;

        const bullet = new Bullet(this.scene, {
            x: spawnPoint.x,
            y: spawnPoint.y,
            angle: adjustedAngle,
            ownerId: bot.playerId,
            texture: 'bullet_basic',
        });

        this.bullets.add(bullet);
        bullet.launch();

        // Register bullet as belonging to this bot
        bot.registerOwnBullet(bullet.ownerId);

        // Update fire time
        this.lastFiredTimes.set(bot.playerId, time);

        // Callback
        if (this.onBotFire) {
            this.onBotFire(bot, bullet);
        }
    }

    /**
     * Set callback for when bot fires
     */
    setOnBotFire(callback: (bot: Bot, bullet: Bullet) => void) {
        this.onBotFire = callback;
    }

    /**
     * Remove a specific bot
     */
    removeBot(bot: Bot) {
        const index = this.bots.indexOf(bot);
        if (index !== -1) {
            this.bots.splice(index, 1);
            this.lastFiredTimes.delete(bot.playerId);
            bot.destroy();
        }
    }

    /**
     * Remove bot by reference (for collision callbacks)
     */
    removeBotByReference(bot: Bot) {
        const index = this.bots.indexOf(bot);
        if (index !== -1) {
            this.bots.splice(index, 1);
            this.lastFiredTimes.delete(bot.playerId);
        }
        // Don't destroy here - let the collision handler do it
    }

    /**
     * Clear all bots
     */
    clearAllBots() {
        for (const bot of this.bots) {
            this.lastFiredTimes.delete(bot.playerId);
            bot.destroy();
        }
        this.bots = [];
    }

    /**
     * Get all active bots
     */
    getBots(): Bot[] {
        return this.bots.filter(bot => bot.active);
    }

    /**
     * Get bot count
     */
    getBotCount(): number {
        return this.bots.filter(bot => bot.active).length;
    }

    /**
     * Update screen size for all bots (call on resize)
     */
    updateScreenSize(width: number, height: number) {
        for (const bot of this.bots) {
            bot.updateScreenSize(width, height);
        }
    }

    /**
     * Check if a bullet belongs to any bot
     */
    isBotBullet(bullet: Bullet): boolean {
        return this.bots.some(bot => bot.playerId === bullet.ownerId);
    }

    /**
     * Clean up
     */
    destroy() {
        this.clearAllBots();
        this.lastFiredTimes.clear();
    }
}
