export interface Character {
  id: string;
  name: string;
  level: number;
  xp: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  sp: number;
  maxSp: number;
  at: number;
  df: number;
  mat: number;
  mdf: number;
  speed: number;
  element: ElementType;
  dragoonLevel: number;
  additions: Addition[];
  equipment: Equipment;
  soulOrbs?: number;
}

export type ElementType = 'fire' | 'water' | 'wind' | 'earth' | 'light' | 'darkness' | 'thunder' | 'non-elemental';

export interface Addition {
  name: string;
  hits: number;
  damagePercent: number;
  spGain: number;
  level: number;
  maxLevel: number;
  uses: number;
}

export interface Equipment {
  weapon: Weapon | null;
  armor: Armor | null;
  accessory: Accessory | null;
}

export interface Weapon {
  id: string;
  name: string;
  level: number;
  xp: number;
  maxXp: number;
  atk: number;
  tradeLimit: number;
  tradesLeft: number;
  ownerId: string;
}

export interface Armor {
  id: string;
  name: string;
  def: number;
}

export interface Accessory {
  id: string;
  name: string;
  effects: string[];
}

export interface BattleState {
  turnOrder: string[];
  currentTurn: number;
  phase: 'idle' | 'addition' | 'counter' | 'dragoon' | 'result';
  actors: BattleActor[];
}

export interface BattleActor {
  id: string;
  name: string;
  hp: number;
  maxHp: number;
  sp: number;
  isDragoon: boolean;
  isPlayer: boolean;
  element: ElementType;
}

export interface Player {
  id: string;
  username: string;
  party: Character[];
  friends: string[];
  online: boolean;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  timeLimit: number;
  rewards: QuestReward[];
  penalty: string;
  active: boolean;
}

export interface QuestReward {
  type: 'xp' | 'item' | 'weapon' | 'character';
  value: string;
  amount: number;
}
