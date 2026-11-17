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

import { CATEGORY_ICONS, CategoryIcon } from "@/components/ui/CategoryIcon";
import {
  deleteCategoryAction,
  moveCategoryAction,
  saveCategoryAction,
} from "@/lib/actions/categories";
import type { CategoryDTO } from "@/lib/types";

const PALETTE = [
  "#4F6BED",
  "#2E9E8F",
  "#2F9BB5",
  "#3FAE7A",
  "#C9A227",
  "#D99532",
  "#E2685A",
  "#D4659B",
  "#8A63D2",
  "#6B7A90",
];

interface Draft {
  id?: number;
  name: string;
  color: string;
  icon: string;
}

export function CategoryManager({ categories }: { categories: CategoryDTO[] }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Draft | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [confirmId, setConfirmId] = useState<number | null>(null);
  const [isPending, startTransition] = useTransition();

  function openNew() {
    setError(null);
    setDraft({
      name: "",
      color: PALETTE[categories.length % PALETTE.length],
      icon: "Circle",
    });
  }

  function openEdit(category: CategoryDTO) {
    setError(null);
    setDraft({
      id: category.id,
      name: category.name,
      color: category.color,
      icon: category.icon,
    });
  }

  function save() {
    if (!draft) return;
    if (!draft.name.trim()) {
      setError("Poné un nombre.");
      return;
    }

    startTransition(async () => {
      const result = await saveCategoryAction(draft);
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
      const result = await deleteCategoryAction(id);
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
      await moveCategoryAction(id, direction);
      router.refresh();
    });
  }

  return (
    <div>
      <header className="flex items-start justify-between gap-3">
        <div>
          <p className="section-label">Organización</p>
          <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">
            Categorías
          </h1>
          <p className="mt-1.5 text-sm text-ink-soft">
            Escuela, salud, familia, cumpleaños… cada categoría tiene su ícono y
            color en el tablero.
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
        Agregar categoría
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
              {draft.id ? "Editar categoría" : "Nueva categoría"}
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
              <span
                className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl"
                style={{
                  backgroundColor: `${draft.color}18`,
                  color: draft.color,
                }}
              >
                <CategoryIcon name={draft.icon} className="h-6 w-6" />
              </span>
              <div className="flex-1">
                <label className="label" htmlFor="category-name">
                  Nombre
                </label>
                <input
                  id="category-name"
                  className="field"
                  value={draft.name}
                  onChange={(event) =>
                    setDraft({ ...draft, name: event.target.value })
                  }
                  placeholder="Ej: Escuela"
                  maxLength={40}
                  autoFocus
                />
              </div>
            </div>

            <div>
              <span className="label">Ícono</span>
              <div className="flex flex-wrap gap-1.5">
                {CATEGORY_ICONS.map(({ name, label, Icon }) => {
                  const selected = draft.icon === name;
                  return (
                    <button
                      key={name}
                      type="button"
                      onClick={() => setDraft({ ...draft, icon: name })}
                      className={`flex h-10 w-10 items-center justify-center rounded-xl border transition-colors ${
                        selected
                          ? "border-brand bg-brand-soft text-brand-dark"
                          : "border-line-strong bg-white text-ink-soft hover:bg-paper-deep"
                      }`}
                      aria-label={label}
                      aria-pressed={selected}
                      title={label}
                    >
                      <Icon className="h-4.5 w-4.5" strokeWidth={1.8} aria-hidden />
                    </button>
                  );
                })}
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

      {categories.length === 0 ? (
        <div className="mt-5 rounded-2xl border border-dashed border-line-strong bg-white/60 px-6 py-12 text-center">
          <p className="text-sm font-semibold">No hay categorías</p>
          <p className="mx-auto mt-1 max-w-xs text-sm text-muted">
            Creá categorías como Escuela, Salud o Cumpleaños para ordenar la
            agenda de un vistazo.
          </p>
        </div>
      ) : (
        <ul className="card mt-5 divide-y divide-line overflow-hidden">
          {categories.map((category, index) => (
            <li
              key={category.id}
              className="flex items-center gap-3 px-3 py-3 sm:px-4"
            >
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl"
                style={{
                  backgroundColor: `${category.color}18`,
                  color: category.color,
                }}
              >
                <CategoryIcon name={category.icon} className="h-5 w-5" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{category.name}</p>
              </div>

              {confirmId === category.id ? (
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    className="btn btn-danger h-8 px-2.5 text-xs"
                    onClick={() => remove(category.id)}
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
                      onClick={() => move(category.id, "up")}
                      disabled={index === 0 || isPending}
                      aria-label="Mover arriba"
                    >
                      <ArrowUp className="h-3 w-3" aria-hidden />
                    </button>
                    <button
                      type="button"
                      className="flex h-4 w-6 items-center justify-center text-muted hover:text-ink disabled:opacity-30"
                      onClick={() => move(category.id, "down")}
                      disabled={index === categories.length - 1 || isPending}
                      aria-label="Mover abajo"
                    >
                      <ArrowDown className="h-3 w-3" aria-hidden />
                    </button>
                  </div>
                  <button
                    type="button"
                    className="btn btn-ghost h-9 w-9 p-0"
                    onClick={() => openEdit(category)}
                    aria-label={`Editar ${category.name}`}
                  >
                    <Pencil className="h-4 w-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    className="btn btn-ghost h-9 w-9 p-0 text-muted hover:text-urgent"
                    onClick={() => setConfirmId(category.id)}
                    aria-label={`Eliminar ${category.name}`}
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
        Si eliminás una categoría, las actividades que la usaban se conservan
        sin categoría.
      </p>
    </div>
  );
}
