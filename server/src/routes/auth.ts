import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import { db } from '../db/index.js';
import { accounts, characters } from '../db/schema.js';
import { JWT_SECRET } from '../middleware/auth.js';

const router = Router();

// In-memory fallback database for development when PG is not running
interface InMemoryAccount {
  id: string;
  username: string;
  passwordHash: string;
  characterId: string;
}
const inMemoryAccounts = new Map<string, InMemoryAccount>();

router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);

    if (db) {
      // 1. Check if user already exists in DB
      const existingUser = await db.select().from(accounts).where(eq(accounts.username, username)).limit(1);
      if (existingUser.length > 0) {
        return res.status(400).json({ error: 'Username already exists' });
      }

      // 2. Insert new account
      const [newAccount] = await db.insert(accounts).values({
        username,
        passwordHash,
      }).returning();

      // 3. Create default character
      const [newCharacter] = await db.insert(characters).values({
        accountId: newAccount.id,
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
      }).returning();

      const token = jwt.sign(
        { id: newAccount.id, username: newAccount.username, characterId: newCharacter.id },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.status(201).json({ token, username: newAccount.username, characterId: newCharacter.id });
    } else {
      console.warn("⚠️ Database is offline. Registering user in-memory.");
      // In-memory fallback
      if (inMemoryAccounts.has(username)) {
        return res.status(400).json({ error: 'Username already exists (in-memory)' });
      }

      const id = crypto.randomUUID();
      const characterId = crypto.randomUUID();
      inMemoryAccounts.set(username, { id, username, passwordHash, characterId });

      const token = jwt.sign(
        { id, username, characterId },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.status(201).json({ token, username, characterId });
    }
  } catch (error) {
    console.error('Error registering user:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

router.post('/login', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ error: 'Username and password are required' });
  }

  try {
    if (db) {
      // 1. Find user in DB
      const [user] = await db.select().from(accounts).where(eq(accounts.username, username)).limit(1);
      if (!user) {
        return res.status(400).json({ error: 'Invalid username or password' });
      }

      // 2. Compare password
      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return res.status(400).json({ error: 'Invalid username or password' });
      }

      // 3. Find user character
      const [character] = await db.select().from(characters).where(eq(characters.accountId, user.id)).limit(1);
      const characterId = character?.id || "";

      const token = jwt.sign(
        { id: user.id, username: user.username, characterId },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.status(200).json({ token, username: user.username, characterId });
    } else {
      console.warn("⚠️ Database is offline. Validating login in-memory.");
      // In-memory fallback
      const user = inMemoryAccounts.get(username);
      if (!user) {
        return res.status(400).json({ error: 'Invalid username or password (in-memory)' });
      }

      const isValid = await bcrypt.compare(password, user.passwordHash);
      if (!isValid) {
        return res.status(400).json({ error: 'Invalid username or password (in-memory)' });
      }

      const token = jwt.sign(
        { id: user.id, username: user.username, characterId: user.characterId },
        JWT_SECRET,
        { expiresIn: '24h' }
      );

      return res.status(200).json({ token, username: user.username, characterId: user.characterId });
    }
  } catch (error) {
    console.error('Error logging in user:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
