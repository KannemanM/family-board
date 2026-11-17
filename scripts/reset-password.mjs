#!/usr/bin/env node
// Restablece la contraseña de una cuenta directamente en SQLite.
// Uso: node scripts/reset-password.mjs <usuario> <contraseña-nueva>

import Database from "better-sqlite3";
import { randomBytes, scryptSync } from "node:crypto";
import fs from "node:fs";
import path from "node:path";

const [username, password] = process.argv.slice(2);

if (!username || !password) {
  console.error(
    "Uso: node scripts/reset-password.mjs <usuario> <contraseña-nueva>",
  );
  process.exit(1);
}

if (password.length < 8) {
  console.error("La contraseña debe tener al menos 8 caracteres.");
  process.exit(1);
}

const file =
  process.env.DATABASE_PATH ?? path.join(process.cwd(), "data", "familyboard.db");

if (!fs.existsSync(file)) {
  console.error(`No existe la base de datos en ${file}`);
  process.exit(1);
}

const SCRYPT = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

const db = new Database(file);
db.pragma("foreign_keys = ON");

const user = db
  .prepare("select id, name from users where lower(username) = lower(?)")
  .get(username);

if (!user) {
  const names = db
    .prepare("select username from users order by id")
    .all()
    .map((row) => row.username);
  console.error(
    `No existe el usuario "${username}". Usuarios: ${names.join(", ") || "ninguno"}.`,
  );
  db.close();
  process.exit(1);
}

const salt = randomBytes(16);
const derived = scryptSync(password, salt, 64, SCRYPT);
const stored = [
  "scrypt",
  SCRYPT.N,
  SCRYPT.r,
  SCRYPT.p,
  salt.toString("base64"),
  derived.toString("base64"),
].join("$");

db.prepare("update users set password_hash = ? where id = ?").run(
  stored,
  user.id,
);
db.prepare("delete from sessions where user_id = ?").run(user.id);
db.close();

console.log(
  `Contraseña actualizada para ${user.name} (@${username}). Se cerraron sus sesiones.`,
);
