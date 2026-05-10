"use client";

import * as React from "react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";

import { Calendar } from "@/components/ui/calendar";
import { Field, FieldLabel } from "@/components/ui/field";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { composeDateTime, splitDateTime } from "@/utils/events-datetime";

export type EventDateTimePickerProps = {
  id: string;
  label: string;
  value: string | undefined;
  onChange: (next: string) => void;
  hint?: string;
  /** `date`: solo dia civil (YYYY-MM-DD). `datetime`: fecha y hora local Guatemala. */
  variant?: "datetime" | "date";
};

function pad2(value: number) {
  return String(value).padStart(2, "0");
}

function dateStrFromLocalDate(date: Date): string {
  return `${date.getFullYear()}-${pad2(date.getMonth() + 1)}-${pad2(date.getDate())}`;
}

function parseYmdToLocalDate(ymd: string) {
  const [year, month, day] = ymd.split("-").map(Number);
  if (!year || !month || !day) {
    return undefined;
  }

  const date = new Date(year, month - 1, day);
  return Number.isNaN(date.getTime()) ? undefined : date;
}

function parseLocalDateTime(value: string | undefined, variant: "datetime" | "date") {
  const safeValue = value ?? "";
  const { date, time } = splitDateTime(safeValue);
  const datePart = variant === "date" && /^\d{4}-\d{2}-\d{2}$/.test(safeValue.trim()) ? safeValue.trim() : date;
  const parsedDate = datePart ? parseYmdToLocalDate(datePart) : undefined;
  const [hour = "00", minute = "00"] = (time || "00:00").split(":");

  if (!parsedDate) {
    return undefined;
  }

  parsedDate.setHours(Number(hour) || 0, Number(minute) || 0, 0, 0);
  return parsedDate;
}

function displayValue(date: Date | undefined, variant: "datetime" | "date") {
  if (!date) {
    return variant === "date" ? "Selecciona una fecha" : "Selecciona fecha y hora";
  }

  return variant === "date" ? format(date, "dd/MM/yyyy", { locale: es }) : format(date, "dd/MM/yyyy hh:mm a", { locale: es });
}

function toValue(date: Date, variant: "datetime" | "date") {
  const datePart = dateStrFromLocalDate(date);
  if (variant === "date") {
    return datePart;
  }

  return composeDateTime(datePart, `${pad2(date.getHours())}:${pad2(date.getMinutes())}`);
}

function updateTime(date: Date | undefined, type: "hour" | "minute" | "ampm", value: string) {
  const next = date ? new Date(date) : new Date();

  if (type === "hour") {
    const selectedHour = Number(value);
    const currentHours = next.getHours();
    const isPm = currentHours >= 12;
    next.setHours(isPm ? (selectedHour % 12) + 12 : selectedHour % 12);
  }

  if (type === "minute") {
    next.setMinutes(Number(value));
  }

  if (type === "ampm") {
    const currentHours = next.getHours();
    if (value === "AM" && currentHours >= 12) {
      next.setHours(currentHours - 12);
    }
    if (value === "PM" && currentHours < 12) {
      next.setHours(currentHours + 12);
    }
  }

  return next;
}

