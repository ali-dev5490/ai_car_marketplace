import dotenv from 'dotenv';
import path from 'path';

// Load .env.local first (local secrets), then .env as fallback.
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });
