"use client";

import {
  CalendarDays,
  LogOut,
  Plus,
  Settings2,
  Tags,
  UsersRound,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

import { logoutAction } from "@/lib/actions/auth";
import { LogoMark } from "@/components/ui/LogoMark";
import type { SessionUser } from "@/lib/auth";

const NAV_ITEMS = [
  { href: "/agenda", label: "Agenda", Icon: CalendarDays },
  { href: "/integrantes", label: "Integrantes", Icon: UsersRound },
  { href: "/categorias", label: "Categorías", Icon: Tags },
  { href: "/ajustes", label: "Ajustes", Icon: Settings2 },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AdminShell({
  user,
  familyName,
  children,
}: {
  user: SessionUser;
  familyName: string;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const isFormPage =
    pathname.startsWith("/agenda/nueva") || /^\/agenda\/\d+$/.test(pathname);

  return (
    <div className="min-h-dvh">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col border-r border-line bg-paper/80 backdrop-blur-xl md:flex">
        <div className="flex items-center gap-3 px-5 py-6">
          <LogoMark className="h-9 w-9 text-brand" />
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold tracking-tight">
              FamilyBoard
            </p>
            <p className="truncate text-xs text-muted">{familyName}</p>
          </div>
        </div>

        <div className="px-4">
          <Link
            href="/agenda/nueva"
            className="btn btn-primary w-full"
          >
            <Plus className="h-4 w-4" aria-hidden />
            Nueva actividad
          </Link>
        </div>

        <nav className="mt-6 flex-1 space-y-1 px-3">
          {NAV_ITEMS.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm transition-colors ${
                  active
                    ? "bg-brand-soft font-semibold text-brand-dark"
                    : "text-ink-soft hover:bg-paper-deep hover:text-ink"
                }`}
              >
                <item.Icon className="h-4 w-4" strokeWidth={1.9} aria-hidden />
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t border-line p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-soft text-sm font-semibold text-brand-dark">
              {user.name.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-medium">{user.name}</p>
              <p className="truncate text-xs text-muted">@{user.username}</p>
            </div>
            <form action={logoutAction}>
              <button
                type="submit"
                className="btn btn-ghost h-9 w-9 p-0"
                aria-label="Cerrar sesión"
                title="Cerrar sesión"
              >
                <LogOut className="h-4 w-4" aria-hidden />
              </button>
            </form>
          </div>
        </div>
      </aside>

      <div className="md:pl-64">
        <header className="sticky top-0 z-20 border-b border-line/90 bg-paper/85 backdrop-blur-xl md:hidden">
          <div className="flex items-center justify-between px-4 py-3">
            <Link href="/agenda" className="flex items-center gap-2.5">
              <LogoMark className="h-8 w-8 text-brand" />
              <div className="min-w-0">
                <p className="text-sm font-semibold leading-tight tracking-tight">
                  FamilyBoard
                </p>
                <p className="truncate text-[11px] leading-tight text-muted">
                  {familyName}
                </p>
              </div>
            </Link>

            <form action={logoutAction}>
              <button
                type="submit"
                className="btn btn-ghost h-9 px-2.5 text-xs"
                aria-label="Cerrar sesión"
              >
                <LogOut className="h-3.5 w-3.5" aria-hidden />
                Salir
              </button>
            </form>
          </div>
        </header>

        <main
          className={`mx-auto w-full max-w-3xl px-4 pt-5 md:px-8 md:pb-14 md:pt-10 ${
            isFormPage ? "pb-10" : "pb-28"
          }`}
        >
          {children}
        </main>
      </div>

      {isFormPage ? null : (
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-paper/95 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl md:hidden">
          <div className="mx-auto grid max-w-md grid-cols-5 items-end px-1.5 pt-2 pb-1.5">
            <MobileNavItem
              href="/agenda"
              label="Agenda"
              Icon={CalendarDays}
              active={isActive(pathname, "/agenda")}
            />
            <MobileNavItem
              href="/integrantes"
              label="Familia"
              Icon={UsersRound}
              active={isActive(pathname, "/integrantes")}
            />

            <div className="flex justify-center">
              <Link
                href="/agenda/nueva"
                aria-label="Nueva actividad"
                className="-mt-6 flex h-14 w-14 items-center justify-center rounded-full border-4 border-paper bg-brand text-white shadow-[0_12px_24px_-10px_rgba(35,83,68,0.65)] transition-transform active:scale-95"
              >
                <Plus className="h-6 w-6" strokeWidth={2.2} aria-hidden />
              </Link>
            </div>

            <MobileNavItem
              href="/categorias"
              label="Categorías"
              Icon={Tags}
              active={isActive(pathname, "/categorias")}
            />
            <MobileNavItem
              href="/ajustes"
              label="Ajustes"
              Icon={Settings2}
              active={isActive(pathname, "/ajustes")}
            />
          </div>
        </nav>
      )}
    </div>
  );
}

function MobileNavItem({
  href,
  label,
  Icon,
  active,
}: {
  href: string;
  label: string;
  Icon: typeof CalendarDays;
  active: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex flex-col items-center gap-1 rounded-lg px-1 py-1.5 text-[10px] font-medium transition-colors ${
        active ? "text-brand-dark" : "text-muted"
      }`}
    >
      <Icon
        className="h-[19px] w-[19px]"
        strokeWidth={active ? 2.2 : 1.8}
        aria-hidden
      />
      {label}
    </Link>
  );
}
