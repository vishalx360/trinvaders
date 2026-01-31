import { io, Socket } from 'socket.io-client';
import { EventEmitter } from 'events';

export interface NetworkState {
    x: number;
    y: number;
    rotation: number;
    velocityX: number;
    velocityY: number;
    playerId: string;
}

export interface FireData {
    x: number;
    y: number;
    angle: number;
    bulletId: string;
}

export interface HitData {
    damage: number;
    newHealth: number;
    shooterId: string;
}

export interface DeathData {
    killerId: string;
}

export interface RoomInfo {
    roomCode: string;
    isHost: boolean;
    hostId?: string;
}

export class NetworkManager extends EventEmitter {
    private socket: Socket | null = null;
    private roomInfo: RoomInfo | null = null;
    private peerId: string | null = null;
    private connected: boolean = false;
    private serverUrl: string;

    constructor(serverUrl?: string) {
        super();
        // Use provided URL, or dynamically build from current hostname
        if (serverUrl) {
            this.serverUrl = serverUrl;
        } else if (typeof window !== 'undefined') {
            // Use same hostname as the page, but port 3001
            const protocol = window.location.protocol === 'https:' ? 'https:' : 'http:';
            this.serverUrl = `${protocol}//${window.location.hostname}:3001`;
        } else {
            this.serverUrl = 'http://localhost:3001';
        }
    }

    // Connect to game server
    connect(): Promise<void> {
        return new Promise((resolve, reject) => {
            this.socket = io(this.serverUrl, {
                transports: ['websocket']
            });

            this.socket.on('connect', () => {
                console.log('[NetworkManager] Connected to game server');
                this.connected = true;
                this.setupSocketHandlers();
                resolve();
            });

            this.socket.on('connect_error', (error) => {
                console.error('[NetworkManager] Connection error:', error);
                reject(error);
            });

            this.socket.on('disconnect', () => {
                console.log('[NetworkManager] Disconnected from game server');
                this.connected = false;
                this.emit('disconnected');
            });
        });
    }

    private setupSocketHandlers() {
        if (!this.socket) return;

        // Peer joined the room
        this.socket.on('peer-joined', ({ peerId }) => {
            console.log('[NetworkManager] Peer joined:', peerId);
            this.peerId = peerId;
            this.emit('peer-joined', peerId);
        });

        // Peer left the room
        this.socket.on('peer-left', ({ peerId }) => {
            console.log('[NetworkManager] Peer left:', peerId);
            this.peerId = null;
            this.emit('peer-left', peerId);
        });

        // Host changed
        this.socket.on('host-changed', ({ newHostId }) => {
            console.log('[NetworkManager] Host changed to:', newHostId);
            if (this.roomInfo) {
                this.roomInfo.isHost = this.socket?.id === newHostId;
                this.roomInfo.hostId = newHostId;
            }
            this.emit('host-changed', newHostId);
        });

        // Player ready
        this.socket.on('player-ready', ({ playerId }) => {
            console.log('[NetworkManager] Player ready:', playerId);
            this.emit('player-ready', playerId);
        });

        // Game start
        this.socket.on('game-start', () => {
            console.log('[NetworkManager] Game starting!');
            this.emit('game-start');
        });

        // ============================================
        // GAME STATE EVENTS (relayed through server)
        // ============================================

        // Opponent position updates
        this.socket.on('opponent-position', (data: NetworkState) => {
            this.emit('remote-position', data, Date.now());
        });

        // Opponent fired bullet
        this.socket.on('opponent-fire', (data: FireData) => {
            this.emit('remote-fire', data);
        });

        // Opponent was hit
        this.socket.on('opponent-hit', (data: HitData) => {
            this.emit('remote-hit', data);
        });

        // Opponent died
        this.socket.on('opponent-death', (data: DeathData) => {
            this.emit('remote-death', data);
        });
    }

    // Room management
    createRoom(): Promise<RoomInfo> {
        return new Promise((resolve, reject) => {
            if (!this.socket) {
                reject(new Error('Not connected to game server'));
                return;
            }

            this.socket.emit('create-room', (response: any) => {
                if (response.success) {
                    this.roomInfo = {
                        roomCode: response.roomCode,
                        isHost: true
                    };
                    resolve(this.roomInfo);
                } else {
                    reject(new Error(response.error));
                }
            });
        });
    }

    joinRoom(roomCode: string): Promise<RoomInfo> {
        return new Promise((resolve, reject) => {
            if (!this.socket) {
                reject(new Error('Not connected to game server'));
                return;
            }

            this.socket.emit('join-room', roomCode.toUpperCase(), (response: any) => {
                if (response.success) {
                    this.roomInfo = {
                        roomCode: response.roomCode,
                        isHost: false,
                        hostId: response.hostId
                    };
                    // Set peer ID to host when joining
                    this.peerId = response.hostId;
                    resolve(this.roomInfo);
                } else {
                    reject(new Error(response.error));
                }
            });
        });
    }

    setReady() {
        this.socket?.emit('player-ready');
    }

    // ============================================
    // GAME MESSAGE SENDING (via socket relay)
    // ============================================

    sendPosition(state: NetworkState) {
        this.socket?.emit('player-position', state);
    }

    sendFire(fireData: FireData) {
        this.socket?.emit('player-fire', fireData);
    }

    sendHit(hitData: HitData) {
        this.socket?.emit('player-hit', hitData);
    }

    sendDeath(deathData: DeathData) {
        this.socket?.emit('player-death', deathData);
    }

    // Getters
    isConnected(): boolean {
        return this.connected;
    }

    getRoomInfo(): RoomInfo | null {
        return this.roomInfo;
    }

    getLocalId(): string | null {
        return this.socket?.id || null;
    }

    getPeerId(): string | null {
        return this.peerId;
    }

    // Cleanup
    disconnect() {
        if (this.socket) {
            this.socket.disconnect();
            this.socket = null;
        }
        this.roomInfo = null;
        this.peerId = null;
        this.connected = false;
    }
}
