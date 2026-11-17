"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { z } from "zod";

import type { ActionResult } from "@/lib/action-types";
import {
  createSession,
  getCurrentUser,
  hashPassword,
  verifyPassword,
} from "@/lib/auth";
import { db } from "@/lib/db";
import { sessions, users } from "@/lib/db/schema";
import { TIMEZONES } from "@/lib/dates";
import { generateBoardToken, updateSettings } from "@/lib/settings";
import { firstIssue } from "@/lib/validation";

const generalSchema = z.object({
  familyName: z.string().trim().min(1, "Poné un nombre").max(60),
  timezone: z
    .string()
    .refine(
      (value) => TIMEZONES.some((zone) => zone.value === value),
      "Zona horaria inválida",
    ),
  refreshSeconds: z.number().int().min(10).max(300),
});

export async function updateGeneralSettingsAction(
  input: unknown,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "Sesión vencida. Volvé a iniciar sesión." };
  }

  const parsed = generalSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };

  updateSettings(parsed.data);
  revalidatePath("/ajustes");
  revalidatePath("/agenda");
  revalidatePath("/");
  return { ok: true };
}

export async function rotateBoardTokenAction(): Promise<
  ActionResult & { token?: string }
> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "Sesión vencida. Volvé a iniciar sesión." };
  }

  const token = generateBoardToken();
  updateSettings({ boardToken: token });
  revalidatePath("/ajustes");
  return { ok: true, token };
}

const passwordSchema = z.object({
  currentPassword: z.string().min(1, "Ingresá tu contraseña actual"),
  newPassword: z
    .string()
    .min(8, "La nueva contraseña debe tener al menos 8 caracteres"),
});

export async function changePasswordAction(
  input: unknown,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "Sesión vencida. Volvé a iniciar sesión." };
  }

  const parsed = passwordSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };

  const row = db
    .select({ passwordHash: users.passwordHash })
    .from(users)
    .where(eq(users.id, user.id))
    .get();

  if (!row || !(await verifyPassword(parsed.data.currentPassword, row.passwordHash))) {
    return { ok: false, error: "La contraseña actual no es correcta" };
  }

  const passwordHash = await hashPassword(parsed.data.newPassword);

  db.transaction((tx) => {
    tx.update(users)
      .set({ passwordHash })
      .where(eq(users.id, user.id))
      .run();
    tx.delete(sessions).where(eq(sessions.userId, user.id)).run();
  });

  await createSession(user.id);
  return { ok: true };
}
