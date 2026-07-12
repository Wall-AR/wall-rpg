export interface Teammate {
  id: string;
  heroId?: string;
  ownerSessionId?: string;
  teamId?: 'blue' | 'red';
  gridSlot?: number;
  entityType?: 'hero' | 'clone' | 'token' | 'barrier' | 'summon';
  controllable?: boolean;
  name: string;
  class: string;
  level: number;
  hp: number;
  maxHp: number;
  mp: number;
  maxMp: number;
  element: 'fogo' | 'agua' | 'terra' | 'vento' | 'none';
  position: 'front' | 'mid' | 'back';
  portrait: string;
  rank: 'S+' | 'S' | 'A' | 'D';
  spells: { id: string; name: string; cost: number; desc: string }[];
  active?: boolean;
}

export interface Rune {
  id: string;
  name: string;
  desc: string;
  icon: string;
}

export interface BattleStateData {
  status: 'waiting' | 'confrontation_prep' | 'planning' | 'resolving' | 'finished';
  mode: 'solo' | 'coop' | 'duel' | 'team_pvp' | 'brawl';
  turn: number;
  expectedPlayers: number;
  maxTeamSize: number;
  planningDeadline: number;
  winnerSessionId: string | null;
  winnerTeamId: string | null;
  logs: string[];
  players: Record<string, {
    username: string;
    teamId: 'blue' | 'red';
    isBot: boolean;
    connected: boolean;
    mana: number;
    maxMana: number;
    hp: number;
    maxHp: number;
    mp: number;
    maxMp: number;
    speed: number;
    strength: number;
    intelligence: number;
    weaponElement: string;
    hasSelectedAction: boolean;
    hasSelectedLineup: boolean;
  }>;
}

export const RUNES_LIST: Rune[] = [
  { id: 'runa-guarda', name: 'Runa da Guarda', desc: 'Escudo inicial na linha de frente.', icon: '🛡️' },
  { id: 'runa-astral', name: 'Runa Astral', desc: '+ alcance de feitiço no 1º turno.', icon: '✨' },
  { id: 'runa-vinculo', name: 'Runa do Vínculo', desc: '+ iniciativa para aliados com afinidade.', icon: '🔗' },
];

export const PREP_ROSTER: Teammate[] = [
  { id: 'char-caelum', name: 'Caelum', class: 'Tanque', level: 128, hp: 8645, maxHp: 8645, mp: 210, maxMp: 280, element: 'agua', position: 'front', portrait: '/assets/characters/caelum_face.png', rank: 'S', spells: [{ id: 'holy-barrier', name: 'Barreira Sagrada', cost: 4, desc: 'Dobra a defesa de aliados na mesma linha por 1 turno.' }] },
  { id: 'char-lyria', name: 'Lyria', class: 'Mago', level: 124, hp: 6215, maxHp: 6215, mp: 420, maxMp: 650, element: 'none', position: 'back', portrait: '/assets/characters/lyria_face.png', rank: 'S+', spells: [{ id: 'nova-astral', name: 'Nova Astral', cost: 8, desc: 'Causa 215% de dano mágico a todos os inimigos e aplica Vulnerável por 2 turnos. Recarga: 3 turnos.' }, { id: 'cure', name: 'Chama Curativa', cost: 4, desc: 'Restaura HP de um companheiro ferido.' }] },
  { id: 'char-raven', name: 'Raven', class: 'Assassino', level: 127, hp: 6085, maxHp: 6085, mp: 200, maxMp: 260, element: 'terra', position: 'mid', portrait: '/assets/characters/raven_face.png', rank: 'S', spells: [{ id: 'shadow-strike', name: 'Golpe Sombrio', cost: 6, desc: 'Ataca ignorando 30% da armadura do oponente.' }] },
  { id: 'char-seraphina', name: 'Seraphina', class: 'Clériga', level: 121, hp: 6500, maxHp: 6500, mp: 180, maxMp: 220, element: 'none', position: 'front', portrait: '/assets/characters/seraphina_face.png', rank: 'A', spells: [{ id: 'earth-smash', name: 'Impacto Sísmico', cost: 5, desc: 'Ataca atordoando o alvo no turno atual.' }] },
  { id: 'char-lobo', name: 'Lobo Cinzento', class: 'Companheiro', level: 132, hp: 5980, maxHp: 5980, mp: 160, maxMp: 240, element: 'vento', position: 'mid', portrait: '🐺', rank: 'D', spells: [{ id: 'wolf-bite', name: 'Mordida Voraz', cost: 3, desc: 'Ataca sangrando o alvo por 2 turnos.' }] },
  { id: 'char-korr', name: 'Korr', class: 'Lanceiro', level: 119, hp: 8120, maxHp: 8120, mp: 180, maxMp: 250, element: 'fogo', position: 'front', portrait: '/assets/characters/korr_face.png', rank: 'A', spells: [{ id: 'fire-charge', name: 'Investida Ígnea', cost: 5, desc: 'Avança causando dano com chance de aplicar queimadura.' }] }
];

export const getElementColorClass = (elem: string) => {
  return `text-element-${elem.toLowerCase()}`;
};

export const getElementEmoji = (elem: string) => {
  const el = elem.toLowerCase();
  if (el === 'fogo') return '🔥';
  if (el === 'agua') return '💧';
  if (el === 'terra') return '🌿';
  if (el === 'vento') return '💨';
  return '✨';
};

export const getCoordinates = (side: 'blue' | 'red', pos: 'front' | 'mid' | 'back') => {
  if (side === 'blue') {
    if (pos === 'front') return { x: '45%', y: '45%' };
    if (pos === 'mid') return { x: '30%', y: '52%' };
    return { x: '18%', y: '68%' };
  } else {
    if (pos === 'front') return { x: '68%', y: '43%' };
    if (pos === 'mid') return { x: '58%', y: '52%' };
    return { x: '72%', y: '68%' };
  }
};

export const getGridCoordinates = (side: 'blue' | 'red', slot = 4) => {
  const safeSlot = Math.max(0, Math.min(8, slot));
  const row = Math.floor(safeSlot / 3);
  const column = safeSlot % 3;
  const blueX = [18, 30, 42][column];
  const redX = [82, 70, 58][column];
  const y = [28, 50, 72][row];
  return { x: `${side === 'blue' ? blueX : redX}%`, y: `${y}%` };
};
