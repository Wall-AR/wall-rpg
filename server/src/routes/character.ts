import { Router } from 'express';
import { eq, and } from 'drizzle-orm';
import { db } from '../db/index.js';
import { characters, accounts, retiredCharacters } from '../db/schema.js';
import jwt from 'jsonwebtoken';

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super-secret-key';

// Middleware to authenticate JWT
const authenticateToken = (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) return res.sendStatus(401);

  jwt.verify(token, JWT_SECRET, (err: any, user: any) => {
    if (err) return res.sendStatus(403);
    req.user = user;
    next();
  });
};

router.get('/me', authenticateToken, async (req: any, res: any) => {
  const { username, id, characterId } = req.user;

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
router.post('/dismiss', authenticateToken, async (req: any, res: any) => {
  const { id: accountId } = req.user;
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
router.get('/retired', authenticateToken, async (req: any, res: any) => {
  const { id: accountId } = req.user;

  try {
    if (db) {
      const list = await db.select().from(retiredCharacters).where(eq(retiredCharacters.accountId, accountId));
      return res.json(list);
    } else {
      // Mock list
      return res.json([
        {
          id: 'mock-ret-1',
          accountId,
          name: 'Heroi Antigo 1',
          level: 12,
          xp: 1250,
          element: 'fogo',
          retiredAt: new Date().toISOString()
        },
        {
          id: 'mock-ret-2',
          accountId,
          name: 'Ninja Lendario',
          level: 25,
          xp: 3400,
          element: 'vento',
          retiredAt: new Date().toISOString()
        }
      ]);
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
router.get('/available-points', authenticateToken, async (req: any, res: any) => {
  const { id: accountId } = req.user;

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
      const alreadySpent =
        (stats.strength - BASE_STRENGTH) +
        (stats.defense - BASE_DEFENSE) +
        (stats.speed - BASE_SPEED);
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
router.post('/add-stats', authenticateToken, async (req: any, res: any) => {
  const { id: accountId } = req.user;
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
      const alreadySpent =
        (currentStats.strength - BASE_STRENGTH) +
        (currentStats.defense - BASE_DEFENSE) +
        (currentStats.speed - BASE_SPEED);
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
