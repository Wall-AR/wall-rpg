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
      connectionTimeoutMillis: 2000,
    });
    pool.on('error', (err) => {
      console.error('Unexpected error on idle database client', err);
    });
    
    // Test connection immediately
    const client = await pool.connect();
    client.release();
    
    db = drizzle(pool, { schema });
    console.log("🔌 Database pool initialized and verified.");
  } catch (error: any) {
    console.warn("⚠️ WARNING: Database connection failed. Falling back to in-memory mode.", error.message);
    db = null;
    pool = null;
  }
}

export { db, pool };
