"use client";
import { cn } from "@/lib/utils";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { useId, useState } from "react";
import { Eye, EyeClosed } from "lucide-react";
interface Props extends React.ComponentProps<"div"> {
  label?: string;
  name?: string;
  type?: React.ComponentProps<typeof Input>["type"];
  defaultValue?: string | number | readonly string[] | undefined;
  errors?: string[];
  placeholder?: string;
  autoComplete?: string;
  disabled?: boolean;
  required?: boolean;
}
export default function Field({
  label,
  name,
  type = "text",
  defaultValue,
  placeholder,
  autoComplete,
  disabled,
  required,
  className,
  errors,
  ...props
}: Props) {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const hasErrors = !!errors?.length;
  const handleShowPassword = () => setShowPassword((prev) => !prev);
  const inputId = useId();
  const errorsId = `${inputId}-errors`;
  return (
    <div className={cn("min-h-26 space-y-2", className)} {...props}>
      {label && <Label htmlFor={inputId}>{label}</Label>}
      <div className="relative">
        <Input
          defaultValue={defaultValue}
          placeholder={placeholder}
          autoComplete={autoComplete}
          disabled={disabled}
          required={required}
          id={inputId}
          name={name}
          aria-invalid={hasErrors}
          aria-describedby={hasErrors ? errorsId : undefined}
          type={isPassword && showPassword ? "text" : type}
          className={cn(isPassword && "pr-10")}
        />
        {isPassword && (
          <button
            type="button"
            onClick={handleShowPassword}
            className="absolute top-1 right-5 cursor-pointer"
            aria-label={
              showPassword ? "Ocultar contraseña" : "Mostrar contraseña"
            }
          >
            {!showPassword ? <Eye /> : <EyeClosed />}
          </button>
        )}
      </div>
      {hasErrors && (
        <ul id={errorsId}>
          {errors.map((e, index) => (
            <li className="text-destructive text-sm" key={index}>
              {e}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
