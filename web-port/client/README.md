# Alien Shooter Web - Client

Browser-based game client using Phaser 3.

## 🎮 Architecture

### Directory Structure

```
src/
├── index.ts          # Entry point, connection handling
├── index.html        # HTML template
├── network/          # Network communication
│   └── NetworkManager.ts
├── scenes/           # Phaser game scenes
│   └── GameScene.ts
└── entities/         # Game entities (future)
```

### Key Components

#### NetworkManager
Handles all client-server communication using Socket.io:
- Connection management
- Protocol event handling
- Actor/user state synchronization
- Shoot events

#### GameScene
Main game scene that handles:
- Player rendering and controls
- Remote player management
- Input handling (WASD + Mouse)
- Visual effects

## 🔧 Development

### Install Dependencies
```bash
npm install
```

### Run Development Server
```bash
npm run dev
```

Open `http://localhost:8080` in your browser.

### Build for Production
```bash
npm run build
```

Output will be in `dist/` directory.

### Clean Build Artifacts
```bash
npm run clean
```

## 🎯 Configuration

The client connects to the server URL specified in the connection panel. Default is `http://localhost:3000`.

For production, update the default server URL in `src/index.html`.

## 📝 Protocol Translation

This client implements the TypeScript translation of the C protocol:

### Packet Types
- `connection_request` - Initial connection with player name
- `actors_sync` - Receive position updates from all players
- `users_sync` - Receive user info updates
- `shoot` - Receive shoot events from other players

### Sent Events
- `actor_sync` - Send local player position/state
- `user_sync` - Send local user info updates
- `shoot` - Send shoot events

See `@alien-shooter-web/shared` package for full protocol definitions.

## 🎨 Asset Management

Assets should be placed in `src/assets/`:
```
src/assets/
├── sprites/     # Character and enemy sprites
├── tiles/       # Tilemap tiles
├── audio/       # Sound effects and music
└── ui/          # UI elements
```

Assets are automatically copied to `dist/assets/` during build.

## 🐛 Debug Mode

Physics debug is enabled in development mode. To disable, edit `src/index.ts`:

```typescript
physics: {
  arcade: {
    debug: false  // Change to false
  }
}
```

## 📦 Dependencies

### Production
- `phaser` - Game engine
- `socket.io-client` - Real-time networking
- `@alien-shooter-web/shared` - Protocol definitions

### Development
- `typescript` - TypeScript compiler
- `webpack` - Module bundler
- `webpack-dev-server` - Development server
- `ts-loader` - TypeScript loader for Webpack
- `html-webpack-plugin` - HTML generation
- `copy-webpack-plugin` - Asset copying

## 🔮 Future Enhancements

- [ ] Asset loading and sprite management
- [ ] Weapon system implementation
- [ ] Enemy rendering (when server-side AI is added)
- [ ] Particle effects
- [ ] Sound effects
- [ ] UI improvements (health bar, ammo counter, minimap)
- [ ] Client-side prediction for smoother movement
- [ ] Interpolation for remote players
