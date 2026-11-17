import { requireUser } from "@/lib/auth";
import { getCategoriesList, toCategoryDTO } from "@/lib/queries";

import { CategoryManager } from "@/components/admin/CategoryManager";

export const dynamic = "force-dynamic";

export const metadata = { title: "Categorías" };

export default async function CategoriesPage() {
  await requireUser();
  const categories = getCategoriesList().map(toCategoryDTO);

  return <CategoryManager categories={categories} />;
}
