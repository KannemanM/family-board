export type Priority = "normal" | "high" | "urgent";
export type RecurrenceKind = "none" | "daily" | "weekly" | "monthly" | "yearly";
export type ReminderUnit = "hours" | "days";
export type OccurrenceState = "active" | "completed" | "cancelled";
export type ActivityScope = "family" | "members";

export const PRIORITY_LABELS: Record<Priority, string> = {
  normal: "Normal",
  high: "Importante",
  urgent: "Urgente",
};

export const PRIORITY_WEIGHT: Record<Priority, number> = {
  normal: 0,
  high: 1,
  urgent: 2,
};

export interface MemberDTO {
  id: number;
  name: string;
  color: string;
  emoji: string;
}

export interface CategoryDTO {
  id: number;
  name: string;
  color: string;
  icon: string;
}

export interface ReminderDTO {
  value: number;
  unit: ReminderUnit;
}

export interface OccurrenceDTO {
  id: string;
  activityId: number;
  date: string;
  title: string;
  notes: string;
  category: CategoryDTO | null;
  members: MemberDTO[];
  scope: ActivityScope;
  allDay: boolean;
  startTime: string | null;
  endTime: string | null;
  priority: Priority;
  recurring: boolean;
  reminder: ReminderDTO | null;
  state: OccurrenceState;
  highlighted: boolean;
}

export interface BoardDay {
  date: string;
  items: OccurrenceDTO[];
}

export interface BoardData {
  generatedAt: string;
  today: string;
  timezone: string;
  familyName: string;
  refreshSeconds: number;
  members: MemberDTO[];
  categories: CategoryDTO[];
  highlights: OccurrenceDTO[];
  days: BoardDay[];
}
