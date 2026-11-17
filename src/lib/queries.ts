import "server-only";

import {
  and,
  asc,
  eq,
  gte,
  inArray,
  isNull,
  lte,
  ne,
  or,
} from "drizzle-orm";

import { getSettings } from "@/lib/settings";
import { addDays, todayInTimeZone } from "@/lib/dates";
import { db } from "@/lib/db";
import {
  activities,
  activityMembers,
  categories,
  members,
  occurrenceStatus,
} from "@/lib/db/schema";
import type { ActivityRow, CategoryRow, MemberRow } from "@/lib/db/schema";
import { isOccurrenceHighlighted } from "@/lib/occurrences";
import { expandOccurrenceDates, normalizeRecurrence } from "@/lib/recurrence";
import type {
  ActivityScope,
  BoardData,
  BoardDay,
  CategoryDTO,
  MemberDTO,
  OccurrenceDTO,
  OccurrenceState,
  Priority,
  ReminderUnit,
} from "@/lib/types";
import { PRIORITY_WEIGHT } from "@/lib/types";

export const BOARD_DAYS = 365;
export const BOARD_UPCOMING_LIMIT = 6;

export function getMembersList(includeInactive = false): MemberRow[] {
  const query = db.select().from(members);
  const rows = includeInactive
    ? query.orderBy(asc(members.sortOrder), asc(members.id)).all()
    : query
        .where(eq(members.active, 1))
        .orderBy(asc(members.sortOrder), asc(members.id))
        .all();
  return rows;
}

export function getCategoriesList(includeInactive = false): CategoryRow[] {
  const query = db.select().from(categories);
  const rows = includeInactive
    ? query.orderBy(asc(categories.sortOrder), asc(categories.id)).all()
    : query
        .where(eq(categories.active, 1))
        .orderBy(asc(categories.sortOrder), asc(categories.id))
        .all();
  return rows;
}

export function toMemberDTO(row: MemberRow): MemberDTO {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    emoji: row.emoji ?? "",
  };
}

export function toCategoryDTO(row: CategoryRow): CategoryDTO {
  return {
    id: row.id,
    name: row.name,
    color: row.color,
    icon: row.icon || "Circle",
  };
}

export function compareOccurrences(a: OccurrenceDTO, b: OccurrenceDTO): number {
  if (a.date !== b.date) return a.date.localeCompare(b.date);
  if (a.allDay !== b.allDay) return a.allDay ? -1 : 1;

  const aTime = a.startTime ?? "";
  const bTime = b.startTime ?? "";
  if (aTime !== bTime) return aTime.localeCompare(bTime);

  return PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
}

interface BuildOptions {
  from: string;
  to: string;
  timezone: string;
  now: Date;
}

