import { Room, Client } from 'colyseus';
import jwt from 'jsonwebtoken';
import { BattleState, BattlePlayerState } from '../schemas/BattleState.js';
import { db } from '../db/index.js';
import { characters, inventory, itemsBase, battleHistory } from '../db/schema.js';
import { eq, and } from 'drizzle-orm';
import { JWT_SECRET } from '../middleware/auth.js';

const getElementModifier = (attackerEl: string, defenderEl: string): number => {
  const el = attackerEl.toLowerCase();
  const def = defenderEl.toLowerCase();
  if (el === def || el === "none" || def === "none") return 1.0;

  // Terra > Vento > Agua > Fogo > Terra
  if (
    (el === "terra" && def === "vento") ||
    (el === "vento" && def === "agua") ||
    (el === "agua" && def === "fogo") ||
    (el === "fogo" && def === "terra")
  ) {
    return 1.5; // 50% bonus
  }

  if (
    (def === "terra" && el === "vento") ||
    (def === "vento" && el === "agua") ||
    (def === "agua" && el === "fogo") ||
    (def === "fogo" && el === "terra")
  ) {
    return 0.75; // 25% penalty
  }

  return 1.0;
};

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
    this.onMessage("action", (client, data: { action: string; spellId?: string }) => {
      if (this.state.status !== "planning") {
        client.send("error", "Not the action selection phase.");
        return;
      }

      const player = this.state.players.get(client.sessionId);
      if (!player) {
        client.send("error", "Player not found in battle.");
        return;
      }

      const allowedActions = ["attack", "defend", "spell", "item"];
      if (!allowedActions.includes(data.action)) {
        client.send("error", "Invalid action selection.");
        return;
      }

      player.selectedAction = data.action;
      player.selectedSpellId = data.spellId || "";
      player.hasSelectedAction = true;

      this.state.logs.push(`${player.username} está pronto.`);

      // Check if both players have made their choices
      let allReady = true;
      this.state.players.forEach(p => {
        if (!p.hasSelectedAction) allReady = false;
      });

      if (allReady) {
        this.resolveRound();
      }
    });

    // Confrontation Prep Selection: Choose 3 of 6 combatants + runes
    this.onMessage("choose_lineup", (client, data: { lineup: string[]; positions: Record<string, string>; runeId: string }) => {
      if (this.state.status !== "confrontation_prep") {
        client.send("error", "Não está na fase de Preparação de Confronto.");
        return;
      }

      const player = this.state.players.get(client.sessionId);
      if (!player) return;

      player.hasSelectedLineup = true;
      this.state.logs.push(`${player.username} confirmou a formação.`);

      // Check if both players are ready
      let allReady = true;
      this.state.players.forEach(p => {
        if (!p.hasSelectedLineup) allReady = false;
      });

      if (allReady) {
        this.startBattle();
      }
    });
  }

  override async onJoin(client: Client, options: any, auth: any) {
    const player = new BattlePlayerState();
    player.username = auth.username || "Challenger";
    player.characterId = auth.characterId || "";

    // 1. Load actual stats from database (with safe fallback)
    let charHp = 100;
    let charMp = 50;
    let charSpeed = 10;
    let charStrength = 12;
    let charIntelligence = 10;
    let weaponEl = "none";

    if (db && auth.characterId) {
      try {
        const charData = await db.select().from(characters).where(eq(characters.id, auth.characterId)).limit(1);
        if (charData && charData.length > 0) {
          const c = charData[0];
          if (c.stats) {
            charHp = c.stats.hp;
            charMp = c.stats.mp;
            charSpeed = c.stats.speed;
            charStrength = c.stats.strength;
            // Usar defense como proxy para poder mágico até campo intelligence ser adicionado ao schema
            charIntelligence = c.stats.defense;
          }
          // Carregar elemento da arma equipada do inventário
          try {
            const equippedWeapon = await db!.select({ metadata: inventory.metadata })
              .from(inventory)
              .innerJoin(itemsBase, eq(inventory.itemId, itemsBase.id))
              .where(and(eq(inventory.equippedCharacterId, auth.characterId), eq(inventory.slot, 0)))
              .limit(1);
            if (equippedWeapon.length > 0) {
              const meta = (equippedWeapon[0].metadata || {}) as Record<string, any>;
              weaponEl = meta.element || 'none';
            }
          } catch (_) { /* fallback para 'none' */ }
        }
      } catch (err) {
        console.warn("[BattleRoom] DB query failed, using mock default stats:", err);
      }
    }

    player.hp = charHp;
    player.maxHp = charHp;
    player.mp = charMp;
    player.maxMp = charMp;
    player.speed = charSpeed;
    player.strength = charStrength;
    player.intelligence = charIntelligence;
    player.weaponElement = weaponEl;
    player.hasSelectedAction = false;
    player.hasSelectedLineup = false;

    this.state.players.set(client.sessionId, player);
    this.state.logs.push(`${player.username} entrou na sala de combate.`);

    console.log(`[BattleRoom] Player ${player.username} joined Battle ${this.roomId}`);

    if (this.state.players.size === 2) {
      this.startConfrontationPrep();
    }
  }

  private startConfrontationPrep() {
    this.state.status = "confrontation_prep";
    this.state.logs.push("Preparação de Confronto: Escolham 3 de seus 6 combatentes e suas runas.");
    
    // 20-second timeout for pre-battle setup
    this.clock.setTimeout(() => {
      if (this.state.status !== "confrontation_prep") return;

      this.state.players.forEach(p => {
        if (!p.hasSelectedLineup) {
          p.hasSelectedLineup = true;
          this.state.logs.push(`${p.username} não confirmou a tempo — formação selecionada automaticamente.`);
        }
      });

      this.startBattle();
    }, 20000);
  }

  private startBattle() {
    this.state.status = "planning";
    this.state.turn = 1;
    this.state.logs.push("A batalha começou! Escolham suas ações na Fase de Planejamento.");
    this.startPlanningTimeout();
  }

  // Timeout de 30s para a fase de planejamento — auto-defende jogadores inativos
  private startPlanningTimeout() {
    this.clock.setTimeout(() => {
      if (this.state.status !== 'planning') return;

      let allReady = true;
      this.state.players.forEach(p => {
        if (!p.hasSelectedAction) {
          p.selectedAction = 'defend';
          p.hasSelectedAction = true;
          this.state.logs.push(`${p.username} não agiu a tempo — defesa automática.`);
        }
      });

      this.resolveRound();
    }, 30000);
  }

  private resolveRound() {
    this.state.status = "resolving";
    this.state.logs.push(`--- Turno ${this.state.turn}: Fase de Resolução ---`);

    const sessions = Array.from(this.state.players.keys());
    const playersList = sessions.map(id => ({ id, state: this.state.players.get(id)! }));

    // Sort by Speed descending
    playersList.sort((a, b) => b.state.speed - a.state.speed);

    // Apply actions in speed order
    for (let i = 0; i < playersList.length; i++) {
      const actor = playersList[i];
      const actorState = actor.state;

      // Skip fainted players
      if (actorState.hp <= 0) continue;

      const targetId = sessions.find(id => id !== actor.id)!;
      const targetState = this.state.players.get(targetId)!;

      if (actorState.selectedAction === "defend") {
        this.state.logs.push(`${actorState.username} assume postura defensiva.`);
        continue;
      }

      if (actorState.selectedAction === "attack") {
        // Base damage formula based on strength
        const baseDmg = Math.floor(actorState.strength * 0.8) + Math.floor(Math.random() * 5) + 3; // e.g. 10-18 dmg
        
        // Element calculation
        const modifier = getElementModifier(actorState.weaponElement, targetState.weaponElement);
        let finalDmg = Math.floor(baseDmg * modifier);

        // Adjust if target is defending
        if (targetState.selectedAction === "defend") {
          finalDmg = Math.floor(finalDmg * 0.5);
          this.state.logs.push(`${targetState.username} defendeu parte do golpe.`);
        }

        targetState.hp = Math.max(0, targetState.hp - finalDmg);

        let elemComment = "";
        if (modifier > 1) elemComment = " (Super Efetivo! 🔥)";
        if (modifier < 1) elemComment = " (Resistido... 🛡️)";

        this.state.logs.push(
          `${actorState.username} atacou ${targetState.username} causando ${finalDmg} de dano${elemComment}.`
        );
      }

      if (actorState.selectedAction === "spell") {
        if (actorState.selectedSpellId === "cure") {
          const mpCost = 10;
          if (actorState.mp < mpCost) {
            this.state.logs.push(`${actorState.username} tentou usar Cura mas não tem MP suficiente (${actorState.mp}/${mpCost}).`);
          } else {
            actorState.mp -= mpCost;
            const heal = Math.floor(actorState.intelligence * 1.5) + Math.floor(Math.random() * 5);
            actorState.hp = Math.min(actorState.maxHp, actorState.hp + heal);
            this.state.logs.push(`${actorState.username} usou Cura restaurando ${heal} de HP. (MP: ${actorState.mp}/${actorState.maxMp})`);
          }
        } else {
          const mpCost = 15;
          if (actorState.mp < mpCost) {
            this.state.logs.push(`${actorState.username} tentou lançar magia mas não tem MP suficiente (${actorState.mp}/${mpCost}).`);
          } else {
            actorState.mp -= mpCost;
            // Ataque mágico
            const baseDmg = Math.floor(actorState.intelligence * 1.2) + Math.floor(Math.random() * 4) + 5;
            const modifier = getElementModifier(actorState.weaponElement, targetState.weaponElement);
            let finalDmg = Math.floor(baseDmg * modifier);

            if (targetState.selectedAction === "defend") {
              finalDmg = Math.floor(finalDmg * 0.5);
            }

            targetState.hp = Math.max(0, targetState.hp - finalDmg);
            this.state.logs.push(`${actorState.username} lançou magia em ${targetState.username} causando ${finalDmg} de dano. (MP: ${actorState.mp}/${actorState.maxMp})`);
          }
        }
      }

      // Check win condition immediately
      if (targetState.hp <= 0) {
        this.state.logs.push(`${targetState.username} desmaiou.`);
        this.state.status = "finished";
        this.state.winnerSessionId = actor.id;
        this.state.logs.push(`--- Batalha Encerrada. Vencedor: ${actorState.username}! ---`);
        this.saveBattleHistory();
        return;
      }
    }

    // Reset planning actions for next round
    this.state.players.forEach(p => {
      p.hasSelectedAction = false;
      p.selectedAction = "none";
      p.selectedSpellId = "";
    });

    this.state.turn += 1;
    this.state.status = "planning";
    this.state.logs.push("Novo turno iniciado. Selecionem suas ações.");
    this.startPlanningTimeout();
  }

  private async saveBattleHistory() {
    try {
      if (db) {
        const playerIds = Array.from(this.state.players.keys());
        const logs = Array.from(this.state.logs);
        await db.insert(battleHistory).values({
          playerIds,
          result: this.state.winnerSessionId ? 'victory' : 'draw',
          xpGained: 0,
          log: logs,
        });
      }
      console.log(`[BattleRoom] Battle history saved for room ${this.roomId}`);
    } catch (err) {
      console.error('[BattleRoom] Error saving battle history:', err);
    }
  }

  override onLeave(client: Client, code?: number) {
    console.log(`[BattleRoom] Player left: ${client.sessionId}`);
    
    if (this.state.status !== "finished" && this.state.players.has(client.sessionId)) {
      const leavingPlayer = this.state.players.get(client.sessionId)!;
      this.state.logs.push(`${leavingPlayer.username} fugiu da batalha!`);
      
      const winnerSessionId = Array.from(this.state.players.keys()).find(id => id !== client.sessionId);
      if (winnerSessionId) {
        const winner = this.state.players.get(winnerSessionId)!;
        this.state.status = "finished";
        this.state.winnerSessionId = winnerSessionId;
        this.state.logs.push(`${winner.username} venceu por WO!`);
        this.saveBattleHistory();
      }
    }
    
    this.state.players.delete(client.sessionId);
  }

  override onDispose() {
    console.log(`[BattleRoom] Battle Room ${this.roomId} disposed`);
  }
}
