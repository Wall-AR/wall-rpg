import { Schema, type } from '@colyseus/schema';

export class MonsterState extends Schema {
  @type("string") id: string = "";
  @type("string") name: string = "";
  @type("number") x: number = 0;
  @type("number") y: number = 0;
  @type("string") type: string = "slime";
  @type("boolean") active: boolean = true;
}
