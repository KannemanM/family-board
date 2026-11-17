"use client";

import {
  Bell,
  CalendarDays,
  Repeat,
  Sun,
  Users,
  WifiOff,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { CategoryIcon } from "@/components/ui/CategoryIcon";
import { MemberAvatar, MemberLegendDot } from "@/components/ui/MemberAvatar";
import { LogoMark } from "@/components/ui/LogoMark";
import {
  formatClock,
  formatDateLong,
  formatDayNumber,
  formatMonthShort,
  formatWeekdayLong,
  getClockParts,
  relativeDayLabel,
  todayInTimeZone,
} from "@/lib/dates";
import type { BoardData, OccurrenceDTO } from "@/lib/types";
import { PRIORITY_LABELS } from "@/lib/types";

export function BoardView({
  initial,
  token,
}: {
  initial: BoardData;
  token: string;
}) {
  const [data, setData] = useState(initial);
  const [clockBase, setClockBase] = useState(() => ({
    serverMs: new Date(initial.generatedAt).getTime(),
    clientMs: Date.now(),
  }));
  const [now, setNow] = useState(() => new Date(initial.generatedAt).getTime());
  const [online, setOnline] = useState(true);
  const [lastSync, setLastSync] = useState(initial.generatedAt);

  useEffect(() => {
    const interval = window.setInterval(() => {
      setNow(clockBase.serverMs + (Date.now() - clockBase.clientMs));
    }, 1000);
    return () => window.clearInterval(interval);
  }, [clockBase]);

  const refresh = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/board?token=${encodeURIComponent(token)}`,
        { cache: "no-store" },
      );

      if (!response.ok) throw new Error("Respuesta inválida");

      const next = (await response.json()) as BoardData;
      setData(next);
      setLastSync(next.generatedAt);
      setClockBase({
        serverMs: new Date(next.generatedAt).getTime(),
        clientMs: Date.now(),
      });
      setOnline(true);
    } catch {
      setOnline(false);
    }
  }, [token]);

  useEffect(() => {
    const interval = window.setInterval(refresh, data.refreshSeconds * 1000);

    const handleVisibility = () => {
      if (!document.hidden) void refresh();
    };

    const handleOnline = () => void refresh();
    const handleOffline = () => setOnline(false);

    document.addEventListener("visibilitychange", handleVisibility);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibility);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [refresh, data.refreshSeconds]);

  const today = todayInTimeZone(data.timezone, new Date(now));
  const clock = getClockParts(now, data.timezone);

  const todayDay = data.days.find((day) => day.date === today);
  const todayItems = todayDay?.items ?? [];
  const upcoming = data.days.filter(
    (day) => day.date > today && day.items.length > 0,
  );

  const highlights = useMemo(
    () => data.highlights.filter((item) => item.date >= today),
    [data.highlights, today],
  );

  return (
    <div className="board-shell">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
          <LogoMark className="h-9 w-9 shrink-0 text-brand sm:h-11 sm:w-11" />
          <div className="min-w-0">
            <p className="section-label truncate">{data.familyName}</p>
            <h1 className="board-date mt-1 truncate font-display font-semibold tracking-tight">
              {formatDateLong(today)}
            </h1>
          </div>
        </div>

        <div className="flex items-end gap-4">
          <div className="hidden items-center gap-2 pb-2 text-right sm:flex">
            <span
              className={`h-2 w-2 rounded-full ${
                online ? "bg-brand" : "offline-pulse bg-high"
              }`}
              aria-hidden
            />
            <span className="board-meta text-muted">
              {online
                ? `Actualizado ${formatClock(new Date(lastSync).getTime(), data.timezone)}`
                : "Sin conexión"}
            </span>
          </div>

          <div className="flex items-baseline gap-1.5">
            <span className="board-clock font-display font-semibold">
              {clock.hours}:{clock.minutes}
            </span>
            <span className="board-meta tabular text-muted">
              {clock.seconds}
            </span>
          </div>
        </div>
      </header>

      <div className="board-content">
        {highlights.length > 0 ? (
          <section aria-label="Para no olvidar">
            <div className="mb-2 flex items-center gap-2">
              <Bell className="h-3.5 w-3.5 text-muted" aria-hidden />
              <p className="section-label">Para no olvidar</p>
            </div>

            <div className="flex flex-wrap gap-2">
              {highlights.map((item) => (
                <HighlightCard
                  key={item.id}
                  occurrence={item}
                  today={today}
                />
              ))}
            </div>
          </section>
        ) : null}

        <main className="board-grid">
          <section aria-label="Actividades de hoy">
            <div className="mb-2.5 flex items-center justify-between gap-3">
              <h2 className="flex items-baseline gap-2 font-display text-xl font-semibold tracking-tight sm:text-2xl">
                Hoy
                <span className="board-meta font-sans font-normal text-muted">
                  {formatDayNumber(today)} {formatMonthShort(today)}
                </span>
              </h2>
              <span className="board-meta text-muted">
                {todayItems.length}{" "}
                {todayItems.length === 1 ? "actividad" : "actividades"}
              </span>
            </div>

            <div className="card p-3 sm:p-5">
              {todayItems.length === 0 ? (
                <div className="flex flex-col items-center px-4 py-10 text-center sm:py-14">
                  <span className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-soft text-brand">
                    <Sun className="h-7 w-7" strokeWidth={1.6} aria-hidden />
                  </span>
                  <p className="mt-3 font-display text-xl font-semibold">
                    Día despejado
                  </p>
                  <p className="board-meta mt-1 max-w-xs text-muted">
                    No hay actividades para hoy. Disfrutá el día.
                  </p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {todayItems.map((item) => (
                    <TodayItem key={item.id} occurrence={item} />
                  ))}
                </div>
              )}
            </div>
          </section>

          <section aria-label="Próximos días">
            <div className="mb-2.5 flex items-center justify-between gap-3">
              <h2 className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
                Próximos días
              </h2>
              <span className="board-meta text-muted">
                {upcoming.reduce((total, day) => total + day.items.length, 0)}{" "}
                en 7 días
              </span>
            </div>

            <div className="card p-3 sm:p-4">
              {upcoming.length === 0 ? (
                <div className="flex flex-col items-center px-4 py-10 text-center">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full bg-paper-deep text-muted">
                    <CalendarDays className="h-6 w-6" strokeWidth={1.6} aria-hidden />
                  </span>
                  <p className="board-meta mt-3 text-muted">
                    No hay compromisos anotados para los próximos días.
                  </p>
                </div>
              ) : (
                <div className="divide-y divide-line">
                  {upcoming.map((day) => (
                    <UpcomingDay
                      key={day.date}
                      date={day.date}
                      items={day.items}
                      today={today}
                    />
                  ))}
                </div>
              )}
            </div>
          </section>
        </main>
      </div>

      <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-line/80 pt-3">
        <div className="board-meta flex flex-wrap items-center gap-x-4 gap-y-2 text-ink-soft">
          {data.members.length > 0 ? (
            data.members.map((member) => (
              <MemberLegendDot
                key={member.id}
                name={member.name}
                color={member.color}
                emoji={member.emoji}
              />
            ))
          ) : (
            <span className="text-muted">Todavía no hay integrantes cargados</span>
          )}
        </div>

        <div className="board-meta flex items-center gap-1.5 text-muted sm:hidden">
          {online ? (
            <span className="tabular">
              Actualizado{" "}
              {formatClock(new Date(lastSync).getTime(), data.timezone)}
            </span>
          ) : (
            <>
              <WifiOff className="h-3.5 w-3.5" aria-hidden />
              Mostrando los últimos datos
            </>
          )}
        </div>
      </footer>
    </div>
  );
}

function startLabel(occurrence: OccurrenceDTO): string {
  if (occurrence.allDay || !occurrence.startTime) return "Todo el día";
  return occurrence.startTime;
}

function accentFor(occurrence: OccurrenceDTO): string {
  return occurrence.category?.color ?? "#2f6b57";
}

function PriorityBadge({ occurrence }: { occurrence: OccurrenceDTO }) {
  if (occurrence.priority === "normal") return null;

  const urgent = occurrence.priority === "urgent";

  return (
    <span
      className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider sm:text-[10px] ${
        urgent ? "bg-urgent-soft text-urgent" : "bg-high-soft text-high"
      }`}
    >
      {PRIORITY_LABELS[occurrence.priority]}
    </span>
  );
}

