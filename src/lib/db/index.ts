import "server-only";

import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import fs from "node:fs";
import path from "node:path";

import * as schema from "./schema";

function createDatabase() {
  const file =
    process.env.DATABASE_PATH ??
    path.join(process.cwd(), "data", "familyboard.db");

  fs.mkdirSync(path.dirname(file), { recursive: true });

  const sqlite = new Database(file);
  sqlite.pragma("journal_mode = WAL");
  sqlite.pragma("foreign_keys = ON");
  sqlite.pragma("busy_timeout = 5000");

  const db = drizzle(sqlite, { schema });

  const migrationsFolder = path.join(process.cwd(), "drizzle");
  if (!fs.existsSync(migrationsFolder)) {
    throw new Error(
      `No se encontró la carpeta de migraciones en ${migrationsFolder}.`,
    );
  }
  migrate(db, { migrationsFolder });

  return { db, sqlite };
}

const globalForDb = globalThis as unknown as {
  __familyboardDb?: ReturnType<typeof createDatabase>;
};

export const database = globalForDb.__familyboardDb ?? createDatabase();

if (process.env.NODE_ENV !== "production") {
  globalForDb.__familyboardDb = database;
}

export const db = database.db;
export const sqlite = database.sqlite;
