/**
 * Network Protocol Definitions
 * 
 * This file translates the C protocol definitions from common/src/net/protocol.h
 * to TypeScript for use in the web-based multiplayer game.
 */

// Type aliases matching the C definitions
export type NetClientId = number;  // unsigned char (0-255)
export type NetPriority = number;  // unsigned char (0-255)
export type NetTime = number;      // unsigned long
export type NetPort = number;      // unsigned short (0-65535)
export type NetByte = number;      // unsigned char (0-255)
export type NetSize = number;      // int

// Constants
export const NET_CLIENT_ID_INVALID: NetClientId = 0b11111110; // 254
export const NET_CLIENT_ID_ALL: NetClientId = 0b11111111;     // 255
export const NET_CLIENT_ID_ALL_BUT_FLAG: NetClientId = 0b10000000; // 128

/**
 * Create a client ID that represents "all clients except one"
 */
export function NET_CLIENT_ID_ALL_BUT(exceptId: NetClientId): NetClientId {
  return exceptId | NET_CLIENT_ID_ALL_BUT_FLAG;
}

/**
 * Network packet types - low-level protocol
 */
export enum NetPacketType {
  NPT_EMPTY = 0,
  NPT_C_CONNECTION_REQUEST = 1,
  NPT_S_CONNECTION_RESPONSE = 2,
  NPT_C_SYNC = 3,
  NPT_C_DISCONNECT = 4,
  NPT_S_DATA = 5,  // Data from server to client
  NPT_C_DATA = 6,  // Data from client to server
  NPT_VIRTUAL = 7, // Events from server to server
}

/**
 * Server configuration information
 */
export interface NetServerInfo {
  maxClients: number;      // max_clients
  recvTimeoutMs: number;   // recv_timeout_ms
  sendTimeoutMs: number;   // send_timeout_ms
}

/**
 * Base packet header for all network packets
 */
export interface NetPacketHead {
  type: NetPacketType;
}

/**
 * Server packet header
 */
export interface NetSPacketHead {
  netHead: NetPacketHead;
}

/**
 * Client packet header (includes sender ID)
 */
export interface NetCPacketHead {
  netHead: NetPacketHead;
  sender: NetClientId;
}

/**
 * Generic server packet with payload
 */
export interface NetSPacket {
  shead: NetSPacketHead;
  payload: Uint8Array;
}

/**
 * Generic client packet with payload
 */
export interface NetCPacket {
  chead: NetCPacketHead;
  payload: Uint8Array;
}

/**
 * Client connection request packet
 */
export interface NetCPacketConnectionRequest {
  head: NetCPacketHead;
}

/**
 * Server connection response packet
 */
export interface NetSPacketConnectionResponse {
  head: NetSPacketHead;
  serverInfo: NetServerInfo;
  assignedId: NetClientId;
}

/**
 * Client disconnect packet
 */
export interface NetCPacketDisconnect {
  head: NetCPacketHead;
}

/**
 * Client sync packet (keepalive)
 */
export interface NetCPacketSync {
  head: NetCPacketHead;
}
