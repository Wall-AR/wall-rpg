import { defineConfig } from 'drizzle-kit';

export default defineConfig({
  schema: './server/src/db/schema.ts',
  out: './server/drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/wallrpg',
  },
});
