import { Scene, Physics, GameObjects, Input } from 'phaser';
import { EventBus } from '../EventBus';
import { Player } from '../entities/Player';
import { Bullet } from '../entities/Bullet';
import { Bot } from '../entities/Bot';
import { SoundManager } from '../systems/SoundManager';
import { BotManager } from '../systems/BotManager';
import { BotDifficulty } from '../ai/BotConfig';

// Ship colors for multiplayer
const SHIP_COLORS = ['blue', 'red', 'green', 'yellow'];

export class Game extends Scene {
    // Core game objects
    private player!: Player;
    private otherPlayers: Map<string, Player> = new Map();
    private bullets!: Physics.Arcade.Group;
    private stars: GameObjects.Image[] = [];

    // Sound
    private soundManager!: SoundManager;

    // Bot system
    private botManager!: BotManager;

    // Input
    private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
    private wasd!: { W: Input.Keyboard.Key; A: Input.Keyboard.Key; S: Input.Keyboard.Key; D: Input.Keyboard.Key };
    private fireKey!: Input.Keyboard.Key;

    // Mobile controls
    private joystickBase?: GameObjects.Arc;
    private joystickThumb?: GameObjects.Arc;
    private joystickPointer?: Input.Pointer;
    private fireButton?: GameObjects.Arc;
    private isMobile: boolean = false;
    private joystickVector = { x: 0, y: 0 };

    // Game state
    private score: number = 0;
    private scoreText!: GameObjects.Text;
    private lastFired: number = 0;
    private fireRate: number = 200; // ms between shots

    // Ammo system
    private maxAmmo: number = 10;
    private currentAmmo: number = 10;
    private ammoRegenRate: number = 500; // ms per ammo regeneration
    private lastAmmoRegen: number = 0;

    // Health system
    private maxHealth: number = 100;
    private currentHealth: number = 100;
    private healthRegenRate: number = 2000; // ms per health point regeneration
    private lastHealthRegen: number = 0;
    private healthRegenAmount: number = 5; // health points per regen tick

    // UI bars
    private speedBarBg!: GameObjects.Rectangle;
    private speedBarFill!: GameObjects.Rectangle;
    private ammoBarBg!: GameObjects.Rectangle;
    private ammoBarFill!: GameObjects.Rectangle;
    private healthBarBg!: GameObjects.Rectangle;
    private healthBarFill!: GameObjects.Rectangle;
    private healthLabel!: GameObjects.Text;

    // For multiplayer (prepared for Socket.io integration)
    private playerId: string = 'local_' + Math.random().toString(36).substr(2, 9);
    private shipColor: string = SHIP_COLORS[Math.floor(Math.random() * SHIP_COLORS.length)];

    // Game difficulty (set from menu)
    private gameDifficulty: BotDifficulty = 'medium';

    // UI Labels (need references for repositioning)
    private speedLabel!: GameObjects.Text;
    private ammoLabel!: GameObjects.Text;
    private shipColorText!: GameObjects.Text;
    private fireButtonText?: GameObjects.Text;
    private quitButton!: GameObjects.Text;
    private escKey!: Phaser.Input.Keyboard.Key;

    constructor() {
        super('Game');
    }

    create(data: { difficulty?: BotDifficulty }) {
        const { width, height } = this.scale;

        // Get difficulty from menu (default to medium)
        this.gameDifficulty = data?.difficulty || 'medium';

        // Reset state
        this.score = 0;
        this.currentAmmo = this.maxAmmo;
        this.lastAmmoRegen = 0;
        this.currentHealth = this.maxHealth;
        this.lastHealthRegen = 0;

        // Initialize sound
        this.soundManager = new SoundManager(this);

        // Fade in
        this.cameras.main.fadeIn(500);

        // Background - scale to cover entire screen
        const bg = this.add.image(width / 2, height / 2, 'background');
        bg.setDisplaySize(Math.max(width, height) * 1.5, Math.max(width, height) * 1.5);

        // Create starfield
        this.createStarfield();

        // Listen for resize events
        this.scale.on('resize', this.handleResize, this);

        // Create groups
        this.bullets = this.physics.add.group({
            classType: Bullet,
            runChildUpdate: true
        });

        // Create local player
        this.createLocalPlayer();

        // Setup input
        this.setupInput();

        // Setup mobile controls if needed
        this.detectMobile();
        if (this.isMobile) {
            this.createMobileControls();
        }

        // UI
        this.createUI();

        // Initialize bot system
        this.initializeBotManager();

        EventBus.emit('current-scene-ready', this);
    }

