import { redirect } from "next/navigation";
import Link from "next/link";
import { Plus } from "lucide-react";

import { getSession } from "@/app/actions/auth";
import { getPlans } from "@/app/actions/content/plans";
import { PlansListClient } from "@/components/plans/plans-list-client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { isSuperAdminRole } from "../../projects/project-components";

export default async function AdminPlansPage() {
  const session = await getSession();

  if (!isSuperAdminRole(session?.platformRole)) {
    redirect("/dashboard");
  }

  const result = await getPlans();

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      {result.status === "error" && (
        <Card className="border-warning/40 bg-warning/10">
          <CardContent className="p-4 text-sm text-warning">
            {result.errors[0]?.title}: {result.errors[0]?.message}
          </CardContent>
        </Card>
      )}

      <section className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-semibold leading-7">Planes</h1>
          <p className="mt-1 text-sm text-muted-foreground">Secciones del CMS que cada plan habilita a sus proyectos.</p>
        </div>
        <Button asChild>
          <Link href="/dashboard/admin/plans/new">
            <Plus className="h-4 w-4" />
            Nuevo plan
          </Link>
        </Button>
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Planes activos</CardTitle>
        </CardHeader>
        <CardContent>
          <PlansListClient plans={result.status === "success" ? result.data : []} />
        </CardContent>
      </Card>
    </div>
  );
}
