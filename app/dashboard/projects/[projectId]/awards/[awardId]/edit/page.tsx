import { notFound } from "next/navigation";

import { getAwardDetail } from "@/app/actions/content";
import { AwardEditForm } from "@/components/content/content-edit-forms";

export default async function AwardEditPage({ params }: { params: Promise<{ projectId: string; awardId: string }> }) {
  const { projectId, awardId } = await params;
  const result = await getAwardDetail(projectId, awardId);

  if (result.status === "error" || !result.data) {
    notFound();
  }

  return <AwardEditForm award={result.data} projectId={projectId} />;
}
