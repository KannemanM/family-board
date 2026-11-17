import { redirect } from "next/navigation";

import { getCurrentUser, isSetupComplete } from "@/lib/auth";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  if (!isSetupComplete()) redirect("/setup");

  const user = await getCurrentUser();
  redirect(user ? "/agenda" : "/login");
}
