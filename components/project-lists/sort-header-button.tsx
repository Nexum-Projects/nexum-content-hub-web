"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function SortHeaderButton({
  label,
  field,
  currentOrderBy,
  currentOrder,
  onSort,
  className,
}: {
  label: string;
  field: string;
  currentOrderBy: string;
  currentOrder: "ASC" | "DESC";
  onSort: (field: string) => void;
  className?: string;
}) {
  const active = currentOrderBy === field;
  const icon = !active ? (
    <ArrowUpDown className="ml-1.5 h-3.5 w-3.5 opacity-60" />
  ) : currentOrder === "ASC" ? (
    <ArrowUp className="ml-1.5 h-3.5 w-3.5" />
  ) : (
    <ArrowDown className="ml-1.5 h-3.5 w-3.5" />
  );

  return (
    <Button
      className={cn("-ml-2 h-8 px-2 text-xs font-medium text-muted-foreground hover:text-foreground", className)}
      onClick={() => onSort(field)}
      type="button"
      variant="ghost"
    >
      <span className="inline-flex items-center">
        {label}
        {icon}
      </span>
    </Button>
  );
}
