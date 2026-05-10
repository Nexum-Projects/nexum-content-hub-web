import { notFound } from "next/navigation";

import { getMenuProductDetail } from "@/app/actions/content";
import { ProductEditForm } from "@/components/content/content-edit-forms";

export default async function ProductEditPage({ params }: { params: Promise<{ projectId: string; productId: string }> }) {
  const { projectId, productId } = await params;
  const result = await getMenuProductDetail(projectId, productId);

  if (result.status === "error" || !result.data) {
    notFound();
  }

  return <ProductEditForm product={result.data} projectId={projectId} />;
}
