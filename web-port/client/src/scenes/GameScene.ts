/**
 * Main Game Scene
 * 
 * Handles the main gameplay, rendering, and player controls
 */

import Phaser from 'phaser';
import { NetworkManager } from '../network/NetworkManager';
import { MpActor, MpSPacketActorSyncItem, MpSPacketUsersSync } from '@alien-shooter-web/shared';

// Constants
const DIAGONAL_MOVEMENT_FACTOR = Math.SQRT1_2; // 1/√2 ≈ 0.707, normalizes diagonal movement speed

interface RemotePlayer {
  sprite: Phaser.GameObjects.Rectangle;
  nameText: Phaser.GameObjects.Text;
  healthBar: Phaser.GameObjects.Graphics;
  actor: MpActor;
  name: string;
}

export class GameScene extends Phaser.Scene {
  private player!: Phaser.GameObjects.Rectangle;
  private playerNameText!: Phaser.GameObjects.Text;
  private playerHealthBar!: Phaser.GameObjects.Graphics;
  private cursors!: Phaser.Types.Input.Keyboard.CursorKeys;
  private wasdKeys!: {
    W: Phaser.Input.Keyboard.Key;
    A: Phaser.Input.Keyboard.Key;
    S: Phaser.Input.Keyboard.Key;
    D: Phaser.Input.Keyboard.Key;
  };
  private networkManager!: NetworkManager;
  private playerName!: string;
  
  // Player state
  private localActor: MpActor = {
    x: 512,
    y: 384,
    z: 0,
    velocity: 0,
    directionLegs: 0,
    directionTorso: 0,
    armedWeapon: 0,
    health: 100,
  };

  // Remote players
  private remotePlayers: Map<number, RemotePlayer> = new Map();
  
  // Update tracking
  private lastActorSync: number = 0;
  private actorSyncInterval: number = 30; // ms

  constructor() {
    super({ key: 'GameScene' });
  }

