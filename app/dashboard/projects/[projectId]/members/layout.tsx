import { assertCanViewProjectMembers } from "@/app/actions/content/can-view-project-members";

export default async function ProjectMembersSectionLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  await assertCanViewProjectMembers(projectId);
  return children;
}
