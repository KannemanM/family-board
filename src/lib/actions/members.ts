"use server";

import { asc, eq, inArray, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import type { ActionResult } from "@/lib/action-types";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { activities, activityMembers, members } from "@/lib/db/schema";
import { firstIssue, memberInputSchema } from "@/lib/validation";

export async function saveMemberAction(input: unknown): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "Sesión vencida. Volvé a iniciar sesión." };
  }

  const parsed = memberInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };

  const data = parsed.data;

  let memberId = data.id ?? 0;

  if (data.id) {
    db.update(members)
      .set({ name: data.name, color: data.color, emoji: data.emoji })
      .where(eq(members.id, data.id))
      .run();
  } else {
    const maxOrder = db
      .select({ value: sql<number>`coalesce(max(${members.sortOrder}), 0)` })
      .from(members)
      .get();

    const result = db
      .insert(members)
      .values({
        name: data.name,
        color: data.color,
        emoji: data.emoji,
        sortOrder: (maxOrder?.value ?? 0) + 1,
        active: 1,
      })
      .run();

    memberId = Number(result.lastInsertRowid);
  }

  revalidatePath("/integrantes");
  revalidatePath("/agenda");
  return { ok: true, id: memberId };
}

export async function deleteMemberAction(id: number): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "Sesión vencida. Volvé a iniciar sesión." };
  }

  if (!Number.isInteger(id) || id <= 0) {
    return { ok: false, error: "Integrante inválido" };
  }

  const linked = db
    .select({ activityId: activityMembers.activityId })
    .from(activityMembers)
    .where(eq(activityMembers.memberId, id))
    .all()
    .map((row) => row.activityId);

  db.transaction((tx) => {
    tx.delete(members).where(eq(members.id, id)).run();

    if (linked.length > 0) {
      const remaining = tx
        .select({
          activityId: activityMembers.activityId,
          count: sql<number>`count(*)`,
        })
        .from(activityMembers)
        .where(inArray(activityMembers.activityId, linked))
        .groupBy(activityMembers.activityId)
        .all();

      const withMembers = new Set(remaining.map((row) => row.activityId));
      const empty = linked.filter((activityId) => !withMembers.has(activityId));

      if (empty.length > 0) {
        tx.update(activities)
          .set({ scope: "family" })
          .where(inArray(activities.id, empty))
          .run();
      }
    }
  });

  revalidatePath("/integrantes");
  revalidatePath("/agenda");
  return { ok: true };
}

export async function moveMemberAction(
  id: number,
  direction: "up" | "down",
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "Sesión vencida. Volvé a iniciar sesión." };
  }

  const list = db
    .select({ id: members.id, sortOrder: members.sortOrder })
    .from(members)
    .where(eq(members.active, 1))
    .orderBy(asc(members.sortOrder), asc(members.id))
    .all();

  const index = list.findIndex((item) => item.id === id);
  if (index === -1) return { ok: false, error: "Integrante inválido" };

  const target = direction === "up" ? index - 1 : index + 1;
  if (target < 0 || target >= list.length) return { ok: true };

  db.transaction((tx) => {
    const current = list[index];
    const other = list[target];

    tx.update(members)
      .set({ sortOrder: target })
      .where(eq(members.id, current.id))
      .run();
    tx.update(members)
      .set({ sortOrder: index })
      .where(eq(members.id, other.id))
      .run();
  });

  revalidatePath("/integrantes");
  return { ok: true };
}
