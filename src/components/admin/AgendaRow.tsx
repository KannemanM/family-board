"use client";

import {
  Bell,
  Check,
  CircleCheck,
  Clock3,
  Loader2,
  Pencil,
  Repeat,
  RotateCcw,
  XCircle,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { MemberAvatar } from "@/components/ui/MemberAvatar";
import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { setOccurrenceStateAction } from "@/lib/actions/activities";
import { reminderLabel } from "@/lib/labels";
import type { OccurrenceDTO } from "@/lib/types";

export function AgendaRow({ occurrence }: { occurrence: OccurrenceDTO }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);

  const completed = occurrence.state === "completed";
  const cancelled = occurrence.state === "cancelled";

  const timeLabel = occurrence.allDay
    ? "Todo el día"
    : occurrence.startTime
      ? occurrence.endTime
        ? `${occurrence.startTime}–${occurrence.endTime}`
        : occurrence.startTime
      : "Sin horario";

  function updateState(state: "active" | "completed" | "cancelled") {
    setError(null);
    startTransition(async () => {
      const result = await setOccurrenceStateAction(
        occurrence.activityId,
        occurrence.date,
        state,
      );

      if (!result.ok) {
        setError(result.error ?? "No se pudo guardar");
        return;
      }
      setConfirmCancel(false);
      router.refresh();
    });
  }

  function toggleComplete() {
    updateState(completed ? "active" : "completed");
  }

  const accent = occurrence.category?.color ?? "#c8c2b5";

  return (
    <div>
      <div
        className={`card flex items-stretch gap-0 overflow-hidden transition-opacity ${
          cancelled ? "opacity-60" : ""
        }`}
      >
        <span
          className="w-1.5 shrink-0"
          style={{ backgroundColor: accent }}
          aria-hidden
        />

        <Link
          href={`/agenda/${occurrence.activityId}`}
          className="min-w-0 flex-1 px-3.5 py-3 sm:px-4 sm:py-3.5"
        >
          <div className="flex flex-wrap items-center gap-x-2.5 gap-y-1">
            <span className="board-time flex items-center gap-1 text-[13px] font-semibold text-ink-soft">
              {occurrence.allDay ? (
                <Clock3 className="h-3.5 w-3.5" aria-hidden />
              ) : null}
              {timeLabel}
            </span>

            <span
              className={`text-[15px] font-medium leading-snug ${
                completed || cancelled
                  ? "text-muted line-through decoration-1"
                  : "text-ink"
              }`}
            >
              {occurrence.title}
            </span>

            {occurrence.priority === "urgent" ? (
              <span className="rounded-full bg-urgent-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-urgent">
                Urgente
              </span>
            ) : null}
            {occurrence.priority === "high" ? (
              <span className="rounded-full bg-high-soft px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-high">
                Importante
              </span>
            ) : null}
            {completed ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-brand">
                <CircleCheck className="h-3.5 w-3.5" aria-hidden />
                Lista
              </span>
            ) : null}
            {cancelled ? (
              <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted">
                <XCircle className="h-3.5 w-3.5" aria-hidden />
                Cancelada
              </span>
            ) : null}
          </div>

          {occurrence.notes ? (
            <p className="mt-1 line-clamp-1 text-[13px] text-muted">
              {occurrence.notes}
            </p>
          ) : null}

          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-muted">
            {occurrence.category ? (
              <span className="inline-flex items-center gap-1.5">
                <CategoryIcon
                  name={occurrence.category.icon}
                  className="h-3.5 w-3.5"
                />
                {occurrence.category.name}
              </span>
            ) : null}

            {occurrence.recurring ? (
              <span className="inline-flex items-center gap-1">
                <Repeat className="h-3.5 w-3.5" aria-hidden />
                Se repite
              </span>
            ) : null}

            {occurrence.reminder ? (
              <span className="inline-flex items-center gap-1">
                <Bell className="h-3.5 w-3.5" aria-hidden />
                {reminderLabel(occurrence.reminder)}
              </span>
            ) : null}

            {occurrence.scope === "family" ? (
              <span className="inline-flex items-center gap-1 font-medium text-ink-soft">
                Toda la familia
              </span>
            ) : occurrence.members.length > 0 ? (
              <span className="flex items-center gap-1.5">
                {occurrence.members.slice(0, 4).map((member) => (
                  <MemberAvatar
                    key={member.id}
                    name={member.name}
                    color={member.color}
                    emoji={member.emoji}
                    size="sm"
                  />
                ))}
                <span className="ml-0.5">
                  {occurrence.members.map((member) => member.name).join(", ")}
                </span>
              </span>
            ) : (
              <span className="text-high">Sin asignar</span>
            )}
          </div>
        </Link>

        <div className="flex items-center gap-1 pr-2.5 sm:pr-3">
          {confirmCancel ? (
            <>
              <button
                type="button"
                onClick={() => updateState("cancelled")}
                disabled={pending}
                className="btn btn-danger h-8 px-2 text-[11px]"
              >
                {pending ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
                ) : null}
                Cancelar fecha
              </button>
              <button
                type="button"
                onClick={() => setConfirmCancel(false)}
                disabled={pending}
                className="btn btn-secondary h-8 px-2 text-[11px]"
              >
                No
              </button>
            </>
          ) : (
            <>
              {cancelled ? (
                <button
                  type="button"
                  onClick={() => updateState("active")}
                  disabled={pending}
                  aria-label="Reactivar esta fecha"
                  title="Reactivar esta fecha"
                  className="flex h-9 w-9 items-center justify-center rounded-full border border-line-strong bg-white text-muted transition-colors hover:border-brand hover:text-brand"
                >
                  {pending ? (
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  ) : (
                    <RotateCcw className="h-4 w-4" aria-hidden />
                  )}
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={toggleComplete}
                    disabled={pending}
                    aria-label={
                      completed
                        ? "Marcar como pendiente"
                        : "Marcar como completada"
                    }
                    title={
                      completed
                        ? "Marcar como pendiente"
                        : "Marcar como completada"
                    }
                    className={`flex h-9 w-9 items-center justify-center rounded-full border transition-colors ${
                      completed
                        ? "border-brand bg-brand text-white"
                        : "border-line-strong bg-white text-muted hover:border-brand hover:text-brand"
                    }`}
                  >
                    {pending ? (
                      <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    ) : (
                      <Check className="h-4 w-4" strokeWidth={2.4} aria-hidden />
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => setConfirmCancel(true)}
                    disabled={pending}
                    aria-label="Cancelar esta fecha"
                    title="Cancelar esta fecha"
                    className="flex h-9 w-9 items-center justify-center rounded-full border border-line-strong bg-white text-muted transition-colors hover:border-urgent hover:text-urgent"
                  >
                    <XCircle className="h-4 w-4" aria-hidden />
                  </button>
                </>
              )}

              <Link
                href={`/agenda/${occurrence.activityId}`}
                className="btn btn-ghost hidden h-9 w-9 p-0 sm:inline-flex"
                aria-label="Editar actividad"
                title="Editar"
              >
                <Pencil className="h-4 w-4" aria-hidden />
              </Link>
            </>
          )}
        </div>
      </div>

      {error ? (
        <p className="mt-1 px-2 text-xs text-urgent">{error}</p>
      ) : null}
    </div>
  );
}
