"use client";

import {
  ArrowLeft,
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  Clock3,
  Loader2,
  Repeat,
  Trash2,
  Users,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";

import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { MemberAvatar } from "@/components/ui/MemberAvatar";
import {
  deleteActivityAction,
  saveActivityAction,
} from "@/lib/actions/activities";
import {
  addDays,
  formatDateLong,
  isValidDate,
} from "@/lib/dates";
import { WEEKDAY_LABELS } from "@/lib/recurrence";
import type {
  CategoryDTO,
  MemberDTO,
  Priority,
  RecurrenceKind,
  ReminderUnit,
} from "@/lib/types";

export interface ActivityFormInitial {
  id: number;
  title: string;
  notes: string;
  categoryId: number | null;
  date: string;
  startTime: string | null;
  endTime: string | null;
  allDay: boolean;
  priority: Priority;
  scope: "family" | "members";
  memberIds: number[];
  recurrence: RecurrenceKind;
  recurrenceInterval: number;
  recurrenceWeekdays: number[];
  recurrenceUntil: string | null;
  reminderValue: number | null;
  reminderUnit: ReminderUnit | null;
}

interface ActivityFormProps {
  mode: "create" | "edit";
  today: string;
  members: MemberDTO[];
  categories: CategoryDTO[];
  initial?: ActivityFormInitial;
}

const PRIORITIES: {
  value: Priority;
  label: string;
  className: string;
  dot: string;
}[] = [
  {
    value: "normal",
    label: "Normal",
    className: "bg-brand-soft text-brand-dark border-brand/30",
    dot: "bg-brand",
  },
  {
    value: "high",
    label: "Importante",
    className: "bg-high-soft text-high border-high/30",
    dot: "bg-high",
  },
  {
    value: "urgent",
    label: "Urgente",
    className: "bg-urgent-soft text-urgent border-urgent/30",
    dot: "bg-urgent",
  },
];

const REMINDER_PRESETS: { value: number; unit: ReminderUnit; label: string }[] = [
  { value: 1, unit: "hours", label: "1 h" },
  { value: 3, unit: "hours", label: "3 h" },
  { value: 24, unit: "hours", label: "1 día" },
  { value: 2, unit: "days", label: "2 días" },
  { value: 7, unit: "days", label: "1 semana" },
];

const WEEKDAY_UNIT_LABEL: Record<RecurrenceKind, string> = {
  none: "",
  daily: "días",
  weekly: "semanas",
  monthly: "meses",
  yearly: "años",
};

export function ActivityForm({
  mode,
  today,
  members,
  categories,
  initial,
}: ActivityFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [isDeleting, startDelete] = useTransition();

  const [title, setTitle] = useState(initial?.title ?? "");
  const [notes, setNotes] = useState(initial?.notes ?? "");
  const [categoryId, setCategoryId] = useState<number | null>(
    initial?.categoryId ?? null,
  );
  const [date, setDate] = useState(initial?.date ?? today);
  const [allDay, setAllDay] = useState(initial?.allDay ?? true);
  const [startTime, setStartTime] = useState(initial?.startTime ?? "");
  const [endTime, setEndTime] = useState(initial?.endTime ?? "");
  const [priority, setPriority] = useState<Priority>(
    initial?.priority ?? "normal",
  );
  const [scope, setScope] = useState<"family" | "members">(
    initial?.scope ?? "family",
  );
  const [memberIds, setMemberIds] = useState<number[]>(
    initial?.memberIds ?? [],
  );
  const [recurrence, setRecurrence] = useState<RecurrenceKind>(
    initial?.recurrence ?? "none",
  );
  const [recurrenceInterval, setRecurrenceInterval] = useState(
    initial?.recurrenceInterval && initial.recurrenceInterval > 0
      ? initial.recurrenceInterval
      : 1,
  );
  const [weekdays, setWeekdays] = useState<number[]>(
    initial?.recurrenceWeekdays ?? [],
  );
  const [recurrenceUntil, setRecurrenceUntil] = useState(
    initial?.recurrenceUntil ?? "",
  );
  const [reminderOn, setReminderOn] = useState(
    initial?.reminderValue !== null && initial?.reminderValue !== undefined,
  );
  const [reminderValue, setReminderValue] = useState(
    initial?.reminderValue ?? 1,
  );
  const [reminderUnit, setReminderUnit] = useState<ReminderUnit>(
    initial?.reminderUnit ?? "days",
  );

  const [showMore, setShowMore] = useState(
    mode === "edit" &&
      Boolean(
        initial?.notes ||
          (initial?.recurrence && initial.recurrence !== "none") ||
          initial?.reminderValue !== null,
      ),
  );

  const [error, setError] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState(false);

  const dateChoices = useMemo(
    () => [
      { label: "Hoy", value: today },
      { label: "Mañana", value: addDays(today, 1) },
      { label: "En 7 días", value: addDays(today, 7) },
    ],
    [today],
  );

  const selectedDateLabel = isValidDate(date) ? formatDateLong(date) : "";

  function toggleMember(memberId: number) {
    const next = memberIds.includes(memberId)
      ? memberIds.filter((id) => id !== memberId)
      : [...memberIds, memberId];

    setMemberIds(next);
    setScope(next.length === 0 ? "family" : "members");
  }

  function toggleWeekday(day: number) {
    setWeekdays((current) =>
      current.includes(day)
        ? current.filter((value) => value !== day)
        : [...current, day].sort((a, b) => a - b),
    );
  }

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError("Poné un título para la actividad.");
      return;
    }

    if (scope === "members" && memberIds.length === 0) {
      setError("Elegí al menos un integrante o toda la familia.");
      return;
    }

    if (!isValidDate(date)) {
      setError("Elegí una fecha válida.");
      return;
    }

    if (!allDay && !startTime) {
      setError("Indicá un horario o marcá «Todo el día».");
      return;
    }

    if (!allDay && startTime && endTime && endTime <= startTime) {
      setError("El horario de fin debe ser posterior al de inicio.");
      return;
    }

    const payload = {
      id: initial?.id,
      title: title.trim(),
      notes,
      categoryId,
      date,
      allDay,
      startTime: allDay ? null : startTime || null,
      endTime: allDay ? null : endTime || null,
      priority,
      scope,
      memberIds: scope === "members" ? memberIds : [],
      recurrence,
      recurrenceInterval: Math.max(1, Number(recurrenceInterval) || 1),
      recurrenceWeekdays: recurrence === "weekly" ? weekdays : [],
      recurrenceUntil:
        recurrence === "none" ? null : recurrenceUntil || null,
      reminderValue: reminderOn ? Math.max(0, Number(reminderValue) || 0) : null,
      reminderUnit: reminderOn ? reminderUnit : null,
    };

    startTransition(async () => {
      const result = await saveActivityAction(payload);

      if (!result.ok) {
        setError(result.error ?? "No se pudo guardar la actividad.");
        return;
      }

      router.push("/agenda");
      router.refresh();
    });
  }

  function handleDelete() {
    if (!initial) return;

    startDelete(async () => {
      const result = await deleteActivityAction(initial.id);
      if (!result.ok) {
        setError(result.error ?? "No se pudo eliminar la actividad.");
        return;
      }
      router.push("/agenda");
      router.refresh();
    });
  }

  const busy = isPending || isDeleting;

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex items-center gap-3">
        <Link
          href="/agenda"
          className="btn btn-ghost h-9 w-9 shrink-0 p-0"
          aria-label="Volver a la agenda"
        >
          <ArrowLeft className="h-4.5 w-4.5" aria-hidden />
        </Link>
        <div className="min-w-0">
          <p className="section-label">
            {mode === "create" ? "Nueva" : "Editar"}
          </p>
          <h1 className="truncate font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            {mode === "create" ? "Nueva actividad" : "Editar actividad"}
          </h1>
        </div>
      </div>

      {error ? (
        <p
          role="alert"
          className="rounded-xl border border-[#edcdc6] bg-urgent-soft px-3.5 py-2.5 text-sm text-urgent"
        >
          {error}
        </p>
      ) : null}

      <div className="card space-y-5 p-4 sm:p-5">
        <div>
          <label className="label" htmlFor="title">
            ¿Qué hay que hacer?
          </label>
          <input
            id="title"
            className="field text-base"
            placeholder="Ej: Turno con la pediatra"
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            maxLength={140}
            required
            autoFocus={mode === "create"}
          />
        </div>

        <div>
          <label className="label" htmlFor="date">
            Fecha
          </label>
          <input
            id="date"
            type="date"
            className="field"
            value={date}
            onChange={(event) => setDate(event.target.value)}
            required
          />
          <div className="mt-2 flex flex-wrap items-center gap-2">
            {dateChoices.map((choice) => (
              <button
                key={choice.label}
                type="button"
                className="chip"
                data-selected={date === choice.value}
                onClick={() => setDate(choice.value)}
              >
                {choice.label}
              </button>
            ))}
            <span className="ml-1 text-xs text-muted">
              {selectedDateLabel}
            </span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between gap-3">
            <span className="label mb-0">Horario</span>
            <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-soft">
              <input
                type="checkbox"
                className="h-4 w-4 accent-[#2f6b57]"
                checked={allDay}
                onChange={(event) => {
                  setAllDay(event.target.checked);
                  if (!event.target.checked && !startTime) {
                    setStartTime("09:00");
                  }
                }}
              />
              Todo el día
            </label>
          </div>

          {allDay ? (
            <p className="mt-2 flex items-center gap-1.5 text-sm text-muted">
              <Clock3 className="h-3.5 w-3.5" aria-hidden />
              Se muestra sin horario en el tablero.
            </p>
          ) : (
            <div className="mt-2 grid grid-cols-2 gap-2">
              <div>
                <label className="mb-1 block text-xs text-muted" htmlFor="startTime">
                  Desde
                </label>
                <input
                  id="startTime"
                  type="time"
                  className="field"
                  value={startTime}
                  onChange={(event) => setStartTime(event.target.value)}
                />
              </div>
              <div>
                <label className="mb-1 block text-xs text-muted" htmlFor="endTime">
                  Hasta (opcional)
                </label>
                <input
                  id="endTime"
                  type="time"
                  className="field"
                  value={endTime}
                  onChange={(event) => setEndTime(event.target.value)}
                />
              </div>
            </div>
          )}
        </div>

        <div>
          <span className="label">¿Quién?</span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="chip"
              data-selected={scope === "family"}
              onClick={() => {
                setScope("family");
                setMemberIds([]);
              }}
            >
              <Users className="h-3.5 w-3.5" aria-hidden />
              Toda la familia
            </button>

            {members.map((member) => {
              const selected =
                scope === "members" && memberIds.includes(member.id);
              return (
                <button
                  key={member.id}
                  type="button"
                  className="chip"
                  data-selected={selected}
                  onClick={() => toggleMember(member.id)}
                  style={
                    selected
                      ? {
                          borderColor: member.color,
                          backgroundColor: `${member.color}16`,
                        }
                      : undefined
                  }
                >
                  <MemberAvatar
                    name={member.name}
                    color={member.color}
                    emoji={member.emoji}
                    size="sm"
                    className="h-5 w-5 text-[10px]"
                  />
                  {member.name}
                </button>
              );
            })}
          </div>
          {members.length === 0 ? (
            <p className="mt-2 text-xs text-muted">
              Todavía no hay integrantes.{" "}
              <Link
                href="/integrantes"
                className="font-medium text-brand underline-offset-2 hover:underline"
              >
                Agregalos acá
              </Link>
              .
            </p>
          ) : null}
        </div>

        <div>
          <span className="label">Categoría</span>
          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              className="chip"
              data-selected={categoryId === null}
              onClick={() => setCategoryId(null)}
            >
              Sin categoría
            </button>
            {categories.map((category) => {
              const selected = categoryId === category.id;
              return (
                <button
                  key={category.id}
                  type="button"
                  className="chip"
                  data-selected={selected}
                  onClick={() => setCategoryId(category.id)}
                  style={
                    selected
                      ? {
                          borderColor: category.color,
                          backgroundColor: `${category.color}16`,
                        }
                      : undefined
                  }
                >
                  <CategoryIcon
                    name={category.icon}
                    className="h-3.5 w-3.5"
                  />
                  {category.name}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <span className="label">Prioridad</span>
          <div className="grid grid-cols-3 gap-2">
            {PRIORITIES.map((option) => {
              const selected = priority === option.value;
              return (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setPriority(option.value)}
                  className={`flex items-center justify-center gap-1.5 rounded-xl border px-2 py-2.5 text-[13px] font-medium transition-colors ${
                    selected
                      ? option.className
                      : "border-line-strong bg-white text-ink-soft hover:bg-paper-deep"
                  }`}
                >
                  <span
                    className={`h-2 w-2 rounded-full ${option.dot}`}
                    aria-hidden
                  />
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      <div className="card overflow-hidden">
        <button
          type="button"
          onClick={() => setShowMore((value) => !value)}
          className="flex w-full items-center justify-between gap-3 px-4 py-3.5 text-left text-sm font-medium sm:px-5"
          aria-expanded={showMore}
        >
          <span className="flex items-center gap-2">
            <span className="text-ink-soft">Más opciones</span>
            <span className="hidden text-xs font-normal text-muted sm:inline">
              Notas, recordatorio y repetición
            </span>
          </span>
          <ChevronDown
            className={`h-4 w-4 text-muted transition-transform ${
              showMore ? "rotate-180" : ""
            }`}
            aria-hidden
          />
        </button>

        {showMore ? (
          <div className="space-y-5 border-t border-line px-4 py-4 sm:px-5">
            <div>
              <label className="label" htmlFor="notes">
                Notas
              </label>
              <textarea
                id="notes"
                className="field min-h-24 resize-y"
                placeholder="Detalles, dirección, qué llevar…"
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                maxLength={2000}
              />
            </div>

            <div>
              <div className="flex items-center justify-between gap-3">
                <span className="label mb-0 flex items-center gap-1.5">
                  <Bell className="h-3.5 w-3.5" aria-hidden />
                  Recordatorio visual
                </span>
                <label className="flex cursor-pointer items-center gap-2 text-sm text-ink-soft">
                  <input
                    type="checkbox"
                    className="h-4 w-4 accent-[#2f6b57]"
                    checked={reminderOn}
                    onChange={(event) => setReminderOn(event.target.checked)}
                  />
                  Activar
                </label>
              </div>

              {reminderOn ? (
                <div className="mt-2 space-y-2">
                  <div className="flex flex-wrap gap-2">
                    {REMINDER_PRESETS.map((preset) => (
                      <button
                        key={preset.label}
                        type="button"
                        className="chip"
                        data-selected={
                          reminderValue === preset.value &&
                          reminderUnit === preset.unit
                        }
                        onClick={() => {
                          setReminderValue(preset.value);
                          setReminderUnit(preset.unit);
                        }}
                      >
                        {preset.label} antes
                      </button>
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      className="field w-24"
                      min={0}
                      max={365}
                      value={reminderValue}
                      onChange={(event) =>
                        setReminderValue(Number(event.target.value))
                      }
                      aria-label="Cantidad de anticipación"
                    />
                    <select
                      className="field w-32"
                      value={reminderUnit}
                      onChange={(event) =>
                        setReminderUnit(event.target.value as ReminderUnit)
                      }
                      aria-label="Unidad de anticipación"
                    >
                      <option value="hours">horas antes</option>
                      <option value="days">días antes</option>
                    </select>
                  </div>
                  <p className="text-xs text-muted">
                    Se destaca en el tablero desde ese momento hasta que termina
                    la actividad.
                  </p>
                </div>
              ) : null}
            </div>

            <div>
              <label className="label flex items-center gap-1.5" htmlFor="recurrence">
                <Repeat className="h-3.5 w-3.5" aria-hidden />
                Repetición
              </label>
              <select
                id="recurrence"
                className="field"
                value={recurrence}
                onChange={(event) =>
                  setRecurrence(event.target.value as RecurrenceKind)
                }
              >
                <option value="none">No se repite</option>
                <option value="daily">Todos los días</option>
                <option value="weekly">Cada semana</option>
                <option value="monthly">Cada mes</option>
                <option value="yearly">Cada año</option>
              </select>

              {recurrence !== "none" ? (
                <div className="mt-3 space-y-3 rounded-xl bg-paper-deep/70 p-3">
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-ink-soft">Cada</span>
                    <input
                      type="number"
                      className="field w-20"
                      min={1}
                      max={52}
                      value={recurrenceInterval}
                      onChange={(event) =>
                        setRecurrenceInterval(Number(event.target.value))
                      }
                      aria-label="Intervalo de repetición"
                    />
                    <span className="text-sm text-ink-soft">
                      {WEEKDAY_UNIT_LABEL[recurrence]}
                    </span>
                  </div>

                  {recurrence === "weekly" ? (
                    <div>
                      <p className="mb-1.5 text-xs text-muted">
                        ¿Qué días? Si no elegís ninguno, se repite el mismo día
                        de la fecha inicial.
                      </p>
                      <div className="flex gap-1.5">
                        {WEEKDAY_LABELS.map((label, index) => {
                          const selected = weekdays.includes(index);
                          return (
                            <button
                              key={index}
                              type="button"
                              onClick={() => toggleWeekday(index)}
                              aria-pressed={selected}
                              className={`flex h-9 w-9 items-center justify-center rounded-full border text-xs font-semibold transition-colors ${
                                selected
                                  ? "border-brand bg-brand text-white"
                                  : "border-line-strong bg-white text-ink-soft hover:bg-paper"
                              }`}
                            >
                              {label}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ) : null}

                  <div>
                    <label
                      className="mb-1 block text-xs text-muted"
                      htmlFor="recurrenceUntil"
                    >
                      Repetir hasta (opcional)
                    </label>
                    <input
                      id="recurrenceUntil"
                      type="date"
                      className="field"
                      value={recurrenceUntil}
                      min={date}
                      onChange={(event) =>
                        setRecurrenceUntil(event.target.value)
                      }
                    />
                  </div>

                  <p className="flex items-start gap-1.5 text-xs text-muted">
                    <CalendarDays
                      className="mt-0.5 h-3.5 w-3.5 shrink-0"
                      aria-hidden
                    />
                    La primera fecha es el inicio. Podés completar o cancelar
                    cada ocurrencia por separado.
                  </p>
                </div>
              ) : null}
            </div>
          </div>
        ) : null}
      </div>

      {mode === "edit" && initial ? (
        <div className="rounded-2xl border border-line bg-white/60 p-3.5">
          {confirmDelete ? (
            <div className="space-y-3">
              <p className="text-sm text-ink-soft">
                ¿Eliminar «{initial.title}»? Se borran todas sus fechas y esta
                acción no se puede deshacer.
              </p>
              <div className="flex gap-2">
                <button
                  type="button"
                  className="btn btn-danger flex-1"
                  onClick={handleDelete}
                  disabled={busy}
                >
                  {isDeleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <Trash2 className="h-4 w-4" aria-hidden />
                  )}
                  Sí, eliminar
                </button>
                <button
                  type="button"
                  className="btn btn-secondary flex-1"
                  onClick={() => setConfirmDelete(false)}
                  disabled={busy}
                >
                  Cancelar
                </button>
              </div>
            </div>
          ) : (
            <button
              type="button"
              className="btn btn-ghost w-full text-urgent hover:bg-urgent-soft"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2 className="h-4 w-4" aria-hidden />
              Eliminar actividad
            </button>
          )}
        </div>
      ) : null}

      <div className="sticky bottom-0 z-10 -mx-4 mt-1 border-t border-line bg-paper/95 px-4 py-3 backdrop-blur-xl md:static md:mx-0 md:border-0 md:bg-transparent md:p-0 md:backdrop-blur-none">
        <button type="submit" className="btn btn-primary w-full" disabled={busy}>
          {isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              Guardando…
            </>
          ) : (
            <>
              <Check className="h-4 w-4" strokeWidth={2.4} aria-hidden />
              {mode === "create" ? "Guardar actividad" : "Guardar cambios"}
            </>
          )}
        </button>
        <p className="mt-2 text-center text-xs text-muted">
          Aparece en el tablero en unos segundos.
        </p>
      </div>
    </form>
  );
}
