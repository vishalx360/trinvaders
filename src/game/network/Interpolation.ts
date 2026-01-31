import { NetworkState } from './NetworkManager';

interface BufferedState extends NetworkState {
    timestamp: number;
}

export class Interpolation {
    private buffer: BufferedState[] = [];
    private bufferTime: number; // How far behind to render (ms)
    private maxBufferSize: number = 10;

    constructor(bufferTime: number = 100) {
        this.bufferTime = bufferTime;
    }

    // Add a new state to the buffer
    addState(state: NetworkState, timestamp: number) {
        this.buffer.push({ ...state, timestamp });

        // Keep buffer from growing too large
        if (this.buffer.length > this.maxBufferSize) {
            this.buffer.shift();
        }
    }

    // Get interpolated state for current time
    getInterpolatedState(currentTime: number): NetworkState | null {
        if (this.buffer.length < 2) {
            // Not enough data to interpolate, return latest
            return this.buffer.length > 0 ? this.buffer[this.buffer.length - 1] : null;
        }

        // Render time is slightly in the past for interpolation
        const renderTime = currentTime - this.bufferTime;

        // Find the two states to interpolate between
        let older: BufferedState | null = null;
        let newer: BufferedState | null = null;

        for (let i = 0; i < this.buffer.length - 1; i++) {
            if (this.buffer[i].timestamp <= renderTime &&
                this.buffer[i + 1].timestamp >= renderTime) {
                older = this.buffer[i];
                newer = this.buffer[i + 1];
                break;
            }
        }

        // If we couldn't find suitable states, use extrapolation from latest
        if (!older || !newer) {
            const latest = this.buffer[this.buffer.length - 1];

            // Simple extrapolation using velocity
            const timeDiff = (currentTime - latest.timestamp) / 1000;
            return {
                x: latest.x + latest.velocityX * timeDiff,
                y: latest.y + latest.velocityY * timeDiff,
                rotation: latest.rotation,
                velocityX: latest.velocityX,
                velocityY: latest.velocityY,
                playerId: latest.playerId
            };
        }

        // Calculate interpolation factor
        const range = newer.timestamp - older.timestamp;
        const t = range > 0 ? (renderTime - older.timestamp) / range : 0;

        // Interpolate position
        return {
            x: this.lerp(older.x, newer.x, t),
            y: this.lerp(older.y, newer.y, t),
            rotation: this.lerpAngle(older.rotation, newer.rotation, t),
            velocityX: this.lerp(older.velocityX, newer.velocityX, t),
            velocityY: this.lerp(older.velocityY, newer.velocityY, t),
            playerId: older.playerId
        };
    }

    private lerp(a: number, b: number, t: number): number {
        return a + (b - a) * Math.max(0, Math.min(1, t));
    }

    private lerpAngle(a: number, b: number, t: number): number {
        // Handle angle wraparound
        let diff = b - a;

        // Normalize to -180 to 180
        while (diff > 180) diff -= 360;
        while (diff < -180) diff += 360;

        return a + diff * Math.max(0, Math.min(1, t));
    }

    // Clear the buffer (e.g., on reconnection)
    clear() {
        this.buffer = [];
    }

    // Adjust buffer time for latency compensation
    setBufferTime(ms: number) {
        this.bufferTime = ms;
    }
}
