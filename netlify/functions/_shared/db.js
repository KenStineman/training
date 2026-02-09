import { neon } from '@neondatabase/serverless';

let sql;

export function getDb() {
  if (!sql) {
    const dbUrl = process.env.DATABASE_URL || process.env.NETLIFY_DATABASE_URL;
    if (!dbUrl) {
      throw new Error('DATABASE_URL environment variable is not set');
    }
    sql = neon(dbUrl);
  }
  return sql;
}

export default getDb;