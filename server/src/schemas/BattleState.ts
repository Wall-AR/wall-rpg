import { Schema, type, MapSchema, ArraySchema } from '@colyseus/schema';

export class BattlePlayerState extends Schema {
  @type("string") username: string = "";
  @type("string") characterId: string = "";
  @type("number") hp: number = 100;
  @type("number") maxHp: number = 100;
  @type("number") mp: number = 50;
  @type("number") maxMp: number = 50;
  @type("number") speed: number = 10;
  @type("number") strength: number = 10;
  @type("number") intelligence: number = 10;
  @type("string") weaponElement: string = "none"; // 'none', 'terra', 'vento', 'agua', 'fogo'
  
  // Turn choices
  @type("boolean") hasSelectedAction: boolean = false;
  @type("boolean") hasSelectedLineup: boolean = false;
  // NOT synced to clients — prevents opponent from seeing chosen action during planning
  selectedAction: string = "none"; // 'attack', 'defend', 'spell', 'item', 'none'
  selectedSpellId: string = "";
}

export class BattleState extends Schema {
  @type("string") status: string = "waiting"; // 'waiting', 'planning', 'resolving', 'finished'
  @type("number") turn: number = 1;
  @type({ map: BattlePlayerState }) players = new MapSchema<BattlePlayerState>();
  @type(["string"]) logs = new ArraySchema<string>();
  @type("string") winnerSessionId: string = "";
}
