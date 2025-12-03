/**
 * Alien Shooter Web - Multiplayer Server
 * 
 * This server manages multiplayer game sessions using Socket.io.
 * It implements the game protocol translated from the C implementation.
 */

import { Server as SocketIOServer, Socket } from 'socket.io';
import { createServer } from 'http';
import {
  MpPacketType,
  MpCPacketConnectionRequest,
  MpSPacketConnectionResponse,
  MpCPacketActorSync,
  MpSPacketActorsSync,
  MpCPacketUserSync,
  MpSPacketUsersSync,
  MpCPacketShoot,
  MpSPacketShoot,
  MpPlayer,
  MpActor,
  MpUser,
  MP_ACTOR_SYNC_UPDATE_RATE_MS,
  MP_USER_SYNC_UPDATE_RATE_MS,
} from '@alien-shooter-web/shared';

const PORT = process.env.PORT || 3000;
const MAP_NAME = 'default_map';

interface ConnectedPlayer {
  socket: Socket;
  player: MpPlayer;
  id: number;
}

/**
 * Game Server class
 * Manages connected players and game state synchronization
 */
class GameServer {
  private io: SocketIOServer;
  private players: Map<string, ConnectedPlayer>;
  private nextPlayerId: number;
  private actorSyncInterval?: NodeJS.Timeout;
  private userSyncInterval?: NodeJS.Timeout;

  constructor() {
    const httpServer = createServer();
    this.io = new SocketIOServer(httpServer, {
      cors: {
        origin: '*', // Configure based on your needs
        methods: ['GET', 'POST'],
      },
    });

    this.players = new Map();
    this.nextPlayerId = 0;

    this.setupEventHandlers();
    this.startSyncIntervals();

    httpServer.listen(PORT, () => {
      console.log(`🚀 Alien Shooter Server running on port ${PORT}`);
      console.log(`Map: ${MAP_NAME}`);
    });
  }

  /**
   * Set up Socket.io event handlers
   */
  private setupEventHandlers(): void {
    this.io.on('connection', (socket: Socket) => {
      console.log(`Client connected: ${socket.id}`);

      // Handle connection request
      socket.on('connection_request', (data: MpCPacketConnectionRequest) => {
        this.handleConnectionRequest(socket, data);
      });

      // Handle user sync updates
      socket.on('user_sync', (data: MpCPacketUserSync) => {
        this.handleUserSync(socket, data);
      });

      // Handle actor sync updates (position, health, etc.)
      socket.on('actor_sync', (data: MpCPacketActorSync) => {
        this.handleActorSync(socket, data);
      });

      // Handle shoot events
      socket.on('shoot', (data: MpCPacketShoot) => {
        this.handleShoot(socket, data);
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        this.handleDisconnect(socket);
      });
    });
  }

  /**
   * Handle client connection request
   */
  private handleConnectionRequest(
    socket: Socket,
    data: MpCPacketConnectionRequest
  ): void {
    const playerId = this.nextPlayerId++;
    
    // Create player with initial state
    const player: MpPlayer = {
      mpUser: {
        name: data.name.substring(0, 15), // Enforce max length
      },
      mpActor: {
        x: 0,
        y: 0,
        z: 0,
        velocity: 0,
        directionLegs: 0,
        directionTorso: 0,
        armedWeapon: 0,
        health: 100,
      },
    };

    // Store player
    this.players.set(socket.id, {
      socket,
      player,
      id: playerId,
    });

    console.log(`Player connected: ${player.mpUser.name} (ID: ${playerId})`);

    // Send connection response
    const response: MpSPacketConnectionResponse = {
      head: { type: MpPacketType.MPT_S_CONNECTION_RESPONSE },
      serverConfiguration: {
        userSyncUpdateRateMs: MP_USER_SYNC_UPDATE_RATE_MS,
        actorSyncUpdateRateMs: MP_ACTOR_SYNC_UPDATE_RATE_MS,
        mapName: MAP_NAME,
      },
    };

    socket.emit('connection_response', response);

    // Notify other players about the new player
    this.broadcastUserSync();
    this.broadcastActorSync();
  }

