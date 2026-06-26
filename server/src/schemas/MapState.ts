import { Schema, type, MapSchema } from '@colyseus/schema';
import { PlayerState } from './PlayerState.js';

export class MapState extends Schema {
  @type("string") mapId: string = "";
  @type({ map: PlayerState }) players = new MapSchema<PlayerState>();
}
