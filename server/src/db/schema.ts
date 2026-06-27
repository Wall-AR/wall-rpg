import { pgTable, text, integer, jsonb, timestamp, primaryKey, uuid } from 'drizzle-orm/pg-core';

export const accounts = pgTable('accounts', {
  id: uuid('id').defaultRandom().primaryKey(),
  username: text('username').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  soulOrbs: integer('soul_orbs').default(0).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const characters = pgTable('characters', {
  id: uuid('id').defaultRandom().primaryKey(),
  accountId: uuid('account_id')
    .notNull()
    .references(() => accounts.id, { onDelete: 'cascade' }),
  name: text('name').notNull().unique(),
  level: integer('level').default(1).notNull(),
  xp: integer('xp').default(0).notNull(),
  stats: jsonb('stats').$type<{
    hp: number;
    mp: number;
    strength: number;
    defense: number;
    speed: number;
  }>().notNull(),
  element: text('element').notNull(),
  dragoonLevel: integer('dragoon_level').default(0).notNull(),
});

export const retiredCharacters = pgTable('retired_characters', {
  id: uuid('id').defaultRandom().primaryKey(),
  accountId: uuid('account_id')
    .notNull()
    .references(() => accounts.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  level: integer('level').notNull(),
  xp: integer('xp').notNull(),
  element: text('element').notNull(),
  retiredAt: timestamp('retired_at').defaultNow().notNull(),
});

export const itemsBase = pgTable('items_base', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  type: text('type').notNull(), // e.g., 'weapon', 'armor', 'consumable'
  rarity: text('rarity').notNull(), // e.g., 'common', 'rare', 'epic', 'legendary'
  baseStats: jsonb('base_stats').$type<Record<string, number>>().notNull(),
});

export const inventory = pgTable('inventory', {
  id: uuid('id').defaultRandom().primaryKey(),
  accountId: uuid('account_id')
    .notNull()
    .references(() => accounts.id, { onDelete: 'cascade' }),
  itemId: text('item_id')
    .notNull()
    .references(() => itemsBase.id),
  equippedCharacterId: uuid('equipped_character_id')
    .references(() => characters.id, { onDelete: 'set null' }),
  slot: integer('slot').notNull(), // -1 if backpack, 0 weapon, 1 armor, etc.
  quantity: integer('quantity').default(1).notNull(),
  metadata: jsonb('metadata').$type<Record<string, any>>().default({}).notNull(),
});

export const friendships = pgTable('friendships', {
  userId1: uuid('user_id_1')
    .notNull()
    .references(() => accounts.id, { onDelete: 'cascade' }),
  userId2: uuid('user_id_2')
    .notNull()
    .references(() => accounts.id, { onDelete: 'cascade' }),
  status: text('status').notNull(), // e.g., 'pending', 'accepted', 'blocked'
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => [
  primaryKey({ columns: [table.userId1, table.userId2] })
]);

export const battleHistory = pgTable('battle_history', {
  id: uuid('id').defaultRandom().primaryKey(),
  playerIds: jsonb('player_ids').$type<string[]>().notNull(),
  result: text('result').notNull(), // e.g., 'victory', 'defeat', 'draw'
  xpGained: integer('xp_gained').default(0).notNull(),
  timestamp: timestamp('timestamp').defaultNow().notNull(),
  log: jsonb('log').$type<any[]>().default([]).notNull(),
});

export const quests = pgTable('quests', {
  id: text('id').primaryKey(),
  name: text('name').notNull(),
  description: text('description').notNull(),
});

export const questProgress = pgTable('quest_progress', {
  id: uuid('id').defaultRandom().primaryKey(),
  questId: text('quest_id')
    .notNull()
    .references(() => quests.id, { onDelete: 'cascade' }),
  characterId: uuid('character_id')
    .notNull()
    .references(() => characters.id, { onDelete: 'cascade' }),
  status: text('status').notNull(), // e.g., 'active', 'completed', 'failed'
  progress: jsonb('progress').$type<Record<string, any>>().default({}).notNull(),
  timeStarted: timestamp('time_started').defaultNow().notNull(),
});
