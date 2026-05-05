import { getSession } from "@/app/actions/auth";
import { DashboardShell } from "@/components/app/dashboard-shell";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await getSession();

  return <DashboardShell session={session}>{children}</DashboardShell>;
}
