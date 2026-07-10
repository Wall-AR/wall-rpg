import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { eq } from 'drizzle-orm';
import crypto from 'crypto';
import { db } from '../db/index.js';
import { accounts, characters, companions } from '../db/schema.js';
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

      // Seed 6 starter companions
      await db.insert(companions).values([
        {
          accountId: newAccount.id,
          name: 'Caelum',
          class: 'Tanque',
          level: 128,
          xp: 0,
          element: 'agua',
          rarity: 'S',
          stats: { hp: 8645, maxHp: 8645, mp: 210, maxMp: 280, strength: 120, defense: 80, speed: 95, intelligence: 80 },
          skills: [{ id: 'holy-barrier', name: 'Barreira Sagrada', cost: 10, desc: 'Dobra a defesa de aliados na mesma linha por 1 turno.' }],
          passives: [],
          isActive: true,
        },
        {
          accountId: newAccount.id,
          name: 'Lyria',
          class: 'Mago',
          level: 124,
          xp: 0,
          element: 'none',
          rarity: 'S+',
          stats: { hp: 6215, maxHp: 6215, mp: 420, maxMp: 650, strength: 65, defense: 70, speed: 105, intelligence: 180 },
          skills: [
            { id: 'nova-astral', name: 'Nova Astral', cost: 4, desc: 'Causa 215% de dano mágico a todos os inimigos e aplica Vulnerável por 2 turnos.' },
            { id: 'cure', name: 'Chama Curativa', cost: 10, desc: 'Restaura HP de um companheiro ferido.' }
          ],
          passives: [],
          isActive: true,
        },
        {
          accountId: newAccount.id,
          name: 'Raven',
          class: 'Assassino',
          level: 127,
          xp: 0,
          element: 'terra',
          rarity: 'S',
          stats: { hp: 6085, maxHp: 6085, mp: 200, maxMp: 260, strength: 145, defense: 75, speed: 140, intelligence: 60 },
          skills: [{ id: 'shadow-strike', name: 'Golpe Sombrio', cost: 15, desc: 'Ataca ignorando 30% da armadura do oponente.' }],
          passives: [],
          isActive: true,
        },
        {
          accountId: newAccount.id,
          name: 'Seraphina',
          class: 'Cleriga',
          level: 121,
          xp: 0,
          element: 'none',
          rarity: 'A',
          stats: { hp: 6500, maxHp: 6500, mp: 180, maxMp: 220, strength: 80, defense: 90, speed: 98, intelligence: 120 },
          skills: [{ id: 'earth-smash', name: 'Impacto Sísmico', cost: 12, desc: 'Ataca atordoando o alvo no turno atual.' }],
          passives: [],
          isActive: false,
        },
        {
          accountId: newAccount.id,
          name: 'Lobo Cinzento',
          class: 'Companheiro',
          level: 132,
          xp: 0,
          element: 'vento',
          rarity: 'D',
          stats: { hp: 5980, maxHp: 5980, mp: 160, maxMp: 240, strength: 110, defense: 60, speed: 115, intelligence: 70 },
          skills: [{ id: 'wolf-bite', name: 'Mordida Voraz', cost: 10, desc: 'Ataca sangrando o alvo por 2 turnos.' }],
          passives: [],
          isActive: false,
        },
        {
          accountId: newAccount.id,
          name: 'Korr',
          class: 'Lanceiro',
          level: 119,
          xp: 0,
          element: 'fogo',
          rarity: 'A',
          stats: { hp: 8120, maxHp: 8120, mp: 180, maxMp: 250, strength: 130, defense: 95, speed: 90, intelligence: 95 },
          skills: [{ id: 'fire-charge', name: 'Investida Ígnea', cost: 12, desc: 'Avança causando dano com chance de aplicar queimadura.' }],
          passives: [],
          isActive: false,
        }
      ]);

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
