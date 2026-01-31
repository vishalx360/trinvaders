/**
 * Bot AI - Finite State Machine logic for NPC bot behavior
 */

import { BotDifficultyConfig } from './BotConfig';
import { Bullet } from '../entities/Bullet';

export enum BotState {
    IDLE = 'IDLE',
    WANDER = 'WANDER',
    CHASE = 'CHASE',
    ATTACK = 'ATTACK',
    EVADE = 'EVADE',
}

export interface BotAction {
    thrust: boolean;
    rotateLeft: boolean;
    rotateRight: boolean;
    fire: boolean;
    targetAngle?: number; // Target angle to rotate towards
}

interface TargetInfo {
    x: number;
    y: number;
    velocityX: number;
    velocityY: number;
}

interface BotInfo {
    x: number;
    y: number;
    angle: number;
    velocityX: number;
    velocityY: number;
}

export class BotAI {
    private config: BotDifficultyConfig;
    private state: BotState = BotState.IDLE;
    private previousState: BotState = BotState.IDLE;

    // Timing
    private stateStartTime: number = 0;
    private lastDecisionTime: number = 0;

    // Wander state
    private wanderAngle: number = 0;

    // Evade state
    private evadeAngle: number = 0;
    private evadeStartTime: number = 0;
    private evadeDuration: number = 500; // ms

    // Screen dimensions for wrap-aware calculations
    private screenWidth: number;
    private screenHeight: number;

    constructor(config: BotDifficultyConfig, screenWidth: number, screenHeight: number) {
        this.config = config;
        this.screenWidth = screenWidth;
        this.screenHeight = screenHeight;
        this.stateStartTime = Date.now();
    }

    /**
     * Main update method - evaluates state and returns actions
     */
    update(
        bot: BotInfo,
        target: TargetInfo | null,
        bullets: Bullet[],
        time: number
    ): BotAction {
        const action: BotAction = {
            thrust: false,
            rotateLeft: false,
            rotateRight: false,
            fire: false,
        };

        // Check for dangerous bullets (takes priority)
        const dangerousBullet = this.findDangerousBullet(bot, bullets);
        if (dangerousBullet && this.state !== BotState.EVADE) {
            if (Math.random() < this.config.dodgeChance) {
                this.transitionTo(BotState.EVADE, time);
                this.calculateEvadeAngle(bot, dangerousBullet);
            }
        }

        // State machine logic
        switch (this.state) {
            case BotState.IDLE:
                this.updateIdle(action, bot, target, time);
                break;
            case BotState.WANDER:
                this.updateWander(action, bot, target, time);
                break;
            case BotState.CHASE:
                this.updateChase(action, bot, target, time);
                break;
            case BotState.ATTACK:
                this.updateAttack(action, bot, target, time);
                break;
            case BotState.EVADE:
                this.updateEvade(action, bot, time);
                break;
        }

        return action;
    }

    private transitionTo(newState: BotState, time: number) {
        if (newState !== BotState.EVADE) {
            this.previousState = this.state;
        }
        this.state = newState;
        this.stateStartTime = time;
    }

    private updateIdle(action: BotAction, bot: BotInfo, target: TargetInfo | null, time: number) {
        // Check for target detection
        if (target && this.isTargetInRange(bot, target, this.config.detectionRange)) {
            // Wait for reaction time before responding
            if (time - this.lastDecisionTime > this.config.reactionTime) {
                this.lastDecisionTime = time;
                this.transitionTo(BotState.CHASE, time);
            }
            return;
        }

        // Transition to wander after idle time
        if (time - this.stateStartTime > this.config.idleTime) {
            this.wanderAngle = Math.random() * 360;
            this.transitionTo(BotState.WANDER, time);
        }
    }

    private updateWander(action: BotAction, bot: BotInfo, target: TargetInfo | null, time: number) {
        // Check for target detection
        if (target && this.isTargetInRange(bot, target, this.config.detectionRange)) {
            if (time - this.lastDecisionTime > this.config.reactionTime) {
                this.lastDecisionTime = time;
                this.transitionTo(BotState.CHASE, time);
                return;
            }
        }

        // Move towards wander angle
        action.targetAngle = this.wanderAngle;
        this.applyRotationTowards(action, bot.angle, this.wanderAngle);
        action.thrust = true;

        // Pick new wander direction periodically
        if (time - this.stateStartTime > this.config.wanderTime) {
            this.wanderAngle = Math.random() * 360;
            this.stateStartTime = time;
        }
    }

    private updateChase(action: BotAction, bot: BotInfo, target: TargetInfo | null, time: number) {
        if (!target) {
            this.transitionTo(BotState.WANDER, time);
            return;
        }

        const distance = this.getWrapAwareDistance(bot, target);

        // Check if in attack range
        if (distance < this.config.attackRange) {
            this.transitionTo(BotState.ATTACK, time);
            return;
        }

        // Lost target
        if (distance > this.config.detectionRange * 1.2) {
            this.transitionTo(BotState.WANDER, time);
            return;
        }

        // Calculate angle to target (with prediction if enabled)
        const targetAngle = this.calculateTargetAngle(bot, target, distance);
        action.targetAngle = targetAngle;
        this.applyRotationTowards(action, bot.angle, targetAngle);
        action.thrust = true;
    }

