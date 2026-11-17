import {
  index,
  integer,
  primaryKey,
  sqliteTable,
  text,
} from "drizzle-orm/sqlite-core";

export const users = sqliteTable("users", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull(),
  username: text("username").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  createdAt: text("created_at").notNull(),
});

export const sessions = sqliteTable(
  "sessions",
  {
    tokenHash: text("token_hash").primaryKey(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    expiresAt: text("expires_at").notNull(),
    createdAt: text("created_at").notNull(),
  },
  (table) => [index("sessions_user_idx").on(table.userId)],
);

export const settings = sqliteTable("settings", {
  key: text("key").primaryKey(),
  value: text("value").notNull(),
});

export const members = sqliteTable(
  "members",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    color: text("color").notNull(),
    emoji: text("emoji").notNull().default(""),
    sortOrder: integer("sort_order").notNull().default(0),
    active: integer("active").notNull().default(1),
  },
  (table) => [index("members_sort_idx").on(table.sortOrder)],
);

export const categories = sqliteTable(
  "categories",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    color: text("color").notNull(),
    icon: text("icon").notNull().default("Circle"),
    sortOrder: integer("sort_order").notNull().default(0),
    active: integer("active").notNull().default(1),
  },
  (table) => [index("categories_sort_idx").on(table.sortOrder)],
);

export const activities = sqliteTable(
  "activities",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    title: text("title").notNull(),
    notes: text("notes").notNull().default(""),
    categoryId: integer("category_id").references(() => categories.id, {
      onDelete: "set null",
    }),
    date: text("date").notNull(),
    startTime: text("start_time"),
    endTime: text("end_time"),
    allDay: integer("all_day").notNull().default(0),
    priority: text("priority").notNull().default("normal"),
    recurrence: text("recurrence").notNull().default("none"),
    recurrenceInterval: integer("recurrence_interval").notNull().default(1),
    recurrenceWeekdays: text("recurrence_weekdays").notNull().default(""),
    recurrenceUntil: text("recurrence_until"),
    scope: text("scope").notNull().default("family"),
    reminderValue: integer("reminder_value"),
    reminderUnit: text("reminder_unit"),
    createdBy: integer("created_by").references(() => users.id, {
      onDelete: "set null",
    }),
    createdAt: text("created_at").notNull(),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    index("activities_date_idx").on(table.date),
    index("activities_recurrence_idx").on(table.recurrence),
  ],
);

export const activityMembers = sqliteTable(
  "activity_members",
  {
    activityId: integer("activity_id")
      .notNull()
      .references(() => activities.id, { onDelete: "cascade" }),
    memberId: integer("member_id")
      .notNull()
      .references(() => members.id, { onDelete: "cascade" }),
  },
  (table) => [
    primaryKey({ columns: [table.activityId, table.memberId] }),
    index("activity_members_member_idx").on(table.memberId),
  ],
);

export const occurrenceStatus = sqliteTable(
  "occurrence_status",
  {
    activityId: integer("activity_id")
      .notNull()
      .references(() => activities.id, { onDelete: "cascade" }),
    occurrenceDate: text("occurrence_date").notNull(),
    status: text("status").notNull(),
    updatedBy: integer("updated_by").references(() => users.id, {
      onDelete: "set null",
    }),
    updatedAt: text("updated_at").notNull(),
  },
  (table) => [
    primaryKey({ columns: [table.activityId, table.occurrenceDate] }),
    index("occurrence_status_date_idx").on(table.occurrenceDate),
  ],
);

export type UserRow = typeof users.$inferSelect;
export type MemberRow = typeof members.$inferSelect;
export type CategoryRow = typeof categories.$inferSelect;
export type ActivityRow = typeof activities.$inferSelect;
