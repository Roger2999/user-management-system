interface Props {
  label: string;
  name: string;
  defaultChecked?: boolean;
  onChange?: (checked: boolean) => void;
  disabled?: boolean;
}

export default function CheckboxField({
  label,
  name,
  defaultChecked,
  onChange,
  disabled,
}: Props) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-sm">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        onChange={(e) => onChange?.(e.target.checked)}
        disabled={disabled}
        className="accent-primary size-6"
      />
      {label}
    </label>
  );
}
