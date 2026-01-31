import { GameObjects, Scene } from 'phaser';
import { EventBus } from '../EventBus';
import { NetworkManager } from '../network/NetworkManager';
import { SoundManager } from '../systems/SoundManager';

export class Lobby extends Scene {
    private background!: GameObjects.Image;
    private titleText!: GameObjects.Text;
    private statusText!: GameObjects.Text;
    private roomCodeText!: GameObjects.Text;
    private instructionText!: GameObjects.Text;
    private errorText!: GameObjects.Text;
    private backButton!: GameObjects.Text;
    private readyButton!: GameObjects.Text;

    private createRoomButton!: GameObjects.Text;
    private joinRoomButton!: GameObjects.Text;
    private roomCodeInput!: string;
    private inputText!: GameObjects.Text;
    private inputCursor!: GameObjects.Text;
    private inputBackground!: GameObjects.Rectangle;

    private networkManager!: NetworkManager;
    private soundManager!: SoundManager;
    private isInRoom: boolean = false;
    private isReady: boolean = false;
    private peerReady: boolean = false;
    private stars: GameObjects.Image[] = [];

    constructor() {
        super('Lobby');
    }

    create() {
        const { width, height } = this.scale;

        this.soundManager = new SoundManager(this);
        this.networkManager = new NetworkManager();
        this.roomCodeInput = '';

        // Background
        this.background = this.add.image(width / 2, height / 2, 'background');
        this.background.setDisplaySize(Math.max(width, height) * 1.5, Math.max(width, height) * 1.5);

        // Create starfield
        this.createStarfield();

        // Title
        this.titleText = this.add.text(width / 2, 80, 'MULTIPLAYER', {
            fontFamily: 'Arial Black',
            fontSize: '48px',
            color: '#ffffff',
            stroke: '#00ffff',
            strokeThickness: 3
        }).setOrigin(0.5);

        // Status text
        this.statusText = this.add.text(width / 2, 140, 'Connect to play 1v1', {
            fontFamily: 'Arial',
            fontSize: '20px',
            color: '#00ffff'
        }).setOrigin(0.5);

        // Error text (hidden by default)
        this.errorText = this.add.text(width / 2, height / 2 + 150, '', {
            fontFamily: 'Arial',
            fontSize: '18px',
            color: '#ff4444'
        }).setOrigin(0.5).setVisible(false);

        // Create initial menu
        this.createLobbyMenu();

        // Back button
        this.backButton = this.add.text(80, 40, '← BACK', {
            fontFamily: 'Arial Black',
            fontSize: '20px',
            color: '#888888'
        }).setInteractive({ useHandCursor: true });

        this.backButton.on('pointerover', () => this.backButton.setColor('#ffffff'));
        this.backButton.on('pointerout', () => this.backButton.setColor('#888888'));
        this.backButton.on('pointerdown', () => this.goBack());

        // ESC to go back
        this.input.keyboard?.on('keydown-ESC', () => this.goBack());

        // Handle resize
        this.scale.on('resize', this.handleResize, this);

        // Connect to signaling server
        this.connectToServer();

        EventBus.emit('current-scene-ready', this);
    }

