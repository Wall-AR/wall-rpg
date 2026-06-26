import { Room, Client } from 'colyseus';
import jwt from 'jsonwebtoken';
import { BattleState, BattlePlayerState } from '../schemas/BattleState.js';

const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';

export class BattleRoom extends Room<{ state: BattleState }> {
  override maxClients = 2;

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
    this.setState(new BattleState());

    // Action handling from active player
    this.onMessage("action", (client, data: { type: 'attack' | 'heal' }) => {
      if (this.state.status !== "player_turn") {
        client.send("error", "Not the action selection phase.");
        return;
      }

      if (client.sessionId !== this.state.activePlayerSessionId) {
        client.send("error", "It is not your turn.");
        return;
      }

      if (data.type !== "attack" && data.type !== "heal") {
        client.send("error", "Invalid action type.");
        return;
      }

      this.executeTurn(client.sessionId, data.type);
    });
  }

  override onJoin(client: Client, options: any, auth: any) {
    const player = new BattlePlayerState();
    player.username = auth.username || "Challenger";
    player.characterId = auth.characterId || "";
    player.hp = 100;
    player.maxHp = 100;
    player.mp = 50;
    player.maxMp = 50;
    player.speed = options.speed || Math.floor(Math.random() * 5) + 8; // Random speed between 8 and 12
    player.hasSelectedAction = false;

    this.state.players.set(client.sessionId, player);
    this.state.logs.push(`Player ${player.username} has joined the battle.`);

    console.log(`[BattleRoom] Player ${player.username} (${client.sessionId}) joined Battle ${this.roomId}`);

    // If both players are here, start the battle
    if (this.state.players.size === 2) {
      this.startBattle();
    }
  }

  private startBattle() {
    this.state.status = "player_turn";
    this.state.turn = 1;

    // Decide who goes first based on speed
    const sessions = Array.from(this.state.players.keys());
    const p1 = this.state.players.get(sessions[0])!;
    const p2 = this.state.players.get(sessions[1])!;

    if (p1.speed >= p2.speed) {
      this.state.activePlayerSessionId = sessions[0];
    } else {
      this.state.activePlayerSessionId = sessions[1];
    }

    const activePlayer = this.state.players.get(this.state.activePlayerSessionId)!;
    this.state.logs.push(`The battle begins! ${activePlayer.username} takes the first turn.`);
  }

  private executeTurn(sessionId: string, actionType: 'attack' | 'heal') {
    this.state.status = "executing";

    const attacker = this.state.players.get(sessionId)!;
    const targetSessionId = Array.from(this.state.players.keys()).find(id => id !== sessionId)!;
    const target = this.state.players.get(targetSessionId)!;

    if (actionType === "attack") {
      const damage = Math.floor(Math.random() * 15) + 10; // 10-24 damage
      target.hp = Math.max(0, target.hp - damage);
      this.state.logs.push(`${attacker.username} attacks ${target.username} for ${damage} damage!`);
    } else if (actionType === "heal") {
      const healAmount = Math.floor(Math.random() * 15) + 15; // 15-29 HP healed
      attacker.hp = Math.min(attacker.maxHp, attacker.hp + healAmount);
      this.state.logs.push(`${attacker.username} casts Heal, restoring ${healAmount} HP!`);
    }

    // Check win condition
    if (target.hp <= 0) {
      this.state.logs.push(`${target.username} has been defeated!`);
      this.state.status = "finished";
      this.state.winnerSessionId = sessionId;
      this.state.logs.push(`${attacker.username} wins the battle!`);
      this.saveBattleHistory();
      return;
    }

    // Switch turns
    this.state.activePlayerSessionId = targetSessionId;
    this.state.turn += 1;
    this.state.status = "player_turn";
    this.state.logs.push(`It is now ${target.username}'s turn.`);
  }

  private async saveBattleHistory() {
    try {
      console.log(`[BattleRoom] Saving battle history for Battle ${this.roomId}...`);
      // Future DB logic with drizzle schema will save the battle results here.
    } catch (err) {
      console.error("[BattleRoom] Error saving battle history:", err);
    }
  }

  override onLeave(client: Client, code?: number) {
    console.log(`[BattleRoom] Player left: ${client.sessionId}`);
    
    if (this.state.status !== "finished" && this.state.players.has(client.sessionId)) {
      const leavingPlayer = this.state.players.get(client.sessionId)!;
      this.state.logs.push(`${leavingPlayer.username} fled from the battle!`);
      
      const winnerSessionId = Array.from(this.state.players.keys()).find(id => id !== client.sessionId);
      if (winnerSessionId) {
        const winner = this.state.players.get(winnerSessionId)!;
        this.state.status = "finished";
        this.state.winnerSessionId = winnerSessionId;
        this.state.logs.push(`${winner.username} wins by forfeit!`);
        this.saveBattleHistory();
      }
    }
    
    this.state.players.delete(client.sessionId);
  }

  override onDispose() {
    console.log(`[BattleRoom] Battle Room ${this.roomId} disposed`);
  }
}
