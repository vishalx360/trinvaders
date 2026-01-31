/**
 * Bot difficulty configuration
 * Defines parameters for easy, medium, and hard AI difficulty levels
 */

export type BotDifficulty = 'easy' | 'medium' | 'hard';

export interface BotDifficultyConfig {
    // Shooting accuracy (0-1, affects aim variance)
    accuracy: number;

    // Aim variance in degrees (applied to shots)
    aimVariance: number;

    // Reaction time in ms before responding to threats
    reactionTime: number;

    // Minimum time between shots in ms
    fireRate: number;

    // Distance at which bot detects player
    detectionRange: number;

    // Distance at which bot starts attacking
    attackRange: number;

    // Chance to dodge incoming bullets (0-1)
    dodgeChance: number;

    // Movement speed multiplier (0-1)
    speedMultiplier: number;

    // Whether the bot predicts target movement
    leadsTargets: boolean;

    // How far ahead to predict (in seconds), for lead shooting
    predictionTime: number;

    // Distance at which bot considers bullet dangerous
    bulletDangerRadius: number;

    // Time to stay in IDLE state before wandering (ms)
    idleTime: number;

    // How long to wander before checking for targets (ms)
    wanderTime: number;
}

export const BOT_CONFIGS: Record<BotDifficulty, BotDifficultyConfig> = {
    easy: {
        accuracy: 0.4,
        aimVariance: 25,
        reactionTime: 800,
        fireRate: 1500,
        detectionRange: 350,
        attackRange: 300,
        dodgeChance: 0.2,
        speedMultiplier: 0.7,
        leadsTargets: false,
        predictionTime: 0,
        bulletDangerRadius: 80,
        idleTime: 1000,
        wanderTime: 3000,
    },
    medium: {
        accuracy: 0.65,
        aimVariance: 12,
        reactionTime: 400,
        fireRate: 800,
        detectionRange: 500,
        attackRange: 400,
        dodgeChance: 0.5,
        speedMultiplier: 0.85,
        leadsTargets: true,
        predictionTime: 0.5,
        bulletDangerRadius: 120,
        idleTime: 500,
        wanderTime: 2000,
    },
    hard: {
        accuracy: 0.85,
        aimVariance: 5,
        reactionTime: 150,
        fireRate: 400,
        detectionRange: 700,
        attackRange: 550,
        dodgeChance: 0.85,
        speedMultiplier: 1.0,
        leadsTargets: true,
        predictionTime: 0.8,
        bulletDangerRadius: 150,
        idleTime: 200,
        wanderTime: 1000,
    },
};
