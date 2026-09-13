"use client";

import { useId } from "react";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  name: string;
  options: readonly { readonly value: string; readonly label: string }[];
  defaultValue?: string;
  errors?: string[];
  onChange?: (value: string) => void;
  disabledValues?: string[];
}

export default function SelectField({
  label,
  name,
  options,
  defaultValue,
  errors,
  onChange,
  disabledValues,
}: Props) {
  const inputId = useId();
  const errorsId = `${inputId}-errors`;
  const hasErrors = !!errors?.length;

  return (
    <div className="min-h-21 space-y-2">
      <Label htmlFor={inputId}>{label}</Label>
      <select
        id={inputId}
        name={name}
        defaultValue={defaultValue}
        onChange={(e) => onChange?.(e.target.value)}
        aria-invalid={hasErrors}
        aria-describedby={hasErrors ? errorsId : undefined}
        className={cn(
          "border-input focus-visible:border-ring focus-visible:ring-ring/50 dark:bg-input/30 h-8 w-full min-w-0 rounded-lg border bg-transparent px-2.5 py-1 text-base transition-colors outline-none focus-visible:ring-3 disabled:pointer-events-none disabled:cursor-not-allowed md:text-sm",
          errors && "border-destructive",
        )}
      >
        <option value="">Seleccionar...</option>
        {options.map((opt) => (
          <option
            key={opt.value}
            value={opt.value}
            disabled={disabledValues?.includes(opt.value)}
          >
            {opt.label}
          </option>
        ))}
      </select>
      {hasErrors && (
        <ul id={errorsId}>
          {errors.map((e, i) => (
            <li className="text-destructive text-sm" key={i}>
              {e}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}