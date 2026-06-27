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
      const [character] = await db.select().from(characters).where(eq(characters.accountId, id)).limit(1);
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

export default router;
