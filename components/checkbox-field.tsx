"use client";

import { useId } from "react";

interface Props {
  label: string;
  name: string;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
  errors?: string[];
}

export default function CheckboxField({
  label,
  name,
  defaultChecked,
  onChange,
  disabled,
  errors,
}: Props) {
  const inputId = useId();
  const errorsId = `${inputId}-errors`;
  const hasErrors = !!errors?.length;

  return (
    <div>
      <label className="flex cursor-pointer items-center gap-2">
        <input
          type="checkbox"
          id={inputId}
          name={name}
          defaultChecked={defaultChecked}
          onChange={(e) => onChange?.(e.target.checked)}
          disabled={disabled}
          aria-invalid={hasErrors}
          aria-describedby={hasErrors ? errorsId : undefined}
          className="accent-primary size-6"
        />
        {label}
      </label>
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