  /**
   * Handle user info sync from client
   */
  private handleUserSync(socket: Socket, data: MpCPacketUserSync): void {
    const connectedPlayer = this.players.get(socket.id);
    if (!connectedPlayer) return;

    // Update user info
    connectedPlayer.player.mpUser = data.mpUser;
    
    // Broadcast updated user list
    this.broadcastUserSync();
  }

  /**
   * Handle actor state sync from client
   * This is called frequently for position updates
   */
  private handleActorSync(socket: Socket, data: MpCPacketActorSync): void {
    const connectedPlayer = this.players.get(socket.id);
    if (!connectedPlayer) return;

    // Server-authoritative: validate and potentially modify the actor state
    // For now, we trust the client (should add validation in production)
    connectedPlayer.player.mpActor = data.mpActor;
  }

  /**
   * Handle shoot event from client
   */
  private handleShoot(socket: Socket, data: MpCPacketShoot): void {
    const connectedPlayer = this.players.get(socket.id);
    if (!connectedPlayer) return;

    // Broadcast shoot event to all other players
    const shootPacket: MpSPacketShoot = {
      head: { type: MpPacketType.MPT_S_SHOOT },
      playerId: connectedPlayer.id,
      x: data.x,
      y: data.y,
    };

    // Send to all clients except the shooter
    socket.broadcast.emit('shoot', shootPacket);
  }

  /**
   * Handle client disconnection
   */
  private handleDisconnect(socket: Socket): void {
    const connectedPlayer = this.players.get(socket.id);
    if (connectedPlayer) {
      console.log(
        `Player disconnected: ${connectedPlayer.player.mpUser.name} (ID: ${connectedPlayer.id})`
      );
      this.players.delete(socket.id);
      
      // Notify remaining players
      this.broadcastUserSync();
      this.broadcastActorSync();
    }
  }

  /**
   * Start periodic sync intervals
   */
  private startSyncIntervals(): void {
    // Actor sync (position, health) - frequent updates
    this.actorSyncInterval = setInterval(() => {
      this.broadcastActorSync();
    }, MP_ACTOR_SYNC_UPDATE_RATE_MS);

    // User sync (names, etc.) - infrequent updates
    this.userSyncInterval = setInterval(() => {
      this.broadcastUserSync();
    }, MP_USER_SYNC_UPDATE_RATE_MS);
  }

  /**
   * Broadcast user info to all connected clients
   */
  private broadcastUserSync(): void {
    const items = Array.from(this.players.values()).map((cp) => ({
      id: cp.id,
      mpUser: cp.player.mpUser,
    }));

    const packet: MpSPacketUsersSync = {
      head: { type: MpPacketType.MPT_S_USERS_SYNC },
      numItems: items.length,
      items,
    };

    this.io.emit('users_sync', packet);
  }

  /**
   * Broadcast actor state to all connected clients
   */
  private broadcastActorSync(): void {
    const items = Array.from(this.players.values()).map((cp) => ({
      id: cp.id,
      mpActor: cp.player.mpActor,
    }));

    const packet: MpSPacketActorsSync = {
      head: { type: MpPacketType.MPT_S_ACTORS_SYNC },
      numItems: items.length,
      items,
    };

    this.io.emit('actors_sync', packet);
  }

  /**
   * Clean up resources
   */
  public shutdown(): void {
    if (this.actorSyncInterval) {
      clearInterval(this.actorSyncInterval);
    }
    if (this.userSyncInterval) {
      clearInterval(this.userSyncInterval);
    }
    this.io.close();
  }
}

// Start the server
const server = new GameServer();

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\nShutting down server...');
  server.shutdown();
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\nShutting down server...');
  server.shutdown();
  process.exit(0);
});
