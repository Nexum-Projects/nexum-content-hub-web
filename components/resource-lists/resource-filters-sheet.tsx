"use client";

import { Filter, X, XCircle } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

type ResourceFiltersSheetProps = {
  activeFiltersCount: number;
  onClear: () => void;
  children: React.ReactNode;
  title?: string;
  description?: string;
};

export function ResourceFiltersSheet({
  activeFiltersCount,
  onClear,
  children,
  title = "Filtros",
  description = "Ajusta la vista del listado. Los cambios se reflejan en la URL.",
}: ResourceFiltersSheetProps) {
  const [open, setOpen] = useState(false);

  return (
    <Sheet onOpenChange={setOpen} open={open}>
      <SheetTrigger asChild>
        <Button className="h-9 w-full shrink-0 gap-2 rounded-lg sm:w-fit" type="button" variant="outline">
          <Filter className="h-4 w-4" />
          Filtros
          {activeFiltersCount > 0 ? (
            <>
              <span aria-hidden className="mx-1 h-4 w-px shrink-0 bg-border" />
              <span className="grid h-5 min-w-5 place-items-center rounded-md bg-primary/10 px-1.5 text-xs font-medium leading-none text-primary">
                {activeFiltersCount}
              </span>
            </>
          ) : null}
        </Button>
      </SheetTrigger>
      <SheetContent className="flex w-full flex-col border-none sm:max-w-md" hideCloseButton side="right">
        <SheetHeader className="relative shrink-0 pr-10">
          <SheetTitle className="text-xl leading-6">{title}</SheetTitle>
          <SheetDescription>{description}</SheetDescription>
          <SheetClose asChild>
            <Button
              aria-label="Cerrar filtros"
              className="absolute right-0 top-0 h-8 w-8 rounded-md"
              size="icon"
              type="button"
              variant="ghost"
            >
              <X className="h-4 w-4" />
            </Button>
          </SheetClose>
        </SheetHeader>
        <div className="flex-1 space-y-4 overflow-y-auto px-4 py-6">{children}</div>
        {activeFiltersCount > 0 ? (
          <SheetFooter className="shrink-0 border-t border-border bg-card">
            <Button
              className="w-full rounded-lg"
              type="button"
              variant="destructive"
              onClick={() => {
                onClear();
                setOpen(false);
              }}
            >
              <XCircle className="mr-2 h-4 w-4" />
              Limpiar filtros
            </Button>
          </SheetFooter>
        ) : null}
      </SheetContent>
    </Sheet>
  );
}
