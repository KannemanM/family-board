import { redirect } from "next/navigation";

import { LoginForm } from "@/components/auth/LoginForm";
import { LogoMark } from "@/components/ui/LogoMark";
import { getCurrentUser, isSetupComplete } from "@/lib/auth";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export const metadata = { title: "Entrar" };

export default async function LoginPage() {
  if (!isSetupComplete()) redirect("/setup");

  const user = await getCurrentUser();
  if (user) redirect("/agenda");

  const settings = getSettings();

  return (
    <main className="flex min-h-dvh items-center justify-center px-5 py-10">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center text-center">
          <LogoMark className="h-12 w-12 text-brand" />
          <p className="mt-4 font-display text-2xl font-semibold tracking-tight">
            FamilyBoard
          </p>
          <p className="mt-1 text-sm text-ink-soft">
            {settings.familyName}
          </p>
        </div>

        <div className="card mt-7 p-6">
          <h1 className="text-lg font-semibold tracking-tight">
            Entrar al panel
          </h1>
          <p className="mt-1 mb-5 text-sm text-muted">
            La pantalla del tablero no necesita iniciar sesión.
          </p>
          <LoginForm />
        </div>

        <p className="mt-6 text-center text-xs leading-relaxed text-muted">
          Tablero privado de la familia.
          <br />
          Si no recordás la contraseña, pedile a la otra persona que la cambie
          desde Ajustes.
        </p>
      </div>
    </main>
  );
}
