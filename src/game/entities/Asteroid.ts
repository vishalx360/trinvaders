import { Scene, Physics, GameObjects } from 'phaser';

export interface AsteroidConfig {
    x: number;
    y: number;
    size: 'large' | 'medium' | 'small';
}

export class Asteroid extends Physics.Arcade.Sprite {
    asteroidSize: 'large' | 'medium' | 'small';
    points: number;
    health: number;

    private static readonly SIZE_CONFIG = {
        large: { scale: 0.8, health: 3, points: 20, speed: 50 },
        medium: { scale: 0.5, health: 2, points: 50, speed: 80 },
        small: { scale: 0.3, health: 1, points: 100, speed: 120 }
    };

    constructor(scene: Scene, config: AsteroidConfig) {
        // Create asteroid using the star sprite (will be tinted/styled)
        super(scene, config.x, config.y, 'star');

        this.asteroidSize = config.size;
        const sizeConfig = Asteroid.SIZE_CONFIG[config.size];

        this.points = sizeConfig.points;
        this.health = sizeConfig.health;

        // Add to scene and enable physics
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Configure appearance
        this.setScale(sizeConfig.scale);
        this.setTint(0xaaaaaa); // Gray tint for asteroid look

        // Configure physics
        const body = this.body as Physics.Arcade.Body;

        // Random velocity
        const angle = Phaser.Math.FloatBetween(0, Math.PI * 2);
        const speed = sizeConfig.speed + Phaser.Math.FloatBetween(-20, 20);
        body.setVelocity(
            Math.cos(angle) * speed,
            Math.sin(angle) * speed
        );

        // Random rotation
        body.setAngularVelocity(Phaser.Math.FloatBetween(-100, 100));

        // Bounce off world bounds
        body.setBounce(1);

        // Circular hitbox
        const radius = 32 * sizeConfig.scale;
        body.setCircle(radius);
    }

    takeDamage(): boolean {
        this.health--;

        // Flash effect
        this.setTint(0xffffff);
        this.scene.time.delayedCall(50, () => {
            if (this.active) {
                this.setTint(0xaaaaaa);
            }
        });

        return this.health <= 0;
    }

    // Wrap around screen edges
    wrapBounds(width: number, height: number) {
        const margin = 50;

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

    // Get spawn positions for child asteroids when destroyed
    getChildSpawns(): { x: number; y: number; size: 'large' | 'medium' | 'small' }[] {
        if (this.asteroidSize === 'small') {
            return []; // Small asteroids don't spawn children
        }

        const childSize = this.asteroidSize === 'large' ? 'medium' : 'small';
        const numChildren = this.asteroidSize === 'large' ? 2 : 2;

        const children: { x: number; y: number; size: 'large' | 'medium' | 'small' }[] = [];

        for (let i = 0; i < numChildren; i++) {
            children.push({
                x: this.x + Phaser.Math.FloatBetween(-20, 20),
                y: this.y + Phaser.Math.FloatBetween(-20, 20),
                size: childSize
            });
        }

        return children;
    }
}
