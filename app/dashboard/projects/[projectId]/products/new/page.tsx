import { ProductForm } from "@/components/products/product-form";

export default async function NewProductPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;

  return <ProductForm projectId={projectId} />;
}
