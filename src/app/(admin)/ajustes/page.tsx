import {
  DatabaseBackup,
  Download,
  KeyRound,
  MonitorPlay,
  SlidersHorizontal,
} from "lucide-react";

import {
  BoardLinkCard,
  GeneralSettingsForm,
  PasswordForm,
} from "@/components/admin/SettingsForms";
import { requireUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export const metadata = { title: "Ajustes" };

export default async function SettingsPage() {
  const user = await requireUser();
  const settings = getSettings();

  return (
    <div className="space-y-5">
      <header>
        <p className="section-label">Configuración</p>
        <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">
          Ajustes
        </h1>
        <p className="mt-1.5 text-sm text-ink-soft">
          El tablero, la cuenta y los datos de la familia.
        </p>
      </header>

      <section className="card p-5">
        <div className="mb-4 flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
            <SlidersHorizontal className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <h2 className="text-sm font-semibold">General</h2>
            <p className="text-sm text-muted">
              Nombre, zona horaria y frecuencia de actualización.
            </p>
          </div>
        </div>

        <GeneralSettingsForm
          familyName={settings.familyName}
          timezone={settings.timezone}
          refreshSeconds={settings.refreshSeconds}
        />
      </section>

      <section className="card p-5">
        <div className="mb-4 flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
            <MonitorPlay className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <h2 className="text-sm font-semibold">Pantalla del tablero</h2>
            <p className="text-sm text-muted">
              La dirección privada que se abre en la pantalla de casa.
            </p>
          </div>
        </div>

        <BoardLinkCard token={settings.boardToken} />

        <div className="mt-5 rounded-xl bg-paper-deep/60 p-3.5">
          <p className="text-xs font-semibold text-ink-soft">
            Para dejarla funcionando
          </p>
          <ol className="mt-1.5 list-decimal space-y-1 pl-4 text-xs leading-relaxed text-muted">
            <li>Abrí el enlace en la pantalla que va a estar en casa.</li>
            <li>
              Ponela en pantalla completa (F11 en la computadora o el modo
              correspondiente del dispositivo).
            </li>
            <li>
              No hace falta iniciar sesión: se actualiza sola cada{" "}
              {settings.refreshSeconds} segundos.
            </li>
          </ol>
        </div>
      </section>

      <section className="card p-5">
        <div className="mb-4 flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
            <KeyRound className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <h2 className="text-sm font-semibold">Tu cuenta</h2>
            <p className="text-sm text-muted">
              Los dos adultos tienen los mismos permisos.
            </p>
          </div>
        </div>

        <PasswordForm username={user.username} />
      </section>

      <section className="card p-5">
        <div className="mb-4 flex items-start gap-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
            <DatabaseBackup className="h-4 w-4" aria-hidden />
          </span>
          <div>
            <h2 className="text-sm font-semibold">Datos</h2>
            <p className="text-sm text-muted">
              Una copia completa de integrantes, categorías y actividades.
            </p>
          </div>
        </div>

        <a
          href="/api/export"
          download="familyboard.json"
          className="btn btn-secondary"
        >
          <Download className="h-4 w-4" aria-hidden />
          Exportar todo (JSON)
        </a>

        <p className="mt-3 text-xs leading-relaxed text-muted">
          Guardá este archivo como respaldo antes de un cambio grande. La base
          de datos completa vive en el volumen del servidor, así que conviene
          copiarla de vez en cuando.
        </p>
      </section>
    </div>
  );
}
