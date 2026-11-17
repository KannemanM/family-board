import { notFound } from "next/navigation";

import {
  ActivityForm,
  type ActivityFormInitial,
} from "@/components/admin/ActivityForm";
import { requireUser } from "@/lib/auth";
import { todayInTimeZone } from "@/lib/dates";
import {
  getActivityDetail,
  getCategoriesList,
  getMembersList,
  toCategoryDTO,
  toMemberDTO,
} from "@/lib/queries";
import { normalizeRecurrence, parseWeekdays } from "@/lib/recurrence";
import { getSettings } from "@/lib/settings";
import type { Priority, ReminderUnit } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata = { title: "Editar actividad" };

export default async function EditActivityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireUser();

  const { id } = await params;
  const numericId = Number(id);

  if (!Number.isInteger(numericId) || numericId <= 0) notFound();

  const detail = getActivityDetail(numericId);
  if (!detail) notFound();

  const settings = getSettings();
  const today = todayInTimeZone(settings.timezone);
  const members = getMembersList().map(toMemberDTO);
  const categories = getCategoriesList().map(toCategoryDTO);
  const { activity, memberIds } = detail;

  const initial: ActivityFormInitial = {
    id: activity.id,
    title: activity.title,
    notes: activity.notes,
    categoryId: activity.categoryId,
    date: activity.date,
    startTime: activity.startTime,
    endTime: activity.endTime,
    allDay: activity.allDay === 1,
    priority: activity.priority as Priority,
    scope: activity.scope === "members" ? "members" : "family",
    memberIds,
    recurrence: normalizeRecurrence(activity.recurrence),
    recurrenceInterval: activity.recurrenceInterval,
    recurrenceWeekdays: parseWeekdays(activity.recurrenceWeekdays),
    recurrenceUntil: activity.recurrenceUntil,
    reminderValue: activity.reminderValue,
    reminderUnit:
      activity.reminderUnit === "days" || activity.reminderUnit === "hours"
        ? (activity.reminderUnit as ReminderUnit)
        : null,
  };

  return (
    <ActivityForm
      mode="edit"
      today={today}
      members={members}
      categories={categories}
      initial={initial}
    />
  );
}
