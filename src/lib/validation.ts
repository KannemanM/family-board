import { z } from "zod";

import { isValidDate, isValidTime } from "@/lib/dates";

const dateString = z
  .string()
  .refine((value) => isValidDate(value), "Fecha inválida");

const timeString = z
  .string()
  .refine((value) => isValidTime(value), "Horario inválido");

export const activityInputSchema = z
  .object({
    id: z.number().int().positive().optional(),
    title: z
      .string()
      .trim()
      .min(1, "Poné un título")
      .max(140, "El título es demasiado largo"),
    notes: z.string().max(2000, "La descripción es demasiado larga").default(""),
    categoryId: z.number().int().positive().nullable().default(null),
    date: dateString,
    allDay: z.boolean().default(false),
    startTime: timeString.nullable().default(null),
    endTime: timeString.nullable().default(null),
    priority: z.enum(["normal", "high", "urgent"]).default("normal"),
    scope: z.enum(["family", "members"]).default("family"),
    memberIds: z.array(z.number().int().positive()).default([]),
    recurrence: z
      .enum(["none", "daily", "weekly", "monthly", "yearly"])
      .default("none"),
    recurrenceInterval: z.number().int().min(1).max(52).default(1),
    recurrenceWeekdays: z
      .array(z.number().int().min(0).max(6))
      .default([]),
    recurrenceUntil: dateString.nullable().default(null),
    reminderValue: z.number().int().min(0).max(365).nullable().default(null),
    reminderUnit: z.enum(["hours", "days"]).nullable().default(null),
  })
  .superRefine((value, context) => {
    if (!value.allDay && !value.startTime) {
      context.addIssue({
        code: "custom",
        path: ["startTime"],
        message: "Indicá un horario o marcá todo el día",
      });
    }

    if (value.startTime && value.endTime && value.endTime <= value.startTime) {
      context.addIssue({
        code: "custom",
        path: ["endTime"],
        message: "El horario de fin debe ser posterior al de inicio",
      });
    }

    if (value.scope === "members" && value.memberIds.length === 0) {
      context.addIssue({
        code: "custom",
        path: ["memberIds"],
        message: "Elegí al menos un integrante",
      });
    }

    if (
      value.recurrenceUntil &&
      value.recurrence !== "none" &&
      value.recurrenceUntil < value.date
    ) {
      context.addIssue({
        code: "custom",
        path: ["recurrenceUntil"],
        message: "La fecha de fin no puede ser anterior al inicio",
      });
    }

    if ((value.reminderValue === null) !== (value.reminderUnit === null)) {
      context.addIssue({
        code: "custom",
        path: ["reminderValue"],
        message: "Completá el recordatorio",
      });
    }
  });

export type ActivityInput = z.infer<typeof activityInputSchema>;

export const memberInputSchema = z.object({
  id: z.number().int().positive().optional(),
  name: z.string().trim().min(1, "Poné un nombre").max(40),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Color inválido"),
  emoji: z.string().trim().max(8).default(""),
});

export type MemberInput = z.infer<typeof memberInputSchema>;

export const categoryInputSchema = z.object({
  id: z.number().int().positive().optional(),
  name: z.string().trim().min(1, "Poné un nombre").max(40),
  color: z
    .string()
    .regex(/^#[0-9a-fA-F]{6}$/, "Color inválido"),
  icon: z.string().trim().max(40).default("Circle"),
});

export type CategoryInput = z.infer<typeof categoryInputSchema>;

export const credentialsSchema = z.object({
  name: z.string().trim().min(1, "Poné tu nombre").max(60),
  username: z
    .string()
    .trim()
    .toLowerCase()
    .regex(
      /^[a-z0-9._-]{3,32}$/,
      "Usá entre 3 y 32 caracteres: letras, números, punto, guion o guion bajo",
    ),
  password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
});

export function firstIssue(error: z.ZodError): string {
  return error.issues[0]?.message ?? "Datos inválidos";
}
