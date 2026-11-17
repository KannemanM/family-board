"use client";

import {
  Check,
  Copy,
  ExternalLink,
  KeyRound,
  Loader2,
  RefreshCw,
  TriangleAlert,
} from "lucide-react";
import { useEffect, useState, useTransition } from "react";

import { PasswordField } from "@/components/ui/FormControls";
import {
  changePasswordAction,
  rotateBoardTokenAction,
  updateGeneralSettingsAction,
} from "@/lib/actions/settings";
import { TIMEZONES } from "@/lib/dates";

export function GeneralSettingsForm({
  familyName,
  timezone,
  refreshSeconds,
}: {
  familyName: string;
  timezone: string;
  refreshSeconds: number;
}) {
  const [name, setName] = useState(familyName);
  const [zone, setZone] = useState(timezone);
  const [refresh, setRefresh] = useState(refreshSeconds);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function save() {
    setError(null);
    setMessage(null);

    startTransition(async () => {
      const result = await updateGeneralSettingsAction({
        familyName: name,
        timezone: zone,
        refreshSeconds: refresh,
      });

      if (!result.ok) {
        setError(result.error ?? "No se pudo guardar.");
        return;
      }
      setMessage("Guardado.");
    });
  }

  return (
    <div className="space-y-4">
      {error ? <p className="text-sm text-urgent">{error}</p> : null}

      <div>
        <label className="label" htmlFor="settings-family">
          Nombre de la familia
        </label>
        <input
          id="settings-family"
          className="field"
          value={name}
          onChange={(event) => setName(event.target.value)}
          maxLength={60}
        />
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="label" htmlFor="settings-timezone">
            Zona horaria
          </label>
          <select
            id="settings-timezone"
            className="field"
            value={zone}
            onChange={(event) => setZone(event.target.value)}
          >
            {TIMEZONES.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="label" htmlFor="settings-refresh">
            Actualización del tablero
          </label>
          <select
            id="settings-refresh"
            className="field"
            value={refresh}
            onChange={(event) => setRefresh(Number(event.target.value))}
          >
            <option value={15}>Cada 15 segundos</option>
            <option value={30}>Cada 30 segundos</option>
            <option value={60}>Cada minuto</option>
            <option value={120}>Cada 2 minutos</option>
          </select>
        </div>
      </div>

      <div className="flex items-center gap-3 pt-1">
        <button
          type="button"
          className="btn btn-primary"
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
        {message ? (
          <span className="flex items-center gap-1 text-sm text-brand">
            <Check className="h-3.5 w-3.5" aria-hidden />
            {message}
          </span>
        ) : null}
      </div>
    </div>
  );
}

export function BoardLinkCard({ token }: { token: string }) {
  const [currentToken, setCurrentToken] = useState(token);
  const [origin, setOrigin] = useState("");
  const [copied, setCopied] = useState(false);
  const [confirmRotate, setConfirmRotate] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  const path = `/b/${currentToken}`;
  const fullUrl = origin ? `${origin}${path}` : path;

  async function copy() {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copiá el enlace del tablero:", fullUrl);
    }
  }

  function rotate() {
    startTransition(async () => {
      const result = await rotateBoardTokenAction();
      if (!result.ok || !result.token) {
        setMessage(result.error ?? "No se pudo generar un enlace nuevo.");
        return;
      }
      setCurrentToken(result.token);
      setConfirmRotate(false);
      setMessage(
        "Enlace renovado. Abrí la nueva dirección en la pantalla del tablero.",
      );
    });
  }

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-line-strong bg-paper-deep/60 p-3">
        <p className="break-all font-mono text-[12px] leading-relaxed text-ink-soft">
          {fullUrl}
        </p>
      </div>

      <div className="flex flex-wrap gap-2">
        <button type="button" className="btn btn-primary" onClick={copy}>
          {copied ? (
            <Check className="h-4 w-4" aria-hidden />
          ) : (
            <Copy className="h-4 w-4" aria-hidden />
          )}
          {copied ? "Copiado" : "Copiar enlace"}
        </button>
        <a
          href={path}
          target="_blank"
          rel="noreferrer"
          className="btn btn-secondary"
        >
          <ExternalLink className="h-4 w-4" aria-hidden />
          Abrir tablero
        </a>
        {confirmRotate ? (
          <div className="flex items-center gap-2">
            <button
              type="button"
              className="btn btn-danger"
              onClick={rotate}
              disabled={isPending}
            >
              {isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
              ) : (
                <RefreshCw className="h-4 w-4" aria-hidden />
              )}
              Confirmar
            </button>
            <button
              type="button"
              className="btn btn-secondary"
              onClick={() => setConfirmRotate(false)}
              disabled={isPending}
            >
              Cancelar
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="btn btn-ghost"
            onClick={() => setConfirmRotate(true)}
          >
            <RefreshCw className="h-4 w-4" aria-hidden />
            Renovar enlace
          </button>
        )}
      </div>

      {confirmRotate ? (
        <p className="flex items-start gap-2 rounded-xl border border-high/25 bg-high-soft px-3 py-2.5 text-xs text-high">
          <TriangleAlert className="mt-0.5 h-3.5 w-3.5 shrink-0" aria-hidden />
          Al renovarlo, la pantalla que ya estaba abierta deja de actualizarse
          hasta que abras la dirección nueva.
        </p>
      ) : null}

      {message ? <p className="text-xs text-ink-soft">{message}</p> : null}

      <p className="text-xs leading-relaxed text-muted">
        Quien tenga este enlace puede ver la agenda, sin usuario ni contraseña.
        No lo compartas fuera de casa.
      </p>
    </div>
  );
}

