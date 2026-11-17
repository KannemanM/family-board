"use client";

import {
  Bell,
  Cloud,
  CloudLightning,
  CloudRain,
  CloudSun,
  Repeat,
  Sun,
  WifiOff,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";

import { CategoryIcon } from "@/components/ui/CategoryIcon";
import {
  formatDateLong,
  formatDayNumber,
  formatWeekdayShort,
  getClockParts,
  relativeDayLabel,
  todayInTimeZone,
} from "@/lib/dates";
import type { BoardData, OccurrenceDTO } from "@/lib/types";
import { PRIORITY_LABELS } from "@/lib/types";

function getDayGreeting(hour: string): string {
  const hourNumber = Number(hour);

  if (hourNumber >= 5 && hourNumber < 12) return "Buenos días familia!";
  if (hourNumber >= 12 && hourNumber < 20) return "Buenas tardes familia!";
  return "Buenas noches familia!";
}

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
  const [weather, setWeather] = useState<WeatherData | null>(null);

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

  useEffect(() => {
    const loadWeather = async () => {
      try {
        const response = await fetch("/api/weather", { cache: "no-store" });
        if (!response.ok) return;
        setWeather((await response.json()) as WeatherData);
      } catch {
        // Keep the last known weather visible when refresh fails.
      }
    };

    void loadWeather();
    const interval = window.setInterval(loadWeather, 10 * 60 * 1000);
    return () => window.clearInterval(interval);
  }, []);

  const today = todayInTimeZone(data.timezone, new Date(now));
  const clock = getClockParts(now, data.timezone);

  const todayDay = data.days.find((day) => day.date === today);
  const todayItems = todayDay?.items ?? [];
  const upcoming = data.days.filter(
    (day) => day.date > today && day.items.length > 0,
  );

  const featured = useMemo(
    () => data.highlights.find((item) => item.date > today),
    [data.highlights, today],
  );

  return (
    <div className="board-shell">
      <header className="board-head">
        <div className="board-head-main">
          <p className="board-family">{getDayGreeting(clock.hours)}</p>
          <h1 className="board-date">{formatDateLong(today)}</h1>
        </div>

        <div className="board-clock-wrap">
          {!online ? (
            <span className="board-offline">
              <WifiOff className="h-4 w-4" aria-hidden />
              Sin conexión
            </span>
          ) : null}
          {weather ? (
            <div
              className="board-weather"
              aria-label={`${weather.temperature} grados Celsius en San Luis`}
            >
              <WeatherIcon weather={weather} />
              <div>
                <strong>{weather.temperature}°</strong>
                <span>San Luis</span>
              </div>
            </div>
          ) : null}
          <span
            className="board-clock"
            role="timer"
            aria-label={`Son las ${clock.hours} con ${clock.minutes} y ${clock.seconds} segundos`}
          >
            {clock.hours}:{clock.minutes}:{clock.seconds}
          </span>
        </div>
      </header>

      <main className="board-grid">
        <section aria-label="Actividades de hoy" className="board-today">
          <p className="board-section-label">Hoy</p>

          {todayItems.length === 0 ? (
            <div className="board-empty">
              <p className="board-empty-title">Todo tranquilo</p>
              <p className="board-empty-text">
                No hay actividades para hoy. Disfrutá el día.
              </p>
            </div>
          ) : (
            <div className="board-events">
              {todayItems.map((item) => (
                <TodayRow key={item.id} occurrence={item} />
              ))}
            </div>
          )}
        </section>

        <aside className="board-side" aria-label="Destacados y próximos días">
          {featured ? <FeaturedCard occurrence={featured} today={today} /> : null}

          <p className="board-section-label">Próximos días</p>

          {upcoming.length === 0 ? (
            <div className="board-empty">
              <p className="board-empty-text">
                No hay compromisos anotados para los próximos días.
              </p>
            </div>
          ) : (
            <div className="board-days">
              {upcoming.map((day) => (
                <UpcomingRow key={day.date} date={day.date} items={day.items} />
              ))}
            </div>
          )}
        </aside>
      </main>
    </div>
  );
}

function peopleLabel(occurrence: OccurrenceDTO): string {
  if (occurrence.scope === "family") return "Toda la familia";
  if (occurrence.members.length === 0) return "Sin asignar";
  return occurrence.members.map((member) => member.name).join(", ");
}

function isAllDay(occurrence: OccurrenceDTO): boolean {
  return occurrence.allDay || !occurrence.startTime;
}

function accentFor(occurrence: OccurrenceDTO): string {
  if (occurrence.scope === "family" || occurrence.members.length > 1) {
    return "#232720";
  }
  if (occurrence.members.length === 1) return occurrence.members[0].color;
  if (occurrence.category) return occurrence.category.color;
  return "#2f6b57";
}

