"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { z } from "zod";

import type { FormState } from "@/lib/action-types";
import {
  clearLoginFailures,
  createSession,
  destroySession,
  hashPassword,
  isLoginBlocked,
  isSetupComplete,
  registerLoginFailure,
  verifyPassword,
} from "@/lib/auth";
import { db } from "@/lib/db";
import { categories, settings, users } from "@/lib/db/schema";
import { TIMEZONES } from "@/lib/dates";
import { firstIssue } from "@/lib/validation";
import { generateBoardToken } from "@/lib/settings";

const setupSchema = z.object({
  familyName: z.string().trim().min(1, "Poné un nombre para la familia").max(60),
  timezone: z.string().refine(
    (value) => TIMEZONES.some((zone) => zone.value === value),
    "Zona horaria inválida",
  ),
  name1: z.string().trim().min(1, "Completá el nombre del primer adulto").max(60),
  username1: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9._-]{3,32}$/, "Usuario inválido (3 a 32 caracteres)"),
  password1: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
  name2: z.string().trim().min(1, "Completá el nombre del segundo adulto").max(60),
  username2: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9._-]{3,32}$/, "Usuario inválido (3 a 32 caracteres)"),
  password2: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

const DEFAULT_CATEGORIES = [
  { name: "Escuela", color: "#4F6BED", icon: "GraduationCap" },
  { name: "Salud", color: "#2E9E8F", icon: "HeartPulse" },
  { name: "Familia", color: "#D99532", icon: "Users" },
  { name: "Recreación", color: "#E2685A", icon: "PartyPopper" },
  { name: "Cumpleaños", color: "#D4659B", icon: "Cake" },
  { name: "Recordatorios", color: "#8A6FD1", icon: "Bell" },
  { name: "Otros", color: "#6B7A90", icon: "Circle" },
];

export async function setupAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  if (isSetupComplete()) redirect("/login");

  const parsed = setupSchema.safeParse({
    familyName: formData.get("familyName"),
    timezone: formData.get("timezone"),
    name1: formData.get("name1"),
    username1: formData.get("username1"),
    password1: formData.get("password1"),
    name2: formData.get("name2"),
    username2: formData.get("username2"),
    password2: formData.get("password2"),
  });

  if (!parsed.success) {
    return { error: firstIssue(parsed.error) };
  }

  const data = parsed.data;

  if (data.username1 === data.username2) {
    return { error: "Los dos usuarios no pueden ser iguales" };
  }

  const passwordHash1 = await hashPassword(data.password1);
  const passwordHash2 = await hashPassword(data.password2);
  const now = new Date().toISOString();
  const boardToken = generateBoardToken();

  const firstUserId = db.transaction((tx) => {
    const first = tx
      .insert(users)
      .values({
        name: data.name1,
        username: data.username1,
        passwordHash: passwordHash1,
        createdAt: now,
      })
      .run();

    tx.insert(users)
      .values({
        name: data.name2,
        username: data.username2,
        passwordHash: passwordHash2,
        createdAt: now,
      })
      .run();

    tx.insert(settings)
      .values([
        { key: "family_name", value: data.familyName },
        { key: "timezone", value: data.timezone },
        { key: "board_token", value: boardToken },
        { key: "board_refresh_seconds", value: "15" },
      ])
      .run();

    tx.insert(categories)
      .values(
        DEFAULT_CATEGORIES.map((category, index) => ({
          ...category,
          sortOrder: index,
          active: 1,
        })),
      )
      .run();

    return Number(first.lastInsertRowid);
  });

  await createSession(firstUserId);
  redirect("/agenda?bienvenida=1");
}

const loginSchema = z.object({
  username: z.string().trim().toLowerCase().min(1, "Ingresá tu usuario"),
  password: z.string().min(1, "Ingresá tu contraseña"),
});

export async function loginAction(
  _previous: FormState,
  formData: FormData,
): Promise<FormState> {
  const parsed = loginSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
  });

  if (!parsed.success) return { error: firstIssue(parsed.error) };

  const { username, password } = parsed.data;

  if (isLoginBlocked(username)) {
    return { error: "Demasiados intentos fallidos. Esperá un minuto." };
  }

  const user = db
    .select()
    .from(users)
    .where(eq(users.username, username))
    .get();

  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    registerLoginFailure(username);
    return { error: "Usuario o contraseña incorrectos" };
  }

  clearLoginFailures(username);
  await createSession(user.id);
  redirect("/agenda");
}

export async function logoutAction(): Promise<void> {
  await destroySession();
  redirect("/login");
}
