"use client";

import * as React from "react";
import { parseDate as parseDateEn } from "chrono-node";
import { parseDate as parseDateEs } from "chrono-node/es";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";

import { Calendar } from "@/components/ui/calendar";
import { Field, FieldLabel } from "@/components/ui/field";
import { Label } from "@/components/ui/label";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { composeDateTime, splitDateTime } from "@/utils/events-datetime";

function parseNaturalDate(text: string): Date | null {
  const trimmed = text.trim();
  if (!trimmed) {
    return null;
  }

  const ref = new Date();
  return parseDateEs(trimmed, ref, { forwardDate: true }) ?? parseDateEn(trimmed, ref, { forwardDate: true });
}

function dateStrFromLocalDate(d: Date): string {
  return format(d, "yyyy-MM-dd");
}

function formatDisplayDate(date: Date | undefined) {
  if (!date) {
    return "";
  }

  return format(date, "d 'de' MMMM yyyy", { locale: es });
}

function parseYmdToLocalDate(ymd: string): Date | undefined {
  const [y, m, d] = ymd.split("-").map(Number);
  if (!y || !m || !d) {
    return undefined;
  }

  const dt = new Date(y, m - 1, d);
  return Number.isNaN(dt.getTime()) ? undefined : dt;
}

function formattedDraftFromIsoLocal(value: string): string {
  const { date } = splitDateTime(value);
  if (!date) {
    return "";
  }

  const dt = parseYmdToLocalDate(date);
  return dt ? formatDisplayDate(dt) : "";
}

export type EventDateTimePickerProps = {
  id: string;
  label: string;
  value: string | undefined;
  onChange: (next: string) => void;
  hint?: string;
  /** `date`: solo día civil (valor `YYYY-MM-DD`), sin hora. `datetime`: fecha y hora local Guatemala. */
  variant?: "datetime" | "date";
};

export function EventDateTimePicker({
  id,
  label,
  value,
  onChange,
  hint,
  variant = "datetime",
}: EventDateTimePickerProps) {
  const safeValue = value ?? "";
  const { date: rawDatePart, time: timePartRaw } = splitDateTime(safeValue);
  const datePart =
    variant === "date"
      ? rawDatePart || (/^\d{4}-\d{2}-\d{2}$/.test(safeValue.trim()) ? safeValue.trim() : "")
      : rawDatePart;
  const timePart = timePartRaw;
  const selectedDate = datePart ? parseYmdToLocalDate(datePart) : undefined;
  const timeValue = timePart ? timePart.slice(0, 5) : "00:00";

  const [open, setOpen] = React.useState(false);
  const [dateFocused, setDateFocused] = React.useState(false);
  const [draft, setDraft] = React.useState("");
  const dateTextValue = dateFocused ? draft : formattedDraftFromIsoLocal(safeValue);

  const applyDateAndTime = React.useCallback(
    (ymd: string, time: string) => {
      const t = time && time.trim() ? time.slice(0, 5) : "00:00";
      onChange(composeDateTime(ymd, t));
    },
    [onChange],
  );

  const applyDateOnly = React.useCallback(
    (ymd: string) => {
      onChange(ymd);
    },
    [onChange],
  );

  return (
    <Field className="w-full">
      <FieldLabel htmlFor={id}>{label}</FieldLabel>
      <div
        className={
          variant === "date"
            ? "w-full"
            : "grid w-full grid-cols-1 gap-x-3 gap-y-2 sm:grid-cols-[minmax(0,1fr)_8.75rem]"
        }
      >
        <InputGroup className={variant === "date" ? "w-full" : "col-start-1 row-start-1 sm:col-start-1 sm:row-start-2"}>
          <InputGroupInput
            autoComplete="off"
            id={id}
            onBlur={() => {
              setDateFocused(false);
            }}
            onChange={(e) => {
              const text = e.target.value;
              setDraft(text);
              if (!text.trim()) {
                onChange("");
                return;
              }

              const parsed = parseNaturalDate(text);
              if (parsed) {
                const ymd = dateStrFromLocalDate(parsed);
                if (variant === "date") {
                  applyDateOnly(ymd);
                } else {
                  applyDateAndTime(ymd, timeValue);
                }
                setDraft(formatDisplayDate(parsed));
              }
            }}
            onFocus={() => {
              setDateFocused(true);
              setDraft(formattedDraftFromIsoLocal(safeValue));
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") {
                e.preventDefault();
                setOpen(true);
              }
            }}
            placeholder="Ej. mañana, en una semana, 15 may 2026"
            value={dateTextValue}
          />
          <InputGroupAddon align="inline-end">
            <Popover onOpenChange={setOpen} open={open}>
              <PopoverTrigger asChild>
                <InputGroupButton aria-label="Abrir calendario" type="button" variant="ghost">
                  <CalendarIcon className="h-4 w-4 shrink-0" />
                  <span className="sr-only">Abrir calendario</span>
                </InputGroupButton>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-auto overflow-hidden p-0" sideOffset={8}>
                <Calendar
                  captionLayout="dropdown"
                  defaultMonth={selectedDate ?? new Date()}
                  formatters={{
                    formatMonthDropdown: (date) => format(date, "MMMM", { locale: es }),
                    formatYearDropdown: (date) => format(date, "yyyy", { locale: es }),
                  }}
                  locale={es}
                  mode="single"
                  onSelect={(selected) => {
                    if (!selected) {
                      return;
                    }

                    const ymd = dateStrFromLocalDate(selected);
                    if (variant === "date") {
                      applyDateOnly(ymd);
                    } else {
                      applyDateAndTime(ymd, timeValue);
                    }
                    setDraft(formatDisplayDate(selected));
                    setOpen(false);
                  }}
                  selected={selectedDate}
                />
              </PopoverContent>
            </Popover>
          </InputGroupAddon>
        </InputGroup>
        {variant === "datetime" ? (
          <>
            <Label className="col-start-1 row-start-2 sm:col-start-2 sm:row-start-1" htmlFor={`${id}-time`}>
              Hora
            </Label>
            <Input
              className="col-start-1 row-start-3 h-9 w-full bg-background sm:col-start-2 sm:row-start-2 [&::-webkit-calendar-picker-indicator]:opacity-70"
              disabled={!datePart}
              id={`${id}-time`}
              onChange={(e) => {
                if (!datePart) {
                  return;
                }

                applyDateAndTime(datePart, e.target.value);
              }}
              step={60}
              type="time"
              value={timeValue}
            />
          </>
        ) : null}
      </div>
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </Field>
  );
}
