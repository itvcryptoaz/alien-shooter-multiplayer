# Design Document: Alien Shooter Web Port

## Executive Summary

This document outlines the architecture and design decisions for porting the C-based Alien Shooter multiplayer mod to a modern web-based implementation using TypeScript, Phaser 3, and Node.js.

## 1. Project Goals

### Primary Objectives
1. Translate the C networking protocol to TypeScript
2. Create a browser-based multiplayer game using Phaser 3
3. Maintain gameplay fidelity to the original implementation
4. Provide a foundation for future enhancements

### Non-Goals (Phase 1)
- Direct asset porting (copyright concerns)
- Perfect visual replication
- Mobile optimization
- Advanced AI implementation

## 2. Architecture Overview

### 2.1 High-Level Architecture

```
┌─────────────┐         WebSocket/Socket.io        ┌─────────────┐
│   Browser   │ ←──────────────────────────────→   │  Node.js    │
│   Client    │         (Port 3000)                 │   Server    │
│  (Phaser 3) │                                     │ (Socket.io) │
└─────────────┘                                     └─────────────┘
      ↓                                                    ↓
  ┌─────────┐                                        ┌─────────┐
  │ Shared  │ ←────────────────────────────────────→ │ Shared  │
  │Protocol │         (npm workspace)                │Protocol │
  └─────────┘                                        └─────────┘
```

### 2.2 Monorepo Structure

We use npm workspaces to share code between client and server:

- **`web-port/shared/`** - Protocol definitions (TypeScript interfaces)
- **`web-port/client/`** - Phaser 3 game client
- **`web-port/server/`** - Node.js Socket.io server

**Rationale:** Ensures type safety across client-server boundary and eliminates protocol drift.

## 3. Protocol Translation

### 3.1 C to TypeScript Mapping

#### C Types → TypeScript Types

| C Type            | TypeScript Type | Range/Notes              |
|-------------------|-----------------|--------------------------|
| `unsigned char`   | `number`        | 0-255, use validation    |
| `unsigned short`  | `number`        | 0-65535                  |
| `unsigned long`   | `number`        | Use carefully (JS limit) |
| `int`             | `number`        | Standard JS number       |
| `float`           | `number`        | Standard JS number       |
| `char[N]`         | `string`        | Enforce max length       |

#### Struct Translation Strategy

C structs become TypeScript interfaces:

**C Code (protocol.h):**
```c
typedef struct NetServerInfo {
    NetClientId max_clients;
    NetTime recv_timeout_ms;
    NetTime send_timeout_ms;
} NetServerInfo;
```

**TypeScript (protocol.ts):**
```typescript
export interface NetServerInfo {
  maxClients: number;
  recvTimeoutMs: number;
  sendTimeoutMs: number;
}
```

**Naming Convention:** `snake_case` (C) → `camelCase` (TypeScript)

### 3.2 Binary vs JSON Protocol

**Decision:** Use JSON for Socket.io (Phase 1)

**Rationale:**
- ✅ Simpler implementation
- ✅ Better debugging
- ✅ Automatic serialization
- ❌ Larger bandwidth (acceptable for initial version)

**Future:** Consider MessagePack or Protobuf for production.

### 3.3 Protocol Layers

#### Layer 1: Network Protocol (Low-Level)
- Connection management
- Packet headers
- Client ID assignment

**Files:** `shared/src/protocol.ts` ← `common/src/net/protocol.h`

#### Layer 2: Multiplayer Protocol (High-Level)
- Game-specific packets
- Actor synchronization
- User information
- Game events (shoot, etc.)

**Files:** `shared/src/multiplayer-protocol.ts` ← `common/src/multiplayer_protocol.h`

## 4. Coordinate System Mapping

### 4.1 Coordinate Spaces

#### Original Game (C Implementation)
- **Type:** Isometric 2D
- **Origin:** Game-specific (from .lgc/.men map files)
- **Units:** Game units (likely pixels at specific scale)

#### Web Implementation (Phaser 3)
- **Type:** 2D Cartesian (can simulate isometric with transforms)
- **Origin:** Top-left (0, 0)
- **Units:** Pixels

### 4.2 Coordinate Translation Strategy

**Phase 1 (Current):** Direct 2D mapping
```
Server Coordinates = Client Coordinates
(Simple 1:1 mapping, top-down view)
```

**Phase 2 (Future):** Isometric projection
```
Screen X = (World X - World Y) * tileWidth / 2
Screen Y = (World X + World Y) * tileHeight / 2
```

### 4.3 Direction Encoding

The C protocol uses `uint8_t` (0-255) for direction:

```typescript
// 0-255 represents 0-360 degrees
const radiansToDirection = (radians: number): number => {
  return Math.floor(((radians + Math.PI) / (2 * Math.PI)) * 256) % 256;
};

const directionToRadians = (direction: number): number => {
  return (direction / 256) * (2 * Math.PI) - Math.PI;
};
```

**Rationale:** Compact network transmission (1 byte vs 4 bytes for float).

## 5. Client Architecture

### 5.1 Scene Structure

```
GameScene (main gameplay)
  ├── Player (local)
  ├── Remote Players (map)
  ├── Enemies (future)
  └── Environment (future)
```

**Future scenes:**
- MenuScene (main menu)
- LobbyScene (room selection)
- ShopScene (upgrades)

### 5.2 Input Handling

