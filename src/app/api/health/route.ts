import { sqlite } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    sqlite.prepare("select 1 as ok").get();
    return Response.json({ status: "ok" });
  } catch {
    return Response.json({ status: "error" }, { status: 503 });
  }
}
