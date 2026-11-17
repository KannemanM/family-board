"use client";

import { useActionState } from "react";

import { loginAction } from "@/lib/actions/auth";
import type { FormState } from "@/lib/action-types";
import { PasswordField, SubmitButton } from "@/components/ui/FormControls";

const initialState: FormState = {};

export function LoginForm() {
  const [state, formAction] = useActionState(loginAction, initialState);

  return (
    <form action={formAction} className="space-y-4">
      {state.error ? (
        <p
          role="alert"
          className="rounded-xl border border-[#edcdc6] bg-urgent-soft px-3.5 py-2.5 text-sm text-urgent"
        >
          {state.error}
        </p>
      ) : null}

      <div>
        <label className="label" htmlFor="username">
          Usuario
        </label>
        <input
          id="username"
          name="username"
          className="field"
          autoComplete="username"
          autoCapitalize="none"
          autoCorrect="off"
          placeholder="tu usuario"
          required
          autoFocus
        />
      </div>

      <PasswordField
        name="password"
        label="Contraseña"
        autoComplete="current-password"
        placeholder="••••••••"
      />

      <div className="pt-1">
        <SubmitButton pendingLabel="Entrando…">Entrar al panel</SubmitButton>
      </div>
    </form>
  );
}
