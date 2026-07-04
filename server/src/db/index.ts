import { drizzle } from 'drizzle-orm/node-postgres';
import pg from 'pg';
import * as schema from './schema.js';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../../../.env') });
dotenv.config({ path: path.resolve(__dirname, '../../.env') });
dotenv.config();

const databaseUrl = process.env.DATABASE_URL;

let db: ReturnType<typeof drizzle<typeof schema>> | null = null;
let pool: pg.Pool | null = null;

if (!databaseUrl) {
  console.warn("⚠️ WARNING: DATABASE_URL is not set. Database features will be unavailable.");
} else {
  try {
    pool = new pg.Pool({
      connectionString: databaseUrl,
    });
    pool.on('error', (err) => {
      console.error('Unexpected error on idle database client', err);
    });
    db = drizzle(pool, { schema });
    console.log("🔌 Database pool initialized.");
  } catch (error) {
    console.error("❌ Failed to initialize database pool:", error);
  }
}

export { db, pool };
