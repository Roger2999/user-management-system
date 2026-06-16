import { cn } from "@/lib/utils";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
interface Props extends React.ComponentProps<"div"> {
  label?: string;
  name?: string;
  type?: string;
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
    <div className={cn("space-y-2 min-h-21", className)} {...props}>
      <Label htmlFor={name}>{label}</Label>
      <Input
        defaultValue={defaultValue}
        id={name}
        name={name}
        type={type}
        className={cn(errors && "border-red-500")}
      />
      <ul>
        {errors?.map((e, index) => (
          <li className="text-sm text-red-500" key={index}>
            {e}
          </li>
        ))}
      </ul>
    </div>
  );
}