    createStarfield() {
        const { width, height } = this.scale;

        for (let i = 0; i < 80; i++) {
            const x = Phaser.Math.Between(0, width);
            const y = Phaser.Math.Between(0, height);
            const star = this.add.image(x, y, 'star')
                .setScale(Phaser.Math.FloatBetween(0.05, 0.2))
                .setAlpha(Phaser.Math.FloatBetween(0.2, 0.6))
                .setDepth(-1);

            // Subtle twinkle
            this.tweens.add({
                targets: star,
                alpha: Phaser.Math.FloatBetween(0.1, 0.4),
                duration: Phaser.Math.Between(2000, 5000),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });

            this.stars.push(star);
        }
    }

    createLocalPlayer() {
        const { width, height } = this.scale;

        this.player = new Player(this, {
            x: width / 2,
            y: height / 2,
            texture: `ship_${this.shipColor}`,
            playerId: this.playerId,
            isLocal: true
        });

        // Make player visually distinct with a cyan glow effect
        this.player.setTint(0xffffff); // Bright white base
        this.player.postFX?.addGlow(0x00ffff, 4, 0, false, 0.1, 16); // Cyan glow outline
    }

    setupInput() {
        // Cursor keys
        this.cursors = this.input.keyboard!.createCursorKeys();

        // WASD
        this.wasd = {
            W: this.input.keyboard!.addKey(Input.Keyboard.KeyCodes.W),
            A: this.input.keyboard!.addKey(Input.Keyboard.KeyCodes.A),
            S: this.input.keyboard!.addKey(Input.Keyboard.KeyCodes.S),
            D: this.input.keyboard!.addKey(Input.Keyboard.KeyCodes.D)
        };

        // Fire key
        this.fireKey = this.input.keyboard!.addKey(Input.Keyboard.KeyCodes.SPACE);

        // ESC key to quit
        this.escKey = this.input.keyboard!.addKey(Input.Keyboard.KeyCodes.ESC);
        this.escKey.on('down', () => {
            this.quitToMenu();
        });
    }

    detectMobile() {
        this.isMobile = !this.sys.game.device.os.desktop;
    }

    createMobileControls() {
        const { width, height } = this.scale;

        // Virtual joystick (left side)
        const joystickX = 120;
        const joystickY = height - 120;
        const baseRadius = 60;
        const thumbRadius = 30;

        this.joystickBase = this.add.circle(joystickX, joystickY, baseRadius, 0x000000, 0.3)
            .setStrokeStyle(3, 0x00ffff, 0.5)
            .setDepth(100)
            .setScrollFactor(0);

        this.joystickThumb = this.add.circle(joystickX, joystickY, thumbRadius, 0x00ffff, 0.5)
            .setDepth(101)
            .setScrollFactor(0);

        // Fire button (right side)
        const fireX = width - 100;
        const fireY = height - 120;

        this.fireButton = this.add.circle(fireX, fireY, 50, 0xff0000, 0.4)
            .setStrokeStyle(3, 0xff0000, 0.8)
            .setDepth(100)
            .setScrollFactor(0)
            .setInteractive();

        this.fireButtonText = this.add.text(fireX, fireY, 'FIRE', {
            fontFamily: 'Arial Black',
            fontSize: '16px',
            color: '#ffffff'
        }).setOrigin(0.5).setDepth(102).setScrollFactor(0);

        // Joystick input handling
        this.input.on('pointerdown', (pointer: Input.Pointer) => {
            if (pointer.x < width / 2) {
                this.joystickPointer = pointer;
            }
        });

        this.input.on('pointermove', (pointer: Input.Pointer) => {
            if (this.joystickPointer && pointer.id === this.joystickPointer.id) {
                this.updateJoystick(pointer);
            }
        });

        this.input.on('pointerup', (pointer: Input.Pointer) => {
            if (this.joystickPointer && pointer.id === this.joystickPointer.id) {
                this.resetJoystick();
            }
        });
    }

