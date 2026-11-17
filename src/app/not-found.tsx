import Link from "next/link";

import { LogoMark } from "@/components/ui/LogoMark";

export default function NotFound() {
  return (
    <main className="flex min-h-dvh items-center justify-center px-5 py-10">
      <div className="max-w-sm text-center">
        <LogoMark className="mx-auto h-10 w-10 text-brand" />
        <h1 className="mt-5 font-display text-2xl font-semibold tracking-tight">
          No encontramos esta página
        </h1>
        <p className="mt-2 text-sm leading-relaxed text-muted">
          Puede que el enlace del tablero haya cambiado o que la dirección esté
          incompleta.
        </p>
        <Link href="/agenda" className="btn btn-primary mt-6">
          Ir a la agenda
        </Link>
      </div>
    </main>
  );
}