  create(): void {
    // Get network manager and player name from registry
    this.networkManager = this.registry.get('networkManager') as NetworkManager;
    this.playerName = this.registry.get('playerName') as string;

    // Set up world
    this.cameras.main.setBackgroundColor('#1a1a1a');

    // Create local player (simple rectangle for now)
    this.player = this.add.rectangle(
      this.localActor.x,
      this.localActor.y,
      32,
      32,
      0x00ff00
    );

    // Create player name text
    this.playerNameText = this.add.text(
      this.player.x,
      this.player.y - 30,
      this.playerName,
      {
        fontSize: '14px',
        color: '#00ff00',
        stroke: '#000000',
        strokeThickness: 2,
      }
    );
    this.playerNameText.setOrigin(0.5);

    // Create health bar
    this.playerHealthBar = this.add.graphics();

    // Set up input
    this.cursors = this.input.keyboard!.createCursorKeys();
    this.wasdKeys = {
      W: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.W),
      A: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.A),
      S: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.S),
      D: this.input.keyboard!.addKey(Phaser.Input.Keyboard.KeyCodes.D),
    };

    // Set up mouse shooting
    this.input.on('pointerdown', (pointer: Phaser.Input.Pointer) => {
      this.handleShoot(pointer.x + this.cameras.main.scrollX, pointer.y + this.cameras.main.scrollY);
    });

    // Set up network event handlers
    this.setupNetworkHandlers();

    // Add instructions
    this.add.text(10, 10, 'WASD to move, Mouse to aim/shoot', {
      fontSize: '16px',
      color: '#00ff00',
      backgroundColor: '#000000',
      padding: { x: 10, y: 5 },
    });
  }

  private setupNetworkHandlers(): void {
    // Handle actor sync updates from server
    this.networkManager.on('actors_sync', (data: any) => {
      data.items.forEach((item: MpSPacketActorSyncItem) => {
        this.updateRemotePlayer(item.id, item.mpActor);
      });
    });

    // Handle user sync updates from server
    this.networkManager.on('users_sync', (data: MpSPacketUsersSync) => {
      data.items.forEach((item) => {
        const remotePlayer = this.remotePlayers.get(item.id);
        if (remotePlayer) {
          remotePlayer.name = item.mpUser.name;
          remotePlayer.nameText.setText(item.mpUser.name);
        }
      });
    });

    // Handle shoot events from other players
    this.networkManager.on('shoot', (data: any) => {
      this.showShootEffect(data.x, data.y);
    });
  }

  update(time: number, delta: number): void {
    // Handle player movement
    const speed = 200; // pixels per second
    let velocityX = 0;
    let velocityY = 0;

    if (this.wasdKeys.W.isDown || this.cursors.up.isDown) {
      velocityY = -speed;
    } else if (this.wasdKeys.S.isDown || this.cursors.down.isDown) {
      velocityY = speed;
    }

    if (this.wasdKeys.A.isDown || this.cursors.left.isDown) {
      velocityX = -speed;
    } else if (this.wasdKeys.D.isDown || this.cursors.right.isDown) {
      velocityX = speed;
    }

    // Normalize diagonal movement
    if (velocityX !== 0 && velocityY !== 0) {
      velocityX *= DIAGONAL_MOVEMENT_FACTOR;
      velocityY *= DIAGONAL_MOVEMENT_FACTOR;
    }

    // Update player position
    this.localActor.x += (velocityX * delta) / 1000;
    this.localActor.y += (velocityY * delta) / 1000;
    this.localActor.velocity = Math.sqrt(velocityX * velocityX + velocityY * velocityY);

    // Calculate direction based on mouse position
    const pointer = this.input.activePointer;
    const worldX = pointer.x + this.cameras.main.scrollX;
    const worldY = pointer.y + this.cameras.main.scrollY;
    const angle = Math.atan2(worldY - this.localActor.y, worldX - this.localActor.x);
    this.localActor.directionTorso = Math.floor(((angle + Math.PI) / (2 * Math.PI)) * 256);
    
    // Direction legs matches torso when moving
    if (this.localActor.velocity > 0) {
      const moveAngle = Math.atan2(velocityY, velocityX);
      this.localActor.directionLegs = Math.floor(((moveAngle + Math.PI) / (2 * Math.PI)) * 256);
    }

    // Update visual representation
    this.player.setPosition(this.localActor.x, this.localActor.y);
    this.playerNameText.setPosition(this.player.x, this.player.y - 30);
    this.updateHealthBar(this.playerHealthBar, this.player.x, this.player.y, this.localActor.health);

    // Send actor sync to server
    if (time - this.lastActorSync > this.actorSyncInterval) {
      this.networkManager.sendActorSync(this.localActor);
      this.lastActorSync = time;
    }
  }

  private updateRemotePlayer(id: number, actor: MpActor): void {
    let remotePlayer = this.remotePlayers.get(id);

    if (!remotePlayer) {
      // Create new remote player
      const sprite = this.add.rectangle(actor.x, actor.y, 32, 32, 0xff0000);
      const nameText = this.add.text(actor.x, actor.y - 30, `Player ${id}`, {
        fontSize: '14px',
        color: '#ff0000',
        stroke: '#000000',
        strokeThickness: 2,
      });
      nameText.setOrigin(0.5);

      const healthBar = this.add.graphics();

      remotePlayer = {
        sprite,
        nameText,
        healthBar,
        actor,
        name: `Player ${id}`,
      };

      this.remotePlayers.set(id, remotePlayer);
    }

    // Update remote player state
    remotePlayer.actor = actor;
    remotePlayer.sprite.setPosition(actor.x, actor.y);
    remotePlayer.nameText.setPosition(actor.x, actor.y - 30);
    this.updateHealthBar(remotePlayer.healthBar, actor.x, actor.y, actor.health);
  }

  private updateHealthBar(graphics: Phaser.GameObjects.Graphics, x: number, y: number, health: number): void {
    graphics.clear();
    
    const barWidth = 40;
    const barHeight = 4;
    const healthPercent = health / 100;

    // Background
    graphics.fillStyle(0x000000, 0.5);
    graphics.fillRect(x - barWidth / 2, y + 20, barWidth, barHeight);

    // Health
    graphics.fillStyle(healthPercent > 0.5 ? 0x00ff00 : healthPercent > 0.25 ? 0xffff00 : 0xff0000);
    graphics.fillRect(x - barWidth / 2, y + 20, barWidth * healthPercent, barHeight);
  }

  private handleShoot(x: number, y: number): void {
    // Send shoot event to server
    this.networkManager.sendShoot(x, y);

    // Show local shoot effect
    this.showShootEffect(x, y);
  }

  private showShootEffect(targetX: number, targetY: number): void {
    // Create a simple line from player to target
    const graphics = this.add.graphics();
    graphics.lineStyle(2, 0xffff00, 1);
    graphics.lineBetween(this.localActor.x, this.localActor.y, targetX, targetY);

    // Fade out and destroy
    this.tweens.add({
      targets: graphics,
      alpha: 0,
      duration: 100,
      onComplete: () => {
        graphics.destroy();
      },
    });

    // Create impact effect
    const impact = this.add.circle(targetX, targetY, 5, 0xff8800);
    this.tweens.add({
      targets: impact,
      scale: 2,
      alpha: 0,
      duration: 200,
      onComplete: () => {
        impact.destroy();
      },
    });
  }
}
