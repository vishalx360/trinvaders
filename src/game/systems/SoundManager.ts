import { Scene } from 'phaser';

/**
 * Synthesized retro sound effects using Web Audio API
 * No external audio files needed!
 */
export class SoundManager {
    private scene: Scene;
    private audioContext: AudioContext | null = null;
    private masterVolume: number = 0.3;
    private enabled: boolean = true;

    constructor(scene: Scene) {
        this.scene = scene;
        this.initAudioContext();
    }

    private initAudioContext() {
        try {
            this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
        } catch (e) {
            console.warn('Web Audio API not supported');
            this.enabled = false;
        }
    }

    private ensureContext() {
        if (this.audioContext?.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    // Laser/shoot sound - short high-pitched zap
    playShoot() {
        if (!this.enabled || !this.audioContext) return;
        this.ensureContext();

        const ctx = this.audioContext;
        const now = ctx.currentTime;

        // Oscillator for the main tone
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = 'square';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.exponentialRampToValueAtTime(220, now + 0.1);

        gain.gain.setValueAtTime(this.masterVolume * 0.4, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

        osc.start(now);
        osc.stop(now + 0.1);
    }

    // Explosion sound - noise burst with decay
    playExplosion() {
        if (!this.enabled || !this.audioContext) return;
        this.ensureContext();

        const ctx = this.audioContext;
        const now = ctx.currentTime;

        // Create noise
        const bufferSize = ctx.sampleRate * 0.3;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        // Filter for rumble effect
        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1000, now);
        filter.frequency.exponentialRampToValueAtTime(100, now + 0.3);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(this.masterVolume * 0.6, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.3);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        noise.start(now);
        noise.stop(now + 0.3);
    }

    // Small explosion for asteroid hits
    playHit() {
        if (!this.enabled || !this.audioContext) return;
        this.ensureContext();

        const ctx = this.audioContext;
        const now = ctx.currentTime;

        // Short noise burst
        const bufferSize = ctx.sampleRate * 0.1;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'bandpass';
        filter.frequency.value = 800;

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(this.masterVolume * 0.3, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.1);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        noise.start(now);
        noise.stop(now + 0.1);
    }

    // Thrust sound - continuous low rumble
    private thrustOsc: OscillatorNode | null = null;
    private thrustGain: GainNode | null = null;

    startThrust() {
        if (!this.enabled || !this.audioContext || this.thrustOsc) return;
        this.ensureContext();

        const ctx = this.audioContext;

        this.thrustOsc = ctx.createOscillator();
        this.thrustGain = ctx.createGain();

        // Create noise-like sound with low frequency oscillator
        this.thrustOsc.type = 'sawtooth';
        this.thrustOsc.frequency.value = 60;

        // Modulate with another oscillator for rumble effect
        const lfo = ctx.createOscillator();
        const lfoGain = ctx.createGain();
        lfo.frequency.value = 20;
        lfoGain.gain.value = 30;

        lfo.connect(lfoGain);
        lfoGain.connect(this.thrustOsc.frequency);

        this.thrustOsc.connect(this.thrustGain);
        this.thrustGain.connect(ctx.destination);

        this.thrustGain.gain.setValueAtTime(0, ctx.currentTime);
        this.thrustGain.gain.linearRampToValueAtTime(this.masterVolume * 0.15, ctx.currentTime + 0.1);

        this.thrustOsc.start();
        lfo.start();
    }

    stopThrust() {
        if (!this.audioContext || !this.thrustOsc || !this.thrustGain) return;

        const ctx = this.audioContext;
        this.thrustGain.gain.linearRampToValueAtTime(0, ctx.currentTime + 0.1);

        setTimeout(() => {
            this.thrustOsc?.stop();
            this.thrustOsc = null;
            this.thrustGain = null;
        }, 100);
    }

    // Player death - longer, dramatic explosion
    playDeath() {
        if (!this.enabled || !this.audioContext) return;
        this.ensureContext();

        const ctx = this.audioContext;
        const now = ctx.currentTime;

        // Low rumbling explosion
        const bufferSize = ctx.sampleRate * 0.8;
        const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
        const data = buffer.getChannelData(0);

        for (let i = 0; i < bufferSize; i++) {
            data[i] = Math.random() * 2 - 1;
        }

        const noise = ctx.createBufferSource();
        noise.buffer = buffer;

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(800, now);
        filter.frequency.exponentialRampToValueAtTime(50, now + 0.8);

        const gain = ctx.createGain();
        gain.gain.setValueAtTime(this.masterVolume * 0.8, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);

        noise.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        noise.start(now);
        noise.stop(now + 0.8);

        // Add a descending tone
        const osc = ctx.createOscillator();
        const oscGain = ctx.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(400, now);
        osc.frequency.exponentialRampToValueAtTime(50, now + 0.6);

        oscGain.gain.setValueAtTime(this.masterVolume * 0.3, now);
        oscGain.gain.exponentialRampToValueAtTime(0.001, now + 0.6);

        osc.connect(oscGain);
        oscGain.connect(ctx.destination);

        osc.start(now);
        osc.stop(now + 0.6);
    }

    // Menu/UI click
    playClick() {
        if (!this.enabled || !this.audioContext) return;
        this.ensureContext();

        const ctx = this.audioContext;
        const now = ctx.currentTime;

        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(660, now);

        gain.gain.setValueAtTime(this.masterVolume * 0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

        osc.start(now);
        osc.stop(now + 0.05);
    }

    // Wave complete jingle
    playWaveComplete() {
        if (!this.enabled || !this.audioContext) return;
        this.ensureContext();

        const ctx = this.audioContext;
        const now = ctx.currentTime;

        const notes = [523, 659, 784, 1047]; // C5, E5, G5, C6

        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.type = 'square';
            osc.frequency.value = freq;

            const startTime = now + i * 0.1;
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(this.masterVolume * 0.2, startTime + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.2);

            osc.start(startTime);
            osc.stop(startTime + 0.2);
        });
    }

    // Game over sound
    playGameOver() {
        if (!this.enabled || !this.audioContext) return;
        this.ensureContext();

        const ctx = this.audioContext;
        const now = ctx.currentTime;

        const notes = [392, 349, 330, 262]; // G4, F4, E4, C4 - descending

        notes.forEach((freq, i) => {
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            osc.connect(gain);
            gain.connect(ctx.destination);

            osc.type = 'triangle';
            osc.frequency.value = freq;

            const startTime = now + i * 0.2;
            gain.gain.setValueAtTime(0, startTime);
            gain.gain.linearRampToValueAtTime(this.masterVolume * 0.3, startTime + 0.02);
            gain.gain.linearRampToValueAtTime(this.masterVolume * 0.3, startTime + 0.15);
            gain.gain.exponentialRampToValueAtTime(0.001, startTime + 0.3);

            osc.start(startTime);
            osc.stop(startTime + 0.3);
        });
    }

    setVolume(volume: number) {
        this.masterVolume = Math.max(0, Math.min(1, volume));
    }

    setEnabled(enabled: boolean) {
        this.enabled = enabled;
        if (!enabled) {
            this.stopThrust();
        }
    }

    destroy() {
        this.stopThrust();
        if (this.audioContext) {
            this.audioContext.close();
        }
    }
}