function MembersInline({ occurrence }: { occurrence: OccurrenceDTO }) {
  if (occurrence.scope === "family") {
    return (
      <span className="inline-flex items-center gap-1 text-ink-soft">
        <Users className="h-3.5 w-3.5" aria-hidden />
        Familia
      </span>
    );
  }

  if (occurrence.members.length === 0) return null;

  return (
    <span className="inline-flex items-center gap-1">
      {occurrence.members.slice(0, 3).map((member) => (
        <MemberAvatar
          key={member.id}
          name={member.name}
          color={member.color}
          emoji={member.emoji}
          size="sm"
          className="h-5 w-5 text-[9px]"
        />
      ))}
      <span className="ml-0.5">
        {occurrence.members.map((member) => member.name).join(", ")}
      </span>
    </span>
  );
}

function HighlightCard({
  occurrence,
  today,
}: {
  occurrence: OccurrenceDTO;
  today: string;
}) {
  const accent = accentFor(occurrence);
  const relative = relativeDayLabel(occurrence.date, today);

  return (
    <article
      className="board-fade-in relative min-w-0 flex-1 basis-full overflow-hidden rounded-xl border border-line bg-white px-3 py-2.5 sm:basis-[calc(50%-0.25rem)] xl:basis-0"
      style={{ borderLeftWidth: 3, borderLeftColor: accent }}
    >
      <div className="flex items-start justify-between gap-2">
        <p className="board-item-title min-w-0 font-medium">
          {occurrence.title}
        </p>
        <PriorityBadge occurrence={occurrence} />
      </div>

      <div className="board-meta mt-1.5 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-muted">
        <span className="font-semibold" style={{ color: accent }}>
          {relative}
          {occurrence.allDay ? "" : ` · ${startLabel(occurrence)}`}
        </span>
        {occurrence.category ? (
          <span className="inline-flex items-center gap-1">
            <CategoryIcon
              name={occurrence.category.icon}
              className="h-3 w-3"
            />
            {occurrence.category.name}
          </span>
        ) : null}
        <MembersInline occurrence={occurrence} />
      </div>
    </article>
  );
}

