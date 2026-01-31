import { Scene, Physics, GameObjects } from 'phaser';

export interface PlayerConfig {
    x: number;
    y: number;
    texture: string;
    playerId: string;
    isLocal: boolean;
}

export class Player extends Physics.Arcade.Sprite {
    playerId: string;
    isLocal: boolean;
    thrustPower: number = 300;
    rotationSpeed: number = 200;
    maxSpeed: number = 400;
    drag: number = 50;

    // Thrust visual
    private thrustEmitter?: GameObjects.Particles.ParticleEmitter;

    constructor(scene: Scene, config: PlayerConfig) {
        super(scene, config.x, config.y, config.texture);

        this.playerId = config.playerId;
        this.isLocal = config.isLocal;

        // Add to scene and enable physics
        scene.add.existing(this);
        scene.physics.add.existing(this);

        // Scale down the ship (original is 301x397, we want ~60px tall)
        this.setScale(0.15);

        // Configure physics body
        const body = this.body as Physics.Arcade.Body;
        body.setDrag(this.drag);
        body.setAngularDrag(100);
        body.setMaxVelocity(this.maxSpeed);

        // Set circular collision body for better asteroid-style physics
        body.setCircle(150, 0, 50); // radius, offsetX, offsetY (adjusted for sprite)

        // Ship sprite points UP in the image file (angle 0 = visual up)
        // No initial rotation needed - ship starts pointing up naturally
    }

    thrust(delta: number) {
        const body = this.body as Physics.Arcade.Body;

        // Calculate thrust direction based on current rotation
        // Sprite points UP at angle 0, but Phaser's angle 0 = RIGHT
        // So we subtract 90° to convert from visual angle to direction angle
        const directionAngle = Phaser.Math.DegToRad(this.angle - 90);

        const thrustX = Math.cos(directionAngle) * this.thrustPower;
        const thrustY = Math.sin(directionAngle) * this.thrustPower;

        body.setAcceleration(thrustX, thrustY);
    }

    stopThrust() {
        const body = this.body as Physics.Arcade.Body;
        body.setAcceleration(0, 0);
    }

    rotateLeft(delta: number) {
        const body = this.body as Physics.Arcade.Body;
        body.setAngularVelocity(-this.rotationSpeed);
    }

    rotateRight(delta: number) {
        const body = this.body as Physics.Arcade.Body;
        body.setAngularVelocity(this.rotationSpeed);
    }

    stopRotation() {
        const body = this.body as Physics.Arcade.Body;
        body.setAngularVelocity(0);
    }

    // Get the position for spawning bullets
    getBulletSpawnPoint(): { x: number; y: number; angle: number } {
        // Same -90° offset to convert visual angle to direction angle
        const directionAngle = Phaser.Math.DegToRad(this.angle - 90);
        const offsetDistance = 40; // Distance from center to nose of ship

        return {
            x: this.x + Math.cos(directionAngle) * offsetDistance,
            y: this.y + Math.sin(directionAngle) * offsetDistance,
            angle: this.angle - 90  // Pass the direction angle for bullet velocity
        };
    }

    // Wrap around screen edges (Asteroids-style)
    wrapBounds(width: number, height: number) {
        const margin = 30;

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

    // Update from network data
    updateFromNetwork(data: { x: number; y: number; rotation: number }) {
        this.x = data.x;
        this.y = data.y;
        this.angle = data.rotation;
    }

    // Get state for network transmission
    getNetworkState() {
        const body = this.body as Physics.Arcade.Body;
        return {
            x: this.x,
            y: this.y,
            rotation: this.angle,
            velocityX: body.velocity.x,
            velocityY: body.velocity.y,
            playerId: this.playerId
        };
    }

    destroy(fromScene?: boolean) {
        if (this.thrustEmitter) {
            this.thrustEmitter.destroy();
        }
        super.destroy(fromScene);
    }
}
