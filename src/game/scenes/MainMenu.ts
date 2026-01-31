import { GameObjects, Scene } from 'phaser';
import { EventBus } from '../EventBus';
import { SoundManager } from '../systems/SoundManager';
import { BotDifficulty } from '../ai/BotConfig';

export class MainMenu extends Scene {
    background: GameObjects.Image;
    titleText: GameObjects.Text;
    playButton: GameObjects.Text;
    subtitleText: GameObjects.Text;
    controlsText: GameObjects.Text;
    mobileText: GameObjects.Text;
    ships: GameObjects.Image[] = [];
    stars: GameObjects.Image[] = [];
    private soundManager!: SoundManager;

    // Difficulty selection
    private selectedDifficulty: BotDifficulty = 'medium';
    private difficultyLabel!: GameObjects.Text;
    private difficultyButtons: GameObjects.Text[] = [];
    private difficultyContainer!: GameObjects.Container;

    constructor() {
        super('MainMenu');
    }

    create() {
        const { width, height } = this.scale;

        // Initialize sound
        this.soundManager = new SoundManager(this);

        // Background - scale to cover entire screen
        this.background = this.add.image(width / 2, height / 2, 'background');
        this.background.setDisplaySize(Math.max(width, height) * 1.5, Math.max(width, height) * 1.5);

        // Listen for resize events
        this.scale.on('resize', this.handleResize, this);

        // Create floating stars in background
        this.createStarfield();

        // Title: TRINVADERS
        this.titleText = this.add.text(width / 2, 120, 'TRINVADERS', {
            fontFamily: 'Arial Black',
            fontSize: '72px',
            color: '#ffffff',
            stroke: '#00ffff',
            strokeThickness: 4,
            shadow: {
                offsetX: 4,
                offsetY: 4,
                color: '#000033',
                blur: 8,
                fill: true
            }
        }).setOrigin(0.5);

        // Animate title with subtle pulse
        this.tweens.add({
            targets: this.titleText,
            scaleX: 1.05,
            scaleY: 1.05,
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Subtitle
        this.subtitleText = this.add.text(width / 2, 190, 'MULTIPLAYER SPACE BATTLE', {
            fontFamily: 'Arial',
            fontSize: '20px',
            color: '#00ffff'
        }).setOrigin(0.5);

        // Display decorative ships
        this.createDecorativeShips();

        // Difficulty selector
        this.createDifficultySelector();

        // Play button
        this.playButton = this.add.text(width / 2, height / 2 + 100, '[ PLAY ]', {
            fontFamily: 'Arial Black',
            fontSize: '48px',
            color: '#ffffff',
            stroke: '#00ff00',
            strokeThickness: 2
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        // Button hover effects
        this.playButton.on('pointerover', () => {
            this.playButton.setStyle({ color: '#00ff00' });
            this.tweens.add({
                targets: this.playButton,
                scale: 1.1,
                duration: 100
            });
        });

        this.playButton.on('pointerout', () => {
            this.playButton.setStyle({ color: '#ffffff' });
            this.tweens.add({
                targets: this.playButton,
                scale: 1,
                duration: 100
            });
        });

        this.playButton.on('pointerdown', () => {
            this.startGame();
        });

        // Instructions
        this.controlsText = this.add.text(width / 2, height - 100, 'W/↑ thrust  •  S/↓ brake  •  A/D or ←/→ rotate  •  SPACE shoot', {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#888888'
        }).setOrigin(0.5);

        this.mobileText = this.add.text(width / 2, height - 70, 'Works on mobile with touch controls!', {
            fontFamily: 'Arial',
            fontSize: '14px',
            color: '#666666'
        }).setOrigin(0.5);

        // Keyboard shortcut to start
        this.input.keyboard?.once('keydown-SPACE', () => {
            this.startGame();
        });
        this.input.keyboard?.once('keydown-ENTER', () => {
            this.startGame();
        });

        EventBus.emit('current-scene-ready', this);
    }

    createStarfield() {
        const { width, height } = this.scale;

        for (let i = 0; i < 50; i++) {
            const x = Phaser.Math.Between(0, width);
            const y = Phaser.Math.Between(0, height);
            const star = this.add.image(x, y, 'star')
                .setScale(Phaser.Math.FloatBetween(0.1, 0.3))
                .setAlpha(Phaser.Math.FloatBetween(0.3, 0.8));

            // Twinkle animation
            this.tweens.add({
                targets: star,
                alpha: Phaser.Math.FloatBetween(0.2, 0.5),
                duration: Phaser.Math.Between(1000, 3000),
                yoyo: true,
                repeat: -1,
                ease: 'Sine.easeInOut'
            });

            this.stars.push(star);
        }
    }

    createDecorativeShips() {
        const { width, height } = this.scale;
        const shipTypes = ['ship_blue', 'ship_red', 'ship_green', 'ship_yellow'];

        // Left ship
        const leftShip = this.add.image(200, height / 2 - 50, shipTypes[0])
            .setScale(0.2)
            .setRotation(-0.3);

        this.tweens.add({
            targets: leftShip,
            y: leftShip.y + 30,
            rotation: leftShip.rotation + 0.1,
            duration: 3000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Right ship
        const rightShip = this.add.image(width - 200, height / 2 - 50, shipTypes[3])
            .setScale(0.2)
            .setRotation(0.3);

        this.tweens.add({
            targets: rightShip,
            y: rightShip.y + 30,
            rotation: rightShip.rotation - 0.1,
            duration: 2500,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        this.ships.push(leftShip, rightShip);
    }

    createDifficultySelector() {
        const { width, height } = this.scale;
        const centerY = height / 2;

        // Label
        this.difficultyLabel = this.add.text(width / 2, centerY - 10, 'DIFFICULTY', {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#888888'
        }).setOrigin(0.5);

        // Difficulty options
        const difficulties: { key: BotDifficulty; label: string; color: string }[] = [
            { key: 'easy', label: 'EASY', color: '#44ff44' },
            { key: 'medium', label: 'MEDIUM', color: '#ffff44' },
            { key: 'hard', label: 'HARD', color: '#ff4444' }
        ];

        const buttonSpacing = 120;
        const startX = width / 2 - buttonSpacing;

        difficulties.forEach((diff, index) => {
            const x = startX + index * buttonSpacing;
            const button = this.add.text(x, centerY + 25, diff.label, {
                fontFamily: 'Arial Black',
                fontSize: '20px',
                color: this.selectedDifficulty === diff.key ? diff.color : '#666666',
                stroke: this.selectedDifficulty === diff.key ? diff.color : '#333333',
                strokeThickness: this.selectedDifficulty === diff.key ? 2 : 1
            }).setOrigin(0.5).setInteractive({ useHandCursor: true });

            // Store reference to color for updates
            (button as any).diffKey = diff.key;
            (button as any).activeColor = diff.color;

            button.on('pointerover', () => {
                if (this.selectedDifficulty !== diff.key) {
                    button.setStyle({ color: '#aaaaaa' });
                }
            });

            button.on('pointerout', () => {
                if (this.selectedDifficulty !== diff.key) {
                    button.setStyle({ color: '#666666' });
                }
            });

            button.on('pointerdown', () => {
                this.soundManager.playClick();
                this.selectDifficulty(diff.key);
            });

            this.difficultyButtons.push(button);
        });
    }

    selectDifficulty(difficulty: BotDifficulty) {
        this.selectedDifficulty = difficulty;

        // Update button styles
        this.difficultyButtons.forEach((button) => {
            const diffKey = (button as any).diffKey as BotDifficulty;
            const activeColor = (button as any).activeColor as string;

            if (diffKey === difficulty) {
                button.setStyle({
                    color: activeColor,
                    stroke: activeColor,
                    strokeThickness: 2
                });
            } else {
                button.setStyle({
                    color: '#666666',
                    stroke: '#333333',
                    strokeThickness: 1
                });
            }
        });
    }

    startGame() {
        // Play click sound
        this.soundManager.playClick();

        // Fade out and start game with selected difficulty
        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.soundManager.destroy();
            this.scene.start('Game', { difficulty: this.selectedDifficulty });
        });
    }

    changeScene() {
        this.startGame();
    }

    handleResize(gameSize: Phaser.Structs.Size) {
        const width = gameSize.width;
        const height = gameSize.height;

        // Reposition background
        if (this.background) {
            this.background.setPosition(width / 2, height / 2);
            this.background.setDisplaySize(Math.max(width, height) * 1.5, Math.max(width, height) * 1.5);
        }

        // Reposition title and subtitle
        if (this.titleText) this.titleText.setPosition(width / 2, 120);
        if (this.subtitleText) this.subtitleText.setPosition(width / 2, 190);

        // Reposition play button
        if (this.playButton) this.playButton.setPosition(width / 2, height / 2 + 100);

        // Reposition instructions at bottom
        if (this.controlsText) this.controlsText.setPosition(width / 2, height - 100);
        if (this.mobileText) this.mobileText.setPosition(width / 2, height - 70);

        // Reposition decorative ships
        if (this.ships.length >= 2) {
            this.ships[0].setPosition(200, height / 2 - 50);
            this.ships[1].setPosition(width - 200, height / 2 - 50);
        }

        // Reposition difficulty selector
        const centerY = height / 2;
        if (this.difficultyLabel) this.difficultyLabel.setPosition(width / 2, centerY - 10);

        const buttonSpacing = 120;
        const startX = width / 2 - buttonSpacing;
        this.difficultyButtons.forEach((button, index) => {
            button.setPosition(startX + index * buttonSpacing, centerY + 25);
        });
    }
}
