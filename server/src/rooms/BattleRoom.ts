import { Room, Client } from 'colyseus';
import jwt from 'jsonwebtoken';
import { BattleState, BattlePlayerState, BattleCombatantState } from '../schemas/BattleState.js';
import { db } from '../db/index.js';
import { characters, inventory, itemsBase, battleHistory, accounts, retiredCharacters, companions } from '../db/schema.js';
import { eq, and, sql } from 'drizzle-orm';
import { JWT_SECRET } from '../middleware/auth.js';
import {
  GROWTH_HP,
  GROWTH_MP,
  GROWTH_STRENGTH,
  GROWTH_DEFENSE,
  GROWTH_SPEED
} from '../constants/growth.js';

const CHARACTER_DATABASE: Record<string, { name: string; class: string; level: number; hp: number; mp: number; speed: number; strength: number; intelligence: number; element: string }> = {
  'char-caelum': { name: 'Caelum', class: 'Tanque', level: 128, hp: 8645, mp: 210, speed: 95, strength: 120, intelligence: 80, element: 'agua' },
  'char-lyria': { name: 'Lyria', class: 'Mago', level: 124, hp: 6215, mp: 420, speed: 105, strength: 65, intelligence: 180, element: 'none' },
  'char-raven': { name: 'Raven', class: 'Assassino', level: 127, hp: 6085, mp: 200, speed: 140, strength: 145, intelligence: 60, element: 'terra' },
  'char-seraphina': { name: 'Seraphina', class: 'Cleriga', level: 121, hp: 6500, mp: 180, speed: 98, strength: 80, intelligence: 120, element: 'none' },
  'char-lobo': { name: 'Lobo Cinzento', class: 'Companheiro', level: 132, hp: 5980, mp: 160, speed: 115, strength: 110, intelligence: 70, element: 'vento' },
  'char-korr': { name: 'Korr', class: 'Lanceiro', level: 119, hp: 8120, mp: 180, speed: 90, strength: 130, intelligence: 95, element: 'fogo' }
};

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
  private sessionAccounts = new Map<string, string>();
  private playerPerfectCombos = new Map<string, number>();
  private clientAnimationsComplete = new Set<string>();
  private planningTimeout: any = null;

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

    this.onMessage("report_performance", (client, data: { perfectCombos: number }) => {
      this.playerPerfectCombos.set(client.sessionId, data.perfectCombos || 0);
      console.log(`[BattleRoom] Player ${client.sessionId} reported ${data.perfectCombos} perfect combos.`);
    });

    this.onMessage("animation_complete", (client) => {
      this.clientAnimationsComplete.add(client.sessionId);
      console.log(`[BattleRoom] Player ${client.sessionId} finished animations. Waiting for other players...`);
      
      let allFinished = true;
      this.clients.forEach(c => {
        if (!this.clientAnimationsComplete.has(c.sessionId)) allFinished = false;
      });

      if (allFinished) {
        this.nextTurn();
      }
    });

    // Action planning handler for all 3 team combatants
    this.onMessage("plan_actions", (client, data: { actions: Record<string, { action: string; spellId?: string; targetId?: string }> }) => {
      if (this.state.status !== "planning") {
        client.send("error", "Não está na fase de planejamento de ações.");
        return;
      }

      const player = this.state.players.get(client.sessionId);
      if (!player) return;

      let plannedCount = 0;
      for (const combatantId in data.actions) {
        const combatant = player.combatants.get(combatantId);
        if (combatant && combatant.hp > 0) {
          const plan = data.actions[combatantId];
          combatant.selectedAction = plan.action;
          combatant.selectedSpellId = plan.spellId || "";
          combatant.selectedTargetId = plan.targetId || "";
          combatant.hasSelectedAction = true;
          plannedCount++;
        }
      }

      // Check if all alive combatants of this player have selected an action
      let totalAlive = 0;
      player.combatants.forEach((c: any) => { if (c.hp > 0) totalAlive++; });

      if (plannedCount >= totalAlive || totalAlive === 0) {
        player.hasSelectedAction = true;
        this.state.logs.push(`${player.username} planejou as ações táticas.`);
      }

      // Check if both players have made their choices
      let allReady = true;
      this.state.players.forEach((p: any) => {
        if (!p.hasSelectedAction) allReady = false;
      });

      if (allReady) {
        this.resolveRound();
      }
    });

    // Confrontation Prep Selection: Choose 3 of 6 combatants + runes
    this.onMessage("choose_lineup", async (client, data: { lineup: string[]; positions: Record<string, string>; runeId: string }) => {
      if (this.state.status !== "confrontation_prep") {
        client.send("error", "Não está na fase de Preparação de Confronto.");
        return;
      }

      const player = this.state.players.get(client.sessionId);
      if (!player) return;

      const accountId = this.sessionAccounts.get(client.sessionId);
      let dbCompanions: any[] = [];
      if (db && accountId) {
        try {
          dbCompanions = await db.select().from(companions).where(eq(companions.accountId, accountId));
        } catch (_) {}
      }

      // Popula combatentes ativos do time de 3 selecionados
      const chosenLineup = data.lineup || [];
      chosenLineup.forEach(charId => {
        const combatant = new BattleCombatantState();
        combatant.id = charId;
        
        // Tenta carregar do DB real
        const dbCompanion = dbCompanions.find(c => c.id === charId);
        
        if (dbCompanion) {
          combatant.name = dbCompanion.name;
          combatant.class = dbCompanion.class;
          combatant.level = dbCompanion.level;
          combatant.hp = dbCompanion.stats.hp;
          combatant.maxHp = dbCompanion.stats.maxHp || dbCompanion.stats.hp;
          combatant.mp = dbCompanion.stats.mp;
          combatant.maxMp = dbCompanion.stats.maxMp || dbCompanion.stats.mp;
          combatant.speed = dbCompanion.stats.speed;
          combatant.strength = dbCompanion.stats.strength;
          combatant.intelligence = dbCompanion.stats.intelligence !== undefined ? dbCompanion.stats.intelligence : dbCompanion.stats.defense;
          combatant.element = dbCompanion.element;
        } else {
          // Carrega do dicionário CHARACTER_DATABASE ou cria mock padrão
          const dbStats = CHARACTER_DATABASE[charId] || CHARACTER_DATABASE['char-caelum'];
          combatant.name = dbStats.name;
          combatant.class = dbStats.class;
          combatant.level = dbStats.level;
          combatant.hp = dbStats.hp;
          combatant.maxHp = dbStats.hp;
          combatant.mp = dbStats.mp;
          combatant.maxMp = dbStats.mp;
          combatant.speed = dbStats.speed;
          combatant.strength = dbStats.strength;
          combatant.intelligence = dbStats.intelligence;
          combatant.element = dbStats.element;
        }
        combatant.position = data.positions[charId] || "mid";
        combatant.hasSelectedAction = false;
        
        // Aplica modificadores das runas
        if (data.runeId === 'runa-vinculo') {
          combatant.speed += 10; // Runa do Vínculo concede iniciativa extra
        }

        player.combatants.set(charId, combatant);
      });

      player.hasSelectedLineup = true;
      this.state.logs.push(`${player.username} confirmou a formação.`);

      // Check if both players are ready
      let allReady = true;
      this.state.players.forEach((p: any) => {
        if (!p.hasSelectedLineup) allReady = false;
      });

      if (allReady) {
        this.startBattle();
      }
    });

    // Recrutamento Real: Substituir um companheiro atual por Thorn
    this.onMessage("recruit_substitute", async (client, data: { substituteCharacterId: string }) => {
      const accountId = this.sessionAccounts.get(client.sessionId);
      if (!accountId || !db) return;

      const charId = data.substituteCharacterId;
      try {
        // 1. Fetch character to replace
        const charData = await db.select().from(characters).where(and(eq(characters.id, charId), eq(characters.accountId, accountId))).limit(1);
        if (charData && charData.length > 0) {
          const c = charData[0];
          
          // 2. Compilar metadados de Memoria (JRPG Flavor)
          const battles = Math.floor(Math.random() * 150) + 250;
          const victories = Math.floor(battles * 0.72) + 10;
          let role = "Companheiro";
          if (c.name.toLowerCase().includes("lobo")) role = "Companheiro / Suporte";
          else if (c.name.toLowerCase().includes("caelum")) role = "Tanque / Guardião";
          else if (c.name.toLowerCase().includes("lyria")) role = "Mago / Dano";
          else if (c.name.toLowerCase().includes("raven")) role = "Assassino / Dano";

          let rarity = "D";
          if (c.name.toLowerCase().includes("lobo")) {
            rarity = "D"; // Lobo Cinzento eh rank D como no mockup
          } else if (c.level >= 150) {
            rarity = "S+";
          } else if (c.level >= 128) {
            rarity = "S";
          } else if (c.level >= 120) {
            rarity = "B";
          } else if (c.level >= 105) {
            rarity = "A";
          } else if (c.level >= 95) {
            rarity = "C";
          } else {
            rarity = "D";
          }

          const metaJson = {
            rarity,
            role,
            joinedAt: "22/05/2025",
            replacedBy: "Thorn",
            battles,
            victories,
            campaigns: ["Cidade-Portal de Veylar", "Fenda Abissal", "Ecos de Outra Dimensão"],
            notableFeat: c.name.toLowerCase().includes("lobo") 
              ? "Sobreviveu à Fenda Abissal com 1 HP." 
              : "Bloqueou o ataque fulminante de um monstro elite salvando o grupo.",
            farewellQuote: c.name.toLowerCase().includes("lobo")
              ? "Mais que um companheiro, uma memória viva."
              : "Minha jornada física terminou, mas estarei para sempre nas páginas do seu Livro.",
            badges: ["Vínculo Lendário", "Primeiro Companheiro"],
            favorite: false,
          };

          // 3. Insert into retiredCharacters (Livro de Memórias)
          await db.insert(retiredCharacters).values({
            accountId: c.accountId,
            name: c.name,
            level: c.level,
            xp: c.xp,
            element: c.element,
            metadata: metaJson,
          });

          // 3. Delete from characters table
          await db.delete(characters).where(eq(characters.id, charId));

          // 4. Insert new character Thorn
          const username = this.state.players.get(client.sessionId)?.username || "Player";
          await db.insert(characters).values({
            accountId: c.accountId,
            name: `Thorn de ${username}`,
            level: 18,
            xp: 0,
            element: 'terra',
            stats: {
              hp: 1800,
              mp: 90,
              strength: 75,
              defense: 60,
              speed: 55
            },
            dragoonLevel: 0
          });

          this.state.logs.push(`${username} desencantou ${c.name} (enviado ao Livro de Memórias) e recrutou Thorn!`);
          client.send("recruit_success", { message: `Você substituiu ${c.name} por Thorn!` });
        } else {
          client.send("recruit_error", { message: "Companheiro para substituir não encontrado." });
        }
      } catch (err) {
        console.error("[BattleRoom] Error during recruit substitution:", err);
        client.send("recruit_error", { message: "Erro ao processar substituição no banco de dados." });
      }
    });

    // Converter em Orbes de Alma (+25)
    this.onMessage("recruit_convert", async (client) => {
      const accountId = this.sessionAccounts.get(client.sessionId);
      if (!accountId || !db) return;

      try {
        // Increment soulOrbs in accounts table
        await db.update(accounts)
          .set({ soulOrbs: sql`${accounts.soulOrbs} + 25` })
          .where(eq(accounts.id, accountId));

        const username = this.state.players.get(client.sessionId)?.username || "Player";
        this.state.logs.push(`${username} converteu Thorn em 25 Orbes de Alma.`);
        client.send("recruit_success", { message: "Convertido com sucesso! +25 Orbes de Alma adicionados." });
      } catch (err) {
        console.error("[BattleRoom] Error converting Thorn to Orbs:", err);
        client.send("recruit_error", { message: "Erro ao converter no banco de dados." });
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

    this.sessionAccounts.set(client.sessionId, auth.id || "");
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

      this.state.players.forEach((p: any) => {
        if (!p.hasSelectedLineup) {
          // Auto-select lineup with fallbacks
          const defaultLineup = ['char-caelum', 'char-lyria', 'char-raven'];
          defaultLineup.forEach(charId => {
            const combatant = new BattleCombatantState();
            combatant.id = charId;
            const dbStats = CHARACTER_DATABASE[charId];
            combatant.name = dbStats.name;
            combatant.class = dbStats.class;
            combatant.level = dbStats.level;
            combatant.hp = dbStats.hp;
            combatant.maxHp = dbStats.hp;
            combatant.mp = dbStats.mp;
            combatant.maxMp = dbStats.mp;
            combatant.speed = dbStats.speed;
            combatant.strength = dbStats.strength;
            combatant.intelligence = dbStats.intelligence;
            combatant.element = dbStats.element;
            combatant.position = charId === 'char-caelum' ? 'front' : charId === 'char-raven' ? 'mid' : 'back';
            combatant.hasSelectedAction = false;
            p.combatants.set(charId, combatant);
          });
          p.hasSelectedLineup = true;
          this.state.logs.push(`${p.username} não confirmou a tempo — formação padrão ativa.`);
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

  // Timeout de 30s para a fase de planejamento — auto-defende combatentes inativos
  private startPlanningTimeout() {
    if (this.planningTimeout) {
      this.planningTimeout.clear();
    }
    this.planningTimeout = this.clock.setTimeout(() => {
      if (this.state.status !== 'planning') return;

      this.state.players.forEach((p: any) => {
        if (!p.hasSelectedAction) {
          p.combatants.forEach((c: any) => {
            if (c.hp > 0 && !c.hasSelectedAction) {
              c.selectedAction = 'defend';
              c.hasSelectedAction = true;
            }
          });
          p.hasSelectedAction = true;
          this.state.logs.push(`${p.username} não agiu a tempo — defesa automática de sua equipe.`);
        }
      });

      this.resolveRound();
    }, 30000);
  }

  private resolveRound() {
    if (this.planningTimeout) {
      this.planningTimeout.clear();
      this.planningTimeout = null;
    }
    this.state.status = "resolving";
    this.state.logs.push(`--- Turno ${this.state.turn}: Fase de Resolução ---`);

    const sessions = Array.from(this.state.players.keys()) as string[];
    
    interface CombatantActor {
      state: BattleCombatantState;
      ownerSessionId: string;
      opponentSessionId: string;
    }

    const actors: CombatantActor[] = [];
    this.state.players.forEach((player: any, sessionId: string) => {
      const oppSessionId = sessions.find(id => id !== sessionId)!;
      player.combatants.forEach((c: any) => {
        if (c.hp > 0) {
          actors.push({
            state: c,
            ownerSessionId: sessionId,
            opponentSessionId: oppSessionId
          });
        }
      });
    });

    // Ordenar fila de combatentes por velocidade individual (Decrescente)
    actors.sort((a, b) => b.state.speed - a.state.speed);

    const roundEvents: any[] = [];

    // Executa ação de cada combatente
    for (let i = 0; i < actors.length; i++) {
      const actor = actors[i];
      const combatant = actor.state;

      // Ignora se o combatente morreu antes de agir nesta rodada
      if (combatant.hp <= 0) continue;

      const actorPlayer = this.state.players.get(actor.ownerSessionId)!;
      const oppPlayer = this.state.players.get(actor.opponentSessionId)!;

      if (combatant.selectedAction === "defend") {
        const logMsg = `${combatant.name} (${actorPlayer.username}) assumiu postura defensiva.`;
        this.state.logs.push(logMsg);
        roundEvents.push({
          type: 'defend',
          actorId: combatant.id,
          actorUsername: actorPlayer.username,
          log: logMsg
        });
        continue;
      }

      // Acha alvo vivo
      let target = oppPlayer.combatants.get(combatant.selectedTargetId);
      if (!target || target.hp <= 0) {
        // Redireciona para o primeiro inimigo vivo
        target = (Array.from(oppPlayer.combatants.values()) as any[]).find(c => c.hp > 0);
      }

      if (!target) continue; // Sem inimigos vivos

      if (combatant.selectedAction === "attack") {
        const baseDmg = Math.floor(combatant.strength * 0.85) + Math.floor(Math.random() * 8) + 5;
        const modifier = getElementModifier(combatant.element, target.element);
        let finalDmg = Math.floor(baseDmg * modifier);

        if (target.selectedAction === "defend") {
          finalDmg = Math.floor(finalDmg * 0.5);
        }

        target.hp = Math.max(0, target.hp - finalDmg);

        let comment = "";
        if (modifier > 1) comment = " (Super Efetivo! 🔥)";
        if (modifier < 1) comment = " (Resistido... 🛡️)";
        if (target.selectedAction === "defend") comment += " [Defendido]";

        const logMsg = `${combatant.name} atacou ${target.name} causando ${finalDmg} de dano${comment}.`;
        this.state.logs.push(logMsg);
        roundEvents.push({
          type: 'attack',
          actorId: combatant.id,
          targetId: target.id,
          damage: finalDmg,
          comment: comment,
          targetHp: target.hp,
          log: logMsg
        });
      }

      if (combatant.selectedAction === "spell") {
        if (combatant.selectedSpellId === "cure") {
          const mpCost = 10;
          if (combatant.mp < mpCost) {
            const logMsg = `${combatant.name} tentou usar Cura mas não tem MP suficiente (${combatant.mp}/${mpCost}).`;
            this.state.logs.push(logMsg);
            roundEvents.push({
              type: 'spell_cure_fail',
              actorId: combatant.id,
              log: logMsg
            });
          } else {
            combatant.mp -= mpCost;
            // Cura o aliado com menor HP
            const allyTarget = (Array.from(actorPlayer.combatants.values()) as any[])
              .filter(c => c.hp > 0)
              .sort((a, b) => a.hp - b.hp)[0];
            if (allyTarget) {
              const heal = Math.floor(combatant.intelligence * 1.5) + Math.floor(Math.random() * 8);
              allyTarget.hp = Math.min(allyTarget.maxHp, allyTarget.hp + heal);
              const logMsg = `${combatant.name} curou ${allyTarget.name} restaurando ${heal} de HP. (MP: ${combatant.mp}/${combatant.maxMp})`;
              this.state.logs.push(logMsg);
              roundEvents.push({
                type: 'spell_cure',
                actorId: combatant.id,
                targetId: allyTarget.id,
                heal: heal,
                actorMp: combatant.mp,
                targetHp: allyTarget.hp,
                log: logMsg
              });
            }
          }
        } else {
          // Spell ofensiva
          const mpCost = 15;
          if (combatant.mp < mpCost) {
            const logMsg = `${combatant.name} tentou lançar magia mas não tem MP suficiente (${combatant.mp}/${mpCost}).`;
            this.state.logs.push(logMsg);
            roundEvents.push({
              type: 'spell_attack_fail',
              actorId: combatant.id,
              log: logMsg
            });
          } else {
            combatant.mp -= mpCost;
            const baseDmg = Math.floor(combatant.intelligence * 1.3) + Math.floor(Math.random() * 10) + 8;
            const modifier = getElementModifier(combatant.element, target.element);
            let finalDmg = Math.floor(baseDmg * modifier);

            if (target.selectedAction === "defend") {
              finalDmg = Math.floor(finalDmg * 0.5);
            }

            target.hp = Math.max(0, target.hp - finalDmg);

            let comment = "";
            if (modifier > 1) comment = " (Super Efetivo! 🔥)";
            if (modifier < 1) comment = " (Resistido... 🛡️)";
            if (target.selectedAction === "defend") comment += " [Defendido]";

            const logMsg = `${combatant.name} lançou Magia em ${target.name} causando ${finalDmg} de dano${comment}. (MP: ${combatant.mp}/${combatant.maxMp})`;
            this.state.logs.push(logMsg);
            roundEvents.push({
              type: 'spell_attack',
              actorId: combatant.id,
              targetId: target.id,
              damage: finalDmg,
              comment: comment,
              actorMp: combatant.mp,
              targetHp: target.hp,
              log: logMsg
            });
          }
        }
      }

      if (target.hp <= 0) {
        const logMsg = `💀 ${target.name} desmaiou.`;
        this.state.logs.push(logMsg);
        roundEvents.push({
          type: 'death',
          actorId: target.id,
          log: logMsg
        });
        
        // Verifica se a equipe do oponente foi totalmente aniquilada
        let oppAliveCount = 0;
        oppPlayer.combatants.forEach((c: any) => { if (c.hp > 0) oppAliveCount++; });

        if (oppAliveCount === 0) {
          const logMsgOver = `🎉 A equipe de ${oppPlayer.username} foi totalmente derrotada!\n--- Batalha Encerrada. Vencedor: ${actorPlayer.username}! ---`;
          this.state.logs.push(logMsgOver);
          roundEvents.push({
            type: 'battle_over',
            winnerSessionId: actor.ownerSessionId,
            log: logMsgOver
          });
          
          this.state.status = "finished";
          this.state.winnerSessionId = actor.ownerSessionId;
          
          this.broadcast("round_resolved", { events: roundEvents });
          this.saveBattleHistory();
          return;
        }
      }
    }

    // Broadcast do resultado da rodada para animações passo-a-passo
    this.broadcast("round_resolved", { events: roundEvents });

    // Fallback de segurança para avançar o turno se clientes travarem (15s)
    this.clock.setTimeout(() => {
      if (this.state.status === "resolving") {
        console.log("[BattleRoom] Timeout das animações atingido, forçando próximo turno.");
        this.nextTurn();
      }
    }, 15000);
  }

  private nextTurn() {
    this.clientAnimationsComplete.clear();

    // Reset de escolhas para o próximo round
    this.state.players.forEach((p: any) => {
      p.hasSelectedAction = false;
      p.combatants.forEach((c: any) => {
        c.hasSelectedAction = false;
        c.selectedAction = "none";
        c.selectedSpellId = "";
        c.selectedTargetId = "";
      });
    });

    this.state.turn += 1;
    this.state.status = "planning";
    this.state.logs.push(`--- Turno ${this.state.turn}: Fase de Planejamento ---`);
    this.startPlanningTimeout();
  }

  private async saveBattleHistory() {
    try {
      if (db) {
        const playerIds = Array.from(this.state.players.keys())
          .map(sid => this.sessionAccounts.get(sid))
          .filter(Boolean) as string[];
        const logs = Array.from(this.state.logs);
        await db.insert(battleHistory).values({
          playerIds,
          result: this.state.winnerSessionId ? 'victory' : 'draw',
          xpGained: 250,
          log: logs,
        });

        // Distribui XP e loot no banco para cada participante
        for (const sessionId of this.state.players.keys()) {
          const accountId = this.sessionAccounts.get(sessionId);
          if (!accountId) continue;

          const isWinner = this.state.winnerSessionId === sessionId;
          let xpGained = isWinner ? 250 : 50;

          // Encontra ID do personagem do jogador
          const playerState = this.state.players.get(sessionId);
          if (playerState && playerState.characterId) {
            try {
              // Calcular combos perfeitos e bônus
              const perfectCombos = this.playerPerfectCombos.get(sessionId) || 0;
              if (perfectCombos > 0) {
                const bonusXp = perfectCombos * 50;
                const bonusOrbs = perfectCombos * 5;
                xpGained += bonusXp;

                // Concede Soul Orbs extras no banco de dados
                await db.update(accounts)
                  .set({ soulOrbs: sql`${accounts.soulOrbs} + ${bonusOrbs}` })
                  .where(eq(accounts.id, accountId));

                this.state.logs.push(`✨ [Combo Perfeito]: ${playerState.username} realizou ${perfectCombos} combos perfeito(s) e obteve +${bonusXp} EXP e +${bonusOrbs} Orbes de Alma!`);

                // Drop extra de loot do Baú da Taverna (Cristal)
                try {
                  await db.insert(inventory).values({
                    accountId,
                    itemId: "stone",
                    slot: -1,
                    quantity: 1,
                    metadata: { type: "loot", name: "Cristal Rúnico (Baú da Taverna)" }
                  });
                  this.state.logs.push(`🔓 [Baú da Taverna]: ${playerState.username} destravou o baú da taverna e ganhou 1x Cristal Rúnico!`);
                } catch (_) {}
              }

              const charData = await db.select().from(characters).where(eq(characters.id, playerState.characterId)).limit(1);
              if (charData && charData.length > 0) {
                const char = charData[0];
                let newXp = char.xp + xpGained;
                let newLevel = char.level;
                let newStats = { ...(char.stats || { hp: 100, mp: 50, strength: 10, defense: 10, speed: 10 }) };

                // Formula simples de Level Up: level * 150 de XP
                let levelUpOccurred = false;
                while (newXp >= newLevel * 150) {
                  newXp -= newLevel * 150;
                  newLevel += 1;
                  newStats.hp += GROWTH_HP;
                  newStats.mp += GROWTH_MP;
                  newStats.strength += GROWTH_STRENGTH;
                  newStats.defense += GROWTH_DEFENSE;
                  newStats.speed += GROWTH_SPEED;
                  levelUpOccurred = true;
                }

                await db.update(characters)
                  .set({ xp: newXp, level: newLevel, stats: newStats })
                  .where(eq(characters.id, playerState.characterId));

                if (levelUpOccurred) {
                  this.state.logs.push(`⭐ ${char.name} subiu para o nível ${newLevel}!`);
                }

                // Evoluir a arma equipada do personagem (Progressão Infinita)
                try {
                  const equippedWeapon = await db.select()
                    .from(inventory)
                    .where(and(eq(inventory.equippedCharacterId, playerState.characterId), eq(inventory.slot, 0)))
                    .limit(1);

                  if (equippedWeapon.length > 0) {
                    const weapon = equippedWeapon[0];
                    let weaponXp = weapon.xp + xpGained;
                    let weaponLevel = weapon.level;
                    let weaponLevelUp = false;

                    // Evolução infinita de armas: cada nível exige level * 100 de XP
                    while (weaponXp >= weaponLevel * 100) {
                      weaponXp -= weaponLevel * 100;
                      weaponLevel += 1;
                      weaponLevelUp = true;
                    }

                    await db.update(inventory)
                      .set({ xp: weaponXp, level: weaponLevel })
                      .where(eq(inventory.id, weapon.id));

                    if (weaponLevelUp) {
                      const meta = (weapon.metadata || {}) as Record<string, any>;
                      const weaponName = meta.name || "Arma Equipada";
                      this.state.logs.push(`⚔️ A arma [${weaponName}] subiu para o Nível ${weaponLevel}!`);
                    }
                  }
                } catch (weaponErr) {
                  console.error("[BattleRoom] Falha ao evoluir arma:", weaponErr);
                }
              }
            } catch (err) {
              console.error("[BattleRoom] Falha ao atualizar XP no banco:", err);
            }

            // Drop de loot para o vencedor (50% de chance de cristal)
            if (isWinner && Math.random() < 0.5) {
              try {
                // stone eh um item_id verificado nas texturas e base_items
                await db.insert(inventory).values({
                  accountId,
                  itemId: "stone",
                  slot: -1, // Mochila
                  quantity: 1,
                  metadata: { type: "loot", name: "Cristal" }
                });
                this.state.logs.push(`🎁 ${playerState.username} recebeu um Cristal.`);
              } catch (_) { /* fallback se constraint de itemsBase falhar */ }
            }
          }
        }
      }
      console.log(`[BattleRoom] Battle history and rewards processed for room ${this.roomId}`);
    } catch (err) {
      console.error('[BattleRoom] Error saving battle history:', err);
    }
  }

  override async onLeave(client: Client, code?: number) {
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
        await this.saveBattleHistory();
      }
    }
    
    this.state.players.delete(client.sessionId);
  }

  override onDispose() {
    console.log(`[BattleRoom] Battle Room ${this.roomId} disposed`);
  }
}
