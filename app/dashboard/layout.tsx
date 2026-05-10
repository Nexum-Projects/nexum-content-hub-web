import { getAuthenticatedUserId, getSession } from "@/app/actions/auth";
import { getUserDetail } from "@/app/actions/content";
import { DashboardShell } from "@/components/app/dashboard-shell";
import { resolveAvatarUrl } from "@/lib/utils";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  /** El JWT no suele traer `avatarUrl`; cargamos la foto desde GET /admin/users/:id para el bloque inferior del sidebar. */
  let profileAvatarUrl: string | null = null;
  const userId = await getAuthenticatedUserId();
  if (userId) {
    const detail = await getUserDetail(userId);
    if (detail.status === "success") {
      profileAvatarUrl = resolveAvatarUrl(detail.data);
    }
  }

  return (
    <DashboardShell profileAvatarUrl={profileAvatarUrl} session={session}>
      {children}
    </DashboardShell>
  );
}
