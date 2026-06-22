import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";

interface Props {
  label: string;
  name: string;
  options: readonly { readonly value: string; readonly label: string }[];
  defaultValue?: string;
  errors?: string[];
  onChange?: (value: string) => void;
}

export default function SelectField({
  label,
  name,
  options,
  defaultValue,
  errors,
  onChange,
}: Props) {
  return (
    <div className="space-y-2 min-h-21">
      <Label htmlFor={name}>{label}</Label>
      <select
        id={name}
        name={name}
        defaultValue={defaultValue}
        onChange={(e) => onChange?.(e.target.value)}
        className={cn(
          "h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed md:text-sm dark:bg-input/30",
          errors && "border-red-500",
        )}
      >
        <option value="">Seleccionar...</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      <ul>
        {errors?.map((e, i) => (
          <li className="text-sm text-red-500" key={i}>
            {e}
          </li>
        ))}
      </ul>
    </div>
  );
}
