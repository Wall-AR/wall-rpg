import { Router } from 'express';
import { eq, and } from 'drizzle-orm';
import { db } from '../db/index.js';
import { accounts, inventory, itemsBase } from '../db/schema.js';
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

// GET /inventory - lists all items in user's inventory
router.get('/', authenticateToken, async (req: any, res: any) => {
  const { id: accountId } = req.user;

  try {
    if (db) {
      const list = await db
        .select({
          id: inventory.id,
          itemId: inventory.itemId,
          equippedCharacterId: inventory.equippedCharacterId,
          slot: inventory.slot,
          quantity: inventory.quantity,
          metadata: inventory.metadata,
          name: itemsBase.name,
          type: itemsBase.type,
          rarity: itemsBase.rarity,
        })
        .from(inventory)
        .innerJoin(itemsBase, eq(inventory.itemId, itemsBase.id))
        .where(eq(inventory.accountId, accountId));

      return res.json(list);
    } else {
      // Mock inventory items
      return res.json([
        {
          id: 'mock-i1',
          itemId: 'sword_1',
          equippedCharacterId: 'mock-char-id',
          slot: 0,
          quantity: 1,
          metadata: { element: 'fogo' },
          name: 'Espada Curta Encantada',
          type: 'weapon',
          rarity: 'rare',
        },
        {
          id: 'mock-i2',
          itemId: 'potion_1',
          equippedCharacterId: null,
          slot: -1,
          quantity: 5,
          metadata: {},
          name: 'Poção de HP',
          type: 'consumable',
          rarity: 'common',
        },
      ]);
    }
  } catch (error) {
    console.error('Error fetching inventory:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /inventory/transfer - transfers an item to another player's backpack
router.post('/transfer', authenticateToken, async (req: any, res: any) => {
  const { id: accountId } = req.user;
  const { targetUsername, inventoryId } = req.body;

  if (!targetUsername || !inventoryId) {
    return res.status(400).json({ error: 'targetUsername and inventoryId are required' });
  }

  try {
    if (db) {
      // 1. Verify item ownership and equipment status
      const [item] = await db
        .select()
        .from(inventory)
        .where(and(eq(inventory.id, inventoryId), eq(inventory.accountId, accountId)))
        .limit(1);

      if (!item) {
        return res.status(404).json({ error: 'Item not found in your inventory' });
      }

      if (item.equippedCharacterId) {
        return res.status(400).json({ error: 'Não é possível transferir um item equipado. Desequipe-o no Perfil primeiro.' });
      }

      // 2. Fetch target user account
      const [targetAcc] = await db
        .select()
        .from(accounts)
        .where(eq(accounts.username, targetUsername))
        .limit(1);

      if (!targetAcc) {
        return res.status(404).json({ error: 'Destinatário não encontrado' });
      }

      if (targetAcc.id === accountId) {
        return res.status(400).json({ error: 'Você não pode transferir itens para você mesmo' });
      }

      // 3. Perform transfer: update accountId and set slot to -1 (backpack)
      await db
        .update(inventory)
        .set({
          accountId: targetAcc.id,
          slot: -1, // Make sure it goes to the unequipped bag list
        })
        .where(eq(inventory.id, inventoryId));

      return res.json({ success: true, message: `Item transferido com sucesso para a mochila de ${targetUsername}.` });
    } else {
      return res.json({ success: true, message: `[MOCK] Item transferido com sucesso para ${targetUsername}.` });
    }
  } catch (error) {
    console.error('Error transferring inventory item:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /inventory/fuse - fuses two identical items to level up
router.post('/fuse', authenticateToken, async (req: any, res: any) => {
  const { id: accountId } = req.user;
  const { item1Id, item2Id } = req.body;

  if (!item1Id || !item2Id) {
    return res.status(400).json({ error: 'item1Id and item2Id are required' });
  }

  if (item1Id === item2Id) {
    return res.status(400).json({ error: 'Cannot fuse an item with itself' });
  }

  try {
    if (db) {
      const [item1] = await db.select().from(inventory).where(and(eq(inventory.id, item1Id), eq(inventory.accountId, accountId))).limit(1);
      const [item2] = await db.select().from(inventory).where(and(eq(inventory.id, item2Id), eq(inventory.accountId, accountId))).limit(1);

      if (!item1 || !item2) {
        return res.status(404).json({ error: 'One or both items not found in inventory' });
      }

      if (item1.itemId !== item2.itemId) {
        return res.status(400).json({ error: 'Items must be identical to fuse' });
      }

      const meta1 = (item1.metadata || {}) as Record<string, any>;
      const meta2 = (item2.metadata || {}) as Record<string, any>;
      const level1 = meta1.level || 1;

      if (level1 >= 10) {
        return res.status(400).json({ error: 'Item already at maximum level 10' });
      }

      const newLevel = level1 + 1;
      const newMeta: Record<string, any> = {
        ...meta1,
        level: newLevel,
        atkBonus: (meta1.atkBonus || 0) + 3
      };

      if (newLevel === 10) {
        newMeta.evolvedSuffix = ' [Evoluído]';
      }

      // Perform transaction: update item1, delete item2
      await db.transaction(async (tx) => {
        await tx.update(inventory).set({ metadata: newMeta }).where(eq(inventory.id, item1Id));
        await tx.delete(inventory).where(eq(inventory.id, item2Id));
      });

      return res.json({ success: true, message: `Itens fundidos! O item subiu para o Nível ${newLevel}.` });
    } else {
      return res.json({ success: true, message: '[MOCK] Fusão concluída com sucesso!' });
    }
  } catch (error) {
    console.error('Error fusing items:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

// POST /inventory/evolve-rarity - upgrades item rarity using Soul Orbs
router.post('/evolve-rarity', authenticateToken, async (req: any, res: any) => {
  const { id: accountId } = req.user;
  const { inventoryId } = req.body;

  if (!inventoryId) {
    return res.status(400).json({ error: 'inventoryId is required' });
  }

  try {
    if (db) {
      // Find item
      const [item] = await db.select().from(inventory).where(and(eq(inventory.id, inventoryId), eq(inventory.accountId, accountId))).limit(1);
      if (!item) {
        return res.status(404).json({ error: 'Item not found in inventory' });
      }

      // Find user to check soul orbs
      const [userAcc] = await db.select().from(accounts).where(eq(accounts.id, accountId)).limit(1);
      if (!userAcc) {
        return res.status(404).json({ error: 'User account not found' });
      }

      const cost = 10;
      if (userAcc.soulOrbs < cost) {
        return res.status(400).json({ error: `Orbes de Alma insuficientes. Você precisa de ${cost} Orbes (Saldo: ${userAcc.soulOrbs}).` });
      }

      const meta = (item.metadata || {}) as Record<string, any>;
      const currentRarity = meta.rarity || 'comum';
      let nextRarity = '';

      if (currentRarity === 'comum') nextRarity = 'raro';
      else if (currentRarity === 'raro') nextRarity = 'épico';
      else if (currentRarity === 'épico') nextRarity = 'lendário';
      else {
        return res.status(400).json({ error: 'Item já atingiu a raridade máxima (Lendário).' });
      }

      const newMeta = {
        ...meta,
        rarity: nextRarity,
        atkBonus: (meta.atkBonus || 0) + 10
      };

      // Perform transaction: deduct soulOrbs, update item rarity
      await db.transaction(async (tx) => {
        await tx.update(accounts).set({ soulOrbs: userAcc.soulOrbs - cost }).where(eq(accounts.id, accountId));
        await tx.update(inventory).set({ metadata: newMeta }).where(eq(inventory.id, inventoryId));
      });

      return res.json({ success: true, message: `Raridade evoluída para ${nextRarity.toUpperCase()}! Consumido ${cost} Orbes de Alma.` });
    } else {
      return res.json({ success: true, message: '[MOCK] Raridade evoluída!' });
    }
  } catch (error) {
    console.error('Error evolving item rarity:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
