import type { LucideIcon } from "lucide-react";
import Link from "next/link";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

export function ListEmptyState({
  icon: Icon,
  title,
  description,
  actionHref,
  actionLabel,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  actionHref: string;
  actionLabel: string;
}) {
  return (
    <Card className="mx-auto max-w-md rounded-xl border border-dashed border-border bg-muted/15">
      <CardContent className="flex flex-col items-center gap-4 px-6 py-12 text-center">
        <span className="grid h-12 w-12 place-items-center rounded-full bg-muted text-muted-foreground">
          <Icon className="h-6 w-6" />
        </span>
        <div className="space-y-1">
          <p className="text-base font-semibold text-foreground">{title}</p>
          <p className="text-sm text-muted-foreground">{description}</p>
        </div>
        <Button asChild className="rounded-lg">
          <Link href={actionHref}>{actionLabel}</Link>
        </Button>
      </CardContent>
    </Card>
  );
}
