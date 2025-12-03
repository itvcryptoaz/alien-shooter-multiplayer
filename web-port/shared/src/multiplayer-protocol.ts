/**
 * Multiplayer Protocol Definitions
 * 
 * This file translates the C multiplayer protocol definitions from 
 * common/src/multiplayer_protocol.h to TypeScript.
 */

// Constants
export const MP_MAX_NAME_LEN = 15;
export const MP_MAX_MAP_NAME_LEN = 24;
export const MP_RECV_TIMEOUT_MS = 5000;
export const MP_SEND_TIMEOUT_MS = 5000;
export const MP_USER_SYNC_UPDATE_RATE_MS = 10000;
export const MP_ACTOR_SYNC_UPDATE_RATE_MS = 30;

/**
 * Server configuration sent to clients on connection
 */
export interface MpServerConfiguration {
  userSyncUpdateRateMs: number;
  actorSyncUpdateRateMs: number;
  mapName: string; // max length: MP_MAX_MAP_NAME_LEN
}

/**
 * Actor (character) state for synchronization
 * Represents the physical state of a player character
 */
export interface MpActor {
  x: number;              // float - X position
  y: number;              // float - Y position
  z: number;              // float - Z position (height)
  velocity: number;       // float - Movement speed
  directionLegs: number;  // uint8 - Direction character is walking (0-255 for 360 degrees)
  directionTorso: number; // uint8 - Direction character is aiming (0-255 for 360 degrees)
  armedWeapon: number;    // uint8 - Currently equipped weapon ID
  health: number;         // uint8 - Health points (0-255)
}

/**
 * User information (non-physical state)
 */
export interface MpUser {
  name: string; // max length: MP_MAX_NAME_LEN + 1
}

/**
 * Complete player state (user info + actor state)
 */
export interface MpPlayer {
  mpUser: MpUser;
  mpActor: MpActor;
}

/**
 * Multiplayer packet types - high-level game protocol
 */
export enum MpPacketType {
  MPT_EMPTY = 0,
  MPT_C_CONNECTION_REQUEST = 1,
  MPT_S_CONNECTION_RESPONSE = 2,  // Note: typo in original C code (CONENCTION)
  MPT_C_USER_SYNC = 3,
  MPT_S_USERS_SYNC = 4,
  MPT_C_ACTOR_SYNC = 5,
  MPT_S_ACTORS_SYNC = 6,
  MPT_C_SHOOT = 7,
  MPT_S_SHOOT = 8,
}

/**
 * Base packet header for multiplayer packets
 */
export interface MpPacketHead {
  type: MpPacketType;
}

/**
 * Client connection request with player name
 */
export interface MpCPacketConnectionRequest {
  head: MpPacketHead;
  nameLen: number;
  name: string;
}

/**
 * Server connection response with configuration
 */
export interface MpSPacketConnectionResponse {
  head: MpPacketHead;
  serverConfiguration: MpServerConfiguration;
}

/**
 * Client user info sync packet
 */
export interface MpCPacketUserSync {
  head: MpPacketHead;
  mpUser: MpUser;
}

/**
 * Single user sync item in server broadcast
 */
export interface MpSPacketUsersSyncItem {
  id: number;      // uint8 - Player/client ID
  mpUser: MpUser;
}

/**
 * Server broadcast of all users' info
 */
export interface MpSPacketUsersSync {
  head: MpPacketHead;
  numItems: number;
  items: MpSPacketUsersSyncItem[];
}

/**
 * Client actor state sync packet
 */
export interface MpCPacketActorSync {
  head: MpPacketHead;
  mpActor: MpActor;
}

/**
 * Single actor sync item in server broadcast
 */
export interface MpSPacketActorSyncItem {
  id: number;       // uint8 - Player/client ID
  mpActor: MpActor;
}

/**
 * Server broadcast of all actors' states
 */
export interface MpSPacketActorsSync {
  head: MpPacketHead;
  numItems: number;
  items: MpSPacketActorSyncItem[];
}

/**
 * Client shoot event packet
 */
export interface MpCPacketShoot {
  head: MpPacketHead;
  x: number;  // float - Target X coordinate
  y: number;  // float - Target Y coordinate
  // TODO: Add weapon id for additional syncing?
}

/**
 * Server shoot event broadcast
 */
export interface MpSPacketShoot {
  head: MpPacketHead;
  playerId: number; // uint8 - ID of player who shot
  x: number;        // float - Target X coordinate
  y: number;        // float - Target Y coordinate
  // TODO: Add weapon id for additional syncing?
}
