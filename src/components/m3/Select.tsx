import { MdOutlinedSelectEl, MdSelectOptionEl } from "./elements";

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export function Select({
  label,
  value,
  onChange,
  options,
  disabled,
  required,
  error,
  errorText,
  supportingText,
  className,
}: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  options: SelectOption[];
  disabled?: boolean;
  required?: boolean;
  error?: boolean;
  errorText?: string;
  supportingText?: string;
  className?: string;
}) {
  return (
    <MdOutlinedSelectEl
      label={label}
      value={value}
      disabled={disabled}
      required={required}
      error={error}
      errorText={errorText}
      supportingText={supportingText}
      className={className}
      onChange={(e) => onChange((e.target as unknown as { value: string }).value)}
    >
      {options.map((opt) => (
        <MdSelectOptionEl key={opt.value} value={opt.value} disabled={opt.disabled}>
          <div slot="headline">{opt.label}</div>
        </MdSelectOptionEl>
      ))}
    </MdOutlinedSelectEl>
  );
}
