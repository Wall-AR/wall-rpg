import { Router } from 'express';
import { eq } from 'drizzle-orm';
import { db } from '../db/index.js';
import { characters } from '../db/schema.js';
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

export default router;
