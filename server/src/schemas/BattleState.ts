import { Schema, type, MapSchema, ArraySchema } from '@colyseus/schema';

export class BattlePlayerState extends Schema {
  @type("string") username: string = "";
  @type("string") characterId: string = "";
  @type("number") hp: number = 100;
  @type("number") maxHp: number = 100;
  @type("number") mp: number = 50;
  @type("number") maxMp: number = 50;
  @type("number") speed: number = 10;
  @type("boolean") hasSelectedAction: boolean = false;
}

export class BattleState extends Schema {
  @type("string") status: string = "waiting"; // 'waiting', 'player_turn', 'executing', 'finished'
  @type("number") turn: number = 1;
  @type("string") activePlayerSessionId: string = "";
  @type({ map: BattlePlayerState }) players = new MapSchema<BattlePlayerState>();
  @type(["string"]) logs = new ArraySchema<string>();
  @type("string") winnerSessionId: string = "";
}
