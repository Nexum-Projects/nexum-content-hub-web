"use client";

import { MinusIcon, PlusIcon } from "lucide-react";
import { Button, Group, Input, Label, NumberField, Text } from "react-aria-components";

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
  return (
    <NumberField
      className={cn("w-full max-w-72 space-y-2", className)}
      defaultValue={defaultValue}
      formatOptions={formatOptions}
      isDisabled={isDisabled}
      isInvalid={Boolean(errorMessage)}
      maxValue={maxValue}
      minValue={minValue}
      onChange={onChange}
      step={step}
      value={value}
    >
      {label ? (
        <Label className="flex items-center gap-2 text-sm leading-none font-medium select-none">
          {label}
        </Label>
      ) : null}
      <Group className="dark:bg-input/30 border-input data-focus-within:border-ring data-focus-within:ring-ring/50 data-focus-within:has-aria-invalid:ring-destructive/20 dark:data-focus-within:has-aria-invalid:ring-destructive/40 data-focus-within:has-aria-invalid:border-destructive relative inline-flex h-9 w-full min-w-0 items-center overflow-hidden rounded-lg border bg-background text-sm whitespace-nowrap shadow-sm transition-[color,box-shadow] outline-none data-disabled:pointer-events-none data-disabled:cursor-not-allowed data-disabled:opacity-50 data-focus-within:ring-[3px]">
        <Input className="selection:bg-primary selection:text-primary-foreground w-full min-w-0 grow px-3 py-1.5 text-left tabular-nums outline-none" />
        <div className="flex h-[calc(100%+2px)] flex-col">
          <Button
            slot="increment"
            className="border-input bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground -me-px flex h-1/2 w-6 flex-1 items-center justify-center border text-sm transition-[color,box-shadow] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            <PlusIcon className="size-3" />
            <span className="sr-only">Incrementar</span>
          </Button>
          <Button
            slot="decrement"
            className="border-input bg-background text-muted-foreground hover:bg-accent hover:text-accent-foreground -me-px -mt-px flex h-1/2 w-6 flex-1 items-center justify-center border text-sm transition-[color,box-shadow] disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50"
          >
            <MinusIcon className="size-3" />
            <span className="sr-only">Decrementar</span>
          </Button>
        </div>
      </Group>
      {description && !errorMessage ? (
        <Text className="text-xs text-muted-foreground" slot="description">
          {description}
        </Text>
      ) : null}
      {errorMessage ? <p className="text-sm text-destructive">{errorMessage}</p> : null}
    </NumberField>
  );
}
