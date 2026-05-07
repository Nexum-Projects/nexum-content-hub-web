import { AwardForm } from "@/components/awards/award-form";

export default async function NewAwardPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;

  return <AwardForm projectId={projectId} />;
}
