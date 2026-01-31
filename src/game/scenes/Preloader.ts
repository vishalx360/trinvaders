import { Scene } from 'phaser';

export class Preloader extends Scene {
    constructor() {
        super('Preloader');
    }

    init() {
        const { width, height } = this.scale;

        // Display background during loading - scale to cover entire screen
        const bg = this.add.image(width / 2, height / 2, 'background');
        bg.setDisplaySize(Math.max(width, height) * 1.5, Math.max(width, height) * 1.5);

        // Loading bar container
        this.add.rectangle(width / 2, height / 2, 468, 32).setStrokeStyle(2, 0x00ffff);

        // Progress bar fill
        const bar = this.add.rectangle(width / 2 - 230, height / 2, 4, 28, 0x00ffff);

        // Loading text
        this.add.text(width / 2, height / 2 - 44, 'LOADING...', {
            fontFamily: 'Arial Black',
            fontSize: '24px',
            color: '#00ffff'
        }).setOrigin(0.5);

        // Update progress bar
        this.load.on('progress', (progress: number) => {
            bar.width = 4 + (460 * progress);
        });
    }

    preload() {
        this.load.setPath('assets');

        // Ships - 4 colors
        this.load.image('ship_blue', 'blue_ship.png');
        this.load.image('ship_red', 'red_ship.png');
        this.load.image('ship_green', 'green_ship.png');
        this.load.image('ship_yellow', 'yellow_ship.png');

        // Blaster ships
        this.load.image('ship_blue_blaster', 'blue_blaster_ship.png');
        this.load.image('ship_red_blaster', 'red_blaster_ship.png');
        this.load.image('ship_green_blaster', 'green_blaster_ship.png');
        this.load.image('ship_yellow_blaster', 'yellow_blaster_ship.png');

        // Bullets
        this.load.image('bullet_basic', 'basic_bullet.png');
        this.load.image('bullet_blaster', 'blaster_bullet.png');

        // Effects
        this.load.image('star', 'star.png');
    }

    create() {
        // Transition to main menu
        this.scene.start('MainMenu');
    }
}
