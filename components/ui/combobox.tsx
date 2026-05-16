"use client";

import * as React from "react";
import { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox";
import { Check, ChevronsUpDown } from "lucide-react";

import { cn } from "@/lib/utils";

const Combobox = ComboboxPrimitive.Root;

const ComboboxInput = React.forwardRef<
  React.ComponentRef<typeof ComboboxPrimitive.Input>,
  React.ComponentPropsWithoutRef<typeof ComboboxPrimitive.Input>
>(({ className, disabled, ...props }, ref) => (
  <ComboboxPrimitive.InputGroup
    className={cn(
      "relative flex h-10 w-full items-center rounded-lg border border-input bg-background text-sm ring-offset-background transition-colors focus-within:outline-none focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2 data-disabled:cursor-not-allowed data-disabled:opacity-50",
      className,
    )}
  >
    <ComboboxPrimitive.Input
      className="h-full min-w-0 flex-1 bg-transparent px-3 pr-10 text-sm outline-none placeholder:text-muted-foreground disabled:cursor-not-allowed"
      disabled={disabled}
      ref={ref}
      {...props}
    />
    <ComboboxPrimitive.Trigger
      aria-label="Abrir opciones"
      className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-lg text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
      disabled={disabled}
      type="button"
    >
      <ComboboxPrimitive.Icon>
        <ChevronsUpDown className="h-4 w-4" />
      </ComboboxPrimitive.Icon>
    </ComboboxPrimitive.Trigger>
  </ComboboxPrimitive.InputGroup>
));
ComboboxInput.displayName = ComboboxPrimitive.Input.displayName;

type ComboboxContentProps = React.ComponentPropsWithoutRef<typeof ComboboxPrimitive.Popup> & {
  align?: React.ComponentPropsWithoutRef<typeof ComboboxPrimitive.Positioner>["align"];
  sideOffset?: React.ComponentPropsWithoutRef<typeof ComboboxPrimitive.Positioner>["sideOffset"];
};

const ComboboxContent = React.forwardRef<React.ComponentRef<typeof ComboboxPrimitive.Popup>, ComboboxContentProps>(
  ({ className, align = "start", children, sideOffset = 6, ...props }, ref) => (
    <ComboboxPrimitive.Portal>
      <ComboboxPrimitive.Positioner align={align} className="z-[60]" sideOffset={sideOffset}>
        <ComboboxPrimitive.Popup
          className={cn(
            "max-h-[min(var(--available-height),20rem)] w-[var(--anchor-width)] overflow-hidden rounded-xl border border-border bg-popover p-1 text-popover-foreground shadow-md outline-none",
            className,
          )}
          ref={ref}
          {...props}
        >
          {children}
        </ComboboxPrimitive.Popup>
      </ComboboxPrimitive.Positioner>
    </ComboboxPrimitive.Portal>
  ),
);
ComboboxContent.displayName = ComboboxPrimitive.Popup.displayName;

const ComboboxEmpty = React.forwardRef<
  React.ComponentRef<typeof ComboboxPrimitive.Empty>,
  React.ComponentPropsWithoutRef<typeof ComboboxPrimitive.Empty>
>(({ className, ...props }, ref) => (
  <ComboboxPrimitive.Empty
    className={cn("px-3 py-6 text-center text-sm text-muted-foreground", className)}
    ref={ref}
    {...props}
  />
));
ComboboxEmpty.displayName = ComboboxPrimitive.Empty.displayName;

const ComboboxList = React.forwardRef<
  React.ComponentRef<typeof ComboboxPrimitive.List>,
  React.ComponentPropsWithoutRef<typeof ComboboxPrimitive.List>
>(({ className, ...props }, ref) => (
  <ComboboxPrimitive.List className={cn("max-h-72 overflow-y-auto py-1", className)} ref={ref} {...props} />
));
ComboboxList.displayName = ComboboxPrimitive.List.displayName;

const ComboboxItem = React.forwardRef<
  React.ComponentRef<typeof ComboboxPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof ComboboxPrimitive.Item>
>(({ className, children, ...props }, ref) => (
  <ComboboxPrimitive.Item
    className={cn(
      "relative flex cursor-default select-none items-center rounded-md px-3 py-2 pl-8 text-sm leading-5 outline-none data-disabled:pointer-events-none data-highlighted:bg-accent data-highlighted:text-accent-foreground data-disabled:opacity-50",
      className,
    )}
    ref={ref}
    {...props}
  >
    <span className="absolute left-2 flex h-4 w-4 items-center justify-center">
      <ComboboxPrimitive.ItemIndicator>
        <Check className="h-4 w-4" />
      </ComboboxPrimitive.ItemIndicator>
    </span>
    {children}
  </ComboboxPrimitive.Item>
));
ComboboxItem.displayName = ComboboxPrimitive.Item.displayName;

export {
  Combobox,
  ComboboxContent,
  ComboboxEmpty,
  ComboboxInput,
  ComboboxItem,
  ComboboxList,
};
