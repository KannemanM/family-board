import { requireUser } from "@/lib/auth";
import { getSettings } from "@/lib/settings";

import { AdminShell } from "@/components/admin/AdminShell";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await requireUser();
  const settings = getSettings();

  return (
    <AdminShell user={user} familyName={settings.familyName}>
      {children}
    </AdminShell>
  );
}
