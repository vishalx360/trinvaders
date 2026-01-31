/**
 * Bot entity - NPC that extends Player with AI behavior
 */

import { Scene, Physics, GameObjects } from 'phaser';
import { Player, PlayerConfig } from './Player';
import { Bullet } from './Bullet';
import { BotAI, BotAction } from '../ai/BotAI';
import { BotDifficulty, BotDifficultyConfig, BOT_CONFIGS } from '../ai/BotConfig';

export interface BotConfig extends Omit<PlayerConfig, 'isLocal'> {
    difficulty: BotDifficulty;
}

export class Bot extends Player {
    readonly difficulty: BotDifficulty;
    readonly difficultyConfig: BotDifficultyConfig;
    private ai: BotAI;

    // Target player reference
    private target: Player | null = null;

    // Bullet getter function (to avoid circular dependency)
    private getBullets: (() => Bullet[]) | null = null;

    // Bot's own bullets (to exclude from dodge calculations)
    private ownBulletIds: Set<string> = new Set();

    // Health system
    maxHealth: number;
    currentHealth: number;
    private healthBarBg: GameObjects.Rectangle;
    private healthBarFill: GameObjects.Rectangle;

    constructor(scene: Scene, config: BotConfig) {
        super(scene, {
            ...config,
            isLocal: false, // Bots are never local players
        });

        this.difficulty = config.difficulty;
        this.difficultyConfig = BOT_CONFIGS[config.difficulty];

        // Explicitly enforce same speed limits as player
        const body = this.body as Physics.Arcade.Body;
        body.setMaxVelocity(400); // Same as Player.maxSpeed
        body.setDrag(50); // Same as Player.drag
        this.thrustPower = 300; // Same as Player.thrustPower
        this.maxSpeed = 400; // Same as Player.maxSpeed

        // Create AI controller
        const { width, height } = scene.scale;
        this.ai = new BotAI(this.difficultyConfig, width, height);

        // Visual indicator of difficulty
        this.setTintByDifficulty();

        // Initialize health based on difficulty
        switch (this.difficulty) {
            case 'easy': this.maxHealth = 40; break;
            case 'medium': this.maxHealth = 60; break;
            case 'hard': this.maxHealth = 80; break;
        }
        this.currentHealth = this.maxHealth;

        // Create health bar
        const barWidth = 40;
        const barHeight = 5;
        this.healthBarBg = scene.add.rectangle(0, 0, barWidth, barHeight, 0x333333)
            .setOrigin(0.5)
            .setDepth(10);
        this.healthBarFill = scene.add.rectangle(0, 0, barWidth - 2, barHeight - 2, 0xff4444)
            .setOrigin(0.5)
            .setDepth(11);
    }

    private setTintByDifficulty() {
        switch (this.difficulty) {
            case 'easy':
                this.setTint(0x88ff88); // Light green
                break;
            case 'medium':
                this.setTint(0xffff88); // Light yellow
                break;
            case 'hard':
                this.setTint(0xff8888); // Light red
                break;
        }
    }

    /**
     * Set the target player for the bot to hunt
     */
    setTarget(player: Player | null) {
        this.target = player;
    }

    /**
     * Set the bullet getter function for dodge calculations
     */
    setBulletGetter(getter: () => Bullet[]) {
        this.getBullets = getter;
    }

    /**
     * Register a bullet as belonging to this bot (won't dodge own bullets)
     */
    registerOwnBullet(bulletId: string) {
        this.ownBulletIds.add(bulletId);
    }

