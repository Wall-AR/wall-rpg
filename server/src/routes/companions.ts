import { Router } from 'express';
import { eq, and, sql } from 'drizzle-orm';
import { db } from '../db/index.js';
import { companions, retiredCharacters, accounts } from '../db/schema.js';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth.js';

const router = Router();

// GET / - Lists all companions (active & reserve) for the authenticated user
router.get('/', authenticateToken, async (req, res) => {
  const { id: accountId } = (req as AuthenticatedRequest).user;

  try {
    if (db) {
      const list = await db
        .select()
        .from(companions)
        .where(eq(companions.accountId, accountId));
      return res.json(list);
    } else {
      // Mock fallback
      return res.json([
        {
          id: 'mock-caelum',
          accountId,
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
          battlesFought: 12,
        },
        {
          id: 'mock-lyria',
          accountId,
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
          battlesFought: 25,
        },
        {
          id: 'mock-raven',
          accountId,
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
          battlesFought: 18,
        },
        {
          id: 'mock-seraphina',
          accountId,
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
          battlesFought: 5,
        }
      ]);
    }
  } catch (error) {
    console.error('Error fetching companions:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// GET /:id - Details of a single companion
router.get('/:id', authenticateToken, async (req, res) => {
  const { id: accountId } = (req as AuthenticatedRequest).user;
  const { id: companionId } = req.params;

  try {
    if (db) {
      const [companion] = await db
        .select()
        .from(companions)
        .where(and(eq(companions.id, companionId), eq(companions.accountId, accountId)))
        .limit(1);
      if (!companion) {
        return res.status(404).json({ error: 'Companion not found' });
      }
      return res.json(companion);
    } else {
      return res.json({
        id: companionId,
        accountId,
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
        battlesFought: 25,
      });
    }
  } catch (error) {
    console.error('Error fetching companion details:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /swap - Toggle companion active/reserve status (max 6 active)
router.post('/swap', authenticateToken, async (req, res) => {
  const { id: accountId } = (req as AuthenticatedRequest).user;
  const { companionId, isActive } = req.body;

  if (!companionId || typeof isActive !== 'boolean') {
    return res.status(400).json({ error: 'companionId and isActive (boolean) are required' });
  }

  try {
    if (db) {
      // Find the target companion
      const [companion] = await db
        .select()
        .from(companions)
        .where(and(eq(companions.id, companionId), eq(companions.accountId, accountId)))
        .limit(1);

      if (!companion) {
        return res.status(404).json({ error: 'Companion not found' });
      }

      if (isActive) {
        // Enforce max 6 active companions
        const activeCompanions = await db
          .select()
          .from(companions)
          .where(and(eq(companions.accountId, accountId), eq(companions.isActive, true)));

        if (activeCompanions.length >= 6) {
          return res.status(400).json({ error: 'Você já atingiu o limite de 6 companheiros ativos na equipe.' });
        }
      }

      const [updated] = await db
        .update(companions)
        .set({ isActive })
        .where(and(eq(companions.id, companionId), eq(companions.accountId, accountId)))
        .returning();

      return res.json({ success: true, companion: updated });
    } else {
      return res.json({ success: true, companion: { id: companionId, isActive } });
    }
  } catch (error) {
    console.error('Error swapping companion active status:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /recruit - Add a new companion
router.post('/recruit', authenticateToken, async (req, res) => {
  const { id: accountId } = (req as AuthenticatedRequest).user;
  const { name, class: className, level, element, rarity, stats, skills, passives } = req.body;

  if (!name || !className || !stats) {
    return res.status(400).json({ error: 'name, class, and stats are required' });
  }

  try {
    if (db) {
      const [newCompanion] = await db
        .insert(companions)
        .values({
          accountId,
          name,
          class: className,
          level: level || 1,
          element: element || 'none',
          rarity: rarity || 'C',
          stats,
          skills: skills || [],
          passives: passives || [],
          isActive: false, // recruited as reserve by default
        })
        .returning();

      return res.status(201).json({ success: true, companion: newCompanion });
    } else {
      return res.status(201).json({
        success: true,
        companion: { id: 'mock-recruited', name, class: className, stats, isActive: false }
      });
    }
  } catch (error) {
    console.error('Error recruiting companion:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /disenchant - Retire companion to retired_characters and award Soul Orbs
router.post('/disenchant', authenticateToken, async (req, res) => {
  const { id: accountId } = (req as AuthenticatedRequest).user;
  const { companionId } = req.body;

  if (!companionId) {
    return res.status(400).json({ error: 'companionId is required' });
  }

  try {
    if (db) {
      // 1. Fetch companion and verify ownership
      const [companion] = await db
        .select()
        .from(companions)
        .where(and(eq(companions.id, companionId), eq(companions.accountId, accountId)))
        .limit(1);

      if (!companion) {
        return res.status(404).json({ error: 'Companion not found' });
      }

      // 2. Check if this would leave the player with 0 companions
      const totalCompanions = await db
        .select()
        .from(companions)
        .where(eq(companions.accountId, accountId));

      if (totalCompanions.length <= 1) {
        return res.status(400).json({ error: 'Você não pode aposentar seu último companheiro da equipe.' });
      }

      // 3. Calculate reward
      const soulOrbsReward = companion.level * 10 + Math.floor(companion.xp / 100);

      // Perform transaction: insert to retired list, delete companion, credit accounts.soulOrbs
      await db.transaction(async (tx) => {
        await tx.insert(retiredCharacters).values({
          accountId,
          name: companion.name,
          level: companion.level,
          xp: companion.xp,
          element: companion.element,
          metadata: {
            rarity: companion.rarity,
            role: companion.class,
            joinedAt: companion.recruitedAt.toLocaleDateString('pt-BR'),
            replacedBy: 'Ninguém',
            battles: companion.battlesFought,
          }
        });

        await tx.delete(companions).where(eq(companions.id, companionId));

        await tx.update(accounts)
          .set({ soulOrbs: sql`${accounts.soulOrbs} + ${soulOrbsReward}` })
          .where(eq(accounts.id, accountId));
      });

      return res.json({
        success: true,
        message: `${companion.name} foi aposentado com honras e registrado no Livro de Memórias.`,
        soulOrbsAwarded: soulOrbsReward
      });
    } else {
      return res.json({
        success: true,
        message: `[MOCK] Companheiro aposentado.`,
        soulOrbsAwarded: 50
      });
    }
  } catch (error) {
    console.error('Error disenchanting companion:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
