import { notFound } from "next/navigation";

import { getBannerDetail } from "@/app/actions/content";
import { BannerEditForm } from "@/components/content/content-edit-forms";

export default async function BannerEditPage({ params }: { params: Promise<{ projectId: string; bannerId: string }> }) {
  const { projectId, bannerId } = await params;
  const result = await getBannerDetail(projectId, bannerId);

  if (result.status === "error" || !result.data) {
    notFound();
  }

  return <BannerEditForm banner={result.data} projectId={projectId} />;
}
