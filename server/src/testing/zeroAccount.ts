import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { accounts, characters, companions } from '../db/schema.js';

export const ZERO_TEST_USERNAME = 'zero';
export const ZERO_TEST_PASSWORD = 'zero';
export const ZERO_ACCOUNT_ID = '00000000-0000-4000-8000-000000000000';
export const ZERO_CHARACTER_ID = '00000000-0000-4000-8000-000000000001';

export const ZERO_TEST_COMPANIONS = [
  {
    id: '00000000-0000-4000-8000-000000000101', name: 'Caelum', class: 'Tanque', level: 12,
    element: 'agua', rarity: 'S', isActive: true,
    stats: { hp: 920, maxHp: 920, mp: 80, maxMp: 80, strength: 52, defense: 68, speed: 34, intelligence: 30 },
    skills: [{ id: 'holy-barrier', name: 'Barreira Sagrada', cost: 4, desc: 'Protege a linha aliada.' }], passives: [],
  },
  {
    id: '00000000-0000-4000-8000-000000000102', name: 'Lyria', class: 'Mago', level: 12,
    element: 'none', rarity: 'S+', isActive: true,
    stats: { hp: 610, maxHp: 610, mp: 140, maxMp: 140, strength: 24, defense: 32, speed: 46, intelligence: 76 },
    skills: [{ id: 'nova-astral', name: 'Nova Astral', cost: 8, desc: 'Magia astral de alto impacto.' }, { id: 'cure', name: 'Chama Curativa', cost: 4, desc: 'Restaura HP de um aliado.' }], passives: [],
  },
  {
    id: '00000000-0000-4000-8000-000000000103', name: 'Raven', class: 'Assassino', level: 12,
    element: 'terra', rarity: 'S', isActive: true,
    stats: { hp: 660, maxHp: 660, mp: 70, maxMp: 70, strength: 72, defense: 35, speed: 78, intelligence: 25 },
    skills: [{ id: 'shadow-strike', name: 'Golpe Sombrio', cost: 6, desc: 'Ataque veloz que ignora parte da defesa.' }], passives: [],
  },
  {
    id: '00000000-0000-4000-8000-000000000104', name: 'Seraphina', class: 'Clériga', level: 11,
    element: 'vento', rarity: 'A', isActive: true,
    stats: { hp: 720, maxHp: 720, mp: 110, maxMp: 110, strength: 34, defense: 48, speed: 43, intelligence: 64 },
    skills: [{ id: 'cure', name: 'Prece Restauradora', cost: 4, desc: 'Cura o aliado mais ferido.' }], passives: [],
  },
  {
    id: '00000000-0000-4000-8000-000000000105', name: 'Korr', class: 'Lanceiro', level: 11,
    element: 'fogo', rarity: 'A', isActive: true,
    stats: { hp: 810, maxHp: 810, mp: 75, maxMp: 75, strength: 64, defense: 52, speed: 39, intelligence: 32 },
    skills: [{ id: 'fire-charge', name: 'Investida Ígnea', cost: 5, desc: 'Avança envolto em fogo.' }], passives: [],
  },
];

export const ZERO_PASSWORD_HASH = bcrypt.hashSync(ZERO_TEST_PASSWORD, 10);

export const isZeroTestAccountEnabled = () => (
  process.env.NODE_ENV !== 'production' || process.env.ENABLE_ZERO_TEST_ACCOUNT === 'true'
);

export const ensureZeroTestAccount = async () => {
  if (!isZeroTestAccountEnabled()) return;
  if (!db) {
    console.warn('[test-account] PostgreSQL indisponível; conta zero será recriada no fallback local a cada inicialização.');
    return;
  }

  const [existingAccount] = await db.select().from(accounts).where(eq(accounts.username, ZERO_TEST_USERNAME)).limit(1);
  const account = existingAccount || (await db.insert(accounts).values({
    id: ZERO_ACCOUNT_ID,
    username: ZERO_TEST_USERNAME,
    passwordHash: ZERO_PASSWORD_HASH,
    role: 'player',
  }).returning())[0];

  if (existingAccount) {
    await db.update(accounts).set({ passwordHash: ZERO_PASSWORD_HASH }).where(eq(accounts.id, account.id));
  }

  const [existingCharacter] = await db.select().from(characters).where(eq(characters.accountId, account.id)).limit(1);
  if (!existingCharacter) {
    await db.insert(characters).values({
      id: ZERO_CHARACTER_ID,
      accountId: account.id,
      name: ZERO_TEST_USERNAME,
      level: 1,
      xp: 0,
      element: 'fire',
      dragoonLevel: 0,
      stats: { hp: 100, mp: 20, strength: 15, defense: 10, speed: 8 },
    });
  }

  const existingCompanions = await db.select().from(companions).where(eq(companions.accountId, account.id));
  const existingIds = new Set(existingCompanions.map(companion => companion.id));
  const missing = ZERO_TEST_COMPANIONS.filter(companion => !existingIds.has(companion.id));
  if (missing.length > 0) {
    await db.insert(companions).values(missing.map(companion => ({
      ...companion,
      accountId: account.id,
      xp: 0,
    })));
  }

  console.log('[test-account] Conta zero pronta no PostgreSQL (usuário: zero).');
};
