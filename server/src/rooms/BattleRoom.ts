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
import {
  assignTeamForJoin,
  BattleRoomConfig,
  BattleRoomOptions,
  BattleTeamId,
  calculatePlanManaCost,
  getDefaultGridSlots,
  gridSlotToPosition,
  manaForTurn,
  normalizeBattleConfig,
  PLANNING_SECONDS,
  validateGridSelection,
} from '../battle/teamBattle.js';
import { ZERO_ACCOUNT_ID, ZERO_TEST_COMPANIONS } from '../testing/zeroAccount.js';

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
  private battleConfig: BattleRoomConfig = normalizeBattleConfig();
  private sessionAccounts = new Map<string, string>();
  private playerPerfectCombos = new Map<string, number>();
  private clientAnimationsComplete = new Set<string>();
  private planningTimeout: any = null;
  private availableCompanions = new Map<string, any[]>();

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

  override onCreate(options: BattleRoomOptions) {
    this.battleConfig = normalizeBattleConfig(options);
    this.maxClients = this.battleConfig.maxClients;
    this.setState(new BattleState());
    this.state.mode = this.battleConfig.mode;
    this.state.expectedPlayers = this.battleConfig.expectedPlayers;
    this.state.maxTeamSize = this.battleConfig.teamSize;
    this.state.rosterSize = this.battleConfig.rosterSize;
    this.state.encounterName = this.battleConfig.enemyName;

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

    // Cada cliente planeja apenas os heróis que controla e confirma uma vez por turno.
    this.onMessage("plan_actions", (client, data: { actions: Record<string, { action: string; spellId?: string; targetId?: string }> }) => {
      if (this.state.status !== "planning") {
        client.send("error", "Não está na fase de planejamento de ações.");
        return;
      }

      const player = this.state.players.get(client.sessionId);
      if (!player) return;
      if (player.hasSelectedAction) {
        client.send("plan_rejected", { reason: "Sua estratégia já foi confirmada neste turno." });
        return;
      }

      const sanitizedActions: Record<string, { action: string; spellId?: string; targetId?: string }> = {};
      for (const combatantId in data.actions || {}) {
        const combatant = player.combatants.get(combatantId);
        if (combatant && combatant.hp > 0) sanitizedActions[combatantId] = data.actions[combatantId];
      }

      const manaCost = calculatePlanManaCost(sanitizedActions);
      if (manaCost > player.mana) {
        client.send("plan_rejected", {
          reason: `Mana insuficiente: a estratégia custa ${manaCost}, mas você possui ${player.mana}.`,
          cost: manaCost,
          mana: player.mana,
        });
        return;
      }

      let plannedCount = 0;
      for (const combatantId in sanitizedActions) {
        const combatant = player.combatants.get(combatantId);
        if (combatant && combatant.hp > 0) {
          const plan = sanitizedActions[combatantId];
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
        player.mana -= manaCost;
        player.hasSelectedAction = true;
        this.state.logs.push(`${player.username} confirmou a estratégia (${manaCost} Mana).`);
      }

      if (this.areAllHumansReady('actions')) {
        this.prepareBotActions();
        this.resolveRound();
      }
    });

    // Solo escolhe 3 heróis; coop/PvP em equipe escolhem 1 herói por jogador.
    this.onMessage("choose_lineup", async (client, data: {
      lineup: string[];
      positions?: Record<string, string>;
      slots?: Record<string, number>;
      runeId: string;
    }) => {
      if (this.state.status !== "confrontation_prep") {
        client.send("error", "Não está na fase de Preparação de Confronto.");
        return;
      }

      const player = this.state.players.get(client.sessionId);
      if (!player) return;
      if (player.hasSelectedLineup) {
        client.send("lineup_rejected", { reason: "Sua formação já foi confirmada." });
        return;
      }

      const chosenLineup = Array.from(new Set(data.lineup || []));
      if (chosenLineup.length !== this.battleConfig.lineupSizePerPlayer) {
        client.send("lineup_rejected", {
          reason: `Escolha exatamente ${this.battleConfig.lineupSizePerPlayer} herói(s) para este modo.`,
        });
        return;
      }

      const defaultSlots = getDefaultGridSlots(chosenLineup.length);
      const requestedSlots = chosenLineup.map((heroId, index) => data.slots?.[heroId] ?? defaultSlots[index]);
      const occupiedSlots = this.getOccupiedTeamSlots(player.teamId as BattleTeamId, client.sessionId);
      const gridValidation = validateGridSelection(requestedSlots, occupiedSlots, chosenLineup.length);
      if (!gridValidation.ok) {
        client.send("lineup_rejected", { reason: gridValidation.reason });
        return;
      }

      const availableCompanions = this.availableCompanions.get(client.sessionId) || [];
      if (availableCompanions.length > 0 && chosenLineup.some(heroId => !availableCompanions.some(companion => companion.id === heroId))) {
        client.send("lineup_rejected", { reason: "Um dos heróis escolhidos não pertence ao roster deste encontro." });
        return;
      }

      chosenLineup.forEach((heroId, index) => {
        const combatant = this.buildCombatant(
          client.sessionId,
          player.teamId as BattleTeamId,
          heroId,
          requestedSlots[index],
          availableCompanions.find(c => c.id === heroId),
          data.runeId,
        );
        player.combatants.set(combatant.id, combatant);
      });

      player.hasSelectedLineup = true;
      this.state.logs.push(`${player.username} confirmou a formação.`);

      if (this.areAllHumansReady('lineup')) {
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

  private getHumanPlayers(): Array<[string, BattlePlayerState]> {
    return Array.from(this.state.players.entries())
      .filter(([, player]) => !player.isBot) as Array<[string, BattlePlayerState]>;
  }

  private areAllHumansReady(kind: 'lineup' | 'actions'): boolean {
    const humans = this.getHumanPlayers();
    if (humans.length < this.battleConfig.expectedPlayers) return false;
    return humans.every(([, player]) => (
      kind === 'lineup' ? player.hasSelectedLineup : player.hasSelectedAction
    ));
  }

  private getOccupiedTeamSlots(teamId: BattleTeamId, excludingSessionId?: string): number[] {
    const occupied: number[] = [];
    this.state.players.forEach((player, sessionId) => {
      if (player.teamId !== teamId || sessionId === excludingSessionId) return;
      player.combatants.forEach(combatant => occupied.push(combatant.gridSlot));
    });
    return occupied;
  }

  private buildCombatant(
    ownerSessionId: string,
    teamId: BattleTeamId,
    heroId: string,
    gridSlot: number,
    dbCompanion?: any,
    runeId = '',
  ): BattleCombatantState {
    const combatant = new BattleCombatantState();
    combatant.id = `${ownerSessionId}--${heroId}`;
    combatant.heroId = heroId;
    combatant.ownerSessionId = ownerSessionId;
    combatant.teamId = teamId;
    combatant.gridSlot = gridSlot;
    combatant.position = gridSlotToPosition(gridSlot);

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
      combatant.intelligence = dbCompanion.stats.intelligence ?? dbCompanion.stats.defense;
      combatant.element = dbCompanion.element;
    } else {
      const stats = CHARACTER_DATABASE[heroId] || CHARACTER_DATABASE['char-caelum'];
      combatant.name = stats.name;
      combatant.class = stats.class;
      combatant.level = stats.level;
      combatant.hp = stats.hp;
      combatant.maxHp = stats.hp;
      combatant.mp = stats.mp;
      combatant.maxMp = stats.mp;
      combatant.speed = stats.speed;
      combatant.strength = stats.strength;
      combatant.intelligence = stats.intelligence;
      combatant.element = stats.element;
    }

    if (runeId === 'runa-vinculo') combatant.speed += 10;
    return combatant;
  }

  private populateDefaultLineup(sessionId: string, player: BattlePlayerState) {
    const lineupSize = this.battleConfig.lineupSizePerPlayer;
    const roster = this.availableCompanions.get(sessionId) || [];
    const heroIds = (roster.length > 0 ? roster.map(companion => companion.id) : ['char-caelum', 'char-lyria', 'char-raven']).slice(0, lineupSize);
    const occupied = this.getOccupiedTeamSlots(player.teamId as BattleTeamId, sessionId);
    const availableSlots = getDefaultGridSlots(9).filter(slot => !occupied.includes(slot));
    heroIds.forEach((heroId, index) => {
      const combatant = this.buildCombatant(
        sessionId,
        player.teamId as BattleTeamId,
        heroId,
        availableSlots[index] ?? index,
        roster.find(companion => companion.id === heroId),
      );
      player.combatants.set(combatant.id, combatant);
    });
    player.hasSelectedLineup = true;
  }

  private ensureBotOpponent() {
    if (!this.battleConfig.usesBotOpponent || this.state.players.has('enemy-ai')) return;
    const bot = new BattlePlayerState();
    bot.username = this.battleConfig.enemyName;
    bot.teamId = 'red';
    bot.isBot = true;
    bot.connected = true;
    bot.hasSelectedLineup = true;
    const botHeroes = ['char-korr', 'char-lobo', 'char-seraphina'];
    getDefaultGridSlots(3).forEach((slot, index) => {
      const combatant = this.buildCombatant('enemy-ai', 'red', botHeroes[index], slot);
      bot.combatants.set(combatant.id, combatant);
    });
    this.state.players.set('enemy-ai', bot);
  }

  private getAliveTeamCombatants(teamId: BattleTeamId) {
    const result: Array<{ player: BattlePlayerState; sessionId: string; combatant: BattleCombatantState }> = [];
    this.state.players.forEach((player, sessionId) => {
      if (player.teamId !== teamId) return;
      player.combatants.forEach(combatant => {
        if (combatant.hp > 0) result.push({ player, sessionId, combatant });
      });
    });
    return result.sort((a, b) => b.combatant.gridSlot - a.combatant.gridSlot);
  }

  private prepareBotActions() {
    this.state.players.forEach(player => {
      if (!player.isBot) return;
      const enemyTeam = player.teamId === 'blue' ? 'red' : 'blue';
      const targets = this.getAliveTeamCombatants(enemyTeam);
      player.combatants.forEach(combatant => {
        if (combatant.hp <= 0) return;
        combatant.selectedAction = 'attack';
        combatant.selectedTargetId = targets[0]?.combatant.id || '';
        combatant.hasSelectedAction = true;
      });
      player.hasSelectedAction = true;
    });
  }

  override async onJoin(client: Client, options: any, auth: any) {
    const player = new BattlePlayerState();
    player.username = auth.username || "Challenger";
    player.characterId = auth.characterId || "";
    player.teamId = assignTeamForJoin(
      this.battleConfig,
      auth.id || '',
      this.getHumanPlayers().length,
    );
    player.isBot = false;
    player.connected = true;

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
    if (db && auth.id) {
      try {
        const roster = await db.select().from(companions).where(eq(companions.accountId, auth.id));
        this.availableCompanions.set(client.sessionId, roster.slice(0, this.battleConfig.rosterSize));
      } catch (_) {
        this.availableCompanions.set(client.sessionId, []);
      }
    } else if (auth.id === ZERO_ACCOUNT_ID) {
      this.availableCompanions.set(client.sessionId, ZERO_TEST_COMPANIONS.slice(0, this.battleConfig.rosterSize));
    }
    this.state.players.set(client.sessionId, player);
    this.state.logs.push(`${player.username} entrou na sala de combate.`);

    console.log(`[BattleRoom] Player ${player.username} joined Battle ${this.roomId}`);

    if (this.getHumanPlayers().length >= this.battleConfig.expectedPlayers) {
      this.ensureBotOpponent();
      this.startConfrontationPrep();
    }
  }

  private startConfrontationPrep() {
    if (this.state.status !== 'waiting') return;
    this.state.status = "confrontation_prep";
    const lineupInstruction = this.battleConfig.lineupSizePerPlayer === 1
      ? 'Cada jogador deve escolher 1 herói e uma casa livre da grade compartilhada.'
      : `Escolha 3 de seus ${this.battleConfig.rosterSize} heróis e suas casas na grade.`;
    this.state.logs.push(`Preparação de Confronto: ${lineupInstruction}`);
    
    // 20-second timeout for pre-battle setup
    this.clock.setTimeout(() => {
      if (this.state.status !== "confrontation_prep") return;

      this.getHumanPlayers().forEach(([sessionId, player]) => {
        if (!player.hasSelectedLineup) {
          this.populateDefaultLineup(sessionId, player);
          this.state.logs.push(`${player.username} não confirmou a tempo — herói e posição padrão ativados.`);
        }
      });

      this.startBattle();
    }, 20000);
  }

  private startBattle() {
    this.state.status = "planning";
    this.state.turn = 1;
    this.state.players.forEach(player => {
      player.maxMana = manaForTurn(1);
      player.mana = player.maxMana;
      player.hasSelectedAction = false;
    });
    this.state.logs.push("A batalha começou! Escolham suas ações na Fase de Planejamento.");
    this.startPlanningTimeout();
  }

  // Timeout de 30s para a fase de planejamento — auto-defende combatentes inativos
  private startPlanningTimeout() {
    if (this.planningTimeout) {
      this.planningTimeout.clear();
    }
    this.state.planningDeadline = Date.now() + PLANNING_SECONDS * 1000;
    this.planningTimeout = this.clock.setTimeout(() => {
      if (this.state.status !== 'planning') return;

      this.getHumanPlayers().forEach(([, p]) => {
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

      this.prepareBotActions();
      this.resolveRound();
    }, PLANNING_SECONDS * 1000);
  }

  private resolveRound() {
    if (this.planningTimeout) {
      this.planningTimeout.clear();
      this.planningTimeout = null;
    }
    this.state.status = "resolving";
    this.state.logs.push(`--- Turno ${this.state.turn}: Fase de Resolução ---`);

    interface CombatantActor {
      state: BattleCombatantState;
      ownerSessionId: string;
      opponentTeamId: BattleTeamId;
    }

    const actors: CombatantActor[] = [];
    this.state.players.forEach((player: any, sessionId: string) => {
      player.combatants.forEach((c: any) => {
        if (c.hp > 0) {
          actors.push({
            state: c,
            ownerSessionId: sessionId,
            opponentTeamId: player.teamId === 'blue' ? 'red' : 'blue',
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

      const opponentCombatants = this.getAliveTeamCombatants(actor.opponentTeamId);
      // Regra base: a casa viva mais à frente protege as casas atrás.
      // Habilidades futuras poderão declarar alvo direto/perfuração no catálogo autoritativo.
      const target = opponentCombatants[0]?.combatant;

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
          const allyTarget = this.getAliveTeamCombatants(actorPlayer.teamId as BattleTeamId)
            .sort((a, b) => a.combatant.hp - b.combatant.hp)[0]?.combatant;
          if (allyTarget) {
            const heal = Math.floor(combatant.intelligence * 1.5) + Math.floor(Math.random() * 8);
            allyTarget.hp = Math.min(allyTarget.maxHp, allyTarget.hp + heal);
            const logMsg = `${combatant.name} curou ${allyTarget.name} restaurando ${heal} de HP.`;
            this.state.logs.push(logMsg);
            roundEvents.push({
              type: 'spell_cure',
              actorId: combatant.id,
              targetId: allyTarget.id,
              heal,
              targetHp: allyTarget.hp,
              log: logMsg,
            });
          }
        } else {
          const baseDmg = Math.floor(combatant.intelligence * 1.3) + Math.floor(Math.random() * 10) + 8;
          const modifier = getElementModifier(combatant.element, target.element);
          let finalDmg = Math.floor(baseDmg * modifier);

          if (target.selectedAction === "defend") finalDmg = Math.floor(finalDmg * 0.5);

          target.hp = Math.max(0, target.hp - finalDmg);

          let comment = "";
          if (modifier > 1) comment = " (Super Efetivo! 🔥)";
          if (modifier < 1) comment = " (Resistido... 🛡️)";
          if (target.selectedAction === "defend") comment += " [Defendido]";

          const logMsg = `${combatant.name} lançou Magia em ${target.name} causando ${finalDmg} de dano${comment}.`;
          this.state.logs.push(logMsg);
          roundEvents.push({
            type: 'spell_attack',
            actorId: combatant.id,
            targetId: target.id,
            damage: finalDmg,
            comment,
            targetHp: target.hp,
            log: logMsg,
          });
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
        
        if (this.getAliveTeamCombatants(actor.opponentTeamId).length === 0) {
          const winnerTeamId = actorPlayer.teamId as BattleTeamId;
          const winnerEntry = this.getHumanPlayers().find(([, player]) => player.teamId === winnerTeamId);
          const logMsgOver = `🎉 A equipe ${actor.opponentTeamId} foi derrotada!\n--- Vencedor: equipe ${winnerTeamId}! ---`;
          this.state.logs.push(logMsgOver);
          roundEvents.push({
            type: 'battle_over',
            winnerSessionId: winnerEntry?.[0] || actor.ownerSessionId,
            winnerTeamId,
            log: logMsgOver
          });
          
          this.state.status = "finished";
          this.state.winnerSessionId = winnerEntry?.[0] || actor.ownerSessionId;
          this.state.winnerTeamId = winnerTeamId;
          
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
      p.maxMana = manaForTurn(this.state.turn + 1);
      p.mana = p.maxMana;
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

          const playerForResult = this.state.players.get(sessionId);
          const isWinner = Boolean(
            playerForResult && this.state.winnerTeamId && playerForResult.teamId === this.state.winnerTeamId,
          );
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
      leavingPlayer.connected = false;
      leavingPlayer.hasSelectedAction = true;
      leavingPlayer.combatants.forEach(combatant => {
        combatant.selectedAction = 'defend';
        combatant.hasSelectedAction = true;
      });
      this.state.logs.push(`${leavingPlayer.username} desconectou e recebeu WO individual.`);

      const connectedTeammates = this.getHumanPlayers()
        .filter(([sessionId, player]) => sessionId !== client.sessionId && player.teamId === leavingPlayer.teamId && player.connected);
      const opponent = (Array.from(this.state.players.entries()) as Array<[string, BattlePlayerState]>)
        .find(([, player]) => player.teamId !== leavingPlayer.teamId && player.connected);
      if (connectedTeammates.length === 0 && opponent) {
        this.state.status = "finished";
        this.state.winnerSessionId = opponent[0];
        this.state.winnerTeamId = opponent[1].teamId;
        this.state.logs.push(`A equipe ${opponent[1].teamId} venceu por WO!`);
        await this.saveBattleHistory();
      }
    }

    if (this.state.status === 'waiting' || this.state.status === 'confrontation_prep') {
      this.state.players.delete(client.sessionId);
    }
  }

  override onDispose() {
    console.log(`[BattleRoom] Battle Room ${this.roomId} disposed`);
  }
}
