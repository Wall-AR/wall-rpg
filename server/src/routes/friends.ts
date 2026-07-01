import { Router } from 'express';
import { eq, and, or } from 'drizzle-orm';
import { db } from '../db/index.js';
import { accounts, friendships } from '../db/schema.js';
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

// GET /friends/ - lists all friendships for the authenticated user
router.get('/', authenticateToken, async (req: any, res: any) => {
  const { id: myId } = req.user;

  try {
    if (db) {
      // Find all friendships involving myId
      const list = await db
        .select()
        .from(friendships)
        .where(or(eq(friendships.userId1, myId), eq(friendships.userId2, myId)));

      const results = [];

      for (const rel of list) {
        const friendId = rel.userId1 === myId ? rel.userId2 : rel.userId1;
        
        // Fetch friend's username
        const [friendAcc] = await db
          .select({ username: accounts.username })
          .from(accounts)
          .where(eq(accounts.id, friendId))
          .limit(1);

        if (friendAcc) {
          results.push({
            friendId,
            username: friendAcc.username,
            status: rel.status, // 'pending', 'accepted'
          });
        }
      }

      return res.json(results);
    } else {
      // Fallback mocks
      return res.json([
        { friendId: 'mock-f1', username: 'GuerreiroLendario', status: 'accepted' },
        { friendId: 'mock-f2', username: 'MagoDoVento', status: 'accepted' },
        { friendId: 'mock-f3', username: 'NovatoRpg', status: 'pending' },
      ]);
    }
  } catch (error) {
    console.error('Error fetching friends:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /friends/request - sends a friend request to a user by username
router.post('/request', authenticateToken, async (req: any, res: any) => {
  const { id: myId } = req.user;
  const { targetUsername } = req.body;

  if (!targetUsername) {
    return res.status(400).json({ error: 'targetUsername is required' });
  }

  try {
    if (db) {
      // Find target user account
      const [targetAcc] = await db
        .select()
        .from(accounts)
        .where(eq(accounts.username, targetUsername))
        .limit(1);

      if (!targetAcc) {
        return res.status(404).json({ error: 'User not found' });
      }

      if (targetAcc.id === myId) {
        return res.status(400).json({ error: 'You cannot add yourself' });
      }

      // Check if relationship already exists
      const existing = await db
        .select()
        .from(friendships)
        .where(
          or(
            and(eq(friendships.userId1, myId), eq(friendships.userId2, targetAcc.id)),
            and(eq(friendships.userId1, targetAcc.id), eq(friendships.userId2, myId))
          )
        )
        .limit(1);

      if (existing.length > 0) {
        return res.status(400).json({ error: 'Friendship or request already exists' });
      }

      // Enforce userId1 is lexicographically smaller to prevent duplicate rows in symmetric relation
      const [id1, id2] = myId < targetAcc.id ? [myId, targetAcc.id] : [targetAcc.id, myId];

      await db.insert(friendships).values({
        userId1: id1,
        userId2: id2,
        status: 'pending',
      });

      return res.json({ success: true, message: `Pedido de amizade enviado para ${targetUsername}.` });
    } else {
      return res.json({ success: true, message: `[MOCK] Pedido enviado para ${targetUsername}.` });
    }
  } catch (error) {
    console.error('Error requesting friend:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /friends/accept - accepts a pending friend request
router.post('/accept', authenticateToken, async (req: any, res: any) => {
  const { id: myId } = req.user;
  const { friendId } = req.body;

  if (!friendId) {
    return res.status(400).json({ error: 'friendId is required' });
  }

  try {
    if (db) {
      const [id1, id2] = myId < friendId ? [myId, friendId] : [friendId, myId];

      const [rel] = await db
        .select()
        .from(friendships)
        .where(and(eq(friendships.userId1, id1), eq(friendships.userId2, id2)))
        .limit(1);

      if (!rel) {
        return res.status(404).json({ error: 'Friend request not found' });
      }

      await db
        .update(friendships)
        .set({ status: 'accepted' })
        .where(and(eq(friendships.userId1, id1), eq(friendships.userId2, id2)));

      return res.json({ success: true, message: 'Pedido de amizade aceito com sucesso!' });
    } else {
      return res.json({ success: true, message: '[MOCK] Pedido de amizade aceito.' });
    }
  } catch (error) {
    console.error('Error accepting friend:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
