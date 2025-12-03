/**
 * Alien Shooter Web - Client Entry Point
 * 
 * Initializes the Phaser game and network connection
 */

import Phaser from 'phaser';
import { GameScene } from './scenes/GameScene';
import { NetworkManager } from './network/NetworkManager';

// Get DOM elements
const connectionPanel = document.getElementById('connection-panel') as HTMLElement;
const playerNameInput = document.getElementById('player-name') as HTMLInputElement;
const serverUrlInput = document.getElementById('server-url') as HTMLInputElement;
const connectButton = document.getElementById('connect-button') as HTMLButtonElement;
const statusMessage = document.getElementById('status-message') as HTMLElement;

let game: Phaser.Game | null = null;
let networkManager: NetworkManager | null = null;

/**
 * Initialize the Phaser game
 */
function initGame(playerName: string): void {
  if (game) {
    return; // Already initialized
  }

  const config: Phaser.Types.Core.GameConfig = {
    type: Phaser.AUTO,
    width: 1024,
    height: 768,
    parent: 'game-container',
    backgroundColor: '#000000',
    scene: [GameScene],
    physics: {
      default: 'arcade',
      arcade: {
        gravity: { x: 0, y: 0 }, // Top-down game, no gravity
        debug: process.env.NODE_ENV !== 'production', // Enable debug in development only
      },
    },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
    },
  };

  game = new Phaser.Game(config);

  // Store player name and network manager in game registry
  game.registry.set('playerName', playerName);
  game.registry.set('networkManager', networkManager);
}

/**
 * Handle connection button click
 */
connectButton.addEventListener('click', async () => {
  const playerName = playerNameInput.value.trim();
  const serverUrl = serverUrlInput.value.trim();

  if (!playerName) {
    statusMessage.textContent = 'Please enter your name';
    statusMessage.style.color = '#ff0000';
    return;
  }

  if (!serverUrl) {
    statusMessage.textContent = 'Please enter server URL';
    statusMessage.style.color = '#ff0000';
    return;
  }

  try {
    connectButton.disabled = true;
    statusMessage.textContent = 'Connecting to server...';
    statusMessage.style.color = '#ffff00';

    // Create network manager
    networkManager = new NetworkManager(serverUrl);

    // Set up connection handlers
    networkManager.on('connected', () => {
      statusMessage.textContent = 'Connected! Starting game...';
      statusMessage.style.color = '#00ff00';
      
      setTimeout(() => {
        connectionPanel.classList.add('hidden');
        initGame(playerName);
      }, 500);
    });

    networkManager.on('connection_error', (error: Error) => {
      statusMessage.textContent = `Connection error: ${error.message}`;
      statusMessage.style.color = '#ff0000';
      connectButton.disabled = false;
    });

    networkManager.on('disconnect', () => {
      statusMessage.textContent = 'Disconnected from server';
      statusMessage.style.color = '#ff0000';
      connectionPanel.classList.remove('hidden');
      connectButton.disabled = false;
      
      if (game) {
        game.destroy(true);
        game = null;
      }
    });

    // Connect to server
    await networkManager.connect(playerName);
  } catch (error) {
    statusMessage.textContent = `Error: ${(error as Error).message}`;
    statusMessage.style.color = '#ff0000';
    connectButton.disabled = false;
  }
});

// Allow Enter key to connect
playerNameInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    connectButton.click();
  }
});

serverUrlInput.addEventListener('keypress', (e) => {
  if (e.key === 'Enter') {
    connectButton.click();
  }
});
