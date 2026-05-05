import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";

import { getSession } from "@/app/actions/auth";
import { getUsers } from "@/app/actions/content";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AdminUsersListClient } from "@/components/resource-lists/admin-users-list-client";
import { fallbackUsers } from "../../projects/fallback-data";
import { isAdminRole } from "../../projects/project-components";

export default async function AdminUsersPage() {
  const session = await getSession();

  if (!isAdminRole(session?.platformRole)) {
    redirect("/dashboard");
  }

  const result = await getUsers();
  const users = result.status === "success" && result.data.length ? result.data : fallbackUsers;

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {result.status === "error" && (
        <Card className="border-warning/40 bg-warning/10">
          <CardContent className="p-4 text-sm text-warning">
            {result.errors[0]?.title}: {result.errors[0]?.message}. Se muestra una vista previa local.
          </CardContent>
        </Card>
      )}

      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold leading-7">Administracion</h1>
          <p className="mt-1 text-sm text-muted-foreground">Usuarios del sistema Nexum Content Hub.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/admin/users/new">
            <Plus className="h-4 w-4" />
            Nuevo usuario
          </Link>
        </Button>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Usuarios</CardTitle>
          <CardDescription>Solo visible para SUPER_ADMIN.</CardDescription>
        </CardHeader>
        <CardContent>
          <AdminUsersListClient users={users} />
        </CardContent>
      </Card>
    </div>
  );
}
