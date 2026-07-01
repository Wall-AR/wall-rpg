import { Room, Client, matchMaker } from 'colyseus';
import jwt from 'jsonwebtoken';
import { MapState } from '../schemas/MapState.js';
import { PlayerState } from '../schemas/PlayerState.js';
import { MonsterState } from '../schemas/MonsterState.js';

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

    // Spawn some default monsters in grass areas
    const defaultMonsters = [
      { id: "m1", name: "Orc Silvestre", x: 2 * 32, y: 2 * 32, type: "orc" },
      { id: "m2", name: "Goblin Saqueador", x: 3 * 32, y: 13 * 32, type: "goblin" },
      { id: "m3", name: "Lobo da Areia", x: 20 * 32, y: 2 * 32, type: "wolf" },
      { id: "m4", name: "Gárgula Rúnica", x: 20 * 32, y: 13 * 32, type: "gargoyle" }
    ];

    defaultMonsters.forEach(m => {
      const monster = new MonsterState();
      monster.id = m.id;
      monster.name = m.name;
      monster.x = m.x;
      monster.y = m.y;
      monster.type = m.type;
      monster.active = true;
      this.state.monsters.set(m.id, monster);
    });

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

    // Handle real-time chat messages
    this.onMessage("chat", (client, data: { text: string }) => {
      const player = this.state.players.get(client.sessionId);
      if (player) {
        this.broadcast("chat", {
          sender: player.username,
          text: data.text,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
      }
    });

    // Handle duel invitation requests
    this.onMessage("requestDuel", (client, data: { targetSessionId: string }) => {
      const challenger = this.state.players.get(client.sessionId);
      const target = this.state.players.get(data.targetSessionId);
      
      if (challenger && target) {
        const targetClient = this.clients.find(c => c.sessionId === data.targetSessionId);
        if (targetClient) {
          targetClient.send("duelRequest", {
            challengerSessionId: client.sessionId,
            challengerUsername: challenger.username
          });
        }
      }
    });

    // Handle duel acceptance and battle room creation
    this.onMessage("acceptDuel", async (client, data: { challengerSessionId: string }) => {
      const target = this.state.players.get(client.sessionId);
      const challenger = this.state.players.get(data.challengerSessionId);

      if (target && challenger) {
        try {
          const battleRoom = await matchMaker.createRoom("battle", {});
          const challengerClient = this.clients.find(c => c.sessionId === data.challengerSessionId);
          
          if (challengerClient) {
            challengerClient.send("startDuel", { roomId: battleRoom.roomId });
          }
          client.send("startDuel", { roomId: battleRoom.roomId });
        } catch (err) {
          console.error("Failed to create battle room for duel:", err);
        }
      }
    });

    // Handle GM Narration Event
    this.onMessage("gmNarrate", (client, data: { text: string }) => {
      this.broadcast("narration", {
        text: data.text,
        sender: this.state.players.get(client.sessionId)?.username || "Mestre"
      });
    });

    // Handle GM Monster Spawn Event
    this.onMessage("gmSpawn", (client, data: { type: string, name: string, x: number, y: number }) => {
      const monsterId = `gm-${Date.now()}`;
      const monster = new MonsterState();
      monster.id = monsterId;
      monster.name = data.name;
      monster.x = data.x;
      monster.y = data.y;
      monster.type = data.type;
      monster.active = true;

      this.state.monsters.set(monsterId, monster);
      console.log(`[GameRoom] GM spawned monster ${data.name} at (${data.x}, ${data.y})`);
      
      // Also notify players in chat about GM spawning
      this.broadcast("chat", {
        sender: "Mestre",
        text: `⚡ ATENÇÃO: Um novo ${data.name} surgiu no mapa na posição (${data.x / 32}, ${data.y / 32})!`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    });

    // Handle GM Quest Activation Event
    this.onMessage("gmQuest", (client, data: { id: string, name: string, description: string }) => {
      this.broadcast("newQuest", {
        id: data.id,
        name: data.name,
        description: data.description
      });
      
      // Notify in chat
      this.broadcast("chat", {
        sender: "Mestre",
        text: `📜 MISSÃO ATIVADA: "${data.name}" — ${data.description}`,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
    });

    // Handle party invitations
    this.onMessage("inviteParty", (client, data: { targetSessionId: string }) => {
      const sender = this.state.players.get(client.sessionId);
      const target = this.state.players.get(data.targetSessionId);
      
      if (sender && target) {
        const targetClient = this.clients.find(c => c.sessionId === data.targetSessionId);
        if (targetClient) {
          targetClient.send("partyInvite", {
            leaderSessionId: client.sessionId,
            leaderUsername: sender.username
          });
        }
      }
    });

    // Handle party acceptances
    this.onMessage("acceptParty", (client, data: { leaderSessionId: string }) => {
      const target = this.state.players.get(client.sessionId);
      const leader = this.state.players.get(data.leaderSessionId);

      if (target && leader) {
        const partyId = leader.partyId || `party-${data.leaderSessionId}-${Date.now()}`;
        leader.partyId = partyId;
        target.partyId = partyId;

        this.broadcast("chat", {
          sender: "Sistema",
          text: `👥 ${target.username} juntou-se ao grupo de ${leader.username}!`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
      }
    });

    // Handle leaving a party
    this.onMessage("leaveParty", (client) => {
      const player = this.state.players.get(client.sessionId);
      if (player && player.partyId) {
        player.partyId = "";
        this.broadcast("chat", {
          sender: "Sistema",
          text: `👥 ${player.username} saiu do grupo.`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
      }
    });

    // Handle client monster collision and battle room matchmaking triggers
    this.onMessage("triggerBattle", async (client, data: { monsterId: string }) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;

      const monster = this.state.monsters.get(data.monsterId);
      if (monster && monster.active) {
        monster.active = false; // Deactivate monster on map state

        try {
          const battleRoom = await matchMaker.createRoom("battle", {});
          
          // If in a party, pull everyone into the same battle room!
          if (player.partyId) {
            const members: string[] = [];
            this.state.players.forEach((p, sid) => {
              if (p.partyId === player.partyId) {
                members.push(sid);
              }
            });

            members.forEach(sid => {
              const memberClient = this.clients.find(c => c.sessionId === sid);
              if (memberClient) {
                memberClient.send("startBattle", { roomId: battleRoom.roomId });
              }
            });
          } else {
            client.send("startBattle", { roomId: battleRoom.roomId });
          }
        } catch (err) {
          console.error("Failed to create battle room for encounter:", err);
        }
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
