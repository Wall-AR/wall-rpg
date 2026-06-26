import { Room, Client } from 'colyseus';
import jwt from 'jsonwebtoken';
import { MapState } from '../schemas/MapState.js';
import { PlayerState } from '../schemas/PlayerState.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';

export class GameRoom extends Room<{ state: MapState }> {
  override async onAuth(client: Client, options: any, request?: any) {
    const token = options.token;
    if (!token) {
      throw new Error("Authentication failed: No token provided");
    }
    try {
      const decoded = jwt.verify(token, JWT_SECRET) as { id: string; username: string; characterId?: string };
      return decoded;
    } catch (err) {
      throw new Error("Authentication failed: Invalid token");
    }
  }

  override onCreate(options: any) {
    this.setState(new MapState());
    this.state.mapId = options.mapId || "default_map";

    // Handle movement messages from clients
    this.onMessage("move", (client, data: { x: number; y: number }) => {
      const player = this.state.players.get(client.sessionId);
      if (player) {
        player.x = data.x;
        player.y = data.y;
        player.status = "moving";
      }
    });

    // Handle status change messages
    this.onMessage("setStatus", (client, data: { status: string }) => {
      const player = this.state.players.get(client.sessionId);
      if (player) {
        player.status = data.status;
      }
    });
  }

  override onJoin(client: Client, options: any, auth: any) {
    const player = new PlayerState();
    player.username = auth.username || "Guest";
    player.characterId = auth.characterId || "";
    player.x = options.x || 0;
    player.y = options.y || 0;
    player.status = "idle";

    this.state.players.set(client.sessionId, player);
    console.log(`[GameRoom] Player ${player.username} (${client.sessionId}) joined room ${this.roomId}`);
  }

  override onLeave(client: Client, code?: number) {
    const player = this.state.players.get(client.sessionId);
    if (player) {
      console.log(`[GameRoom] Player ${player.username} (${client.sessionId}) left room ${this.roomId}`);
      this.state.players.delete(client.sessionId);
    }
  }

  override onDispose() {
    console.log(`[GameRoom] Room ${this.roomId} disposed`);
  }
}
