"use client";

import {
  ArrowDown,
  ArrowUp,
  Check,
  Loader2,
  Pencil,
  Plus,
  Trash2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";

import { MemberAvatar } from "@/components/ui/MemberAvatar";
import {
  deleteMemberAction,
  moveMemberAction,
  saveMemberAction,
} from "@/lib/actions/members";
import type { MemberDTO } from "@/lib/types";

const PALETTE = [
  "#E05D5D",
  "#E8993A",
  "#C9A227",
  "#3FAE7A",
  "#2F9BB5",
  "#4F72E8",
  "#8A63D2",
  "#D45E9E",
  "#7C6A5A",
  "#5A6B7B",
];

const EMOJI_CHOICES = ["", "👩", "👨", "👧", "👦", "🧒", "👶", "🐶", "🐱", "⭐"];

interface Draft {
  id?: number;
  name: string;
  color: string;
  emoji: string;
}

export function MemberManager({ members }: { members: MemberDTO[] }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  function openNew() {
    setError(null);
    setDraft({
      name: "",
      color: PALETTE[members.length % PALETTE.length],
      emoji: "",
    });
  }

  function openEdit(member: MemberDTO) {
    setError(null);
    setDraft({
      id: member.id,
      name: member.name,
      color: member.color,
      emoji: member.emoji,
    });
  }

  function save() {
    if (!draft) return;
    if (!draft.name.trim()) {
      setError("Poné un nombre.");
      return;
    }

    startTransition(async () => {
      const result = await saveMemberAction(draft);
      if (!result.ok) {
        setError(result.error ?? "No se pudo guardar.");
        return;
      }
      setDraft(null);
      setError(null);
      router.refresh();
    });
  }

  function remove(id: number) {
    startTransition(async () => {
      const result = await deleteMemberAction(id);
      if (!result.ok) {
        setError(result.error ?? "No se pudo eliminar.");
        return;
      }
      setConfirmId(null);
      router.refresh();
    });
  }

  function move(id: number, direction: "up" | "down") {
    startTransition(async () => {
      await moveMemberAction(id, direction);
      router.refresh();
    });
  }

  return (
    <div>
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="section-label">La familia</p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">
            Integrantes
          </h1>
          <p className="mt-1.5 text-sm text-ink-soft">
            Cada persona tiene su color. Se usa para identificar sus
            actividades en el tablero.
          </p>
        </div>
        <button
          type="button"
          className="btn btn-primary hidden shrink-0 sm:inline-flex"
          onClick={openNew}
        >
          <Plus className="h-4 w-4" aria-hidden />
          Agregar
        </button>
      </header>

      <button
        type="button"
        className="btn btn-primary mt-4 w-full sm:hidden"
        onClick={openNew}
      >
        <Plus className="h-4 w-4" aria-hidden />
        Agregar integrante
      </button>

      {error ? (
        <p
          role="alert"
          className="mt-4 rounded-xl border border-[#edcdc6] bg-urgent-soft px-3.5 py-2.5 text-sm text-urgent"
        >
          {error}
        </p>
      ) : null}

      {draft ? (
        <div className="card mt-4 p-4 sm:p-5">
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">
              {draft.id ? "Editar integrante" : "Nuevo integrante"}
            </h2>
            <button
              type="button"
              className="btn btn-ghost h-8 w-8 p-0"
              onClick={() => setDraft(null)}
              aria-label="Cerrar"
            >
              <X className="h-4 w-4" aria-hidden />
            </button>
          </div>

          <div className="mt-4 space-y-4">
            <div className="flex items-center gap-3">
              <MemberAvatar
                name={draft.name || "?"}
                color={draft.color}
                emoji={draft.emoji}
                size="lg"
              />
              <div className="flex-1">
                <label className="label" htmlFor="member-name">
                  Nombre
                </label>
                <input
                  id="member-name"
                  className="field"
                  value={draft.name}
                  onChange={(event) =>
                    setDraft({ ...draft, name: event.target.value })
                  }
                  placeholder="Ej: Ana"
                  maxLength={40}
                  autoFocus
                />
              </div>
            </div>

            <div>
              <span className="label">Color</span>
              <div className="flex flex-wrap gap-2">
                {PALETTE.map((color) => {
                  const selected = draft.color === color;
                  return (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setDraft({ ...draft, color })}
                      className={`flex h-9 w-9 items-center justify-center rounded-full border-2 transition-transform active:scale-95 ${
                        selected
                          ? "border-ink shadow-sm"
                          : "border-transparent"
                      }`}
                      style={{ backgroundColor: color }}
                      aria-label={`Color ${color}`}
                      aria-pressed={selected}
                    >
                      {selected ? (
                        <Check
                          className="h-4 w-4 text-white"
                          strokeWidth={2.5}
                          aria-hidden
                        />
                      ) : null}
                    </button>
                  );
                })}
              </div>
            </div>

            <div>
              <span className="label">Emoji (opcional)</span>
              <div className="flex flex-wrap items-center gap-2">
                {EMOJI_CHOICES.map((emoji, index) => (
                  <button
                    key={`${emoji}-${index}`}
                    type="button"
                    onClick={() => setDraft({ ...draft, emoji })}
                    className={`flex h-9 w-9 items-center justify-center rounded-xl border text-base transition-colors ${
                      draft.emoji === emoji
                        ? "border-brand bg-brand-soft"
                        : "border-line-strong bg-white hover:bg-paper-deep"
                    }`}
                    aria-pressed={draft.emoji === emoji}
                    aria-label={emoji || "Sin emoji"}
                  >
                    {emoji || "—"}
                  </button>
                ))}
                <input
                  className="field w-20 text-center"
                  value={draft.emoji}
                  onChange={(event) =>
                    setDraft({ ...draft, emoji: event.target.value })
                  }
                  maxLength={8}
                  aria-label="Otro emoji"
                  placeholder="Otro"
                />
              </div>
            </div>

            <div className="flex gap-2 pt-1">
              <button
                type="button"
                className="btn btn-primary flex-1"
                onClick={save}
                disabled={isPending}
              >
                {isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                ) : (
                  <Check className="h-4 w-4" aria-hidden />
                )}
                Guardar
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={() => setDraft(null)}
                disabled={isPending}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      ) : null}

      {members.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-line-strong bg-white/60 px-6 py-12 text-center">
          <p className="text-sm font-semibold">Todavía no hay integrantes</p>
          <p className="mx-auto mt-1 max-w-xs text-sm text-muted">
            Sumá a cada persona de la familia para poder asignarle actividades
            y verlas con su color en el tablero.
          </p>
        </div>
      ) : (
        <ul className="card mt-5 divide-y divide-line overflow-hidden">
          {members.map((member, index) => (
            <li key={member.id} className="flex items-center gap-3 px-3 py-3 sm:px-4">
              <MemberAvatar
                name={member.name}
                color={member.color}
                emoji={member.emoji}
                size="lg"
              />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{member.name}</p>
                {member.emoji ? (
                  <p className="text-xs text-muted">{member.emoji}</p>
                ) : null}
              </div>

              {confirmId === member.id ? (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    className="btn btn-danger h-8 px-2.5 text-xs"
                    onClick={() => remove(member.id)}
                    disabled={isPending}
                  >
                    Eliminar
                  </button>
                  <button
                    type="button"
                    className="btn btn-secondary h-8 px-2.5 text-xs"
                    onClick={() => setConfirmId(null)}
                    disabled={isPending}
                  >
                    No
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-0.5">
                  <div className="hidden flex-col sm:flex">
                    <button
                      type="button"
                      className="flex h-4 w-6 items-center justify-center text-muted hover:text-ink disabled:opacity-30"
                      onClick={() => move(member.id, "up")}
                      disabled={index === 0 || isPending}
                      aria-label="Mover arriba"
                    >
                      <ArrowUp className="h-3 w-3" aria-hidden />
                    </button>
                    <button
                      type="button"
                      className="flex h-4 w-6 items-center justify-center text-muted hover:text-ink disabled:opacity-30"
                      onClick={() => move(member.id, "down")}
                      disabled={index === members.length - 1 || isPending}
                      aria-label="Mover abajo"
                    >
                      <ArrowDown className="h-3 w-3" aria-hidden />
                    </button>
                  </div>
                  <button
                    type="button"
                    className="btn btn-ghost h-9 w-9 p-0"
                    onClick={() => openEdit(member)}
                    aria-label={`Editar ${member.name}`}
                  >
                    <Pencil className="h-4 w-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost h-9 w-9 p-0 text-muted hover:text-urgent"
                    onClick={() => setConfirmId(member.id)}
                    aria-label={`Eliminar ${member.name}`}
                  >
                    <Trash2 className="h-4 w-4" aria-hidden />
                  </button>
                </div>
              )}
            </li>
          ))}
        </ul>
      )}

      <p className="mt-4 text-xs leading-relaxed text-muted">
        Al eliminar un integrante, sus actividades no se borran: quedan
        asignadas a toda la familia para que puedas reasignarlas.
      </p>
    </div>
  );
}
