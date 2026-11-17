import { CalendarPlus, History, Plus, Sparkles, UsersRound } from "lucide-react";
import Link from "next/link";

import { AgendaRow } from "@/components/admin/AgendaRow";
import { MemberAvatar } from "@/components/ui/MemberAvatar";
import { requireUser } from "@/lib/auth";
import {
  addDays,
  formatDayNumber,
  formatMonthShort,
  formatWeekdayLong,
  todayInTimeZone,
} from "@/lib/dates";
import {
  getCategoriesList,
  getMembersList,
  getOccurrences,
} from "@/lib/queries";
import { getSettings } from "@/lib/settings";
import type { OccurrenceDTO } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata = { title: "Agenda" };

interface AgendaSearchParams {
  ver?: string;
  integrante?: string;
  bienvenida?: string;
}

interface DayGroup {
  date: string;
  items: OccurrenceDTO[];
}

function groupByDate(occurrences: OccurrenceDTO[]): DayGroup[] {
  const map = new Map<string, OccurrenceDTO[]>();

  for (const occurrence of occurrences) {
    const list = map.get(occurrence.date) ?? [];
    list.push(occurrence);
    map.set(occurrence.date, list);
  }

  return Array.from(map.entries()).map(([date, items]) => ({ date, items }));
}

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: Promise<AgendaSearchParams>;
}) {
  const user = await requireUser();
  const params = await searchParams;

  const settings = getSettings();
  const today = todayInTimeZone(settings.timezone);
  const members = getMembersList();
  const categories = getCategoriesList();

  const isHistory = params.ver === "historial";
  const requestedMember = Number(params.integrante);
  const memberFilter = members.find((member) => member.id === requestedMember);

  const from = isHistory ? addDays(today, -60) : today;
  const to = isHistory ? addDays(today, -1) : addDays(today, 30);

  let occurrences = getOccurrences(from, to);

  if (memberFilter) {
    occurrences = occurrences.filter(
      (occurrence) =>
        occurrence.scope === "family" ||
        occurrence.members.some((member) => member.id === memberFilter.id),
    );
  }

  const groups = groupByDate(occurrences).sort((a, b) =>
    isHistory
      ? b.date.localeCompare(a.date)
      : a.date.localeCompare(b.date),
  );

  const total = occurrences.filter(
    (occurrence) => occurrence.state !== "cancelled",
  ).length;
  const firstName = user.name.split(" ")[0];

  const hrefFor = (options: { history?: boolean; memberId?: number }) => {
    const search = new URLSearchParams();
    if (options.history) search.set("ver", "historial");
    if (options.memberId) search.set("integrante", String(options.memberId));
    const query = search.toString();
    return query ? `/agenda?${query}` : "/agenda";
  };

  return (
    <div>
      <header>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="section-label">
              {isHistory ? "Últimos 60 días" : "Próximos 30 días"}
            </p>
            <h1 className="mt-1 font-display text-3xl font-semibold tracking-tight">
              {isHistory ? "Historial" : "Agenda"}
            </h1>
            <p className="mt-1.5 text-sm text-ink-soft">
              {isHistory
                ? `${total} ${total === 1 ? "actividad" : "actividades"} en el archivo`
                : total > 0
                  ? `Hola, ${firstName}. Hay ${total} ${total === 1 ? "actividad" : "actividades"} en los próximos 30 días.`
                  : `Hola, ${firstName}. No hay actividades cargadas para los próximos 30 días.`}
            </p>
          </div>

          <div className="flex shrink-0 items-center gap-2">
            <Link
              href={hrefFor({
                history: !isHistory,
                memberId: memberFilter?.id,
              })}
              className="btn btn-secondary hidden h-10 px-3 text-xs sm:inline-flex"
            >
              <History className="h-4 w-4" aria-hidden />
              {isHistory ? "Próximas" : "Historial"}
            </Link>
            <Link
              href="/agenda/nueva"
              className="btn btn-primary hidden h-10 sm:inline-flex"
            >
              <Plus className="h-4 w-4" aria-hidden />
              Nueva
            </Link>
          </div>
        </div>

        <div className="mt-4 flex items-center gap-2 sm:hidden">
          <Link href="/agenda/nueva" className="btn btn-primary flex-1">
            <Plus className="h-4 w-4" aria-hidden />
            Nueva actividad
          </Link>
          <Link
            href={hrefFor({
              history: !isHistory,
              memberId: memberFilter?.id,
            })}
            className="btn btn-secondary"
          >
            <History className="h-4 w-4" aria-hidden />
            {isHistory ? "Próximas" : "Historial"}
          </Link>
        </div>
      </header>

      {params.bienvenida === "1" ? (
        <div className="mt-5 flex items-start gap-3 rounded-2xl border border-brand/20 bg-brand-soft px-4 py-3.5 text-sm text-brand-dark">
          <Sparkles className="mt-0.5 h-4 w-4 shrink-0" aria-hidden />
          <p>
            <span className="font-semibold">¡Listo!</span> El tablero ya está
            funcionando. El próximo paso es agregar a los integrantes de la
            familia para poder asignarles actividades.
          </p>
        </div>
      ) : null}

      {members.length === 0 ? (
        <div className="card mt-5 flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-soft text-brand">
              <UsersRound className="h-4.5 w-4.5" aria-hidden />
            </span>
            <div>
              <p className="text-sm font-semibold">Falta sumar a la familia</p>
              <p className="mt-0.5 text-sm text-muted">
                Agregá a cada integrante con su color para poder asignar
                actividades.
              </p>
            </div>
          </div>
          <Link href="/integrantes" className="btn btn-secondary shrink-0">
            Agregar integrantes
          </Link>
        </div>
      ) : null}

      {categories.length === 0 ? (
        <div className="card mt-3 flex flex-col gap-3 p-5 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-ink-soft">
            Todavía no hay categorías. Podés crear las tuyas para ordenar la
            agenda.
          </p>
          <Link href="/categorias" className="btn btn-secondary shrink-0">
            Crear categorías
          </Link>
        </div>
      ) : null}

      {members.length > 0 ? (
        <div className="hide-scrollbar -mx-4 mt-5 flex gap-2 overflow-x-auto px-4 pb-1 sm:mx-0 sm:px-0">
          <Link
            href={hrefFor({ history: isHistory })}
            className="chip shrink-0"
            data-selected={!memberFilter}
          >
            Todos
          </Link>
          {members.map((member) => (
            <Link
              key={member.id}
              href={hrefFor({ history: isHistory, memberId: member.id })}
              className="chip shrink-0"
              data-selected={memberFilter?.id === member.id}
            >
              <MemberAvatar
                name={member.name}
                color={member.color}
                emoji={member.emoji}
                size="sm"
                className="h-5 w-5 text-[10px]"
              />
              {member.name}
            </Link>
          ))}
        </div>
      ) : null}

      {groups.length === 0 ? (
        <div className="mt-8 rounded-2xl border border-dashed border-line-strong bg-white/60 px-6 py-12 text-center">
          <CalendarPlus
            className="mx-auto h-8 w-8 text-muted"
            strokeWidth={1.5}
            aria-hidden
          />
          <p className="mt-3 text-sm font-semibold">
            {isHistory
              ? "No hay actividades en el archivo"
              : "No hay actividades para mostrar"}
          </p>
          <p className="mx-auto mt-1 max-w-xs text-sm text-muted">
            {isHistory
              ? "Cuando pase el día de una actividad, va a quedar guardada acá."
              : memberFilter
                ? `No hay actividades de ${memberFilter.name} en este período.`
                : "Cargá la primera actividad y va a aparecer en el tablero al instante."}
          </p>
          {!isHistory ? (
            <Link href="/agenda/nueva" className="btn btn-primary mt-5">
              <Plus className="h-4 w-4" aria-hidden />
              Cargar una actividad
            </Link>
          ) : null}
        </div>
      ) : (
        <div className="mt-6 space-y-7">
          {groups.map((group) => (
            <section key={group.date}>
              <div className="sticky top-[3.55rem] z-10 -mx-4 mb-2 flex items-center justify-between bg-paper/90 px-4 py-2 backdrop-blur md:static md:mx-0 md:bg-transparent md:px-0 md:py-0 md:backdrop-blur-none">
                <div className="flex items-baseline gap-2">
                  <h2 className="text-sm font-semibold tracking-tight">
                    {group.date === today
                      ? "Hoy"
                      : group.date === addDays(today, 1)
                        ? "Mañana"
                        : group.date === addDays(today, -1)
                          ? "Ayer"
                          : formatWeekdayLong(group.date)}
                  </h2>
                  <span className="text-xs text-muted">
                    {formatDayNumber(group.date)}{" "}
                    {formatMonthShort(group.date)}
                  </span>
                </div>
                <span className="text-[11px] font-medium text-muted">
                  {group.items.length}{" "}
                  {group.items.length === 1 ? "actividad" : "actividades"}
                </span>
              </div>

              <div className="space-y-2">
                {group.items.map((occurrence) => (
                  <AgendaRow key={occurrence.id} occurrence={occurrence} />
                ))}
              </div>
            </section>
          ))}
        </div>
      )}
    </div>
  );
}
