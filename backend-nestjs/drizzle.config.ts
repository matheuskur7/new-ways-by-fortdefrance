import 'dotenv/config';
import { defineConfig } from 'drizzle-kit';

if (!process.env.DATABASE_URL) {
  throw new Error('DATABASE_URL é obrigatória para comandos do Drizzle.');
}

export default defineConfig({
  dialect: 'postgresql',
  schema: './src/shared/database/schemas/*.schema.ts',
  out: './drizzle',
  dbCredentials: { url: process.env.DATABASE_URL },
  strict: true,
});
