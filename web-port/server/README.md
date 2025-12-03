# Alien Shooter Web - Server

Node.js multiplayer server using Socket.io.

## 🚀 Architecture

### Directory Structure

```
src/
└── index.ts    # Server implementation
```

### Key Components

#### GameServer Class
Main server class that manages:
- Client connections and disconnections
- Player state tracking
- Periodic synchronization broadcasts
- Game events (shooting, etc.)

## 🔧 Development

### Install Dependencies
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```

Server runs on `http://localhost:3000` with hot-reload enabled.

### Build for Production
```bash
npm run build
```

### Run Production Server
```bash
npm run start
```

Or directly:
```bash
node dist/index.js
```

### Clean Build Artifacts
```bash
npm run clean
```

## ⚙️ Configuration

### Environment Variables

- `PORT` - Server port (default: 3000)

Example:
```bash
PORT=8080 npm run start
```

### Server Settings

Current configuration in code:
- Map: `default_map`
- Actor sync rate: 30ms (33 Hz)
- User sync rate: 10000ms (0.1 Hz)
- Receive timeout: 5000ms
- Send timeout: 5000ms

## 📡 Protocol Implementation

The server implements these protocol handlers:

### Client → Server
- `connection_request` - New player connection
- `user_sync` - User info update
- `actor_sync` - Player position/state update
- `shoot` - Shoot event

### Server → Client
- `connection_response` - Connection accepted with config
- `users_sync` - Broadcast of all users' info
- `actors_sync` - Broadcast of all players' states
- `shoot` - Broadcast shoot event to other players

## 🎮 Game State Management

### Player State
Each connected player has:
- **User Info**: Name (max 15 chars)
- **Actor State**: Position (x, y, z), velocity, direction (legs/torso), weapon, health

### Synchronization Strategy

1. **Actor Sync** (30ms intervals):
   - Server broadcasts all players' positions/states
   - Enables smooth movement visualization
   - Critical for real-time gameplay

2. **User Sync** (10s intervals):
   - Server broadcasts all players' names/info
   - Less frequent since this data rarely changes
   - Handles late joiners seeing existing players

### Authority Model

Currently **client-authoritative** for position (for simplicity):
- Clients send their position
- Server broadcasts to other clients
- **TODO**: Implement server-side validation

Future **server-authoritative** features:
- Health/damage calculation
- Hit detection
- Enemy AI
- Item pickups

## 🔒 Security Considerations

### Current Implementation (Development)
⚠️ The current implementation trusts client data. This is acceptable for development but **NOT for production**.

### Production Recommendations
- [ ] Validate player movement (speed limits, boundaries)
- [ ] Server-side hit detection
- [ ] Rate limiting for packets
- [ ] Input sanitization (especially player names)
- [ ] Anti-cheat measures
- [ ] Secure WebSocket connections (WSS)
- [ ] Authentication/authorization

## 📊 Performance

### Scalability
Current architecture supports:
- ~100 concurrent players (theoretical, untested)
- Limited by single-threaded Node.js event loop

### Optimization Opportunities
- [ ] Spatial partitioning for actor sync (only send nearby players)
- [ ] Interest management (zone-based updates)
- [ ] Binary protocol for bandwidth reduction
- [ ] Redis for multi-server state sharing
- [ ] Clustering for horizontal scaling

## 🐛 Debugging

### Enable Socket.io Debug Logs
```bash
DEBUG=socket.io:* npm run dev
```

### Monitor Connected Players
The server logs:
- Player connections (with name and ID)
- Player disconnections
- Current player count

### Common Issues

1. **Clients can't connect**
   - Check CORS settings in server
   - Verify firewall/port forwarding
   - Check client is using correct URL

2. **Choppy movement**
   - Network latency too high
   - Actor sync rate may need adjustment
   - Consider implementing interpolation on client

## 📦 Dependencies

### Production
- `socket.io` - WebSocket server
- `@alien-shooter-web/shared` - Protocol definitions

### Development
- `typescript` - TypeScript compiler
- `ts-node-dev` - Development server with hot-reload
- `@types/node` - Node.js type definitions

## 🔮 Future Enhancements

- [ ] Room/lobby system (multiple game instances)
- [ ] Persistent player stats
- [ ] Database integration (PostgreSQL/MongoDB)
- [ ] Admin commands
- [ ] Server-side enemy AI
- [ ] Map loading system
- [ ] Game modes (survival, team deathmatch)
- [ ] Spectator mode
- [ ] Replay system
