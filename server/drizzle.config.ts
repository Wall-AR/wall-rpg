import { defineConfig } from 'drizzle-kit';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export default defineConfig({
  schema: path.resolve(__dirname, './src/db/schema.ts').replace(/\\/g, '/'),
  out: path.resolve(__dirname, './drizzle').replace(/\\/g, '/'),
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/wallrpg',
  },
});
