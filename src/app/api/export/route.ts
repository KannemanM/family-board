import { getCurrentUser } from "@/lib/auth";
import { todayInTimeZone } from "@/lib/dates";
import { getExportData } from "@/lib/queries";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) {
    return Response.json({ error: "No autorizado" }, { status: 401 });
  }

  const settings = getSettings();
  const today = todayInTimeZone(settings.timezone);
  const payload = getExportData();

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="familyboard-${today}.json"`,
      "Cache-Control": "no-store",
    },
  });
}
