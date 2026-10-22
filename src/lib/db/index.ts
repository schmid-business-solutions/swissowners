import { drizzle, type MySql2Database } from "drizzle-orm/mysql2";
import mysql from "mysql2/promise";
import * as schema from "./schema";

declare global {
  // eslint-disable-next-line no-var
  var __swoPool: mysql.Pool | undefined;
}

function createPool() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL ist nicht gesetzt (siehe .env.example)");
  return mysql.createPool({ uri: url, connectionLimit: 5, timezone: "Z", charset: "utf8mb4" });
}

export const pool = globalThis.__swoPool ?? createPool();
if (process.env.NODE_ENV !== "production") globalThis.__swoPool = pool;

export const db: MySql2Database<typeof schema> = drizzle(pool, { schema, mode: "default" });
export { schema };
