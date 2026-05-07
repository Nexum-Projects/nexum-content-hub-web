"use client";

import { cn } from "@/lib/utils";

export type NumberInputProps = {
  value?: number;
  defaultValue?: number;
  onChange?: (value: number) => void;
  minValue?: number;
  maxValue?: number;
  step?: number;
  label?: string;
  description?: string;
  errorMessage?: string;
  isDisabled?: boolean;
  className?: string;
  formatOptions?: Intl.NumberFormatOptions;
};

export function NumberInput({
  value,
  defaultValue,
  onChange,
  minValue,
  maxValue,
  step,
  label,
  description,
  errorMessage,
  isDisabled,
  className,
  formatOptions,
}: NumberInputProps) {
  const formatter = formatOptions ? new Intl.NumberFormat(undefined, formatOptions) : null;
  const displayValue = typeof value === "number" && formatter ? formatter.format(value) : value;

  return (
    <div className={cn("w-full max-w-72 space-y-2", className)}>
      {label ? (
        <label className="flex items-center gap-2 text-sm leading-none font-medium select-none">
          {label}
        </label>
      ) : null}
      <input
        className={cn(
          "selection:bg-primary selection:text-primary-foreground dark:bg-input/30 border-input focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40 aria-invalid:border-destructive h-9 w-full rounded-lg border bg-background px-3 py-1.5 text-left text-sm tabular-nums shadow-sm transition-[color,box-shadow] outline-none focus-visible:ring-[3px] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        )}
        aria-invalid={Boolean(errorMessage)}
        defaultValue={defaultValue}
        disabled={isDisabled}
        max={maxValue}
        min={minValue}
        onChange={(event) => onChange?.(event.currentTarget.valueAsNumber)}
        step={step}
        type="number"
        value={displayValue}
      />
      {description && !errorMessage ? (
        <p className="text-xs text-muted-foreground">
          {description}
        </p>
      ) : null}
      {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
    </div>
  );
}
