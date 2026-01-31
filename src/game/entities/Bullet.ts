import { Scene, Physics } from 'phaser';

export interface BulletConfig {
    x: number;
    y: number;
    angle: number;
    ownerId: string;
    texture?: string;
}

export class Bullet extends Physics.Arcade.Sprite {
    ownerId: string;
    speed: number = 600;
    lifespan: number = 2000; // ms before auto-destroy
    private spawnTime: number;

    private fireAngle: number;

    constructor(scene: Scene, config: BulletConfig) {
        super(scene, config.x, config.y, config.texture || 'bullet_basic');

        this.ownerId = config.ownerId;
        this.spawnTime = scene.time.now;
        this.fireAngle = config.angle;

        // Add to scene and enable physics
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Scale bullet (original is 192x517, we want ~20px)
        this.setScale(0.04);

        // Set rotation to match firing direction
        // Bullet sprite points UP in image, so add 90° to convert direction angle to visual angle
        this.setAngle(config.angle + 90);

        // Small circular hitbox
        const body = this.body as Physics.Arcade.Body;
        body.setCircle(100, 50, 200);
    }

    // Call this after adding to physics group
    launch() {
        const angleRad = Phaser.Math.DegToRad(this.fireAngle);
        const body = this.body as Physics.Arcade.Body;
        body.setVelocity(
            Math.cos(angleRad) * this.speed,
            Math.sin(angleRad) * this.speed
        );
    }

    update(time: number, delta: number) {
        // Check lifespan
        if (time - this.spawnTime > this.lifespan) {
            this.destroy();
            return;
        }
    }

    // Wrap around screen edges
    wrapBounds(width: number, height: number) {
        const margin = 20;

        if (this.x < -margin) {
            this.x = width + margin;
        } else if (this.x > width + margin) {
            this.x = -margin;
        }

        if (this.y < -margin) {
            this.y = height + margin;
        } else if (this.y > height + margin) {
            this.y = -margin;
        }
    }
}
