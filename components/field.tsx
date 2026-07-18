import { cn } from "@/lib/utils";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
interface Props extends React.ComponentProps<"div"> {
  label?: string;
  name?: string;
  type?:
    | "number"
    | "button"
    | "search"
    | "time"
    | "image"
    | "text"
    | "hidden"
    | "color"
    | (string & {})
    | "checkbox"
    | "radio"
    | "tel"
    | "url"
    | "email"
    | "date"
    | "datetime-local"
    | "file"
    | "month"
    | "password"
    | "range"
    | "reset"
    | "submit"
    | "week";
  defaultValue?: string | number | readonly string[] | undefined;
  errors?: string[];
}
export default function Field({
  label,
  name,
  type = "text",
  defaultValue,
  className,
  errors,
  ...props
}: Props) {
  return (
    <div className={cn("min-h-21 space-y-2", className)} {...props}>
      <Label htmlFor={name}>{label}</Label>
      <Input
        defaultValue={defaultValue}
        id={name}
        name={name}
        type={type}
        className={cn(errors && "border-destructive")}
      />
      {errors && (
        <ul>
          {errors?.map((e, index) => (
            <li className="text-destructive text-sm" key={index}>
              {e}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
