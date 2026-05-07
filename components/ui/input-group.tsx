"use client";

import * as React from "react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function InputGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      className={cn(
        "flex h-9 w-full min-w-0 items-stretch overflow-hidden rounded-lg border border-input bg-background shadow-sm transition-colors focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/40",
        className,
      )}
      {...props}
    />
  );
}

export function InputGroupInput({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      className={cn(
        "min-w-0 flex-1 border-0 bg-transparent px-3 py-1 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed disabled:opacity-50",
        className,
      )}
      {...props}
    />
  );
}

export function InputGroupAddon({
  className,
  align,
  ...props
}: React.ComponentProps<"div"> & { align?: "inline-end" | "inline-start" }) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-stretch border-input bg-muted/30",
        align === "inline-end" && "border-l",
        align === "inline-start" && "border-r",
        className,
      )}
      {...props}
    />
  );
}

export function InputGroupButton({
  className,
  variant = "ghost",
  size = "icon",
  ...props
}: React.ComponentProps<typeof Button>) {
  return (
    <Button
      className={cn("h-full min-h-9 min-w-9 shrink-0 rounded-none px-0 shadow-none", className)}
      size={size}
      variant={variant}
      {...props}
    />
  );
}
