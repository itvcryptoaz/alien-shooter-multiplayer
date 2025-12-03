/**
 * Network Manager
 * 
 * Handles all client-server communication using Socket.io
 */

import { io, Socket } from 'socket.io-client';
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
  MpActor,
  MpUser,
} from '@alien-shooter-web/shared';

type EventCallback = (...args: any[]) => void;

/**
 * NetworkManager class
 * Manages Socket.io connection and game protocol events
 */
export class NetworkManager {
  private socket: Socket | null = null;
  private serverUrl: string;
  private eventHandlers: Map<string, EventCallback[]>;
  private playerName: string = '';
  private connected: boolean = false;

  constructor(serverUrl: string) {
    this.serverUrl = serverUrl;
    this.eventHandlers = new Map();
  }

  /**
   * Register an event handler
   */
  public on(event: string, callback: EventCallback): void {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(callback);
  }

  /**
   * Emit an event to registered handlers
   */
  private emit(event: string, ...args: any[]): void {
    const handlers = this.eventHandlers.get(event);
    if (handlers) {
      handlers.forEach((handler) => handler(...args));
    }
  }

  /**
   * Connect to the server
   */
  public async connect(playerName: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.playerName = playerName;

      // Create socket connection
      this.socket = io(this.serverUrl, {
        transports: ['websocket', 'polling'],
      });

      // Set up connection event handlers
      this.socket.on('connect', () => {
        console.log('Connected to server');
        this.connected = true;

        // Send connection request
        const request: MpCPacketConnectionRequest = {
          head: { type: MpPacketType.MPT_C_CONNECTION_REQUEST },
          nameLen: playerName.length,
          name: playerName,
        };

        this.socket!.emit('connection_request', request);
      });

      this.socket.on('connect_error', (error) => {
        console.error('Connection error:', error);
        this.connected = false;
        this.emit('connection_error', error);
        reject(error);
      });

      this.socket.on('disconnect', () => {
        console.log('Disconnected from server');
        this.connected = false;
        this.emit('disconnect');
      });

      // Set up game protocol handlers
      this.socket.on('connection_response', (data: MpSPacketConnectionResponse) => {
        console.log('Connection accepted:', data.serverConfiguration);
        this.emit('connected', data.serverConfiguration);
        resolve();
      });

      this.socket.on('users_sync', (data: MpSPacketUsersSync) => {
        this.emit('users_sync', data);
      });

      this.socket.on('actors_sync', (data: MpSPacketActorsSync) => {
        this.emit('actors_sync', data);
      });

      this.socket.on('shoot', (data: MpSPacketShoot) => {
        this.emit('shoot', data);
      });

      // Timeout after 5 seconds
      setTimeout(() => {
        if (!this.connected) {
          reject(new Error('Connection timeout'));
        }
      }, 5000);
    });
  }

  /**
   * Send actor state update to server
   */
  public sendActorSync(actor: MpActor): void {
    if (!this.socket || !this.connected) {
      console.warn('Cannot send actor sync: not connected');
      return;
    }

    const packet: MpCPacketActorSync = {
      head: { type: MpPacketType.MPT_C_ACTOR_SYNC },
      mpActor: actor,
    };

    this.socket.emit('actor_sync', packet);
  }

  /**
   * Send user info update to server
   */
  public sendUserSync(user: MpUser): void {
    if (!this.socket || !this.connected) {
      console.warn('Cannot send user sync: not connected');
      return;
    }

    const packet: MpCPacketUserSync = {
      head: { type: MpPacketType.MPT_C_USER_SYNC },
      mpUser: user,
    };

    this.socket.emit('user_sync', packet);
  }

  /**
   * Send shoot event to server
   */
  public sendShoot(x: number, y: number): void {
    if (!this.socket || !this.connected) {
      console.warn('Cannot send shoot: not connected');
      return;
    }

    const packet: MpCPacketShoot = {
      head: { type: MpPacketType.MPT_C_SHOOT },
      x,
      y,
    };

    this.socket.emit('shoot', packet);
  }

  /**
   * Disconnect from server
   */
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
      this.connected = false;
    }
  }

  /**
   * Check if connected
   */
  public isConnected(): boolean {
    return this.connected;
  }
}
