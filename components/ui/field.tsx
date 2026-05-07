"use client";

import * as React from "react";

import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

export function Field({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("space-y-2", className)} {...props} />;
}

export function FieldLabel({ className, ...props }: React.ComponentProps<typeof Label>) {
  return <Label className={cn(className)} {...props} />;
}

export function FieldGroup({ className, ...props }: React.ComponentProps<"div">) {
  return <div className={cn("flex flex-col gap-4 sm:flex-row sm:items-end", className)} {...props} />;
}
