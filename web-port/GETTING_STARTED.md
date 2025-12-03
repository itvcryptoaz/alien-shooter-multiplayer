# Getting Started with Alien Shooter Web

This guide will help you set up and run the Alien Shooter Web multiplayer game on your local machine.

## Prerequisites

Before you begin, ensure you have the following installed:

- **Node.js** (version 18.0.0 or higher)
- **npm** (version 9.0.0 or higher)

To check your versions:
```bash
node --version
npm --version
```

## Installation

### Step 1: Navigate to the web-port directory

```bash
cd web-port
```

### Step 2: Install dependencies

You can install dependencies for all packages at once or individually:

#### Option A: Install all at once
```bash
# Install root dependencies
npm install

# Install shared package dependencies
cd shared && npm install && cd ..

# Install server dependencies
cd server && npm install && cd ..

# Install client dependencies
cd client && npm install && cd ..
```

#### Option B: Use the convenience script (from root)
```bash
npm run install:all
```

### Step 3: Build the shared protocol package

The shared package must be built first since both client and server depend on it:

```bash
cd shared
npm run build
cd ..
```

You should see output indicating TypeScript compilation succeeded, and a `dist/` directory will be created in `shared/`.

## Running the Game

### Development Mode (Recommended)

#### Option A: Run both client and server together

From the `web-port` directory:
```bash
npm run dev
```

This will start both the server and client in development mode with hot-reload enabled.

#### Option B: Run separately (in different terminals)

**Terminal 1 - Start the Server:**
```bash
cd web-port
npm run dev:server
```

You should see:
```
🚀 Alien Shooter Server running on port 3000
Map: default_map
```

**Terminal 2 - Start the Client:**
```bash
cd web-port
npm run dev:client
```

You should see Webpack dev server starting on port 8080.

### Accessing the Game

1. Open your browser and navigate to: **http://localhost:8080**
2. You should see the connection panel
3. Enter your player name (max 15 characters)
4. The server URL should be pre-filled: `http://localhost:3000`
5. Click **CONNECT**
6. Once connected, you'll enter the game

### Controls

- **WASD** or **Arrow Keys** - Move your character
- **Mouse** - Aim your weapon
- **Left Click** - Shoot

### Testing Multiplayer

To test multiplayer functionality:

1. Keep the server running
2. Open multiple browser windows/tabs (or different browsers)
3. Connect from each window with different player names
4. You should see other players appearing as red squares
5. Movement and shooting should sync between all clients

## Production Build

### Building for Production

Build all packages:

```bash
# From web-port directory
npm run build
```

This will:
1. Build the shared protocol library
2. Build the server (TypeScript → JavaScript)
3. Build the client (Webpack production bundle)

### Running in Production

**Start the server:**
```bash
cd web-port
npm run start:server
```

**Serve the client:**

The client files are in `client/dist/`. You can serve them using any static file server:

```bash
# Using Python 3
cd client/dist
python3 -m http.server 8080

# Using Node.js http-server (install with: npm install -g http-server)
cd client/dist
http-server -p 8080

# Using nginx, apache, or any other web server
```

Then open http://localhost:8080 in your browser.

## Troubleshooting

### Issue: "Cannot find module '@alien-shooter-web/shared'"

**Solution:** Make sure you've built the shared package:
```bash
cd web-port/shared
npm run build
```

### Issue: Client can't connect to server

**Possible causes:**
1. Server is not running - check Terminal 1
2. Wrong server URL - make sure it's `http://localhost:3000`
3. CORS issues - the server is configured to allow all origins in development
4. Firewall blocking the connection

### Issue: "EADDRINUSE" error when starting server

**Solution:** Port 3000 is already in use. Either:
1. Stop the process using port 3000
2. Change the port:
   ```bash
   PORT=3001 npm run dev:server
   ```
   (Don't forget to update the server URL in the client to `http://localhost:3001`)

### Issue: Build warnings about bundle size

**Explanation:** This is expected - Phaser 3 is a large library (~7MB). For production, you can:
- Use code splitting (future enhancement)
- Serve with gzip compression
- Use a CDN for Phaser

### Issue: Game runs but players don't appear

**Solution:**
1. Check browser console (F12) for errors
2. Check server terminal for errors
3. Make sure both client and server are using the same protocol version (rebuild if needed)

## Development Tips

### Hot Reload

When using `npm run dev`, changes to the code will automatically reload:

- **Client:** Webpack dev server will hot-reload the browser
- **Server:** ts-node-dev will restart the server when files change

### Debug Mode

The client has physics debug mode enabled by default in development. To see hitboxes and debug info, this is already on.

To disable it, edit `client/src/index.ts`:
```typescript
arcade: {
  debug: false  // Change to false
}
```

### Server Logging

To see Socket.io debug logs:
```bash
DEBUG=socket.io:* npm run dev:server
```

### Viewing Network Traffic

Open browser DevTools (F12) → Network tab → WS (WebSocket) to see real-time packet communication.

## Next Steps

Now that you have the game running, you can:

1. **Read the documentation:**
   - [Main README](README.md) - Project overview
   - [Client README](client/README.md) - Client architecture
   - [Server README](server/README.md) - Server architecture
   - [Design Document](DESIGN.md) - Detailed design decisions

2. **Explore the code:**
   - Protocol definitions: `shared/src/`
   - Server logic: `server/src/index.ts`
   - Client game scene: `client/src/scenes/GameScene.ts`
   - Network manager: `client/src/network/NetworkManager.ts`

3. **Contribute:**
   - Add new features (weapons, enemies, maps)
   - Improve graphics (replace rectangles with sprites)
   - Optimize performance
   - Add sound effects

## Quick Reference

### Common Commands

```bash
# Install all dependencies
npm run install:all

# Build everything
npm run build

# Run in development (client + server)
npm run dev

# Run only server
npm run dev:server

# Run only client
npm run dev:client

# Production server
npm run start:server

# Clean build artifacts
npm run clean
```

### Default Ports

- **Client (Webpack Dev Server):** http://localhost:8080
- **Server (Socket.io):** http://localhost:3000

### Project Structure Quick Reference

```
web-port/
├── shared/       # Protocol definitions (build first!)
├── server/       # Node.js server
├── client/       # Phaser 3 client
└── package.json  # Workspace root
```

## Support

If you encounter any issues:

1. Check this guide's troubleshooting section
2. Review the README files for each component
3. Check the Design Document for architecture details
4. Open an issue on GitHub with:
   - What you were trying to do
   - What happened instead
   - Error messages (from terminal and browser console)
   - Your Node.js and npm versions

Happy coding! 🎮