    private updateAttack(action: BotAction, bot: BotInfo, target: TargetInfo | null, time: number) {
        if (!target) {
            this.transitionTo(BotState.WANDER, time);
            return;
        }

        const distance = this.getWrapAwareDistance(bot, target);

        // Target moved out of attack range
        if (distance > this.config.attackRange * 1.2) {
            this.transitionTo(BotState.CHASE, time);
            return;
        }

        // Calculate angle to target
        const targetAngle = this.calculateTargetAngle(bot, target, distance);
        action.targetAngle = targetAngle;
        this.applyRotationTowards(action, bot.angle, targetAngle);

        // Check if we're aimed close enough to fire
        const angleDiff = this.normalizeAngle(targetAngle - bot.angle);
        const aimThreshold = this.config.aimVariance + 10; // Some tolerance

        if (Math.abs(angleDiff) < aimThreshold) {
            // Apply accuracy-based variance
            if (Math.random() < this.config.accuracy) {
                action.fire = true;
            }
        }

        // Light thrust to maintain distance / adjust position
        if (distance > this.config.attackRange * 0.6) {
            action.thrust = true;
        }
    }

    private updateEvade(action: BotAction, bot: BotInfo, time: number) {
        // Evade for a short duration
        if (time - this.stateStartTime > this.evadeDuration) {
            this.transitionTo(this.previousState, time);
            return;
        }

        // Move perpendicular to danger
        action.targetAngle = this.evadeAngle;
        this.applyRotationTowards(action, bot.angle, this.evadeAngle);
        action.thrust = true;
    }

    private calculateEvadeAngle(bot: BotInfo, bullet: Bullet) {
        const body = bullet.body as Phaser.Physics.Arcade.Body;
        const bulletAngle = Math.atan2(body.velocity.y, body.velocity.x);

        // Evade perpendicular to bullet direction
        const perpOffset = Math.random() > 0.5 ? Math.PI / 2 : -Math.PI / 2;
        this.evadeAngle = Phaser.Math.RadToDeg(bulletAngle + perpOffset);
    }

    private findDangerousBullet(bot: BotInfo, bullets: Bullet[]): Bullet | null {
        for (const bullet of bullets) {
            if (!bullet.active) continue;

            const body = bullet.body as Phaser.Physics.Arcade.Body;
            const dx = bullet.x - bot.x;
            const dy = bullet.y - bot.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Only check bullets within danger radius
            if (distance > this.config.bulletDangerRadius * 2) continue;

            // Check if bullet is heading towards bot using dot product
            const bulletVelNorm = Math.sqrt(body.velocity.x ** 2 + body.velocity.y ** 2);
            if (bulletVelNorm === 0) continue;

            const bulletDirX = body.velocity.x / bulletVelNorm;
            const bulletDirY = body.velocity.y / bulletVelNorm;

            // Vector from bullet to bot
            const toBotX = -dx;
            const toBotY = -dy;
            const toBotNorm = Math.sqrt(toBotX * toBotX + toBotY * toBotY);
            if (toBotNorm === 0) continue;

            const toBotDirX = toBotX / toBotNorm;
            const toBotDirY = toBotY / toBotNorm;

            // Dot product - positive means bullet heading towards bot
            const dot = bulletDirX * toBotDirX + bulletDirY * toBotDirY;

            if (dot > 0.7 && distance < this.config.bulletDangerRadius) {
                return bullet;
            }
        }
        return null;
    }

    private calculateTargetAngle(bot: BotInfo, target: TargetInfo, distance: number): number {
        let targetX = target.x;
        let targetY = target.y;

        // Apply prediction for lead shooting
        if (this.config.leadsTargets) {
            const bulletSpeed = 600; // Same as Bullet.speed
            const timeToReach = distance / bulletSpeed;
            const predictionFactor = Math.min(timeToReach, this.config.predictionTime);

            targetX += target.velocityX * predictionFactor * this.config.accuracy;
            targetY += target.velocityY * predictionFactor * this.config.accuracy;
        }

        // Calculate wrap-aware direction
        let dx = targetX - bot.x;
        let dy = targetY - bot.y;

        // Adjust for screen wrap
        if (Math.abs(dx) > this.screenWidth / 2) {
            dx = dx > 0 ? dx - this.screenWidth : dx + this.screenWidth;
        }
        if (Math.abs(dy) > this.screenHeight / 2) {
            dy = dy > 0 ? dy - this.screenHeight : dy + this.screenHeight;
        }

        // Convert to angle (Phaser angle where 0 = right, but ship sprite points up)
        // Bot.angle is the visual angle, but direction needs -90 offset
        const directionAngle = Phaser.Math.RadToDeg(Math.atan2(dy, dx));
        // Convert direction angle to visual angle (add 90 since ship points up at angle 0)
        return directionAngle + 90;
    }

    private getWrapAwareDistance(bot: BotInfo, target: TargetInfo): number {
        let dx = Math.abs(target.x - bot.x);
        let dy = Math.abs(target.y - bot.y);

        // Use shorter distance accounting for wrap
        if (dx > this.screenWidth / 2) dx = this.screenWidth - dx;
        if (dy > this.screenHeight / 2) dy = this.screenHeight - dy;

        return Math.sqrt(dx * dx + dy * dy);
    }

    private isTargetInRange(bot: BotInfo, target: TargetInfo, range: number): boolean {
        return this.getWrapAwareDistance(bot, target) < range;
    }

    private applyRotationTowards(action: BotAction, currentAngle: number, targetAngle: number) {
        const angleDiff = this.normalizeAngle(targetAngle - currentAngle);

        if (angleDiff > 5) {
            action.rotateRight = true;
        } else if (angleDiff < -5) {
            action.rotateLeft = true;
        }
    }

    private normalizeAngle(angle: number): number {
        while (angle > 180) angle -= 360;
        while (angle < -180) angle += 360;
        return angle;
    }

    /**
     * Apply aim variance to shots
     */
    getAimVariance(): number {
        return (Math.random() - 0.5) * 2 * this.config.aimVariance;
    }

    getState(): BotState {
        return this.state;
    }

    updateScreenSize(width: number, height: number) {
        this.screenWidth = width;
        this.screenHeight = height;
    }
}
