import { fetchProductCategories } from "@/app/actions/content";
import { ProductForm } from "@/components/products/product-form";

export default async function NewProductPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;
  const categoriesRes = await fetchProductCategories(projectId);

  return <ProductForm categories={categoriesRes.status === "success" ? categoriesRes.data : []} projectId={projectId} />;
}
