import { Schema, type, MapSchema, ArraySchema } from '@colyseus/schema';
import { PlayerState } from './PlayerState.js';
import { MonsterState } from './MonsterState.js';

export class MapState extends Schema {
  @type("string") mapId: string = "";
  @type("number") width: number = 32;
  @type("number") height: number = 24;
  @type(["number"]) grid = new ArraySchema<number>();

  @type({ map: PlayerState }) players = new MapSchema<PlayerState>();
  @type({ map: MonsterState }) monsters = new MapSchema<MonsterState>();
}