    createStarfield() {
        const { width, height } = this.scale;

        for (let i = 0; i < 30; i++) {
            const x = Phaser.Math.Between(0, width);
            const y = Phaser.Math.Between(0, height);
            const star = this.add.image(x, y, 'star')
                .setScale(Phaser.Math.FloatBetween(0.1, 0.3))
                .setAlpha(Phaser.Math.FloatBetween(0.3, 0.7));

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

    createLobbyMenu() {
        const { width, height } = this.scale;
        const centerY = height / 2 - 50;

        // Create Room button
        this.createRoomButton = this.add.text(width / 2, centerY, '[ CREATE ROOM ]', {
            fontFamily: 'Arial Black',
            fontSize: '32px',
            color: '#ffffff',
            stroke: '#00ff00',
            strokeThickness: 2
        }).setOrigin(0.5).setInteractive({ useHandCursor: true });

        this.createRoomButton.on('pointerover', () => {
            this.createRoomButton.setStyle({ color: '#00ff00' });
            this.tweens.add({ targets: this.createRoomButton, scale: 1.05, duration: 100 });
        });
        this.createRoomButton.on('pointerout', () => {
            this.createRoomButton.setStyle({ color: '#ffffff' });
            this.tweens.add({ targets: this.createRoomButton, scale: 1, duration: 100 });
        });
        this.createRoomButton.on('pointerdown', () => this.createRoom());

        // OR text
        this.add.text(width / 2, centerY + 60, '- OR -', {
            fontFamily: 'Arial',
            fontSize: '16px',
            color: '#666666'
        }).setOrigin(0.5);

        // Join Room section
        this.add.text(width / 2, centerY + 100, 'JOIN WITH CODE:', {
            fontFamily: 'Arial',
            fontSize: '18px',
            color: '#888888'
        }).setOrigin(0.5);

        // Input field background
        this.inputBackground = this.add.rectangle(width / 2, centerY + 150, 200, 50, 0x333333)
            .setStrokeStyle(2, 0x00ffff);

        // Input field text
        this.inputText = this.add.text(width / 2, centerY + 150, '', {
            fontFamily: 'Courier New',
            fontSize: '32px',
            color: '#ffffff',
            letterSpacing: 8
        }).setOrigin(0.5);

        // Blinking cursor
        this.inputCursor = this.add.text(width / 2 + 40, centerY + 150, '|', {
            fontFamily: 'Courier New',
            fontSize: '32px',
            color: '#00ffff'
        }).setOrigin(0.5);

        this.tweens.add({
            targets: this.inputCursor,
            alpha: 0,
            duration: 500,
            yoyo: true,
            repeat: -1
        });

        // Join button
        this.joinRoomButton = this.add.text(width / 2, centerY + 220, '[ JOIN ]', {
            fontFamily: 'Arial Black',
            fontSize: '28px',
            color: '#666666'
        }).setOrigin(0.5);

        // Keyboard input for room code
        this.input.keyboard?.on('keydown', (event: KeyboardEvent) => {
            if (this.isInRoom) return;

            if (event.key === 'Backspace') {
                this.roomCodeInput = this.roomCodeInput.slice(0, -1);
            } else if (event.key === 'Enter' && this.roomCodeInput.length === 4) {
                this.joinRoom();
            } else if (/^[a-zA-Z0-9]$/.test(event.key) && this.roomCodeInput.length < 4) {
                this.roomCodeInput += event.key.toUpperCase();
            }

            this.updateInputDisplay();
        });
    }

    updateInputDisplay() {
        this.inputText.setText(this.roomCodeInput);

        // Update cursor position
        const textWidth = this.roomCodeInput.length * 24;
        this.inputCursor.setX(this.inputText.x + textWidth / 2 + 10);

        // Update join button state
        if (this.roomCodeInput.length === 4) {
            this.joinRoomButton.setStyle({ color: '#ffffff', stroke: '#00ff00', strokeThickness: 2 });
            this.joinRoomButton.setInteractive({ useHandCursor: true });
            this.joinRoomButton.on('pointerover', () => this.joinRoomButton.setStyle({ color: '#00ff00' }));
            this.joinRoomButton.on('pointerout', () => this.joinRoomButton.setStyle({ color: '#ffffff' }));
            this.joinRoomButton.on('pointerdown', () => this.joinRoom());
        } else {
            this.joinRoomButton.setStyle({ color: '#666666', stroke: '#333333', strokeThickness: 0 });
            this.joinRoomButton.removeInteractive();
        }
    }

    async connectToServer() {
        try {
            this.statusText.setText('Connecting to server...');
            await this.networkManager.connect();
            this.statusText.setText('Connected! Create or join a room');
            this.setupNetworkHandlers();
        } catch (error) {
            console.error('Failed to connect:', error);
            this.showError('Failed to connect to server. Is it running?');
        }
    }

    setupNetworkHandlers() {
        this.networkManager.on('peer-joined', () => {
            this.statusText.setText('Opponent joined! Get ready...');
            // Show ready button when opponent joins
            if (this.readyButton) {
                this.readyButton.setVisible(true);
            }
        });

        this.networkManager.on('peer-left', () => {
            this.peerReady = false;
            this.statusText.setText('Opponent left. Waiting for new opponent...');
            if (this.readyButton) {
                this.readyButton.setVisible(false);
                this.isReady = false;
                this.readyButton.setText('[ READY ]');
            }
        });

        this.networkManager.on('player-ready', (playerId: string) => {
            if (playerId !== this.networkManager.getLocalId()) {
                this.peerReady = true;
                this.statusText.setText(this.isReady ? 'Both ready! Starting...' : 'Opponent ready! Press READY');
            }
        });

        this.networkManager.on('game-start', () => {
            this.startGame();
        });

        this.networkManager.on('error', (err: Error) => {
            console.error('Network error:', err);
            this.showError('Connection error: ' + err.message);
        });
    }

    async createRoom() {
        this.soundManager.playClick();

        try {
            this.createRoomButton.setText('Creating...');
            const roomInfo = await this.networkManager.createRoom();
            this.showRoomView(roomInfo.roomCode);
        } catch (error: any) {
            console.error('Failed to create room:', error);
            this.showError(error.message || 'Failed to create room');
            this.createRoomButton.setText('[ CREATE ROOM ]');
        }
    }

    async joinRoom() {
        this.soundManager.playClick();

        if (this.roomCodeInput.length !== 4) return;

        try {
            this.joinRoomButton.setText('Joining...');
            const roomInfo = await this.networkManager.joinRoom(this.roomCodeInput);
            this.showRoomView(roomInfo.roomCode);
        } catch (error: any) {
            console.error('Failed to join room:', error);
            this.showError(error.message || 'Failed to join room');
            this.joinRoomButton.setText('[ JOIN ]');
        }
    }

    showRoomView(roomCode: string) {
        this.isInRoom = true;
        const { width, height } = this.scale;
        const isHost = this.networkManager.getRoomInfo()?.isHost ?? false;

        // Hide lobby menu
        this.createRoomButton.setVisible(false);
        this.joinRoomButton.setVisible(false);
        this.inputText.setVisible(false);
        this.inputCursor.setVisible(false);
        this.inputBackground.setVisible(false);

        // Show room code
        this.roomCodeText = this.add.text(width / 2, height / 2 - 80, `ROOM CODE: ${roomCode}`, {
            fontFamily: 'Arial Black',
            fontSize: '48px',
            color: '#00ffff'
        }).setOrigin(0.5);

        // Instruction to share code
        this.instructionText = this.add.text(width / 2, height / 2 - 20, 'Share this code with your opponent', {
            fontFamily: 'Arial',
            fontSize: '20px',
            color: '#888888'
        }).setOrigin(0.5);

        // Status
        if (isHost) {
            this.statusText.setText('Waiting for opponent...');
        } else {
            this.statusText.setText('Connected! Press READY when ready');
        }
        this.statusText.setPosition(width / 2, height / 2 + 30);

        // Ready button (visible immediately for joiner, hidden until peer joins for host)
        this.readyButton = this.add.text(width / 2, height / 2 + 100, '[ READY ]', {
            fontFamily: 'Arial Black',
            fontSize: '36px',
            color: '#ffffff',
            stroke: '#00ff00',
            strokeThickness: 2
        }).setOrigin(0.5).setInteractive({ useHandCursor: true }).setVisible(!isHost);

        this.readyButton.on('pointerover', () => {
            if (!this.isReady) this.readyButton.setStyle({ color: '#00ff00' });
        });
        this.readyButton.on('pointerout', () => {
            if (!this.isReady) this.readyButton.setStyle({ color: '#ffffff' });
        });
        this.readyButton.on('pointerdown', () => this.setReady());
    }

    setReady() {
        if (this.isReady) return;

        this.soundManager.playClick();
        this.isReady = true;
        this.networkManager.setReady();
        this.readyButton.setText('READY!');
        this.readyButton.setStyle({ color: '#00ff00' });
        this.readyButton.removeInteractive();

        if (this.peerReady) {
            this.statusText.setText('Both ready! Starting...');
        } else {
            this.statusText.setText('Waiting for opponent to ready up...');
        }
    }

    startGame() {
        this.cameras.main.fadeOut(500, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.soundManager.destroy();
            // Pass network manager to game scene
            this.scene.start('Game', {
                isMultiplayer: true,
                networkManager: this.networkManager
            });
        });
    }

    showError(message: string) {
        this.errorText.setText(message);
        this.errorText.setVisible(true);

        // Hide after 3 seconds
        this.time.delayedCall(3000, () => {
            this.errorText.setVisible(false);
        });
    }

    goBack() {
        this.soundManager.playClick();
        this.networkManager.disconnect();
        this.cameras.main.fadeOut(300, 0, 0, 0);
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.soundManager.destroy();
            this.scene.start('MainMenu');
        });
    }

    handleResize(gameSize: Phaser.Structs.Size) {
        const width = gameSize.width;
        const height = gameSize.height;

        if (this.background) {
            this.background.setPosition(width / 2, height / 2);
            this.background.setDisplaySize(Math.max(width, height) * 1.5, Math.max(width, height) * 1.5);
        }

        if (this.titleText) this.titleText.setPosition(width / 2, 80);
        if (this.statusText) this.statusText.setPosition(width / 2, this.isInRoom ? height / 2 + 30 : 140);
        if (this.errorText) this.errorText.setPosition(width / 2, height / 2 + 150);

        if (this.isInRoom) {
            if (this.roomCodeText) this.roomCodeText.setPosition(width / 2, height / 2 - 80);
            if (this.instructionText) this.instructionText.setPosition(width / 2, height / 2 - 20);
            if (this.readyButton) this.readyButton.setPosition(width / 2, height / 2 + 100);
        } else {
            const centerY = height / 2 - 50;
            if (this.createRoomButton) this.createRoomButton.setPosition(width / 2, centerY);
            if (this.inputBackground) this.inputBackground.setPosition(width / 2, centerY + 150);
            if (this.inputText) this.inputText.setPosition(width / 2, centerY + 150);
            if (this.joinRoomButton) this.joinRoomButton.setPosition(width / 2, centerY + 220);
        }
    }

    shutdown() {
        this.scale.off('resize', this.handleResize, this);
        this.networkManager.removeAllListeners();
    }
}