export function PasswordForm({ username }: { username: string }) {
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setMessage(null);

    const form = event.currentTarget;
    const data = new FormData(form);
    const currentPassword = String(data.get("currentPassword") ?? "");
    const newPassword = String(data.get("newPassword") ?? "");
    const repeat = String(data.get("repeatPassword") ?? "");

    if (newPassword.length < 8) {
      setError("La nueva contraseña debe tener al menos 8 caracteres.");
      return;
    }
    if (newPassword !== repeat) {
      setError("Las contraseñas nuevas no coinciden.");
      return;
    }

    startTransition(async () => {
      const result = await changePasswordAction({
        currentPassword,
        newPassword,
      });

      if (!result.ok) {
        setError(result.error ?? "No se pudo cambiar la contraseña.");
        return;
      }

      form.reset();
      setMessage("Contraseña actualizada. Las otras sesiones se cerraron.");
    });
  }

  return (
    <form onSubmit={save} className="space-y-4">
      <p className="text-sm text-ink-soft">
        Cuenta: <span className="font-medium text-ink">@{username}</span>
      </p>

      {error ? (
        <p
          role="alert"
          className="rounded-xl border border-[#edcdc6] bg-urgent-soft px-3.5 py-2.5 text-sm text-urgent"
        >
          {error}
        </p>
      ) : null}

      <PasswordField
        name="currentPassword"
        label="Contraseña actual"
        autoComplete="current-password"
        placeholder="••••••••"
      />

      <div className="grid gap-4 sm:grid-cols-2">
        <PasswordField
          name="newPassword"
          label="Nueva contraseña"
          autoComplete="new-password"
          placeholder="Mínimo 8 caracteres"
        />
        <PasswordField
          name="repeatPassword"
          label="Repetir la nueva"
          autoComplete="new-password"
          placeholder="Otra vez"
        />
      </div>

      <div className="flex items-center gap-3 pt-1">
        <button type="submit" className="btn btn-secondary" disabled={isPending}>
          {isPending ? (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
          ) : (
            <KeyRound className="h-4 w-4" aria-hidden />
          )}
          Cambiar contraseña
        </button>
        {message ? (
          <span className="text-sm text-brand">{message}</span>
        ) : null}
      </div>
    </form>
  );
}
