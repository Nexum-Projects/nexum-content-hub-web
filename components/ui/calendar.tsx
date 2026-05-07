"use client";

import * as React from "react";
import type { VariantProps } from "class-variance-authority";
import { ChevronDownIcon, ChevronLeftIcon, ChevronRightIcon } from "lucide-react";
import { DayPicker, type DayButtonProps, getDefaultClassNames } from "react-day-picker";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type CalendarProps = React.ComponentProps<typeof DayPicker> & {
  buttonVariant?: VariantProps<typeof buttonVariants>["variant"];
};

function CalendarDayButton({ className, day, modifiers, ...props }: DayButtonProps) {
  const defaultClassNames = getDefaultClassNames();
  const ref = React.useRef<HTMLButtonElement>(null);

  React.useEffect(() => {
    if (modifiers.focused) {
      ref.current?.focus();
    }
  }, [modifiers.focused]);

  return (
    <button
      ref={ref}
      type="button"
      data-day={day.date.toISOString().slice(0, 10)}
      className={cn(
        buttonVariants({ variant: "ghost" }),
        "size-(--cell-size) min-h-(--cell-size) min-w-(--cell-size) rounded-md p-0 font-normal transition-colors",
        "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
        !modifiers.selected && !modifiers.disabled && "hover:bg-accent hover:text-accent-foreground",
        modifiers.today && !modifiers.selected && "bg-accent/70 text-accent-foreground hover:bg-accent",
        modifiers.outside && !modifiers.selected && "text-muted-foreground",
        modifiers.disabled && "pointer-events-none opacity-40",
        modifiers.selected &&
          "bg-primary font-medium text-primary-foreground hover:bg-primary hover:text-primary-foreground focus-visible:ring-offset-background",
        defaultClassNames.day_button,
        className,
      )}
      {...props}
    />
  );
}

export function Calendar({
  className,
  classNames,
  showOutsideDays = true,
  captionLayout = "label",
  buttonVariant = "ghost",
  formatters,
  components,
  showWeekNumber,
  ...props
}: CalendarProps) {
  const defaultClassNames = getDefaultClassNames();

  return (
    <DayPicker
      captionLayout={captionLayout}
      className={cn(
        "bg-popover p-3 [--cell-size:2.25rem] group/calendar in-data-[slot=popover-content]:bg-transparent",
        String.raw`rtl:**:[.rdp-button_next>svg]:rotate-180`,
        String.raw`rtl:**:[.rdp-button_previous>svg]:rotate-180`,
        "[&_.rdp-caption_label]:leading-none",
        "[&_td.rdp-selected]:text-sm [&_td.rdp-selected]:font-normal [&_td.rdp-selected]:leading-none",
        className,
      )}
      classNames={{
        root: cn("w-fit", defaultClassNames.root),
        months: cn("relative flex flex-col gap-4 md:flex-row", defaultClassNames.months),
        month: cn("flex w-full flex-col gap-4", defaultClassNames.month),
        nav: cn(
          "absolute inset-x-0 top-0 flex w-full items-center justify-between gap-1 px-1",
          defaultClassNames.nav,
        ),
        button_previous: cn(
          buttonVariants({ variant: buttonVariant }),
          "size-(--cell-size) shrink-0 rounded-md p-0 select-none aria-disabled:opacity-40",
          defaultClassNames.button_previous,
        ),
        button_next: cn(
          buttonVariants({ variant: buttonVariant }),
          "size-(--cell-size) shrink-0 rounded-md p-0 select-none aria-disabled:opacity-40",
          defaultClassNames.button_next,
        ),
        month_caption: cn(
          "flex h-(--cell-size) w-full items-center justify-center px-(--cell-size)",
          defaultClassNames.month_caption,
        ),
        dropdowns: cn(
          "flex h-(--cell-size) w-full items-center justify-center gap-2 text-sm font-medium",
          defaultClassNames.dropdowns,
        ),
        dropdown_root: cn(
          "relative rounded-md border border-input bg-background shadow-sm focus-within:border-ring focus-within:ring-2 focus-within:ring-ring/35",
          defaultClassNames.dropdown_root,
        ),
        dropdown: cn("absolute inset-0 cursor-pointer opacity-0", defaultClassNames.dropdown),
        caption_label: cn(
          "select-none font-medium",
          captionLayout === "label"
            ? "text-sm"
            : "flex h-8 items-center gap-1 rounded-md pl-2 pr-1 text-sm [&>svg]:size-3.5 [&>svg]:text-muted-foreground",
          defaultClassNames.caption_label,
        ),
        month_grid: cn("w-full border-collapse", defaultClassNames.month_grid),
        weekdays: cn("flex w-full", defaultClassNames.weekdays),
        weekday: cn(
          "flex-1 select-none rounded-md text-center text-[0.75rem] font-normal capitalize text-muted-foreground",
          defaultClassNames.weekday,
        ),
        week: cn("mt-2 flex w-full", defaultClassNames.week),
        week_number_header: cn(
          "w-(--cell-size) shrink-0 select-none",
          defaultClassNames.week_number_header,
        ),
        week_number: cn(
          "text-[0.75rem] font-normal text-muted-foreground select-none",
          defaultClassNames.week_number,
        ),
        day: cn(
          "relative flex h-full w-full flex-1 select-none justify-center p-0 text-center",
          showWeekNumber === true
            ? "[&:nth-child(2)[data-selected]_button]:rounded-l-md [&:last-child[data-selected]_button]:rounded-r-md"
            : "[&:first-child[data-selected]_button]:rounded-l-md [&:last-child[data-selected]_button]:rounded-r-md",
          defaultClassNames.day,
        ),
        range_start: cn("rounded-l-md bg-accent", defaultClassNames.range_start),
        range_middle: cn("rounded-none", defaultClassNames.range_middle),
        range_end: cn("rounded-r-md bg-accent", defaultClassNames.range_end),
        selected: cn(defaultClassNames.selected),
        today: cn("[&:not(.rdp-selected)]:font-normal", defaultClassNames.today),
        outside: cn("text-muted-foreground", defaultClassNames.outside),
        disabled: cn(defaultClassNames.disabled),
        hidden: cn("invisible", defaultClassNames.hidden),
        ...classNames,
      }}
      components={{
        Root: ({ className: rootClassName, rootRef, ...rootProps }) => (
          <div className={cn(rootClassName)} data-slot="calendar" ref={rootRef} {...rootProps} />
        ),
        Chevron: ({ className: chevronClassName, orientation, ...chevronProps }) => {
          if (orientation === "left") {
            return (
              <ChevronLeftIcon className={cn("size-4 shrink-0 text-muted-foreground", chevronClassName)} {...chevronProps} />
            );
          }
          if (orientation === "right") {
            return (
              <ChevronRightIcon className={cn("size-4 shrink-0 text-muted-foreground", chevronClassName)} {...chevronProps} />
            );
          }
          return (
            <ChevronDownIcon className={cn("size-4 shrink-0 text-muted-foreground", chevronClassName)} {...chevronProps} />
          );
        },
        DayButton: CalendarDayButton,
        ...components,
      }}
      formatters={{
        formatMonthDropdown: (date) => date.toLocaleString("default", { month: "short" }),
        ...formatters,
      }}
      showOutsideDays={showOutsideDays}
      showWeekNumber={showWeekNumber}
      {...props}
    />
  );
}