function PriorityBadge({ occurrence }: { occurrence: OccurrenceDTO }) {
  if (occurrence.priority === "normal") return null;

  return (
    <span
      className={`board-priority board-priority-${occurrence.priority}`}
    >
      {PRIORITY_LABELS[occurrence.priority]}
    </span>
  );
}

function TodayRow({ occurrence }: { occurrence: OccurrenceDTO }) {
  const accent = accentFor(occurrence);
  const allDay = isAllDay(occurrence);

  return (
    <article className="board-event board-fade-in">
      <div
        className="board-event-time"
        style={{ backgroundColor: accent }}
        data-allday={allDay}
      >
        {allDay ? <span>Sin horario</span> : <span>{occurrence.startTime}</span>}
      </div>

      <div className="board-event-body">
        <div className="board-event-line">
          <p className="board-event-title">{occurrence.title}</p>
          <PriorityBadge occurrence={occurrence} />
          {occurrence.highlighted ? (
            <Bell className="h-4 w-4 shrink-0 text-high" aria-label="Con recordatorio activo" />
          ) : null}
          {occurrence.recurring ? (
            <Repeat className="h-4 w-4 shrink-0 text-muted" aria-label="Se repite" />
          ) : null}
        </div>

        <div className="board-event-foot">
          {occurrence.scope === "family" ? (
            <span className="board-member-pill board-member-pill-dark">
              Toda la familia
            </span>
          ) : (
            occurrence.members.slice(0, 3).map((member) => (
              <span
                key={member.id}
                className="board-member-pill"
                style={{ backgroundColor: member.color }}
              >
                {member.name}
              </span>
            ))
          )}

          {occurrence.category ? (
            <span className="board-event-category">
              <CategoryIcon
                name={occurrence.category.icon}
                className="h-3.5 w-3.5"
              />
              {occurrence.category.name}
            </span>
          ) : null}
        </div>

        {occurrence.notes.trim() ? (
          <p className="board-event-notes">{occurrence.notes.trim()}</p>
        ) : null}
      </div>
    </article>
  );
}

function FeaturedCard({
  occurrence,
  today,
}: {
  occurrence: OccurrenceDTO;
  today: string;
}) {
  const relative = relativeDayLabel(occurrence.date, today);
  const eyebrow =
    occurrence.priority === "normal"
      ? relative
      : `${relative} · ${PRIORITY_LABELS[occurrence.priority]}`;

  const allDay = isAllDay(occurrence);
  const time = allDay
    ? "Todo el día"
    : occurrence.endTime
      ? `${occurrence.startTime}–${occurrence.endTime}`
      : occurrence.startTime;

  const meta = [peopleLabel(occurrence), time, occurrence.category?.name]
    .filter(Boolean)
    .join(" · ");

  return (
    <article className="board-featured">
      <p className="board-featured-eyebrow">{eyebrow}</p>
      <p className="board-featured-title">{occurrence.title}</p>
      <p className="board-featured-meta">{meta}</p>
    </article>
  );
}

function dayMeta(occurrence: OccurrenceDTO): string {
  const allDay = isAllDay(occurrence);
  const time = allDay ? "Todo el día" : occurrence.startTime;
  return `${time} · ${peopleLabel(occurrence)}`;
}

function UpcomingRow({
  date,
  items,
}: {
  date: string;
  items: OccurrenceDTO[];
}) {
  const visible = items.slice(0, 2);
  const hidden = items.length - visible.length;

  return (
    <article className="board-day board-fade-in">
      <div className="board-day-date" aria-hidden>
        <p className="board-day-dow">{formatWeekdayShort(date)}</p>
        <p className="board-day-num">{formatDayNumber(date)}</p>
      </div>

      <div className="board-day-items">
        {visible.map((item) => (
          <div key={item.id} className="board-day-item">
            <p className="board-day-item-title">{item.title}</p>
            <p className="board-day-item-meta">{dayMeta(item)}</p>
          </div>
        ))}
        {hidden > 0 ? <p className="board-day-more">+ {hidden} más</p> : null}
      </div>
    </article>
  );
}

interface WeatherData {
  temperature: number;
  code: number;
  isDay: boolean;
}

function WeatherIcon({ weather }: { weather: WeatherData }) {
  if (weather.code >= 95) {
    return <CloudLightning className="board-weather-icon" aria-hidden />;
  }
  if (weather.code >= 51) {
    return <CloudRain className="board-weather-icon" aria-hidden />;
  }
  if (weather.code >= 1) {
    return weather.isDay ? (
      <CloudSun className="board-weather-icon" aria-hidden />
    ) : (
      <Cloud className="board-weather-icon" aria-hidden />
    );
  }
  return weather.isDay ? (
    <Sun className="board-weather-icon" aria-hidden />
  ) : (
    <Cloud className="board-weather-icon" aria-hidden />
  );
}