function TodayItem({ occurrence }: { occurrence: OccurrenceDTO }) {
  const accent = accentFor(occurrence);

  return (
    <article
      className="board-fade-in flex items-start gap-2.5 rounded-xl border border-line/90 bg-white px-2.5 py-2.5 sm:gap-3 sm:px-3"
      style={{ borderLeftWidth: 3, borderLeftColor: accent }}
    >
      <div
        className="board-time w-[4.8rem] shrink-0 pt-0.5 font-semibold leading-tight sm:w-24"
        style={{ color: accent }}
      >
        {startLabel(occurrence)}
      </div>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <p className="board-item-title font-medium">{occurrence.title}</p>
          <PriorityBadge occurrence={occurrence} />
          {occurrence.highlighted ? (
            <Bell
              className="h-3.5 w-3.5 shrink-0 text-high"
              aria-label="Con recordatorio activo"
            />
          ) : null}
          {occurrence.recurring ? (
            <Repeat
              className="h-3.5 w-3.5 shrink-0 text-muted"
              aria-label="Se repite"
            />
          ) : null}
        </div>

        {occurrence.notes ? (
          <p className="board-meta mt-0.5 line-clamp-1 text-muted">
            {occurrence.notes}
          </p>
        ) : null}

        <div className="board-meta mt-1 flex flex-wrap items-center gap-x-2.5 gap-y-1 text-muted">
          {!occurrence.allDay && occurrence.endTime ? (
            <span>Hasta {occurrence.endTime}</span>
          ) : null}
          {occurrence.category ? (
            <span
              className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5"
              style={{
                backgroundColor: `${occurrence.category.color}12`,
                color: occurrence.category.color,
              }}
            >
              <CategoryIcon
                name={occurrence.category.icon}
                className="h-3 w-3"
              />
              {occurrence.category.name}
            </span>
          ) : null}
          <MembersInline occurrence={occurrence} />
        </div>
      </div>
    </article>
  );
}

function UpcomingDay({
  date,
  items,
  today,
}: {
  date: string;
  items: OccurrenceDTO[];
  today: string;
}) {
  const visible = items.slice(0, 4);
  const hidden = items.length - visible.length;
  const tomorrow = relativeDayLabel(date, today) === "Mañana";

  return (
    <div className="py-2.5 first:pt-1 last:pb-1">
      <div className="flex items-baseline justify-between gap-2">
        <div className="flex items-baseline gap-1.5">
          <span className="board-day-title font-semibold">
            {tomorrow ? "Mañana" : formatWeekdayLong(date)}
          </span>
          <span className="board-meta text-muted">
            {formatDayNumber(date)} {formatMonthShort(date)}
          </span>
        </div>
        <span className="board-meta text-muted">{items.length}</span>
      </div>

      <div className="mt-1.5 space-y-1">
        {visible.map((occurrence) => (
          <div
            key={occurrence.id}
            className="flex items-center gap-2.5 rounded-lg px-1 py-1 transition-colors hover:bg-paper"
          >
            <span
              className="board-meta w-[4.8rem] shrink-0 font-medium text-ink-soft sm:w-24"
              style={{ color: accentFor(occurrence) }}
            >
              {startLabel(occurrence)}
            </span>
            <span className="board-item-title min-w-0 flex-1 truncate font-normal">
              {occurrence.title}
            </span>
            {occurrence.priority !== "normal" ? (
              <span
                className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                  occurrence.priority === "urgent" ? "bg-urgent" : "bg-high"
                }`}
                aria-label={PRIORITY_LABELS[occurrence.priority]}
              />
            ) : null}
            {occurrence.scope === "members" && occurrence.members.length > 0 ? (
              <span className="flex shrink-0 items-center gap-0.5">
                {occurrence.members.slice(0, 3).map((member) => (
                  <span
                    key={member.id}
                    className="h-2 w-2 rounded-full"
                    style={{ backgroundColor: member.color }}
                    title={member.name}
                  />
                ))}
              </span>
            ) : (
              <Users
                className="h-3 w-3 shrink-0 text-muted"
                aria-label="Toda la familia"
              />
            )}
          </div>
        ))}

        {hidden > 0 ? (
          <p className="board-meta pl-[5.3rem] text-muted sm:pl-[6.2rem]">
            y {hidden} más
          </p>
        ) : null}
      </div>
    </div>
  );
}
