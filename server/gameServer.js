const { Server } = require('socket.io');

const PORT = process.env.PORT || 3001;

const io = new Server(PORT, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST']
  }
});

// Store active rooms: Map<roomCode, { players: Map<socketId, playerInfo>, host: socketId }>
const rooms = new Map();

// Generate a random 4-character room code
function generateRoomCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Exclude confusing chars
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

io.on('connection', (socket) => {
  console.log(`[${new Date().toISOString()}] Client connected: ${socket.id}`);

  // Create a new room
  socket.on('create-room', (callback) => {
    let roomCode = generateRoomCode();
    // Ensure unique room code
    while (rooms.has(roomCode)) {
      roomCode = generateRoomCode();
    }

    rooms.set(roomCode, {
      players: new Map([[socket.id, { ready: false }]]),
      host: socket.id
    });

    socket.join(roomCode);
    socket.roomCode = roomCode;

    console.log(`[${new Date().toISOString()}] Room created: ${roomCode} by ${socket.id}`);
    callback({ success: true, roomCode, isHost: true });
  });

  // Join an existing room
  socket.on('join-room', (roomCode, callback) => {
    const room = rooms.get(roomCode);

    if (!room) {
      callback({ success: false, error: 'Room not found' });
      return;
    }

    if (room.players.size >= 2) {
      callback({ success: false, error: 'Room is full' });
      return;
    }

    room.players.set(socket.id, { ready: false });
    socket.join(roomCode);
    socket.roomCode = roomCode;

    console.log(`[${new Date().toISOString()}] Player ${socket.id} joined room: ${roomCode}`);

    // Notify existing player that someone joined
    socket.to(roomCode).emit('peer-joined', { peerId: socket.id });

    callback({ success: true, roomCode, isHost: false, hostId: room.host });
  });

  // Player ready status
  socket.on('player-ready', () => {
    const roomCode = socket.roomCode;
    const room = rooms.get(roomCode);

    if (!room) return;

    const playerInfo = room.players.get(socket.id);
    if (playerInfo) {
      playerInfo.ready = true;
    }

    // Notify all players in room
    io.to(roomCode).emit('player-ready', { playerId: socket.id });

    // Check if all players are ready and room is full
    const allReady = [...room.players.values()].every(p => p.ready);
    if (room.players.size === 2 && allReady) {
      console.log(`[${new Date().toISOString()}] Room ${roomCode} starting game`);
      io.to(roomCode).emit('game-start');
    }
  });

  // ============================================
  // GAME STATE RELAY EVENTS
  // Server relays all game state between players
  // ============================================

  // Relay player position to opponent (~30Hz from each client)
  socket.on('player-position', (data) => {
    const roomCode = socket.roomCode;
    if (roomCode) {
      socket.to(roomCode).emit('opponent-position', data);
    }
  });

  // Relay bullet fired to opponent
  socket.on('player-fire', (data) => {
    const roomCode = socket.roomCode;
    if (roomCode) {
      socket.to(roomCode).emit('opponent-fire', data);
    }
  });

  // Relay hit event to opponent
  socket.on('player-hit', (data) => {
    const roomCode = socket.roomCode;
    if (roomCode) {
      socket.to(roomCode).emit('opponent-hit', data);
    }
  });

  // Relay death event to opponent
  socket.on('player-death', (data) => {
    const roomCode = socket.roomCode;
    if (roomCode) {
      socket.to(roomCode).emit('opponent-death', data);
    }
  });

  // Host changed
  socket.on('host-changed', ({ newHostId }) => {
    const roomCode = socket.roomCode;
    if (roomCode) {
      io.to(roomCode).emit('host-changed', { newHostId });
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log(`[${new Date().toISOString()}] Client disconnected: ${socket.id}`);

    const roomCode = socket.roomCode;
    if (!roomCode) return;

    const room = rooms.get(roomCode);
    if (!room) return;

    room.players.delete(socket.id);

    // Notify other player
    socket.to(roomCode).emit('peer-left', { peerId: socket.id });

    // Clean up empty room
    if (room.players.size === 0) {
      rooms.delete(roomCode);
      console.log(`[${new Date().toISOString()}] Room ${roomCode} deleted (empty)`);
    } else if (room.host === socket.id) {
      // Transfer host to remaining player
      const newHost = room.players.keys().next().value;
      room.host = newHost;
      io.to(roomCode).emit('host-changed', { newHostId: newHost });
    }
  });
});

console.log(`[${new Date().toISOString()}] Game server running on port ${PORT}`);