    /**
     * Main AI update method - call from game update loop
     */
    updateAI(time: number, delta: number): BotAction {
        if (!this.active) {
            return { thrust: false, rotateLeft: false, rotateRight: false, fire: false };
        }

        // Get bot state
        const body = this.body as Physics.Arcade.Body;
        const botInfo = {
            x: this.x,
            y: this.y,
            angle: this.angle,
            velocityX: body.velocity.x,
            velocityY: body.velocity.y,
        };

        // Get target info
        let targetInfo = null;
        if (this.target && this.target.active) {
            const targetBody = this.target.body as Physics.Arcade.Body;
            targetInfo = {
                x: this.target.x,
                y: this.target.y,
                velocityX: targetBody.velocity.x,
                velocityY: targetBody.velocity.y,
            };
        }

        // Get bullets to dodge (exclude own bullets)
        const bullets: Bullet[] = [];
        if (this.getBullets) {
            const allBullets = this.getBullets();
            for (const bullet of allBullets) {
                if (bullet.active && bullet.ownerId !== this.playerId) {
                    bullets.push(bullet);
                }
            }
        }

        // Run AI update
        const action = this.ai.update(botInfo, targetInfo, bullets, time);

        // Execute the action
        this.executeAction(action, delta);

        // Clamp velocity to ensure bot never exceeds player speed
        const currentSpeed = Math.sqrt(body.velocity.x ** 2 + body.velocity.y ** 2);
        if (currentSpeed > 400) {
            const scale = 400 / currentSpeed;
            body.setVelocity(body.velocity.x * scale, body.velocity.y * scale);
        }

        // Update health bar position
        this.updateHealthBar();

        return action;
    }

    /**
     * Update health bar position to follow the bot
     */
    private updateHealthBar() {
        if (!this.healthBarBg || !this.healthBarFill) return;

        const offsetY = -35; // Above the ship
        this.healthBarBg.setPosition(this.x, this.y + offsetY);
        this.healthBarFill.setPosition(this.x, this.y + offsetY);

        // Update fill width based on health
        const healthPercent = this.currentHealth / this.maxHealth;
        const maxWidth = 38;
        this.healthBarFill.width = maxWidth * healthPercent;

        // Change color based on health
        if (healthPercent <= 0.25) {
            this.healthBarFill.setFillStyle(0xff0000); // Bright red
        } else if (healthPercent <= 0.5) {
            this.healthBarFill.setFillStyle(0xff4444); // Red
        } else if (healthPercent <= 0.75) {
            this.healthBarFill.setFillStyle(0xffff44); // Yellow
        } else {
            this.healthBarFill.setFillStyle(0x44ff44); // Green
        }
    }

    /**
     * Take damage and return true if bot is destroyed
     */
    takeDamage(amount: number): boolean {
        this.currentHealth -= amount;

        // Flash white to indicate hit
        this.setTint(0xffffff);
        this.scene.time.delayedCall(50, () => {
            if (this.active) {
                this.setTintByDifficulty();
            }
        });

        if (this.currentHealth <= 0) {
            this.currentHealth = 0;
            return true; // Bot destroyed
        }
        return false;
    }

    private executeAction(action: BotAction, delta: number) {
        // Handle rotation
        if (action.rotateLeft) {
            this.rotateLeft(delta);
        } else if (action.rotateRight) {
            this.rotateRight(delta);
        } else {
            this.stopRotation();
        }

        // Handle thrust - bots use same drag mechanics as player
        if (action.thrust) {
            this.thrust(delta);
        } else {
            this.stopThrust(); // This now applies higher drag for faster slowdown
        }

        // Fire is handled by BotManager to control fire rate
    }

    /**
     * Get aim variance for shooting
     */
    getAimVariance(): number {
        return this.ai.getAimVariance();
    }

    /**
     * Update screen dimensions (call on resize)
     */
    updateScreenSize(width: number, height: number) {
        this.ai.updateScreenSize(width, height);
    }

    /**
     * Clean up
     */
    destroy(fromScene?: boolean) {
        this.target = null;
        this.getBullets = null;
        this.ownBulletIds.clear();

        // Destroy health bar
        if (this.healthBarBg) {
            this.healthBarBg.destroy();
        }
        if (this.healthBarFill) {
            this.healthBarFill.destroy();
        }

        super.destroy(fromScene);
    }
}
