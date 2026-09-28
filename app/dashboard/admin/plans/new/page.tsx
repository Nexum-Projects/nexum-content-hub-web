import { redirect } from "next/navigation";

import { getSession } from "@/app/actions/auth";
import { getCmsResources } from "@/app/actions/content/plans";
import { PlanForm } from "@/components/plans/plan-form";
import { CMS_RESOURCES } from "@/lib/cms-resources";
import { isSuperAdminRole } from "../../../projects/project-components";

export default async function NewPlanPage() {
  const session = await getSession();

  if (!isSuperAdminRole(session?.platformRole)) {
    redirect("/dashboard");
  }

  const resources = await getCmsResources();

  return <PlanForm resources={resources.status === "success" ? resources.data : [...CMS_RESOURCES]} />;
}
