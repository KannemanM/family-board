import { requireUser } from "@/lib/auth";
import { getMembersList, toMemberDTO } from "@/lib/queries";

import { MemberManager } from "@/components/admin/MemberManager";

export const dynamic = "force-dynamic";

export const metadata = { title: "Integrantes" };

export default async function MembersPage() {
  await requireUser();
  const members = getMembersList().map(toMemberDTO);

  return <MemberManager members={members} />;
}
