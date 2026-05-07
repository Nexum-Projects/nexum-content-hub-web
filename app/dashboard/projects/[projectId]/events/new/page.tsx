import { EventForm } from "@/components/events/event-form";

export default async function NewEventPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = await params;

  return <EventForm projectId={projectId} />;
}
