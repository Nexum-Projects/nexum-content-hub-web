"use client";

import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/radix-select";
import { LIST_LIMITS } from "@/lib/project-list-query";

type Meta = {
  page: number;
  limit: number;
  totalObjects: number;
  totalPages: number;
  hasPreviousPage: boolean;
  hasNextPage: boolean;
};

export function ListPaginationFooter({
  meta,
  isPending,
  onPageChange,
  onLimitChange,
  entityLabel,
}: {
  meta: Meta;
  isPending: boolean;
  onPageChange: (page: number) => void;
  onLimitChange: (limit: number) => void;
  entityLabel: string;
}) {
  const { page, limit, totalObjects, totalPages, hasPreviousPage, hasNextPage } = meta;
  const from = totalObjects > 0 ? (page - 1) * limit + 1 : 0;
  const to = Math.min(page * limit, totalObjects);

  return (
    <div className="flex flex-col gap-4 border-t border-border pt-4 sm:flex-row sm:flex-wrap sm:items-center sm:justify-between">
      <p className="text-sm text-muted-foreground">
        Mostrando <span className="font-medium text-foreground">{from}</span>–
        <span className="font-medium text-foreground">{to}</span> de{" "}
        <span className="font-medium text-foreground">{totalObjects}</span> {entityLabel}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Filas</span>
          <Select onValueChange={(v) => onLimitChange(Number(v))} value={String(limit)}>
            <SelectTrigger className="h-8 w-[4.75rem] rounded-lg text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {LIST_LIMITS.map((n) => (
                <SelectItem key={n} value={String(n)}>
                  {n}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-center gap-2">
          <Button
            className="rounded-lg"
            disabled={!hasPreviousPage || isPending}
            onClick={() => onPageChange(page - 1)}
            size="sm"
            type="button"
            variant="outline"
          >
            Anterior
          </Button>
          <span className="min-w-[5.5rem] text-center text-sm tabular-nums text-muted-foreground">
            Pagina {page} / {totalPages}
          </span>
          <Button
            className="rounded-lg"
            disabled={!hasNextPage || isPending}
            onClick={() => onPageChange(page + 1)}
            size="sm"
            type="button"
            variant="outline"
          >
            Siguiente
          </Button>
        </div>
      </div>
    </div>
  );
}
