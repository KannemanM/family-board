import { notFound } from "next/navigation";

import { BoardView } from "@/components/board/BoardView";
import { getBoardData } from "@/lib/queries";
import { getSettings, isValidBoardToken } from "@/lib/settings";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Tablero",
  robots: { index: false, follow: false },
};

export default async function BoardPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;
  const settings = getSettings();

  if (!isValidBoardToken(token, settings.boardToken)) notFound();

  const data = getBoardData();

  return <BoardView initial={data} token={settings.boardToken} />;
}
