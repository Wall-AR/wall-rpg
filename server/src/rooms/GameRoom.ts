import { Room, Client, matchMaker } from 'colyseus';
import jwt from 'jsonwebtoken';
import { MapState } from '../schemas/MapState.js';
import { PlayerState } from '../schemas/PlayerState.js';
import { MonsterState } from '../schemas/MonsterState.js';
import { JWT_SECRET } from '../middleware/auth.js';
import { MAX_PARTY_SIZE } from '../battle/teamBattle.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const GM_SECRET = process.env.GM_SECRET || 'gm-master-key';

// Map dimensions (matching client map.ts)
const MAP_WIDTH = 32;
const MAP_HEIGHT = 24;
const TILE_SIZE = 32;

const LOBBY_GRID = [
  [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 3, 3, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2],
  [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 4, 4, 0, 0, 0, 0, 2],
  [2, 0, 4, 4, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 4, 4, 4, 4, 0, 0, 0, 2],
  [2, 0, 4, 4, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 0, 0, 1, 1, 1, 0, 0, 0, 0, 4, 4, 0, 0, 0, 0, 2],
  [2, 0, 0, 0, 0, 2, 2, 2, 2, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 2],
  [2, 0, 0, 0, 0, 2, 6, 6, 2, 1, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 1, 2, 6, 6, 2, 0, 0, 0, 5, 5, 0, 2],
  [2, 0, 0, 0, 0, 2, 6, 6, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 6, 6, 2, 0, 0, 5, 5, 5, 0, 2],
  [2, 0, 0, 0, 0, 2, 2, 2, 2, 1, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 1, 2, 2, 2, 2, 0, 0, 5, 5, 5, 0, 2],
  [2, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 5, 0, 0, 2],
  [2, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 2],
  [2, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 2],
  [2, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 2],
  [2, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
  [2, 0, 0, 0, 0, 2, 2, 2, 2, 1, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 1, 2, 2, 2, 2, 0, 0, 0, 0, 0, 0, 2],
  [2, 0, 0, 0, 0, 2, 6, 6, 2, 1, 0, 0, 0, 1, 1, 1, 1, 0, 0, 0, 1, 2, 6, 6, 2, 0, 0, 7, 7, 7, 0, 2],
  [2, 0, 0, 0, 0, 2, 6, 6, 1, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 1, 6, 6, 2, 0, 0, 7, 0, 7, 0, 2],
  [2, 0, 0, 0, 0, 2, 2, 2, 2, 1, 0, 0, 0, 0, 1, 1, 0, 0, 0, 0, 1, 2, 2, 2, 2, 0, 0, 7, 0, 7, 0, 2],
  [2, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 1, 1, 0, 0, 0, 0, 0, 0, 7, 0, 7, 0, 2],
  [2, 0, 4, 4, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 0, 0, 0, 7, 7, 7, 0, 2],
  [2, 0, 4, 4, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 4, 4, 0, 0, 0, 0, 0, 0, 2],
  [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 1, 1, 1, 1, 1, 0, 0, 0, 0, 4, 4, 4, 4, 0, 0, 0, 0, 0, 2],
  [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 4, 4, 0, 0, 0, 0, 0, 0, 2],
  [2, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2],
  [2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2, 2]
];

const getMonsterElement = (type: string): string => {
  const t = type.toLowerCase();
  if (t === 'orc') return 'terra';
  if (t === 'goblin') return 'fogo';
  if (t === 'wolf') return 'vento';
  if (t === 'gargoyle') return 'none';
  return 'none';
};

export class GameRoom extends Room<{ state: MapState }> {
  private gmSessions = new Set<string>();

  private loadStaticGrid() {
    this.state.width = MAP_WIDTH;
    this.state.height = MAP_HEIGHT;
    this.state.grid.clear();
    for (let r = 0; r < LOBBY_GRID.length; r++) {
      for (let c = 0; c < LOBBY_GRID[r].length; c++) {
        this.state.grid.push(LOBBY_GRID[r][c]);
      }
    }
  }

  private isWalkable(gridX: number, gridY: number): boolean {
    if (gridX < 0 || gridX >= this.state.width || gridY < 0 || gridY >= this.state.height) return false;
    const tileIndex = gridY * this.state.width + gridX;
    const tile = this.state.grid[tileIndex];
    return tile !== 2 && tile !== 5 && tile !== 7;
  }

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
    
    const mapId = options.mapId || "default_map";
    this.state.mapId = mapId;

    try {
      const mapPath = path.join(__dirname, '..', 'data', 'maps', `${mapId}.json`);
      if (fs.existsSync(mapPath)) {
        const mapData = JSON.parse(fs.readFileSync(mapPath, 'utf8'));
        this.state.width = mapData.width || 32;
        this.state.height = mapData.height || 24;
        this.state.grid.clear();
        mapData.grid.forEach((tile: number) => this.state.grid.push(tile));
        console.log(`[GameRoom] Loaded map layout dynamically from ${mapId}.json`);
      } else {
        console.warn(`[GameRoom] Map file ${mapId}.json not found. Falling back to static LOBBY_GRID.`);
        this.loadStaticGrid();
      }
    } catch (err) {
      console.error("[GameRoom] Failed to load map layout, using static grid fallback:", err);
      this.loadStaticGrid();
    }

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

    // Handle GM authentication via secret passphrase
    this.onMessage("authenticateGM", (client, data: { secret: string }) => {
      if (data.secret === GM_SECRET) {
        this.gmSessions.add(client.sessionId);
        client.send("gmAuthenticated", { success: true });
        console.log(`[GameRoom] Player ${client.sessionId} authenticated as GM`);
      } else {
        client.send("error", "Invalid GM passphrase");
      }
    });

    // Paint tile handler (GM only)
    this.onMessage("paint_tile", (client, data: { x: number; y: number; tileType: number }) => {
      if (!this.gmSessions.has(client.sessionId)) {
        client.send("error", "Não autorizado como GM.");
        return;
      }
      
      const { x, y, tileType } = data;
      if (x < 0 || x >= this.state.width || y < 0 || y >= this.state.height) return;
      
      const index = y * this.state.width + x;
      this.state.grid[index] = tileType;
      console.log(`[GameRoom] GM ${client.sessionId} painted tile at (${x}, ${y}) to ${tileType}`);
    });

    // Save map handler (GM only)
    this.onMessage("save_map", (client) => {
      if (!this.gmSessions.has(client.sessionId)) {
        client.send("error", "Não autorizado como GM.");
        return;
      }

      try {
        const mapPath = path.join(__dirname, '..', 'data', 'maps', `${this.state.mapId}.json`);
        const mapData = {
          width: this.state.width,
          height: this.state.height,
          grid: Array.from(this.state.grid)
        };
        fs.writeFileSync(mapPath, JSON.stringify(mapData, null, 2), 'utf8');
        console.log(`[GameRoom] GM ${client.sessionId} saved map changes to ${this.state.mapId}.json`);
        this.broadcast("chat", {
          sender: "Sistema",
          text: `🗺️ O mapa "${this.state.mapId}" foi atualizado e salvo com sucesso!`,
          time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
        });
      } catch (err) {
        console.error("[GameRoom] Failed to save map changes:", err);
        client.send("error", "Falha ao salvar as alterações do mapa no servidor.");
      }
    });

    // Handle movement messages from clients (with server-side validation)
    this.onMessage("move", (client, data: { x: number; y: number }) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;

      // Validate data types
      if (typeof data.x !== 'number' || typeof data.y !== 'number') return;

      // Validate bounds
      if (data.x < 0 || data.x >= this.state.width * TILE_SIZE || data.y < 0 || data.y >= this.state.height * TILE_SIZE) return;

      // Validate distance (max 1 tile movement per message)
      const dx = Math.abs(data.x - player.x);
      const dy = Math.abs(data.y - player.y);
      if (dx > TILE_SIZE || dy > TILE_SIZE) return;

      player.x = data.x;
      player.y = data.y;
      player.status = "moving";

      // Collision check with roaming monsters
      const playerGridX = Math.floor(player.x / TILE_SIZE);
      const playerGridY = Math.floor(player.y / TILE_SIZE);

      this.state.monsters.forEach((monster: any) => {
        if (!monster.active) return;
        const monsterGridX = Math.floor(monster.x / TILE_SIZE);
        const monsterGridY = Math.floor(monster.y / TILE_SIZE);
        
        if (playerGridX === monsterGridX && playerGridY === monsterGridY) {
          this.triggerBattleForPlayer(client.sessionId, monster.id);
        }
      });
    });

    // Handle status change messages
    this.onMessage("setStatus", (client, data: { status: string }) => {
      const player = this.state.players.get(client.sessionId);
      if (player) {
        player.status = data.status;
      }
    });

    // Handle real-time chat messages (with sanitization and length limit)
    this.onMessage("chat", (client, data: { text: string }) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;
      if (typeof data.text !== 'string' || data.text.length === 0) return;

      // Sanitize: limit length and strip HTML tags
      const sanitizedText = data.text.substring(0, 200).replace(/<[^>]*>/g, '');

      this.broadcast("chat", {
        sender: player.username,
        text: sanitizedText,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      });
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
          const collectTeam = (captainSessionId: string, partyId: string) => {
            const members: string[] = [];
            if (partyId) {
              this.state.players.forEach((player, sessionId) => {
                if (player.partyId === partyId && members.length < MAX_PARTY_SIZE) members.push(sessionId);
              });
            } else {
              members.push(captainSessionId);
            }
            return members;
          };

          const challengerTeam = collectTeam(data.challengerSessionId, challenger.partyId);
          const targetTeam = collectTeam(client.sessionId, target.partyId);
          const sameParty = challengerTeam.some(sessionId => targetTeam.includes(sessionId));
          if (sameParty) {
            client.send("error", "Jogadores da mesma equipe não podem iniciar um duelo entre si.");
            return;
          }
          if (challengerTeam.length !== targetTeam.length) {
            client.send("error", "Para este duelo, as equipes precisam ter o mesmo tamanho (1×1, 2×2 ou 3×3).");
            return;
          }

          const teamAssignments: Record<string, 'blue' | 'red'> = {};
          const assignAccounts = (sessionIds: string[], teamId: 'blue' | 'red') => {
            sessionIds.forEach(sessionId => {
              const memberClient = this.clients.find(candidate => candidate.sessionId === sessionId);
              const accountId = (memberClient?.auth as { id?: string } | undefined)?.id;
              if (accountId) teamAssignments[accountId] = teamId;
            });
          };
          assignAccounts(challengerTeam, 'blue');
          assignAccounts(targetTeam, 'red');

          const teamSize = challengerTeam.length;
          const battleRoom = await matchMaker.createRoom("battle", {
            mode: teamSize === 1 ? 'duel' : 'team_pvp',
            expectedPlayers: teamSize * 2,
            teamSize,
            teamAssignments,
          });

          [...challengerTeam, ...targetTeam].forEach(sessionId => {
            const memberClient = this.clients.find(candidate => candidate.sessionId === sessionId);
            memberClient?.send("startDuel", {
              roomId: battleRoom.roomId,
              mode: teamSize === 1 ? 'duel' : 'team_pvp',
              teamSize,
            });
          });

          if (teamSize > 1) {
            this.broadcast("chat", {
              sender: "Sistema",
              text: `⚔️ Duelo ${teamSize}×${teamSize} iniciado entre as duas equipes!`,
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
            });
          }
        } catch (err) {
          console.error("Failed to create battle room for duel:", err);
        }
      }
    });

    // Handle GM Narration Event (requires GM authentication)
    this.onMessage("gmNarrate", (client, data: { text: string }) => {
      if (!this.gmSessions.has(client.sessionId)) {
        client.send("error", "Não autorizado como Mestre. Use o comando de autenticação GM.");
        return;
      }
      this.broadcast("narration", {
        text: data.text,
        sender: this.state.players.get(client.sessionId)?.username || "Mestre"
      });
    });

    // Handle GM Monster Spawn Event (requires GM authentication)
    this.onMessage("gmSpawn", (client, data: { type: string, name: string, x: number, y: number }) => {
      if (!this.gmSessions.has(client.sessionId)) {
        client.send("error", "Não autorizado como Mestre.");
        return;
      }
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

    // Handle GM Quest Activation Event (requires GM authentication)
    this.onMessage("gmQuest", (client, data: { id: string, name: string, description: string }) => {
      if (!this.gmSessions.has(client.sessionId)) {
        client.send("error", "Não autorizado como Mestre.");
        return;
      }
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
        let currentMembers = 0;
        this.state.players.forEach(player => {
          if (player.partyId === partyId || (!leader.partyId && player === leader)) currentMembers++;
        });
        if (currentMembers >= MAX_PARTY_SIZE) {
          client.send("error", `A equipe já atingiu o limite de ${MAX_PARTY_SIZE} jogadores.`);
          return;
        }
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
    this.onMessage("triggerBattle", (client, data: { monsterId: string }) => {
      this.triggerBattleForPlayer(client.sessionId, data.monsterId);
    });

    // Encontro PvE determinístico usado pelo NPC Instrutor Kael no caminho dourado.
    this.onMessage("startTestBattle", async (client) => {
      const player = this.state.players.get(client.sessionId);
      if (!player) return;
      try {
        const battleRoom = await matchMaker.createRoom("battle", {
          mode: 'solo',
          expectedPlayers: 1,
          teamSize: 1,
          rosterSize: 5,
          enemyName: 'Instrutor Kael',
        });
        client.send("startBattle", {
          roomId: battleRoom.roomId,
          type: 'wild',
          enemyName: 'Instrutor Kael',
          enemyLevel: 10,
          enemyElement: 'none',
          source: 'training_npc',
        });
      } catch (error) {
        console.error('[GameRoom] Failed to create the training battle:', error);
        client.send("error", "Não foi possível abrir o duelo de teste.");
      }
    });

    // Start roaming interval for active monsters
    this.clock.setInterval(() => {
      this.roamMonsters();
    }, 2000);
  }

  private roamMonsters() {
    this.state.monsters.forEach((monster: any) => {
      if (!monster.active) return;

      // 40% chance of staying in place
      if (Math.random() < 0.4) return;

      const directions = [
        { dx: 0, dy: -1 }, // Up
        { dx: 0, dy: 1 },  // Down
        { dx: -1, dy: 0 }, // Left
        { dx: 1, dy: 0 }   // Right
      ];
      const dir = directions[Math.floor(Math.random() * directions.length)];
      
      const currentGridX = Math.floor(monster.x / TILE_SIZE);
      const currentGridY = Math.floor(monster.y / TILE_SIZE);
      const targetGridX = currentGridX + dir.dx;
      const targetGridY = currentGridY + dir.dy;

      if (this.isWalkable(targetGridX, targetGridY)) {
        monster.x = targetGridX * TILE_SIZE;
        monster.y = targetGridY * TILE_SIZE;

        // Check if any player collided with this monster after it moved
        this.state.players.forEach((player: any, sessionId: string) => {
          const playerGridX = Math.floor(player.x / TILE_SIZE);
          const playerGridY = Math.floor(player.y / TILE_SIZE);
          if (playerGridX === targetGridX && playerGridY === targetGridY) {
            this.triggerBattleForPlayer(sessionId, monster.id);
          }
        });
      }
    });
  }

  private async triggerBattleForPlayer(sessionId: string, monsterId: string) {
    const player = this.state.players.get(sessionId);
    if (!player) return;

    // Cooldown check to prevent duplicate battle room creations
    const now = Date.now();
    const lastTrigger = (player as any).__lastBattleTrigger || 0;
    if (now - lastTrigger < 3000) return;
    (player as any).__lastBattleTrigger = now;

    const monster = this.state.monsters.get(monsterId);
    if (monster && monster.active) {
      monster.active = false; // Deactivate monster

      const client = this.clients.find(c => c.sessionId === sessionId);
      const encounterData = {
        roomId: '',
        type: 'wild' as const,
        enemyName: monster.name,
        enemyElement: getMonsterElement(monster.type),
      };

      try {
        const members: string[] = [];
        if (player.partyId) {
          this.state.players.forEach((p: any, sid: string) => {
            if (p.partyId === player.partyId && members.length < MAX_PARTY_SIZE) {
              members.push(sid);
            }
          });
        } else {
          members.push(sessionId);
        }

        const battleRoom = await matchMaker.createRoom("battle", {
          mode: members.length > 1 ? 'coop' : 'solo',
          expectedPlayers: members.length,
          teamSize: members.length,
        });
        encounterData.roomId = battleRoom.roomId;

        members.forEach(sid => {
          const memberClient = this.clients.find(c => c.sessionId === sid);
          if (memberClient) memberClient.send("startBattle", encounterData);
        });

        // Respawn the monster after 15 seconds in a random walkable tile
        this.clock.setTimeout(() => {
          if (monster) {
            let rx = 14;
            let ry = 10;
            do {
              rx = Math.floor(Math.random() * this.state.width);
              ry = Math.floor(Math.random() * this.state.height);
            } while (!this.isWalkable(rx, ry));
            monster.x = rx * TILE_SIZE;
            monster.y = ry * TILE_SIZE;
            monster.active = true;
            console.log(`[GameRoom] Respawned monster ${monster.name} at (${rx}, ${ry})`);
          }
        }, 15000);

      } catch (err) {
        console.error("Failed to trigger battle on collision:", err);
        monster.active = true; // Reactivate
      }
    }
  }

  override onJoin(client: Client, options: any, auth: any) {
    const player = new PlayerState();
    player.username = auth.username || "Guest";
    player.characterId = auth.characterId || "";
    player.x = (options && options.x !== undefined) ? options.x : 160;
    player.y = (options && options.y !== undefined) ? options.y : 384;
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
