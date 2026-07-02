import { Schema, type, MapSchema, ArraySchema } from '@colyseus/schema';

export class BattleCombatantState extends Schema {
  @type("string") id: string = "";
  @type("string") name: string = "";
  @type("string") class: string = "";
  @type("number") level: number = 1;
  @type("number") hp: number = 100;
  @type("number") maxHp: number = 100;
  @type("number") mp: number = 50;
  @type("number") maxMp: number = 50;
  @type("number") speed: number = 10;
  @type("number") strength: number = 10;
  @type("number") intelligence: number = 10;
  @type("string") element: string = "none";
  @type("string") position: string = "mid"; // 'front', 'mid', 'back'
  @type("boolean") hasSelectedAction: boolean = false;

  // Planificado privadamente no servidor (oculto de sincronizacao de rede)
  selectedAction: string = "none"; // 'attack', 'defend', 'spell', 'item', 'none'
  selectedSpellId: string = "";
  selectedTargetId: string = ""; // ID do combatente inimigo visado
}

export class BattlePlayerState extends Schema {
  @type("string") username: string = "";
  @type("string") characterId: string = "";
  
  // Single char fallbacks (legado para compatibilidade se necessario)
  @type("number") hp: number = 100;
  @type("number") maxHp: number = 100;
  @type("number") mp: number = 50;
  @type("number") maxMp: number = 50;
  @type("number") speed: number = 10;
  @type("number") strength: number = 10;
  @type("number") intelligence: number = 10;
  @type("string") weaponElement: string = "none";

  @type("boolean") hasSelectedAction: boolean = false;
  @type("boolean") hasSelectedLineup: boolean = false;
  
  // Combatentes ativos selecionados para o confronto 3v3
  @type({ map: BattleCombatantState }) combatants = new MapSchema<BattleCombatantState>();

  selectedAction: string = "none";
  selectedSpellId: string = "";
}

export class BattleState extends Schema {
  @type("string") status: string = "waiting"; // 'waiting', 'confrontation_prep', 'planning', 'resolving', 'finished'
  @type("number") turn: number = 1;
  @type({ map: BattlePlayerState }) players = new MapSchema<BattlePlayerState>();
  @type(["string"]) logs = new ArraySchema<string>();
  @type("string") winnerSessionId: string = "";
}
