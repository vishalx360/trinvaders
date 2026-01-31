import { Scene, GameObjects } from 'phaser';
import { EventBus } from '../EventBus';

export class GameOver extends Scene {
    private background!: GameObjects.Image;
    private score: number = 0;
    private isMultiplayer: boolean = false;
    private won: boolean = false;
    private gameOverText!: GameObjects.Text;
    private scoreText!: GameObjects.Text;
    private resultText!: GameObjects.Text;
    private restartButton!: GameObjects.Text;
    private menuButton!: GameObjects.Text;

    constructor() {
        super('GameOver');
    }

    init(data: { score?: number; isMultiplayer?: boolean; won?: boolean }) {
        this.score = data.score || 0;
        this.isMultiplayer = data.isMultiplayer || false;
        this.won = data.won || false;
    }

    create() {
        const { width, height } = this.scale;

        // Fade in
        this.cameras.main.fadeIn(300);

        // Dark background overlay - scale to cover entire screen
        this.background = this.add.image(width / 2, height / 2, 'background');
        this.background.setDisplaySize(Math.max(width, height) * 1.5, Math.max(width, height) * 1.5);
        this.background.setTint(0x330000);

        // Create some floating debris (stars)
        this.createDebris();

        // Listen for resize events
        this.scale.on('resize', this.handleResize, this);

        // Game Over text - different for multiplayer
        const titleText = this.isMultiplayer ? (this.won ? 'VICTORY!' : 'DEFEAT') : 'GAME OVER';
        const titleColor = this.isMultiplayer ? (this.won ? '#00ff00' : '#ff0000') : '#ff0000';
        const bgTint = this.isMultiplayer ? (this.won ? 0x003300 : 0x330000) : 0x330000;

        this.background.setTint(bgTint);

        this.gameOverText = this.add.text(width / 2, height / 2 - 120, titleText, {
            fontFamily: 'Arial Black',
            fontSize: '64px',
            color: titleColor,
            stroke: '#000000',
            strokeThickness: 6,
            shadow: {
                offsetX: 4,
                offsetY: 4,
                color: '#000000',
                blur: 8,
                fill: true
            }
        }).setOrigin(0.5);

        // Pulse animation
        this.tweens.add({
            targets: this.gameOverText,
            scaleX: 1.05,
            scaleY: 1.05,
            duration: 1000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });

        // Multiplayer result text
        if (this.isMultiplayer) {
            const resultMessage = this.won ? 'You destroyed your opponent!' : 'Your ship was destroyed!';
            this.resultText = this.add.text(width / 2, height / 2 - 50, resultMessage, {
                fontFamily: 'Arial',
                fontSize: '24px',
                color: '#cccccc'
            }).setOrigin(0.5);
        }

        // Score display
        this.scoreText = this.add.text(width / 2, height / 2, `FINAL SCORE: ${this.score}`, {
            fontFamily: 'Arial Black',
            fontSize: '32px',
            color: '#ffffff',
            stroke: '#000000',
            strokeThickness: 4
        }).setOrigin(0.5);

        // Restart button
        this.restartButton = this.add.text(width / 2, height / 2 + 100, '[ PLAY AGAIN ]', {
            fontFamily: 'Arial Black',
            fontSize: '36px',
            color: '#ffffff',
            stroke: '#00ff00',
            strokeThickness: 2
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        this.restartButton.on('pointerover', () => {
            this.restartButton.setStyle({ color: '#00ff00' });
            this.tweens.add({
                targets: this.restartButton,
                scale: 1.1,
                duration: 100
            });
        });

        this.restartButton.on('pointerout', () => {
            this.restartButton.setStyle({ color: '#ffffff' });
            this.tweens.add({
                targets: this.restartButton,
                scale: 1,
                duration: 100
            });
        });

        this.restartButton.on('pointerdown', () => {
            this.restartGame();
        });

        // Menu button
        this.menuButton = this.add.text(width / 2, height / 2 + 160, '[ MAIN MENU ]', {
            fontFamily: 'Arial Black',
            fontSize: '24px',
            color: '#888888'
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        this.menuButton.on('pointerover', () => {
            this.menuButton.setStyle({ color: '#00ffff' });
        });

        this.menuButton.on('pointerout', () => {
            this.menuButton.setStyle({ color: '#888888' });
        });

        this.menuButton.on('pointerdown', () => {
            this.goToMenu();
        });

        // Keyboard shortcuts
        this.input.keyboard?.once('keydown-SPACE', () => {
            this.restartGame();
        });
        this.input.keyboard?.once('keydown-ENTER', () => {
            this.restartGame();
        });
        this.input.keyboard?.once('keydown-ESC', () => {
            this.goToMenu();
        });

        EventBus.emit('current-scene-ready', this);
    }

    createDebris() {
        const { width, height } = this.scale;

        for (let i = 0; i < 30; i++) {
            const x = Phaser.Math.Between(0, width);
            const y = Phaser.Math.Between(0, height);
            const star = this.add.image(x, y, 'star')
                .setScale(Phaser.Math.FloatBetween(0.1, 0.3))
                .setAlpha(Phaser.Math.FloatBetween(0.2, 0.5))
                .setTint(0xff6666);

            // Slow drift animation
            this.tweens.add({
                targets: star,
                y: star.y + Phaser.Math.Between(20, 50),
                alpha: 0,
                duration: Phaser.Math.Between(3000, 6000),
                repeat: -1,
                ease: 'Linear'
            });
        }
    }

    restartGame() {
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            // Go to lobby for multiplayer, directly to game for single player
            if (this.isMultiplayer) {
                this.scene.start('Lobby');
            } else {
                this.scene.start('Game');
            }
        });
    }

    goToMenu() {
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('MainMenu');
        });
    }

    changeScene() {
        this.restartGame();
    }

    handleResize(gameSize: Phaser.Structs.Size) {
        const width = gameSize.width;
        const height = gameSize.height;

        // Reposition background
        if (this.background) {
            this.background.setPosition(width / 2, height / 2);
            this.background.setDisplaySize(Math.max(width, height) * 1.5, Math.max(width, height) * 1.5);
        }

        // Reposition UI elements
        if (this.gameOverText) this.gameOverText.setPosition(width / 2, height / 2 - 120);
        if (this.resultText) this.resultText.setPosition(width / 2, height / 2 - 50);
        if (this.scoreText) this.scoreText.setPosition(width / 2, height / 2);
        if (this.restartButton) this.restartButton.setPosition(width / 2, height / 2 + 100);
        if (this.menuButton) this.menuButton.setPosition(width / 2, height / 2 + 160);
    }
}
