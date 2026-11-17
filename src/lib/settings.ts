import "server-only";

import { randomBytes, timingSafeEqual } from "node:crypto";

import { DEFAULT_TIMEZONE } from "@/lib/dates";
import { db } from "@/lib/db";
import { settings } from "@/lib/db/schema";

export interface AppSettings {
  familyName: string;
  timezone: string;
  boardToken: string;
  refreshSeconds: number;
}

const KEYS = {
  familyName: "family_name",
  timezone: "timezone",
  boardToken: "board_token",
  refreshSeconds: "board_refresh_seconds",
} as const;

export const SETTINGS_DEFAULTS: AppSettings = {
  familyName: "Nuestra familia",
  timezone: DEFAULT_TIMEZONE,
  boardToken: "",
  refreshSeconds: 15,
};

export function generateBoardToken(): string {
  return randomBytes(24).toString("base64url");
}

export function getSettings(): AppSettings {
  const rows = db.select().from(settings).all();
  const map = new Map(rows.map((row) => [row.key, row.value]));

  const refresh = Number(map.get(KEYS.refreshSeconds) ?? "15");

  return {
    familyName: map.get(KEYS.familyName) || SETTINGS_DEFAULTS.familyName,
    timezone: map.get(KEYS.timezone) || SETTINGS_DEFAULTS.timezone,
    boardToken: map.get(KEYS.boardToken) || "",
    refreshSeconds:
      Number.isFinite(refresh) && refresh >= 10 ? Math.min(refresh, 300) : 15,
  };
}

export function setSetting(key: keyof typeof KEYS, value: string): void {
  const settingKey = KEYS[key];

  db.insert(settings)
    .values({ key: settingKey, value })
    .onConflictDoUpdate({ target: settings.key, set: { value } })
    .run();
}

export function updateSettings(partial: Partial<AppSettings>): void {
  if (partial.familyName !== undefined) {
    setSetting("familyName", partial.familyName);
  }
  if (partial.timezone !== undefined) {
    setSetting("timezone", partial.timezone);
  }
  if (partial.boardToken !== undefined) {
    setSetting("boardToken", partial.boardToken);
  }
  if (partial.refreshSeconds !== undefined) {
    setSetting("refreshSeconds", String(partial.refreshSeconds));
  }
}

export function isValidBoardToken(
  candidate: string | null | undefined,
  expected: string,
): boolean {
  if (!candidate || !expected) return false;

  const candidateBuffer = Buffer.from(candidate);
  const expectedBuffer = Buffer.from(expected);

  if (candidateBuffer.length !== expectedBuffer.length) return false;

  return timingSafeEqual(candidateBuffer, expectedBuffer);
}
