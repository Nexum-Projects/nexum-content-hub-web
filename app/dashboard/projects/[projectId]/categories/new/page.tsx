import { CategoryForm } from "@/components/categories/category-form";

export default async function NewCategoryPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;

  return <CategoryForm projectId={projectId} />;
}
