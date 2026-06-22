interface Props {
  label: string;
  name: string;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
}

export default function CheckboxField({
  label,
  name,
  defaultChecked,
  onChange,
}: Props) {
  return (
    <label className="flex items-center gap-2 cursor-pointer text-sm">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        onChange={(e) => onChange?.(e.target.checked)}
        className="size-4 accent-primary"
      />
      {label}
    </label>
  );
}