export function EventDateTimePicker({
  id,
  label,
  value,
  onChange,
  hint,
  variant = "datetime",
}: EventDateTimePickerProps) {
  const [open, setOpen] = React.useState(false);
  const selectedDate = parseLocalDateTime(value, variant);
  const selectedHour = selectedDate ? selectedDate.getHours() : undefined;
  const selectedMinute = selectedDate ? selectedDate.getMinutes() : undefined;
  const isPm = typeof selectedHour === "number" && selectedHour >= 12;
  const twelveHour = typeof selectedHour === "number" ? selectedHour % 12 || 12 : undefined;

  function commit(next: Date) {
    onChange(toValue(next, variant));
  }

  function handleDateSelect(date: Date | undefined) {
    if (!date) {
      return;
    }

    const next = new Date(date);
    next.setHours(selectedDate?.getHours() ?? 9, selectedDate?.getMinutes() ?? 0, 0, 0);
    commit(next);

    if (variant === "date") {
      setOpen(false);
    }
  }

  function handleTimeChange(type: "hour" | "minute" | "ampm", nextValue: string) {
    commit(updateTime(selectedDate, type, nextValue));
  }

  return (
    <Field className="w-full">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <Popover onOpenChange={setOpen} open={open}>
        <PopoverTrigger asChild>
          <Button
            aria-label={label}
            className={cn("h-10 w-full justify-start px-3 text-left font-normal", !selectedDate && "text-muted-foreground")}
            id={id}
            type="button"
            variant="outline"
          >
            <span className="truncate">{displayValue(selectedDate, variant)}</span>
            <CalendarIcon className="ml-auto h-4 w-4 shrink-0 opacity-60" />
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" className="w-auto overflow-hidden p-0" sideOffset={8}>
          <div className="sm:flex">
            <div>
              <Calendar
                captionLayout="dropdown"
                defaultMonth={selectedDate ?? new Date()}
                formatters={{
                  formatMonthDropdown: (date) => format(date, "MMMM", { locale: es }),
                  formatYearDropdown: (date) => format(date, "yyyy", { locale: es }),
                }}
                locale={es}
                mode="single"
                onSelect={handleDateSelect}
                selected={selectedDate}
              />
              {selectedDate ? (
                <div className="border-t p-2">
                  <Button className="w-full" onClick={() => onChange("")} size="sm" type="button" variant="ghost">
                    Limpiar fecha
                  </Button>
                </div>
              ) : null}
            </div>
            {variant === "datetime" ? (
              <div className="flex flex-col border-t sm:h-[300px] sm:flex-row sm:border-l sm:border-t-0">
                <div className="w-64 overflow-x-auto sm:w-auto sm:overflow-y-auto">
                  <div className="flex gap-1 p-2 sm:flex-col">
                    {Array.from({ length: 12 }, (_, index) => index + 1)
                      .reverse()
                      .map((hour) => (
                        <Button
                          className="aspect-square shrink-0 sm:w-full"
                          key={hour}
                          onClick={() => handleTimeChange("hour", String(hour))}
                          size="icon"
                          type="button"
                          variant={twelveHour === hour ? "default" : "ghost"}
                        >
                          {hour}
                        </Button>
                      ))}
                  </div>
                </div>
                <div className="w-64 overflow-x-auto border-t sm:w-auto sm:overflow-y-auto sm:border-l sm:border-t-0">
                  <div className="flex gap-1 p-2 sm:flex-col">
                    {Array.from({ length: 12 }, (_, index) => index * 5).map((minute) => (
                      <Button
                        className="aspect-square shrink-0 sm:w-full"
                        key={minute}
                        onClick={() => handleTimeChange("minute", String(minute))}
                        size="icon"
                        type="button"
                        variant={selectedMinute === minute ? "default" : "ghost"}
                      >
                        {pad2(minute)}
                      </Button>
                    ))}
                  </div>
                </div>
                <div className="overflow-x-auto border-t sm:overflow-y-auto sm:border-l sm:border-t-0">
                  <div className="flex gap-1 p-2 sm:flex-col">
                    {["AM", "PM"].map((ampm) => (
                      <Button
                        className="aspect-square shrink-0 sm:w-full"
                        key={ampm}
                        onClick={() => handleTimeChange("ampm", ampm)}
                        size="icon"
                        type="button"
                        variant={(ampm === "PM" && isPm) || (ampm === "AM" && !isPm) ? "default" : "ghost"}
                      >
                        {ampm}
                      </Button>
                    ))}
                  </div>
                </div>
              </div>
            ) : null}
          </div>
        </PopoverContent>
      </Popover>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </Field>
  );
}
