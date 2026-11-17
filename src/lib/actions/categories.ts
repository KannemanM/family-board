"use server";

import { asc, eq, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import type { ActionResult } from "@/lib/action-types";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { categories } from "@/lib/db/schema";
import { categoryInputSchema, firstIssue } from "@/lib/validation";

export async function saveCategoryAction(
  input: unknown,
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "Sesión vencida. Volvé a iniciar sesión." };
  }

  const parsed = categoryInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };

  const data = parsed.data;
  let categoryId = data.id ?? 0;

  if (data.id) {
    db.update(categories)
      .set({ name: data.name, color: data.color, icon: data.icon })
      .where(eq(categories.id, data.id))
      .run();
  } else {
    const maxOrder = db
      .select({
        value: sql<number>`coalesce(max(${categories.sortOrder}), 0)`,
      })
      .from(categories)
      .get();

    const result = db
      .insert(categories)
      .values({
        name: data.name,
        color: data.color,
        icon: data.icon,
        sortOrder: (maxOrder?.value ?? 0) + 1,
        active: 1,
      })
      .run();

    categoryId = Number(result.lastInsertRowid);
  }

  revalidatePath("/categorias");
  revalidatePath("/agenda");
  return { ok: true, id: categoryId };
}

export async function deleteCategoryAction(id: number): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "Sesión vencida. Volvé a iniciar sesión." };
  }

  if (!Number.isInteger(id) || id <= 0) {
    return { ok: false, error: "Categoría inválida" };
  }

  db.delete(categories).where(eq(categories.id, id)).run();
  revalidatePath("/categorias");
  revalidatePath("/agenda");
  return { ok: true };
}

export async function moveCategoryAction(
  id: number,
  direction: "up" | "down",
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "Sesión vencida. Volvé a iniciar sesión." };
  }

  const list = db
    .select({ id: categories.id })
    .from(categories)
    .where(eq(categories.active, 1))
    .orderBy(asc(categories.sortOrder), asc(categories.id))
    .all();

  const index = list.findIndex((item) => item.id === id);
  if (index === -1) return { ok: false, error: "Categoría inválida" };

  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= list.length) return { ok: true };

  db.transaction((tx) => {
    tx.update(categories)
      .set({ sortOrder: target })
      .where(eq(categories.id, list[index].id))
      .run();
    tx.update(categories)
      .set({ sortOrder: index })
      .where(eq(categories.id, list[target].id))
      .run();
  });

  revalidatePath("/categorias");
  return { ok: true };
}
