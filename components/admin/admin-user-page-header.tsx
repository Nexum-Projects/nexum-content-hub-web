import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { Button } from "@/components/ui/button";

export function AdminUserPageHeader({
  title,
  description,
  breadcrumbHref,
  breadcrumbParentLabel = "Usuarios",
  breadcrumbCurrent,
  backHref,
  backLabel,
  /** Por defecto el botón va a la derecha (p. ej. pantallas antiguas). */
  backAlign = "right",
}: {
  title: string;
  description: string;
  breadcrumbHref: string;
  breadcrumbParentLabel?: string;
  breadcrumbCurrent: string;
  backHref: string;
  backLabel: string;
  backAlign?: "left" | "right";
}) {
  const backButton = (
    <Button asChild className="rounded-lg" variant="outline">
      <Link href={backHref}>
        <ArrowLeft className="h-4 w-4" />
        {backLabel}
      </Link>
    </Button>
  );

  const main = (
    <div className="space-y-2">
      <div className="flex flex-wrap items-center gap-2 text-sm">
        <Link className="font-medium text-primary hover:underline" href={breadcrumbHref}>
          {breadcrumbParentLabel}
        </Link>
        <span className="text-muted-foreground">/</span>
        <span className="text-muted-foreground">{breadcrumbCurrent}</span>
      </div>
      <div>
        <h1 className="text-2xl font-semibold leading-7">{title}</h1>
        {description.trim() ? <p className="mt-2 max-w-2xl text-sm text-muted-foreground">{description}</p> : null}
      </div>
    </div>
  );

  if (backAlign === "left") {
    return (
      <header className="space-y-4">
        {backButton}
        {main}
      </header>
    );
  }

  return (
    <header className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      {main}
      {backButton}
    </header>
  );
}
