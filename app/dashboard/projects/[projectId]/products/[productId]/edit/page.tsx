import { notFound } from "next/navigation";

import { fetchProductCategories, getMenuProductDetail } from "@/app/actions/content";
import { ProductEditForm } from "@/components/content/content-edit-forms";

export default async function ProductEditPage({ params }: { params: Promise<{ projectId: string; productId: string }> }) {
  const { projectId, productId } = await params;
  const [result, categoriesRes] = await Promise.all([
    getMenuProductDetail(projectId, productId),
    fetchProductCategories(projectId),
  ]);

  if (result.status === "error" || !result.data) {
    notFound();
  }

  return (
    <ProductEditForm
      categories={categoriesRes.status === "success" ? categoriesRes.data : []}
      product={result.data}
      projectId={projectId}
    />
  );
}