    updateJoystick(pointer: Input.Pointer) {
        if (!this.joystickBase || !this.joystickThumb) return;

        const baseX = this.joystickBase.x;
        const baseY = this.joystickBase.y;
        const maxDistance = 50;

        let dx = pointer.x - baseX;
        let dy = pointer.y - baseY;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > maxDistance) {
            dx = (dx / distance) * maxDistance;
            dy = (dy / distance) * maxDistance;
        }

        this.joystickThumb.x = baseX + dx;
        this.joystickThumb.y = baseY + dy;

        // Normalize joystick vector
        this.joystickVector.x = dx / maxDistance;
        this.joystickVector.y = dy / maxDistance;
    }

    resetJoystick() {
        this.joystickPointer = undefined;
        this.joystickVector = { x: 0, y: 0 };

        if (this.joystickBase && this.joystickThumb) {
            this.joystickThumb.x = this.joystickBase.x;
            this.joystickThumb.y = this.joystickBase.y;
        }
    }

    createUI() {
        const { height } = this.scale;

        // Score display
        this.scoreText = this.add.text(20, 20, 'SCORE: 0', {
            fontFamily: 'Arial Black',
            fontSize: '24px',
            color: '#00ffff',
            stroke: '#000000',
            strokeThickness: 2
        }).setDepth(100).setScrollFactor(0);

        // Ship color indicator
        this.shipColorText = this.add.text(20, 55, `SHIP: ${this.shipColor.toUpperCase()}`, {
            fontFamily: 'Arial',
            fontSize: '14px',
            color: '#888888'
        }).setDepth(100).setScrollFactor(0);

        // Speed bar (bottom left)
        const barWidth = 120;
        const barHeight = 12;
        const barX = 20;
        const barY = height - 60;

        this.speedLabel = this.add.text(barX, barY - 18, 'SPEED', {
            fontFamily: 'Arial',
            fontSize: '12px',
            color: '#00ffff'
        }).setDepth(100).setScrollFactor(0);

        this.speedBarBg = this.add.rectangle(barX, barY, barWidth, barHeight, 0x333333)
            .setOrigin(0, 0)
            .setStrokeStyle(1, 0x00ffff)
            .setDepth(100)
            .setScrollFactor(0);

        this.speedBarFill = this.add.rectangle(barX + 2, barY + 2, 0, barHeight - 4, 0x00ffff)
            .setOrigin(0, 0)
            .setDepth(101)
            .setScrollFactor(0);

        // Ammo bar (bottom left, below speed)
        const ammoBarY = barY + 35;

        this.ammoLabel = this.add.text(barX, ammoBarY - 18, 'AMMO', {
            fontFamily: 'Arial',
            fontSize: '12px',
            color: '#ffaa00'
        }).setDepth(100).setScrollFactor(0);

        this.ammoBarBg = this.add.rectangle(barX, ammoBarY, barWidth, barHeight, 0x333333)
            .setOrigin(0, 0)
            .setStrokeStyle(1, 0xffaa00)
            .setDepth(100)
            .setScrollFactor(0);

        this.ammoBarFill = this.add.rectangle(barX + 2, ammoBarY + 2, barWidth - 4, barHeight - 4, 0xffaa00)
            .setOrigin(0, 0)
            .setDepth(101)
            .setScrollFactor(0);

        // Health bar (top right)
        const { width } = this.scale;
        const healthBarWidth = 150;
        const healthBarHeight = 16;
        const healthBarX = width - healthBarWidth - 20;
        const healthBarY = 20;

        this.healthLabel = this.add.text(healthBarX, healthBarY - 18, 'HEALTH', {
            fontFamily: 'Arial',
            fontSize: '12px',
            color: '#ff4444'
        }).setDepth(100).setScrollFactor(0);

        this.healthBarBg = this.add.rectangle(healthBarX, healthBarY, healthBarWidth, healthBarHeight, 0x333333)
            .setOrigin(0, 0)
            .setStrokeStyle(2, 0xff4444)
            .setDepth(100)
            .setScrollFactor(0);

        this.healthBarFill = this.add.rectangle(healthBarX + 2, healthBarY + 2, healthBarWidth - 4, healthBarHeight - 4, 0xff4444)
            .setOrigin(0, 0)
            .setDepth(101)
            .setScrollFactor(0);

        // Quit button (top right corner, below health bar)
        this.quitButton = this.add.text(width - 20, 60, '[ESC] QUIT', {
            fontFamily: 'Arial',
            fontSize: '14px',
            color: '#666666'
        }).setOrigin(1, 0).setDepth(100).setScrollFactor(0).setInteractive({ useHandCursor: true });

        this.quitButton.on('pointerover', () => {
            this.quitButton.setStyle({ color: '#ff4444' });
        });

        this.quitButton.on('pointerout', () => {
            this.quitButton.setStyle({ color: '#666666' });
        });

        this.quitButton.on('pointerdown', () => {
            this.quitToMenu();
        });
    }

    initializeBotManager() {
        // Create bot manager
        this.botManager = new BotManager(this, this.player, this.bullets);

        // Set up bot fire callback (play sound and tint bullet red)
        this.botManager.setOnBotFire((bot, bullet) => {
            this.soundManager.playShoot();
            bullet.setTint(0xff4444); // Red tint for bot bullets
        });

        // Set up collisions
        this.setupBotCollisions();

        // Spawn initial bots (one of each difficulty)
        this.spawnInitialBots();
    }

    setupBotCollisions() {
        // Player bullets hitting bots
        this.physics.add.overlap(
            this.bullets,
            this.botManager.getBotGroup(),
            (bulletObj, botObj) => {
                const bullet = bulletObj as Bullet;
                const bot = botObj as Bot;

                // Only player bullets damage bots
                if (bullet.ownerId === this.playerId && bullet.active && bot.active) {
                    this.bulletHitBot(bullet, bot);
                }
            },
            undefined,
            this
        );
    }

    bulletHitBot(bullet: Bullet, bot: Bot) {
        // Destroy bullet
        bullet.destroy();

        // Deal damage to bot
        const damage = 20;
        const destroyed = bot.takeDamage(damage);

        // Play hit sound
        this.soundManager.playHit();

        if (destroyed) {
            // Remove bot from manager
            this.botManager.removeBotByReference(bot);

            // Play explosion sound
            this.soundManager.playExplosion();

            // Add score based on difficulty
            let points = 100;
            switch (bot.difficulty) {
                case 'easy': points = 50; break;
                case 'medium': points = 100; break;
                case 'hard': points = 200; break;
            }
            this.addScore(points);

            // Destroy bot
            bot.destroy();

            // Respawn a new bot after delay (same difficulty as game setting)
            this.time.delayedCall(2000, () => {
                if (this.player && this.player.active) {
                    this.botManager.spawnBotRandom(this.gameDifficulty, 250);
                    // Re-setup collisions for new bots
                    this.refreshBotCollisions();
                }
            });
        }
    }

    bulletHitPlayer(bullet: Bullet) {
        // Destroy bullet
        bullet.destroy();

        // Calculate damage based on bot difficulty (if we can determine it)
        const damage = 20; // Base damage per hit

        // Reduce health
        this.currentHealth -= damage;

        // Play hit sound
        this.soundManager.playHit();

        // Flash player red to indicate damage
        this.player.setTint(0xff0000);
        this.time.delayedCall(100, () => {
            if (this.player && this.player.active) {
                this.player.setTint(0xffffff); // Restore white tint (glow is separate)
            }
        });

        // Check for death
        if (this.currentHealth <= 0) {
            this.currentHealth = 0;
            this.soundManager.playDeath();
            this.gameOver();
        }
    }

    checkBotBulletsHitPlayer() {
        if (!this.player || !this.player.active) return;

        const playerBody = this.player.body as Physics.Arcade.Body;
        const playerRadius = 20; // Approximate collision radius

        this.bullets.getChildren().forEach((obj) => {
            const bullet = obj as Bullet;
            if (!bullet.active) return;

            // Check if this is a bot bullet
            if (!this.botManager.isBotBullet(bullet)) return;

            // Simple distance check for collision
            const dx = bullet.x - this.player.x;
            const dy = bullet.y - this.player.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < playerRadius + 10) {
                this.bulletHitPlayer(bullet);
            }
        });
    }

    refreshBotCollisions() {
        // No longer needed - physics group handles new bots automatically
    }

    spawnInitialBots() {
        // Number of bots based on difficulty
        let botCount = 2;
        switch (this.gameDifficulty) {
            case 'easy': botCount = 1; break;
            case 'medium': botCount = 2; break;
            case 'hard': botCount = 3; break;
        }

        for (let i = 0; i < botCount; i++) {
            this.botManager.spawnBotRandom(this.gameDifficulty, 250);
        }
    }

    update(time: number, delta: number) {
        if (!this.player || !this.player.active) return;

        // Handle input
        this.handleInput(time, delta);

        // Screen wrap player
        this.player.wrapBounds(this.scale.width, this.scale.height);

        // Wrap bullets
        this.bullets.getChildren().forEach((bullet) => {
            if (bullet.active) {
                (bullet as Bullet).wrapBounds(this.scale.width, this.scale.height);
            }
        });

        // Update bots
        if (this.botManager) {
            this.botManager.update(time, delta);

            // Check for bot bullets hitting player
            this.checkBotBulletsHitPlayer();
        }

        // Update speed bar
        this.updateSpeedBar();

        // Regenerate ammo over time
        this.updateAmmo(time);

        // Regenerate health over time
        this.updateHealth(time);
    }

    updateSpeedBar() {
        const body = this.player.body as Physics.Arcade.Body;
        const speed = Math.sqrt(body.velocity.x ** 2 + body.velocity.y ** 2);
        const maxSpeed = this.player.maxSpeed;
        const speedPercent = Math.min(speed / maxSpeed, 1);

        // Update fill width (bar is 120px wide, with 2px padding on each side = 116px max fill)
        const maxFillWidth = 116;
        this.speedBarFill.width = maxFillWidth * speedPercent;

        // Change color based on speed
        if (speedPercent > 0.8) {
            this.speedBarFill.setFillStyle(0xff4444); // Red when fast
        } else if (speedPercent > 0.5) {
            this.speedBarFill.setFillStyle(0xffff00); // Yellow when medium
        } else {
            this.speedBarFill.setFillStyle(0x00ffff); // Cyan when slow
        }
    }

    updateAmmo(time: number) {
        // Regenerate ammo over time
        if (this.currentAmmo < this.maxAmmo) {
            if (time - this.lastAmmoRegen > this.ammoRegenRate) {
                this.currentAmmo++;
                this.lastAmmoRegen = time;
            }
        }

        // Update ammo bar fill
        const ammoPercent = this.currentAmmo / this.maxAmmo;
        const maxFillWidth = 116;
        this.ammoBarFill.width = maxFillWidth * ammoPercent;

        // Change color based on ammo level
        if (ammoPercent <= 0.2) {
            this.ammoBarFill.setFillStyle(0xff4444); // Red when low
        } else if (ammoPercent <= 0.5) {
            this.ammoBarFill.setFillStyle(0xffff00); // Yellow when medium
        } else {
            this.ammoBarFill.setFillStyle(0xffaa00); // Orange when good
        }
    }

    updateHealth(time: number) {
        // Regenerate health over time (slowly)
        if (this.currentHealth < this.maxHealth) {
            if (time - this.lastHealthRegen > this.healthRegenRate) {
                this.currentHealth = Math.min(this.currentHealth + this.healthRegenAmount, this.maxHealth);
                this.lastHealthRegen = time;
            }
        }

        // Update health bar fill
        const healthPercent = this.currentHealth / this.maxHealth;
        const maxFillWidth = 146; // 150 - 4 padding
        this.healthBarFill.width = maxFillWidth * healthPercent;

        // Change color based on health level
        if (healthPercent <= 0.25) {
            this.healthBarFill.setFillStyle(0xff0000); // Bright red when critical
        } else if (healthPercent <= 0.5) {
            this.healthBarFill.setFillStyle(0xff4444); // Red when low
        } else if (healthPercent <= 0.75) {
            this.healthBarFill.setFillStyle(0xffff00); // Yellow when medium
        } else {
            this.healthBarFill.setFillStyle(0x44ff44); // Green when good
        }
    }

    handleInput(time: number, delta: number) {
        let rotating = false;
        let thrusting = false;
        let braking = false;
        let firing = false;

        // Keyboard: Rotation
        if (this.cursors.left.isDown || this.wasd.A.isDown) {
            this.player.rotateLeft(delta);
            rotating = true;
        } else if (this.cursors.right.isDown || this.wasd.D.isDown) {
            this.player.rotateRight(delta);
            rotating = true;
        }

        // Keyboard: Thrust
        if (this.cursors.up.isDown || this.wasd.W.isDown) {
            this.player.thrust(delta);
            thrusting = true;
        }

        // Keyboard: Brake / Reverse
        if (this.cursors.down.isDown || this.wasd.S.isDown) {
            this.player.brake(delta);
            braking = true;
        }

        // Keyboard: Fire
        if (this.fireKey.isDown) {
            firing = true;
        }

        // Mobile joystick
        if (this.isMobile && this.joystickVector) {
            const magnitude = Math.sqrt(
                this.joystickVector.x * this.joystickVector.x +
                this.joystickVector.y * this.joystickVector.y
            );

            if (magnitude > 0.2) {
                // Calculate target angle from joystick direction
                const targetAngle = Phaser.Math.RadToDeg(
                    Math.atan2(this.joystickVector.y, this.joystickVector.x)
                );

                // Smoothly rotate towards target
                const currentAngle = this.player.angle;
                let angleDiff = targetAngle - currentAngle;

                // Normalize angle difference
                while (angleDiff > 180) angleDiff -= 360;
                while (angleDiff < -180) angleDiff += 360;

                if (Math.abs(angleDiff) > 5) {
                    if (angleDiff > 0) {
                        this.player.rotateRight(delta);
                    } else {
                        this.player.rotateLeft(delta);
                    }
                    rotating = true;
                }

                // Thrust if joystick pushed far enough
                if (magnitude > 0.5) {
                    this.player.thrust(delta);
                    thrusting = true;
                }
            }
        }

        // Mobile fire button
        if (this.fireButton?.active) {
            const pointer = this.input.activePointer;
            if (pointer.isDown) {
                const dx = pointer.x - this.fireButton.x;
                const dy = pointer.y - this.fireButton.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 60) {
                    firing = true;
                }
            }
        }

        // Stop rotation/thrust if not active
        if (!rotating) {
            this.player.stopRotation();
        }
        if (!thrusting && !braking) {
            this.player.stopThrust();
        }

        // Handle firing (check ammo too)
        if (firing && time > this.lastFired + this.fireRate && this.currentAmmo > 0) {
            this.fire();
            this.lastFired = time;
        }
    }

    fire() {
        // Consume ammo
        this.currentAmmo--;

        const spawnPoint = this.player.getBulletSpawnPoint();

        const bullet = new Bullet(this, {
            x: spawnPoint.x,
            y: spawnPoint.y,
            angle: spawnPoint.angle,
            ownerId: this.playerId,
            texture: 'bullet_basic'
        });

        this.bullets.add(bullet);
        bullet.launch(); // Set velocity after adding to group

        // Tint player bullets cyan
        bullet.setTint(0x00ffff);

        // Play shoot sound
        this.soundManager.playShoot();
    }

    // Multiplayer methods (ready for Socket.io integration)
    addOtherPlayer(playerInfo: { playerId: string; x: number; y: number; rotation: number; color: string }) {
        const otherPlayer = new Player(this, {
            x: playerInfo.x,
            y: playerInfo.y,
            texture: `ship_${playerInfo.color}`,
            playerId: playerInfo.playerId,
            isLocal: false
        });

        // Tint other players slightly to distinguish
        otherPlayer.setTint(0xcccccc);

        this.otherPlayers.set(playerInfo.playerId, otherPlayer);
    }

    removeOtherPlayer(playerId: string) {
        const otherPlayer = this.otherPlayers.get(playerId);
        if (otherPlayer) {
            otherPlayer.destroy();
            this.otherPlayers.delete(playerId);
        }
    }

    updateOtherPlayerPosition(playerId: string, data: { x: number; y: number; rotation: number }) {
        const otherPlayer = this.otherPlayers.get(playerId);
        if (otherPlayer) {
            otherPlayer.updateFromNetwork(data);
        }
    }

    addScore(points: number) {
        this.score += points;
        this.scoreText.setText(`SCORE: ${this.score}`);

        // Score popup effect
        const popup = this.add.text(
            this.player.x,
            this.player.y - 50,
            `+${points}`,
            {
                fontFamily: 'Arial Black',
                fontSize: '20px',
                color: '#00ff00'
            }
        ).setOrigin(0.5);

        this.tweens.add({
            targets: popup,
            y: popup.y - 30,
            alpha: 0,
            duration: 800,
            onComplete: () => popup.destroy()
        });
    }

    gameOver() {
        // Play game over sound
        this.soundManager.playGameOver();

        // Clean up bot manager
        if (this.botManager) {
            this.botManager.clearAllBots();
        }

        // Clean up sound manager
        this.time.delayedCall(1000, () => {
            this.soundManager.destroy();
            if (this.botManager) {
                this.botManager.destroy();
            }
            this.scene.start('GameOver', { score: this.score });
        });
    }

    changeScene() {
        this.gameOver();
    }

    quitToMenu() {
        // Clean up
        if (this.botManager) {
            this.botManager.clearAllBots();
            this.botManager.destroy();
        }
        this.soundManager.destroy();

        // Fade out and return to menu
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('MainMenu');
        });
    }

    handleResize(gameSize: Phaser.Structs.Size) {
        const width = gameSize.width;
        const height = gameSize.height;

        // Reposition UI bars (bottom left)
        const barX = 20;
        const barY = height - 60;
        const ammoBarY = barY + 35;

        if (this.speedLabel) this.speedLabel.setPosition(barX, barY - 18);
        if (this.speedBarBg) this.speedBarBg.setPosition(barX, barY);
        if (this.speedBarFill) this.speedBarFill.setPosition(barX + 2, barY + 2);

        if (this.ammoLabel) this.ammoLabel.setPosition(barX, ammoBarY - 18);
        if (this.ammoBarBg) this.ammoBarBg.setPosition(barX, ammoBarY);
        if (this.ammoBarFill) this.ammoBarFill.setPosition(barX + 2, ammoBarY + 2);

        // Reposition health bar (top right)
        const healthBarWidth = 150;
        const healthBarX = width - healthBarWidth - 20;
        const healthBarY = 20;
        if (this.healthLabel) this.healthLabel.setPosition(healthBarX, healthBarY - 18);
        if (this.healthBarBg) this.healthBarBg.setPosition(healthBarX, healthBarY);
        if (this.healthBarFill) this.healthBarFill.setPosition(healthBarX + 2, healthBarY + 2);

        // Reposition quit button
        if (this.quitButton) this.quitButton.setPosition(width - 20, 60);

        // Reposition mobile controls if present
        if (this.isMobile) {
            const joystickX = 120;
            const joystickY = height - 120;
            const fireX = width - 100;
            const fireY = height - 120;

            if (this.joystickBase) this.joystickBase.setPosition(joystickX, joystickY);
            if (this.joystickThumb) this.joystickThumb.setPosition(joystickX, joystickY);
            if (this.fireButton) this.fireButton.setPosition(fireX, fireY);
            if (this.fireButtonText) this.fireButtonText.setPosition(fireX, fireY);
        }

        // Update bot manager screen size
        if (this.botManager) {
            this.botManager.updateScreenSize(width, height);
        }
    }
}