**Controls:**
- **WASD / Arrow Keys:** Movement
- **Mouse:** Aim/shoot direction
- **Left Click:** Fire weapon

**Implementation:**
```typescript
// Twin-stick style
Movement direction ← Keyboard input
Aim direction ← Mouse position relative to player
```

### 5.3 Client-Side Prediction

**Phase 1:** Simple client-authoritative movement
- Client updates position locally
- Server broadcasts to other clients

**Phase 2 (Future):** Full client-side prediction
1. Client predicts movement
2. Server validates and corrects
3. Client reconciles with server state

## 6. Server Architecture

### 6.1 State Management

```typescript
Map<socketId, ConnectedPlayer>
  ├── socket: Socket
  ├── player: MpPlayer
  │   ├── mpUser: { name }
  │   └── mpActor: { x, y, z, velocity, ... }
  └── id: number (assigned by server)
```

### 6.2 Update Loop

**Actor Sync Loop (30ms):**
```
1. Collect all player states
2. Create MpSPacketActorsSync
3. Broadcast to all clients
```

**User Sync Loop (10s):**
```
1. Collect all user info
2. Create MpSPacketUsersSync
3. Broadcast to all clients
```

### 6.3 Authority Model

**Current (Phase 1):**
- Client-authoritative for position (trust client)
- Server is pass-through/broadcaster

**Future (Phase 2):**
- Server-authoritative for:
  - Health/damage
  - Hit detection
  - Item pickups
  - Enemy AI

## 7. Network Synchronization

### 7.1 Update Rates

| Data Type | Rate   | Reason                          |
|-----------|--------|---------------------------------|
| Actor     | 30ms   | Smooth movement (33 Hz)         |
| User Info | 10s    | Rarely changes                  |
| Shoot     | Event  | Immediate response required     |

### 7.2 Bandwidth Estimation

**Per player actor update (JSON):**
```json
{
  "id": 1,
  "mpActor": {
    "x": 512.5,
    "y": 384.2,
    "z": 0,
    "velocity": 200,
    "directionLegs": 128,
    "directionTorso": 140,
    "armedWeapon": 1,
    "health": 95
  }
}
```
≈ 150 bytes (uncompressed JSON)

**For 10 players at 33 Hz:**
- Upload (per client): 150 bytes × 33 Hz = 4.95 KB/s
- Download (per client): 150 bytes × 10 × 33 Hz = 49.5 KB/s

**Acceptable** for modern broadband.

### 7.3 Latency Handling

**Phase 1:** None (simple broadcast)
**Phase 2:** 
- Client interpolation between states
- Server-side lag compensation for hit detection

## 8. Asset Strategy

### 8.1 Asset Requirements

Due to copyright, we cannot use original game assets. Alternatives:

1. **Placeholder Graphics** (current)
   - Colored rectangles for players
   - Basic shapes

2. **Open-Source Assets** (recommended)
   - OpenGameArt.org
   - Kenney.nl
   - itch.io

3. **AI-Generated** (future)
   - Stable Diffusion for sprites
   - Ensure commercial-use rights

### 8.2 Asset Organization

```
client/src/assets/
├── sprites/
│   ├── player/
│   ├── enemies/
│   └── weapons/
├── tiles/
│   └── lab/
├── audio/
│   ├── sfx/
│   └── music/
└── ui/
```

## 9. Security Considerations

### 9.1 Current Vulnerabilities

⚠️ **Development-Only Implementation**

- No input validation
- Client-authoritative position
- No rate limiting
- No authentication

### 9.2 Production Checklist

- [ ] Server-side movement validation
- [ ] Rate limiting (socket.io-rate-limit)
- [ ] Input sanitization (especially names)
- [ ] Authentication (JWT/session)
- [ ] WSS (encrypted WebSocket)
- [ ] CORS configuration
- [ ] DDoS protection

## 10. Future Roadmap

### Phase 2: Core Gameplay
- [ ] Weapon system (pistol, minigun, rocket launcher)
- [ ] Enemy AI (swarm behavior)
- [ ] Health/damage system
- [ ] Collision detection

### Phase 3: Content
- [ ] Map system (tilemap rendering)
- [ ] Asset integration (sprites, sounds)
- [ ] Multiple maps
- [ ] Power-ups and items

### Phase 4: Features
- [ ] Lobby system (multiple rooms)
- [ ] Character customization
- [ ] Statistics tracking
- [ ] Leaderboards

### Phase 5: Polish
- [ ] Mobile controls
- [ ] Sound effects
- [ ] Particle effects
- [ ] UI improvements

## 11. References

### Original C Repository
- Protocol: `common/src/net/protocol.h`, `common/src/multiplayer_protocol.h`
- Game types: `asmp-dll/src/game/types/`
- Entities: `asmp-dll/src/game/types/entities/`

### Documentation
- [Phaser 3 Docs](https://photonstorm.github.io/phaser3-docs/)
- [Socket.io Docs](https://socket.io/docs/v4/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/)

## 12. Glossary

- **Actor:** Physical game state (position, health, etc.)
- **User:** Non-physical player info (name, stats)
- **Entity:** Any game object (player, enemy, item)
- **Client-Authoritative:** Client determines state, server broadcasts
- **Server-Authoritative:** Server determines state, client obeys
- **Sync Packet:** Periodic state update
- **Event Packet:** Immediate action notification

---

**Document Version:** 1.0  
**Last Updated:** 2025-12-03  
**Author:** AI Agent (Copilot Workspace)
