import type { ReminderDTO } from "@/lib/types";

export function reminderLabel(reminder: ReminderDTO): string {
  if (reminder.unit === "days") {
    return reminder.value === 1
      ? "1 día antes"
      : `${reminder.value} días antes`;
  }

  if (reminder.value >= 24 && reminder.value % 24 === 0) {
    const days = reminder.value / 24;
    return days === 1 ? "1 día antes" : `${days} días antes`;
  }

  return reminder.value === 1
    ? "1 hora antes"
    : `${reminder.value} horas antes`;
}
