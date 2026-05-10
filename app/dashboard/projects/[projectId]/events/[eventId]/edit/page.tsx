import { notFound } from "next/navigation";

import { getEventDetail } from "@/app/actions/content";
import { EventEditForm } from "@/components/content/content-edit-forms";

export default async function EventEditPage({ params }: { params: Promise<{ projectId: string; eventId: string }> }) {
  const { projectId, eventId } = await params;
  const result = await getEventDetail(projectId, eventId);

  if (result.status === "error" || !result.data) {
    notFound();
  }

  return <EventEditForm event={result.data} projectId={projectId} />;
}
