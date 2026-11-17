import { ActivityForm } from "@/components/admin/ActivityForm";
import { requireUser } from "@/lib/auth";
import { todayInTimeZone } from "@/lib/dates";
import {
  getCategoriesList,
  getMembersList,
  toCategoryDTO,
  toMemberDTO,
} from "@/lib/queries";
import { getSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";

export const metadata = { title: "Nueva actividad" };

export default async function NewActivityPage() {
  await requireUser();
  const settings = getSettings();
  const today = todayInTimeZone(settings.timezone);

  const members = getMembersList().map(toMemberDTO);
  const categories = getCategoriesList().map(toCategoryDTO);

  return (
    <ActivityForm
      mode="create"
      today={today}
      members={members}
      categories={categories}
    />
  );
}
