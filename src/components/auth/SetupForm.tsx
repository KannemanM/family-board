"use client";

import { useActionState } from "react";

import { setupAction } from "@/lib/actions/auth";
import type { FormState } from "@/lib/action-types";
import { PasswordField, SubmitButton } from "@/components/ui/FormControls";
import { TIMEZONES } from "@/lib/dates";

const initialState: FormState = {};

export function SetupForm() {
  const [state, formAction] = useActionState(setupAction, initialState);

  return (
    <form action={formAction} className="space-y-6">
      {state.error ? (
        <p
          role="alert"
          className="rounded-xl border border-[#edcdc6] bg-urgent-soft px-3.5 py-2.5 text-sm text-urgent"
        >
          {state.error}
        </p>
      ) : null}

      <section className="card p-5 sm:p-6">
        <div className="mb-4">
          <p className="section-label">Paso 1</p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight">
            La familia
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="label" htmlFor="familyName">
              Nombre de la familia
            </label>
            <input
              id="familyName"
              name="familyName"
              className="field"
              placeholder="Casa Rodríguez"
              required
              autoFocus
            />
          </div>

          <div className="sm:col-span-2">
            <label className="label" htmlFor="timezone">
              Zona horaria
            </label>
            <select
              id="timezone"
              name="timezone"
              className="field"
              defaultValue="America/Argentina/Buenos_Aires"
            >
              {TIMEZONES.map((zone) => (
                <option key={zone.value} value={zone.value}>
                  {zone.label} ({zone.value})
                </option>
              ))}
            </select>
            <p className="mt-1.5 text-xs text-muted">
              Se usa para el reloj y para calcular qué actividades son de hoy.
            </p>
          </div>
        </div>
      </section>

      <section className="card p-5 sm:p-6">
        <div className="mb-4">
          <p className="section-label">Paso 2</p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight">
            Primer adulto
          </h2>
          <p className="mt-1 text-sm text-muted">
            Cada adulto tiene su propia cuenta, con los mismos permisos.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="name1">
              Nombre
            </label>
            <input
              id="name1"
              name="name1"
              className="field"
              placeholder="Martín"
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="username1">
              Usuario
            </label>
            <input
              id="username1"
              name="username1"
              className="field"
              placeholder="martin"
              autoCapitalize="none"
              autoCorrect="off"
              pattern="[a-zA-Z0-9._\-]{3,32}"
              title="Entre 3 y 32 caracteres: letras, números, punto, guion o guion bajo"
              required
            />
          </div>
          <div className="sm:col-span-2">
            <PasswordField
              name="password1"
              label="Contraseña"
              autoComplete="new-password"
              placeholder="Mínimo 8 caracteres"
            />
          </div>
        </div>
      </section>

      <section className="card p-5 sm:p-6">
        <div className="mb-4">
          <p className="section-label">Paso 3</p>
          <h2 className="mt-1 text-lg font-semibold tracking-tight">
            Segundo adulto
          </h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="label" htmlFor="name2">
              Nombre
            </label>
            <input
              id="name2"
              name="name2"
              className="field"
              placeholder="Ana"
              required
            />
          </div>
          <div>
            <label className="label" htmlFor="username2">
              Usuario
            </label>
            <input
              id="username2"
              name="username2"
              className="field"
              placeholder="ana"
              autoCapitalize="none"
              autoCorrect="off"
              pattern="[a-zA-Z0-9._\-]{3,32}"
              title="Entre 3 y 32 caracteres: letras, números, punto, guion o guion bajo"
              required
            />
          </div>
          <div className="sm:col-span-2">
            <PasswordField
              name="password2"
              label="Contraseña"
              autoComplete="new-password"
              placeholder="Mínimo 8 caracteres"
            />
          </div>
        </div>
      </section>

      <div className="space-y-3">
        <SubmitButton pendingLabel="Creando el tablero…">
          Crear FamilyBoard
        </SubmitButton>
        <p className="text-center text-xs text-muted">
          Después vas a poder agregar integrantes, colores y actividades.
        </p>
      </div>
    </form>
  );
}
