import { notFound } from "next/navigation";

import { getProductCategoryDetail } from "@/app/actions/content";
import { CategoryForm } from "@/components/categories/category-form";

export default async function EditCategoryPage({
  params,
}: {
  params: Promise<{ projectId: string; categoryId: string }>;
}) {
  const { projectId, categoryId } = await params;
  const result = await getProductCategoryDetail(projectId, categoryId);

  if (result.status === "error" || !result.data) {
    notFound();
  }

  return <CategoryForm category={result.data} projectId={projectId} />;
}
