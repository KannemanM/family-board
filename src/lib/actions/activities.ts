"use server";

import { and, eq, inArray } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import type { ActionResult } from "@/lib/action-types";
import { getCurrentUser } from "@/lib/auth";
import { isValidDate } from "@/lib/dates";
import { db } from "@/lib/db";
import {
  activities,
  activityMembers,
  categories,
  members,
  occurrenceStatus,
} from "@/lib/db/schema";
import { serializeWeekdays } from "@/lib/recurrence";
import { activityInputSchema, firstIssue } from "@/lib/validation";

function refreshAdminPaths() {
  revalidatePath("/agenda");
  revalidatePath("/agenda/nueva");
}

export async function saveActivityAction(input: unknown): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "Sesión vencida. Volvé a iniciar sesión." };
  }

  const parsed = activityInputSchema.safeParse(input);
  if (!parsed.success) return { ok: false, error: firstIssue(parsed.error) };

  const data = parsed.data;

  if (data.categoryId) {
    const category = db
      .select({ id: categories.id })
      .from(categories)
      .where(eq(categories.id, data.categoryId))
      .get();
    if (!category) return { ok: false, error: "La categoría no existe" };
  }

  if (data.scope === "members" && data.memberIds.length > 0) {
    const found = db
      .select({ id: members.id })
      .from(members)
      .where(inArray(members.id, data.memberIds))
      .all();
    if (found.length !== new Set(data.memberIds).size) {
      return { ok: false, error: "Algún integrante ya no existe" };
    }
  }

  const now = new Date().toISOString();
  const values = {
    title: data.title,
    notes: data.notes,
    categoryId: data.categoryId,
    date: data.date,
    startTime: data.allDay ? null : data.startTime,
    endTime: data.allDay ? null : data.endTime,
    allDay: data.allDay ? 1 : 0,
    priority: data.priority,
    recurrence: data.recurrence,
    recurrenceInterval: data.recurrenceInterval,
    recurrenceWeekdays:
      data.recurrence === "weekly"
        ? serializeWeekdays(data.recurrenceWeekdays)
        : "",
    recurrenceUntil: data.recurrence === "none" ? null : data.recurrenceUntil,
    scope: data.scope,
    reminderValue: data.reminderValue,
    reminderUnit: data.reminderUnit,
    updatedAt: now,
  };

  let activityId = data.id ?? 0;

  db.transaction((tx) => {
    if (data.id) {
      tx.update(activities)
        .set(values)
        .where(eq(activities.id, data.id))
        .run();
      tx.delete(activityMembers)
        .where(eq(activityMembers.activityId, data.id))
        .run();
    } else {
      const result = tx
        .insert(activities)
        .values({
          ...values,
          createdBy: user.id,
          createdAt: now,
        })
        .run();
      activityId = Number(result.lastInsertRowid);
    }

    if (data.scope === "members" && data.memberIds.length > 0) {
      tx.insert(activityMembers)
        .values(
          Array.from(new Set(data.memberIds)).map((memberId) => ({
            activityId,
            memberId,
          })),
        )
        .run();
    }
  });

  refreshAdminPaths();
  return { ok: true, id: activityId };
}

export async function setOccurrenceStateAction(
  activityId: number,
  occurrenceDate: string,
  state: "active" | "completed" | "cancelled",
): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "Sesión vencida. Volvé a iniciar sesión." };
  }

  if (
    !Number.isInteger(activityId) ||
    activityId <= 0 ||
    !isValidDate(occurrenceDate)
  ) {
    return { ok: false, error: "Datos inválidos" };
  }

  const activity = db
    .select({ id: activities.id })
    .from(activities)
    .where(eq(activities.id, activityId))
    .get();

  if (!activity) return { ok: false, error: "La actividad no existe" };

  const key = and(
    eq(occurrenceStatus.activityId, activityId),
    eq(occurrenceStatus.occurrenceDate, occurrenceDate),
  );

  if (state === "active") {
    db.delete(occurrenceStatus).where(key).run();
  } else {
    db.insert(occurrenceStatus)
      .values({
        activityId,
        occurrenceDate,
        status: state,
        updatedBy: user.id,
        updatedAt: new Date().toISOString(),
      })
      .onConflictDoUpdate({
        target: [
          occurrenceStatus.activityId,
          occurrenceStatus.occurrenceDate,
        ],
        set: {
          status: state,
          updatedBy: user.id,
          updatedAt: new Date().toISOString(),
        },
      })
      .run();
  }

  refreshAdminPaths();
  return { ok: true };
}

export async function deleteActivityAction(id: number): Promise<ActionResult> {
  const user = await getCurrentUser();
  if (!user) {
    return { ok: false, error: "Sesión vencida. Volvé a iniciar sesión." };
  }

  if (!Number.isInteger(id) || id <= 0) {
    return { ok: false, error: "Actividad inválida" };
  }

  db.delete(activities).where(eq(activities.id, id)).run();
  refreshAdminPaths();
  return { ok: true };
}
