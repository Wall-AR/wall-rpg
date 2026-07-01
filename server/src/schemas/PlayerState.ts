import { Schema, type } from '@colyseus/schema';

export class PlayerState extends Schema {
  @type("number") x: number = 0;
  @type("number") y: number = 0;
  @type("string") username: string = "";
  @type("string") characterId: string = "";
  @type("string") status: string = "idle";
  @type("string") partyId: string = "";
}
