export type BattleMode = 'solo' | 'coop' | 'duel' | 'team_pvp' | 'brawl';
export type BattleTeamId = 'blue' | 'red';

export const MAX_PARTY_SIZE = 3;
export const GRID_SLOT_COUNT = 9;
export const MAX_MANA = 10;
export const PLANNING_SECONDS = 30;

export interface BattleRoomOptions {
  mode?: BattleMode;
  expectedPlayers?: number;
  teamSize?: number;
  rosterSize?: number;
  enemyName?: string;
  teamAssignments?: Record<string, BattleTeamId>;
}

export interface BattleRoomConfig {
  mode: BattleMode;
  expectedPlayers: number;
  teamSize: number;
  maxClients: number;
  usesBotOpponent: boolean;
  lineupSizePerPlayer: number;
  rosterSize: number;
  enemyName: string;
  teamAssignments: Record<string, BattleTeamId>;
}

const clampInteger = (value: unknown, min: number, max: number, fallback: number) => {
  const numeric = Number(value);
  if (!Number.isFinite(numeric)) return fallback;
  return Math.min(max, Math.max(min, Math.floor(numeric)));
};

export const normalizeBattleConfig = (options: BattleRoomOptions = {}): BattleRoomConfig => {
  const mode = options.mode || 'duel';
  const rosterSize = clampInteger(options.rosterSize, 3, 5, 5);
  const enemyName = typeof options.enemyName === 'string' && options.enemyName.trim()
    ? options.enemyName.trim().slice(0, 60)
    : 'Guardiões da Fenda';

  if (mode === 'solo') {
    return {
      mode,
      expectedPlayers: 1,
      teamSize: 1,
      maxClients: 1,
      usesBotOpponent: true,
      lineupSizePerPlayer: 3,
      rosterSize,
      enemyName,
      teamAssignments: options.teamAssignments || {},
    };
  }

  if (mode === 'coop') {
    const expectedPlayers = clampInteger(options.expectedPlayers, 1, MAX_PARTY_SIZE, 1);
    return {
      mode,
      expectedPlayers,
      teamSize: expectedPlayers,
      maxClients: expectedPlayers,
      usesBotOpponent: true,
      lineupSizePerPlayer: 1,
      rosterSize,
      enemyName,
      teamAssignments: options.teamAssignments || {},
    };
  }

  if (mode === 'team_pvp') {
    const teamSize = clampInteger(options.teamSize, 1, MAX_PARTY_SIZE, 1);
    return {
      mode,
      expectedPlayers: teamSize * 2,
      teamSize,
      maxClients: teamSize * 2,
      usesBotOpponent: false,
      lineupSizePerPlayer: 1,
      rosterSize,
      enemyName,
      teamAssignments: options.teamAssignments || {},
    };
  }

  if (mode === 'brawl') {
    return {
      mode,
      expectedPlayers: 8,
      teamSize: 1,
      maxClients: 8,
      usesBotOpponent: false,
      lineupSizePerPlayer: 3,
      rosterSize,
      enemyName,
      teamAssignments: options.teamAssignments || {},
    };
  }

  return {
    mode: 'duel',
    expectedPlayers: 2,
    teamSize: 1,
    maxClients: 2,
    usesBotOpponent: false,
    lineupSizePerPlayer: 1,
    rosterSize,
    enemyName,
    teamAssignments: options.teamAssignments || {},
  };
};

export const assignTeamForJoin = (
  config: BattleRoomConfig,
  accountId: string,
  humanJoinIndex: number,
): BattleTeamId => {
  const assigned = config.teamAssignments[accountId];
  if (assigned) return assigned;
  if (config.mode === 'solo' || config.mode === 'coop') return 'blue';
  if (config.mode === 'brawl') return humanJoinIndex % 2 === 0 ? 'blue' : 'red';
  return humanJoinIndex < config.teamSize ? 'blue' : 'red';
};

export const isValidGridSlot = (slot: number) => Number.isInteger(slot) && slot >= 0 && slot < GRID_SLOT_COUNT;

export const validateGridSelection = (
  requestedSlots: number[],
  occupiedSlots: number[],
  expectedCount: number,
): { ok: true } | { ok: false; reason: string } => {
  if (requestedSlots.length !== expectedCount) {
    return { ok: false, reason: `Selecione exatamente ${expectedCount} posição(ões).` };
  }
  if (requestedSlots.some(slot => !isValidGridSlot(slot))) {
    return { ok: false, reason: 'Uma das posições está fora da grade 3×3.' };
  }
  if (new Set(requestedSlots).size !== requestedSlots.length) {
    return { ok: false, reason: 'Dois heróis não podem ocupar a mesma casa.' };
  }
  if (requestedSlots.some(slot => occupiedSlots.includes(slot))) {
    return { ok: false, reason: 'Essa casa já está ocupada por um aliado.' };
  }
  return { ok: true };
};

export const gridSlotToPosition = (slot: number): 'front' | 'mid' | 'back' => {
  if (slot >= 6) return 'front';
  if (slot >= 3) return 'mid';
  return 'back';
};

export const getDefaultGridSlots = (count: number): number[] => {
  const preferred = [7, 4, 1, 6, 8, 3, 5, 0, 2];
  return preferred.slice(0, clampInteger(count, 0, GRID_SLOT_COUNT, 0));
};

export const manaForTurn = (turn: number) => Math.min(MAX_MANA, Math.max(1, Math.floor(turn)));

export const SPELL_MANA_COSTS: Record<string, number> = {
  'wolf-bite': 3,
  'holy-barrier': 4,
  cure: 4,
  'earth-smash': 5,
  'fire-charge': 5,
  'shadow-strike': 6,
  'nova-astral': 8,
};

export const getActionManaCost = (action: string, spellId = ''): number => {
  if (action === 'attack' || action === 'defend' || action === 'none') return 0;
  if (action === 'spell') return SPELL_MANA_COSTS[spellId] ?? 5;
  if (action === 'substitute') return 3;
  if (action === 'reposition') return 1;
  if (action === 'item') return 2;
  return 0;
};

export const calculatePlanManaCost = (
  actions: Record<string, { action: string; spellId?: string }>,
) => Object.values(actions).reduce(
  (total, action) => total + getActionManaCost(action.action, action.spellId),
  0,
);
