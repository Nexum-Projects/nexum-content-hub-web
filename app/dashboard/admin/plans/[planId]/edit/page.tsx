import { notFound, redirect } from "next/navigation";

import { getSession } from "@/app/actions/auth";
import { getCmsResources, getPlan } from "@/app/actions/content/plans";
import { PlanForm } from "@/components/plans/plan-form";
import { CMS_RESOURCES } from "@/lib/cms-resources";
import { isSuperAdminRole } from "../../../../projects/project-components";

export default async function EditPlanPage({ params }: { params: Promise<{ planId: string }> }) {
  const session = await getSession();

  if (!isSuperAdminRole(session?.platformRole)) {
    redirect("/dashboard");
  }

  const { planId } = await params;
  const [plan, resources] = await Promise.all([getPlan(planId), getCmsResources()]);

  if (plan.status !== "success") {
    notFound();
  }

  return <PlanForm plan={plan.data} resources={resources.status === "success" ? resources.data : [...CMS_RESOURCES]} />;
}
