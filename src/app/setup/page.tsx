import { redirect } from "next/navigation";

import { SetupForm } from "@/components/auth/SetupForm";
import { LogoMark } from "@/components/ui/LogoMark";
import { isSetupComplete } from "@/lib/auth";

export const dynamic = "force-dynamic";

export const metadata = { title: "Configuración inicial" };

export default async function SetupPage() {
  if (isSetupComplete()) redirect("/login");

  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col px-5 py-10 sm:py-14">
      <header className="mb-8">
        <ConfettiMark />
        <LogoMark className="mt-6 h-12 w-12 text-brand" />
        <p className="section-label mt-5">Configuración inicial</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Armemos el tablero de tu familia
        </h1>
        <p className="mt-3 max-w-lg text-[15px] leading-relaxed text-ink-soft">
          En dos minutos queda listo. Vas a crear las dos cuentas de
          administración y el tablero va a tener su propia dirección privada,
          sin login.
        </p>
      </header>

      <SetupForm />
    </main>
  );
}

function ConfettiMark() {
  return (
    <div className="flex items-center gap-1.5" aria-hidden>
      {["#4F6BED", "#2E9E8F", "#D99532", "#E2685A", "#D4659B"].map(
        (color) => (
          <span
            key={color}
            className="h-1.5 w-8 rounded-full"
            style={{ backgroundColor: color }}
          />
        ),
      )}
    </div>
  );
}
