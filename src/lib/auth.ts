import "server-only";

import {
  createHash,
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";

import { db } from "@/lib/db";
import { sessions, users } from "@/lib/db/schema";
import { eq } from "drizzle-orm";

const scrypt = promisify(scryptCallback) as (
  password: string,
  salt: Buffer,
  keylen: number,
  options: { N: number; r: number; p: number; maxmem: number },
) => Promise<Buffer>;

export const SESSION_COOKIE = "familyboard_session";
const SESSION_DAYS = 30;
const SCRYPT = { N: 16384, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };

export interface SessionUser {
  id: number;
  name: string;
  username: string;
}

export async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16);
  const derived = await scrypt(password, salt, 64, SCRYPT);

  return [
    "scrypt",
    SCRYPT.N,
    SCRYPT.r,
    SCRYPT.p,
    salt.toString("base64"),
    derived.toString("base64"),
  ].join("$");
}

export async function verifyPassword(
  password: string,
  stored: string,
): Promise<boolean> {
  const [scheme, n, r, p, salt, hash] = stored.split("$");
  if (scheme !== "scrypt" || !salt || !hash) return false;

  try {
    const derived = await scrypt(password, Buffer.from(salt, "base64"), 64, {
      N: Number(n),
      r: Number(r),
      p: Number(p),
      maxmem: 64 * 1024 * 1024,
    });

    const expected = Buffer.from(hash, "base64");
    if (expected.length !== derived.length) return false;

    return timingSafeEqual(expected, derived);
  } catch {
    return false;
  }
}

function hashToken(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

export async function createSession(userId: number): Promise<void> {
  const raw = randomBytes(32).toString("base64url");
  const now = new Date();
  const expires = new Date(now.getTime() + SESSION_DAYS * 86_400_000);

  db.insert(sessions)
    .values({
      tokenHash: hashToken(raw),
      userId,
      expiresAt: expires.toISOString(),
      createdAt: now.toISOString(),
    })
    .run();

  const jar = await cookies();
  jar.set(SESSION_COOKIE, raw, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.COOKIE_SECURE === "true",
    path: "/",
    expires,
  });
}

export async function destroySession(): Promise<void> {
  const jar = await cookies();
  const raw = jar.get(SESSION_COOKIE)?.value;

  if (raw) {
    db.delete(sessions).where(eq(sessions.tokenHash, hashToken(raw))).run();
  }

  jar.delete(SESSION_COOKIE);
}

export async function getCurrentUser(): Promise<SessionUser | null> {
  const jar = await cookies();
  const raw = jar.get(SESSION_COOKIE)?.value;
  if (!raw) return null;

  const row = db
    .select({
      id: users.id,
      name: users.name,
      username: users.username,
      expiresAt: sessions.expiresAt,
    })
    .from(sessions)
    .innerJoin(users, eq(sessions.userId, users.id))
    .where(eq(sessions.tokenHash, hashToken(raw)))
    .get();

  if (!row) return null;

  if (new Date(row.expiresAt).getTime() < Date.now()) {
    db.delete(sessions).where(eq(sessions.tokenHash, hashToken(raw))).run();
    return null;
  }

  return { id: row.id, name: row.name, username: row.username };
}

export async function requireUser(): Promise<SessionUser> {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  return user;
}

export function countUsers(): number {
  const row = db.select({ id: users.id }).from(users).limit(1).get();
  return row ? 1 : 0;
}

export function isSetupComplete(): boolean {
  return countUsers() > 0;
}

interface AttemptRecord {
  failures: number;
  blockedUntil: number;
}

const attempts = new Map<string, AttemptRecord>();
const BLOCK_MS = 60_000;
const MAX_FAILURES = 6;

export function isLoginBlocked(key: string): boolean {
  const record = attempts.get(key);
  if (!record) return false;

  if (record.blockedUntil > Date.now()) return true;

  if (record.blockedUntil !== 0 && record.blockedUntil <= Date.now()) {
    attempts.delete(key);
  }

  return false;
}

export function registerLoginFailure(key: string): void {
  const record = attempts.get(key) ?? { failures: 0, blockedUntil: 0 };
  record.failures += 1;

  if (record.failures >= MAX_FAILURES) {
    record.blockedUntil = Date.now() + BLOCK_MS;
    record.failures = 0;
  }

  attempts.set(key, record);

  if (attempts.size > 500) {
    const firstKey = attempts.keys().next().value;
    if (firstKey) attempts.delete(firstKey);
  }
}

export function clearLoginFailures(key: string): void {
  attempts.delete(key);
}