function buildOccurrences({
  from,
  to,
  timezone,
  now,
}: BuildOptions): OccurrenceDTO[] {
  const rows = db
    .select({ activity: activities, category: categories })
    .from(activities)
    .leftJoin(categories, eq(activities.categoryId, categories.id))
    .where(
      and(
        lte(activities.date, to),
        or(gte(activities.date, from), ne(activities.recurrence, "none")),
        or(
          isNull(activities.recurrenceUntil),
          gte(activities.recurrenceUntil, from),
        ),
      ),
    )
    .orderBy(asc(activities.date), asc(activities.id))
    .all();

  if (rows.length === 0) return [];

  const activityIds = rows.map((row) => row.activity.id);

  const memberLinks = db
    .select({
      activityId: activityMembers.activityId,
      member: members,
    })
    .from(activityMembers)
    .innerJoin(members, eq(activityMembers.memberId, members.id))
    .where(inArray(activityMembers.activityId, activityIds))
    .all();

  const membersByActivity = new Map<number, MemberRow[]>();
  for (const link of memberLinks) {
    const list = membersByActivity.get(link.activityId) ?? [];
    list.push(link.member);
    membersByActivity.set(link.activityId, list);
  }

  const statusRows = db
    .select()
    .from(occurrenceStatus)
    .where(
      and(
        inArray(occurrenceStatus.activityId, activityIds),
        gte(occurrenceStatus.occurrenceDate, from),
        lte(occurrenceStatus.occurrenceDate, to),
      ),
    )
    .all();

  const statusByKey = new Map(
    statusRows.map((row) => [
      `${row.activityId}:${row.occurrenceDate}`,
      row.status as OccurrenceState,
    ]),
  );

  const nowMs = now.getTime();
  const occurrences: OccurrenceDTO[] = [];

  for (const { activity, category } of rows) {
    const dates = expandOccurrenceDates(
      {
        date: activity.date,
        recurrence: normalizeRecurrence(activity.recurrence),
        recurrenceInterval: activity.recurrenceInterval,
        recurrenceWeekdays: activity.recurrenceWeekdays,
        recurrenceUntil: activity.recurrenceUntil,
      },
      from,
      to,
    );

    const activityMembersList = membersByActivity.get(activity.id) ?? [];
    const scope: ActivityScope =
      activity.scope === "members" ? "members" : "family";
    const priority = activity.priority as Priority;
    const reminder =
      activity.reminderValue !== null && activity.reminderUnit
        ? {
            value: activity.reminderValue,
            unit: activity.reminderUnit as ReminderUnit,
          }
        : null;

    for (const date of dates) {
      const state = statusByKey.get(`${activity.id}:${date}`) ?? "active";

      const occurrence: OccurrenceDTO = {
        id: `${activity.id}:${date}`,
        activityId: activity.id,
        date,
        title: activity.title,
        notes: activity.notes,
        category: category ? toCategoryDTO(category) : null,
        members: activityMembersList
          .slice()
          .sort((a, b) => a.sortOrder - b.sortOrder)
          .map(toMemberDTO),
        scope,
        allDay: activity.allDay === 1,
        startTime: activity.startTime,
        endTime: activity.endTime,
        priority,
        recurring: activity.recurrence !== "none",
        reminder,
        state,
        highlighted: false,
      };

      occurrence.highlighted = isOccurrenceHighlighted(
        occurrence,
        nowMs,
        timezone,
      );

      occurrences.push(occurrence);
    }
  }

  return occurrences.sort(compareOccurrences);
}

export function getOccurrences(
  from: string,
  to: string,
  now: Date = new Date(),
): OccurrenceDTO[] {
  const settings = getSettings();
  return buildOccurrences({ from, to, timezone: settings.timezone, now });
}

export function getBoardData(now: Date = new Date()): BoardData {
  const settings = getSettings();
  const today = todayInTimeZone(settings.timezone, now);
  const end = addDays(today, BOARD_DAYS - 1);

  const occurrences = buildOccurrences({
    from: today,
    to: end,
    timezone: settings.timezone,
    now,
  }).filter((occurrence) => occurrence.state === "active");

  const highlights = occurrences
    .filter((occurrence) => occurrence.highlighted)
    .sort((a, b) => {
      const priorityDiff =
        PRIORITY_WEIGHT[b.priority] - PRIORITY_WEIGHT[a.priority];
      if (priorityDiff !== 0) return priorityDiff;
      return compareOccurrences(a, b);
    })
    .slice(0, 4);

  const todayItems = occurrences.filter((occurrence) => occurrence.date === today);
  const upcomingItems = occurrences
    .filter((occurrence) => occurrence.date > today)
    .slice(0, BOARD_UPCOMING_LIMIT);

  const upcomingDates = [...new Set(upcomingItems.map((item) => item.date))];
  const days: BoardDay[] = [
    { date: today, items: todayItems },
    ...upcomingDates.map((date) => ({
      date,
      items: upcomingItems.filter((occurrence) => occurrence.date === date),
    })),
  ];

  return {
    generatedAt: now.toISOString(),
    today,
    timezone: settings.timezone,
    familyName: settings.familyName,
    refreshSeconds: settings.refreshSeconds,
    members: getMembersList(true).map(toMemberDTO),
    categories: getCategoriesList(true).map(toCategoryDTO),
    highlights,
    days,
  };
}

export function getActivityDetail(id: number): {
  activity: ActivityRow;
  memberIds: number[];
} | null {
  const activity = db
    .select()
    .from(activities)
    .where(eq(activities.id, id))
    .get();

  if (!activity) return null;

  const memberIds = db
    .select({ memberId: activityMembers.memberId })
    .from(activityMembers)
    .where(eq(activityMembers.activityId, id))
    .all()
    .map((row) => row.memberId);

  return { activity, memberIds };
}

export function getExportData() {
  return {
    exportedAt: new Date().toISOString(),
    settings: getSettings(),
    members: db.select().from(members).all(),
    categories: db.select().from(categories).all(),
    activities: db.select().from(activities).all(),
    activityMembers: db.select().from(activityMembers).all(),
    occurrenceStatus: db.select().from(occurrenceStatus).all(),
  };
}
