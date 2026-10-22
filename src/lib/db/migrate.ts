import path from "node:path";
import { migrate } from "drizzle-orm/mysql2/migrator";
import { drizzle } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";

/** Führt ausstehende SQL-Migrationen aus dem Ordner /drizzle aus. Idempotent. */
export async function runMigrations() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL ist nicht gesetzt");
  const conn = await mysql.createConnection({ uri: url, multipleStatements: true });
  try {
    await migrate(drizzle(conn), { migrationsFolder: path.join(process.cwd(), "drizzle") });
  } finally {
    await conn.end();
  }
}
