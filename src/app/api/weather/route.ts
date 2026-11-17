import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const WEATHER_URL =
  "https://api.open-meteo.com/v1/forecast?latitude=-33.295&longitude=-66.335&current=temperature_2m,weather_code,is_day&timezone=America%2FArgentina%2FSan_Luis";

export async function GET() {
  try {
    const response = await fetch(WEATHER_URL, { cache: "no-store" });

    if (!response.ok) throw new Error("Weather request failed");

    const data = (await response.json()) as {
      current?: {
        temperature_2m?: number;
        weather_code?: number;
        is_day?: number;
      };
    };

    if (!data.current || typeof data.current.temperature_2m !== "number") {
      throw new Error("Invalid weather response");
    }

    return NextResponse.json(
      {
        temperature: Math.round(data.current.temperature_2m),
        code: data.current.weather_code ?? 0,
        isDay: data.current.is_day === 1,
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { error: "Clima no disponible" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
