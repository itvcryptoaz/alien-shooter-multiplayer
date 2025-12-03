# Alien Shooter Web Port

A modern browser-based multiplayer port of Alien Shooter (2003) using **Phaser 3** and **Node.js**, translated from the original C implementation.

## 🎮 Overview

This project recreates the gameplay of Alien Shooter in a web browser with full multiplayer support. It translates the networking protocol and game logic from the C-based DLL injection mod to a modern JavaScript/TypeScript stack.

## 📁 Project Structure

```
web-port/
├── client/          # Phaser 3 browser game client
├── server/          # Node.js multiplayer server  
├── shared/          # Shared protocol definitions
└── package.json     # Root package for workspace management
```

## 🚀 Quick Start

### Prerequisites

- Node.js >= 18.0.0
- npm >= 9.0.0

### Installation

1. Install all dependencies:
```bash
cd web-port
npm install
cd client && npm install
cd ../server && npm install
cd ../shared && npm install
```

Or use the convenience script:
```bash
cd web-port
npm run install:all
```

2. Build the shared protocol library:
```bash
npm run build:shared
```

### Development

Run both client and server in development mode:
```bash
npm run dev
```

Or run them separately:
```bash
# Terminal 1 - Server
npm run dev:server

# Terminal 2 - Client
npm run dev:client
```

The client will be available at `http://localhost:8080`  
The server will run on `http://localhost:3000`

### Production Build

Build all packages:
```bash
npm run build
```

Start the production server:
```bash
npm run start:server
```

Then serve the client from `client/dist/` using any web server.

## 🎯 Technology Stack

### Client
- **Phaser 3** - 2D game engine
- **TypeScript** - Type-safe JavaScript
- **Socket.io Client** - Real-time networking
- **Webpack** - Module bundler

### Server
- **Node.js** - JavaScript runtime
- **Socket.io** - WebSocket server
- **TypeScript** - Type-safe JavaScript

### Shared
- **TypeScript** - Protocol definitions shared between client and server

## 🌐 Network Protocol

The networking protocol is translated from the original C implementation:

### Low-Level Protocol (`protocol.ts`)
- Connection management
- Client ID assignment
- Packet types and headers

**Reference:** `common/src/net/protocol.h` in the C repository

### High-Level Game Protocol (`multiplayer-protocol.ts`)
- Player state synchronization
- Actor movement and combat
- User information updates
- Shoot events

**Reference:** `common/src/multiplayer_protocol.h` in the C repository

## 🎮 Controls

- **WASD** or **Arrow Keys** - Move character
- **Mouse** - Aim
- **Left Click** - Shoot

## 📋 Features Implemented

### Phase 1: Architecture & Setup ✅
- [x] Monorepo structure with client, server, and shared modules
- [x] TypeScript configuration
- [x] Build system (Webpack for client, tsc for server)
- [x] Package dependencies

### Phase 2: Network Protocol ✅
- [x] Low-level network protocol translation
- [x] Multiplayer protocol translation
- [x] Shared TypeScript interfaces
- [x] Socket.io integration

### Phase 3: Core Game Engine ✅
- [x] Phaser 3 basic setup
- [x] Player controller (WASD + Mouse)
- [x] Basic rendering
- [x] Health bars and player names

### Phase 4: Server Implementation ✅
- [x] Socket.io server
- [x] Client-server synchronization
- [x] Entity management
- [x] Connection/disconnection handling

### Phase 5: Gameplay (In Progress)
- [ ] Isometric tilemap rendering
- [ ] Weapon system
- [ ] Enemy AI
- [ ] Stats and RPG elements
- [ ] Game assets

## 🔧 Development Notes

### Coordinate System

The game uses a standard 2D coordinate system:
- Origin (0,0) is at the top-left
- X increases to the right
- Y increases downward
- Angles are in radians, converted to 0-255 for network transmission

### Server Authority

The server is authoritative for:
- Player health
- Hit detection (future)
- Enemy AI (future)
- Item spawning (future)

The client handles:
- Rendering
- Input prediction
- Visual effects

### Network Updates

- **Actor Sync**: 30ms intervals (33 Hz) - position, health, direction
- **User Sync**: 10000ms intervals (0.1 Hz) - names, static info

## 📚 Further Reading

- [Client README](./client/README.md)
- [Server README](./server/README.md)
- [Original C Repository](https://github.com/itvcryptoaz/alien-shooter-multiplayer)
- [Phaser 3 Documentation](https://photonstorm.github.io/phaser3-docs/)
- [Socket.io Documentation](https://socket.io/docs/)

## 🤝 Contributing

This is a port of the original C implementation. When adding features, refer to the C codebase for reference:
- Game types: `asmp-dll/src/game/types/`
- Entity logic: `asmp-dll/src/game/types/entities/`
- Network protocol: `common/src/net/` and `common/src/multiplayer_protocol.h`

## 📄 License

MIT

## 🙏 Credits

Based on the reverse engineering and multiplayer mod work from the [alien-shooter-multiplayer](https://github.com/itvcryptoaz/alien-shooter-multiplayer) repository.

Original game: Alien Shooter (2003) by Sigma Team
