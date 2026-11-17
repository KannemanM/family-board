import { NextResponse } from "next/server";

import { getBoardData } from "@/lib/queries";
import { getSettings, isValidBoardToken } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const token = url.searchParams.get("token");
  const settings = getSettings();

  if (!isValidBoardToken(token, settings.boardToken)) {
    return NextResponse.json(
      { error: "No autorizado" },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  return NextResponse.json(getBoardData(), {
    headers: { "Cache-Control": "no-store" },
  });
}
