import { Router } from 'express';
import { eq, and } from 'drizzle-orm';
import { db } from '../db/index.js';
import { characters, accounts, retiredCharacters } from '../db/schema.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

router.get('/me', authenticateToken, async (req, res) => {
  const { username, id, characterId } = (req as AuthenticatedRequest).user;


  try {
    if (db) {
      const [character] = await db
        .select({
          id: characters.id,
          accountId: characters.accountId,
          name: characters.name,
          level: characters.level,
          xp: characters.xp,
          stats: characters.stats,
          element: characters.element,
          dragoonLevel: characters.dragoonLevel,
          soulOrbs: accounts.soulOrbs,
        })
        .from(characters)
        .innerJoin(accounts, eq(characters.accountId, accounts.id))
        .where(eq(characters.accountId, id))
        .limit(1);

      if (!character) {
        return res.status(404).json({ error: 'Character not found' });
      }
      return res.json(character);
    } else {
      // Return mock character data for in-memory dev mode
      return res.json({
        id: characterId || 'mock-char-id',
        accountId: id,
        name: username,
        level: 1,
        xp: 0,
        element: 'fire',
        dragoonLevel: 0,
        soulOrbs: 45,
        stats: {
          hp: 100,
          mp: 20,
          strength: 15,
          defense: 10,
          speed: 8
        }
      });
    }
  } catch (error) {
    console.error('Error fetching character:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /character/dismiss - retires a character to obtain soul orbs
router.post('/dismiss', authenticateToken, async (req, res) => {
  const { id: accountId } = (req as AuthenticatedRequest).user;
  const { characterId } = req.body;

  if (!characterId) {
    return res.status(400).json({ error: 'characterId is required' });
  }

  try {
    if (db) {
      // 1. Fetch character details and verify ownership
      const [character] = await db
        .select()
        .from(characters)
        .where(and(eq(characters.id, characterId), eq(characters.accountId, accountId)))
        .limit(1);

      if (!character) {
        return res.status(404).json({ error: 'Character not found or not owned by you' });
      }

      // 2. Calculate soul orbs to award
      const orbsAwarded = character.level * 10 + Math.floor(character.xp / 100);

      // 3. Start database transaction to ensure atomicity
      await db.transaction(async (tx) => {
        // A. Insert into retired_characters
        await tx.insert(retiredCharacters).values({
          accountId,
          name: character.name,
          level: character.level,
          xp: character.xp,
          element: character.element,
        });

        // B. Add soul orbs to user account
        const [account] = await tx
          .select()
          .from(accounts)
          .where(eq(accounts.id, accountId))
          .limit(1);
        
        const currentOrbs = account?.soulOrbs || 0;

        await tx
          .update(accounts)
          .set({ soulOrbs: currentOrbs + orbsAwarded })
          .where(eq(accounts.id, accountId));

        // C. Delete character (equipped items will auto unequip due to onDelete set null)
        await tx.delete(characters).where(eq(characters.id, characterId));
      });

      return res.json({
        success: true,
        message: `Seu guerreiro ${character.name} despediu-se e tornou-se parte do Mural de Lembranças.`,
        orbsAwarded,
      });
    } else {
      // In-memory fallback response
      return res.json({
        success: true,
        message: `[MOCK] Seu guerreiro despediu-se com sucesso.`,
        orbsAwarded: 15,
      });
    }
  } catch (error) {
    console.error('Error dismissing character:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /character/retired - fetches the retired characters (mural/album)
router.get('/retired', authenticateToken, async (req, res) => {
  const { id: accountId } = (req as AuthenticatedRequest).user;

  const DEFAULT_MEMORIES = [
    {
      id: 'mem-1',
      name: 'Lobo Cinzento',
      level: 132,
      xp: 0,
      element: 'vento',
      retiredAt: '2025-08-14T23:00:00.000Z',
      metadata: {
        rarity: 'D',
        role: 'Companheiro',
        joinedAt: '22/05/2025',
        replacedBy: 'Thorn',
        battles: 418,
        victories: 301,
        campaigns: ['Cidade-Portal de Veylar', 'Fenda Abissal', 'Ecos de Outra Dimensão'],
        notableFeat: 'Sobreviveu à Fenda Abissal com 1 HP.',
        farewellQuote: 'Mais que um companheiro, uma memória viva.',
        badges: ['Vínculo Lendário', 'Primeiro Companheiro'],
        favorite: true
      }
    },
    {
      id: 'mem-2',
      name: 'Goblin Saqueador',
      level: 98,
      xp: 0,
      element: 'fogo',
      retiredAt: '2025-07-03T23:00:00.000Z',
      metadata: {
        rarity: 'C',
        role: 'Monstro',
        joinedAt: '10/06/2025',
        replacedBy: 'Caelum',
        battles: 120,
        victories: 85,
        campaigns: ['Cidade-Portal de Veylar', 'Ecos de Outra Dimensão'],
        notableFeat: 'Saqueou 2.500 de Ouro em um único turno.',
        farewellQuote: 'A bolsa cheia, a alma leve. Até a próxima moeda!',
        badges: ['Saqueador Fiel'],
        favorite: false
      }
    },
    {
      id: 'mem-3',
      name: 'Arqueira de Veylar',
      level: 116,
      xp: 0,
      element: 'terra',
      retiredAt: '2025-06-30T23:00:00.000Z',
      metadata: {
        rarity: 'B',
        role: 'Atiradora',
        joinedAt: '15/05/2025',
        replacedBy: 'Lyria',
        battles: 215,
        victories: 160,
        campaigns: ['Cidade-Portal de Veylar', 'Pântano Sombrio'],
        notableFeat: 'Acertou o olho do dragão de pedra a 100 metros.',
        farewellQuote: 'Minha flecha encontrou seu destino. Siga em frente.',
        badges: ['Olho de Águia'],
        favorite: false
      }
    },
    {
      id: 'mem-4',
      name: 'Guardião de Pedra',
      level: 121,
      xp: 0,
      element: 'terra',
      retiredAt: '2025-06-18T23:00:00.000Z',
      metadata: {
        rarity: 'B',
        role: 'Tanque',
        joinedAt: '01/05/2025',
        replacedBy: 'Raven',
        battles: 180,
        victories: 130,
        campaigns: ['Fenda Abissal', 'Pântano Sombrio'],
        notableFeat: 'Absorveu 37.000 de dano físico em uma campanha.',
        farewellQuote: 'Tão firme quanto a montanha, guardarei suas memórias.',
        badges: ['Muralha Inquebrável'],
        favorite: false
      }
    },
    {
      id: 'mem-5',
      name: 'Serpente Astral',
      level: 150,
      xp: 0,
      element: 'sombra',
      retiredAt: '2025-05-02T23:00:00.000Z',
      metadata: {
        rarity: 'S+',
        role: 'Arcanista',
        joinedAt: '20/04/2025',
        replacedBy: 'Lobo Cinzento',
        battles: 350,
        victories: 280,
        campaigns: ['Ecos de Outra Dimensão', 'Pico do Dragão Congelado'],
        notableFeat: 'Conjurou Nova Astral finalizando o Boss da Fenda.',
        farewellQuote: 'O cosmos nos uniu. Brilharei para sempre na sua constelação.',
        badges: ['Eco Astral', 'Herói Cósmico'],
        favorite: true
      }
    },
    {
      id: 'mem-6',
      name: 'Mercenário Errante',
      level: 105,
      xp: 0,
      element: 'fogo',
      retiredAt: '2025-04-15T23:00:00.000Z',
      metadata: {
        rarity: 'A',
        role: 'Guerreiro',
        joinedAt: '10/04/2025',
        replacedBy: 'Seraphina',
        battles: 95,
        victories: 70,
        campaigns: ['Cidade-Portal de Veylar'],
        notableFeat: 'Venceu 12 duelos PvP consecutivos.',
        farewellQuote: 'Meu contrato acabou, mas o respeito permanece.',
        badges: ['Espada de Aluguel'],
        favorite: false
      }
    }
  ];

  try {
    if (db) {
      const list = await db.select().from(retiredCharacters).where(eq(retiredCharacters.accountId, accountId));
      if (list.length === 0) {
        return res.json(DEFAULT_MEMORIES);
      }
      return res.json(list);
    } else {
      return res.json(DEFAULT_MEMORIES);
    }
  } catch (error) {
    console.error('Error fetching retired characters:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// Base stats for a new character (used to calculate already-spent points)
const BASE_STRENGTH = 15;
const BASE_DEFENSE = 10;
const BASE_SPEED = 8;
const STAT_POINTS_PER_LEVEL = 3;

// GET /character/available-points - returns how many stat points the player can still allocate
router.get('/available-points', authenticateToken, async (req, res) => {
  const { id: accountId } = (req as AuthenticatedRequest).user;

  try {
    if (db) {
      const [character] = await db
        .select()
        .from(characters)
        .where(eq(characters.accountId, accountId))
        .limit(1);

      if (!character) {
        return res.status(404).json({ error: 'Character not found' });
      }

      const stats = character.stats as { strength: number; defense: number; speed: number };
      const dynamicBaseStrength = BASE_STRENGTH + 8 * (character.level - 1);
      const dynamicBaseDefense = BASE_DEFENSE + 6 * (character.level - 1);
      const dynamicBaseSpeed = BASE_SPEED + 3 * (character.level - 1);
      const alreadySpent =
        (stats.strength - dynamicBaseStrength) +
        (stats.defense - dynamicBaseDefense) +
        (stats.speed - dynamicBaseSpeed);
      const availablePoints = (character.level * STAT_POINTS_PER_LEVEL) - alreadySpent;

      return res.json({ availablePoints });
    } else {
      // Mock fallback
      return res.json({ availablePoints: 3 });
    }
  } catch (error) {
    console.error('Error fetching available points:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /character/add-stats - permanently allocate stat points to a character
router.post('/add-stats', authenticateToken, async (req, res) => {
  const { id: accountId } = (req as AuthenticatedRequest).user;
  const { strength, defense, speed } = req.body;

  // Validate that all three values are provided and are non-negative integers
  if (
    !Number.isInteger(strength) || strength < 0 ||
    !Number.isInteger(defense) || defense < 0 ||
    !Number.isInteger(speed) || speed < 0
  ) {
    return res.status(400).json({ error: 'strength, defense, and speed must be non-negative integers' });
  }

  const totalRequested = strength + defense + speed;
  if (totalRequested <= 0) {
    return res.status(400).json({ error: 'You must allocate at least 1 stat point' });
  }

  try {
    if (db) {
      // 1. Fetch character and verify ownership
      const [character] = await db
        .select()
        .from(characters)
        .where(eq(characters.accountId, accountId))
        .limit(1);

      if (!character) {
        return res.status(404).json({ error: 'Character not found or not owned by you' });
      }

      // 2. Calculate available points
      const currentStats = character.stats as {
        hp: number; mp: number; strength: number; defense: number; speed: number;
      };
      const dynamicBaseStrength = BASE_STRENGTH + 8 * (character.level - 1);
      const dynamicBaseDefense = BASE_DEFENSE + 6 * (character.level - 1);
      const dynamicBaseSpeed = BASE_SPEED + 3 * (character.level - 1);
      const alreadySpent =
        (currentStats.strength - dynamicBaseStrength) +
        (currentStats.defense - dynamicBaseDefense) +
        (currentStats.speed - dynamicBaseSpeed);
      const availablePoints = (character.level * STAT_POINTS_PER_LEVEL) - alreadySpent;

      if (totalRequested > availablePoints) {
        return res.status(400).json({
          error: `Not enough stat points. Available: ${availablePoints}, Requested: ${totalRequested}`,
        });
      }

      // 3. Build updated stats
      const newStats = {
        hp: currentStats.hp,
        mp: currentStats.mp,
        strength: currentStats.strength + strength,
        defense: currentStats.defense + defense,
        speed: currentStats.speed + speed,
      };

      // 4. Save to database
      await db
        .update(characters)
        .set({ stats: newStats })
        .where(eq(characters.id, character.id));

      const remainingPoints = availablePoints - totalRequested;

      return res.json({ success: true, newStats, remainingPoints });
    } else {
      // Mock fallback
      const mockNewStats = {
        hp: 100,
        mp: 20,
        strength: 15 + strength,
        defense: 10 + defense,
        speed: 8 + speed,
      };
      return res.json({ success: true, newStats: mockNewStats, remainingPoints: 0 });
    }
  } catch (error) {
    console.error('Error allocating stat points:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
