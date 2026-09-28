import { getMyPermissions } from "@/app/actions/content/permissions";
import { ProjectPermissionsProvider } from "@/components/app/project-permissions";

export default async function ProjectLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ projectId: string }>;
}) {
  const { projectId } = await params;
  const result = await getMyPermissions(projectId);

  return (
    <ProjectPermissionsProvider permissions={result.status === "success" ? result.data : null} projectId={projectId}>
      {children}
    </ProjectPermissionsProvider>
  );
}
