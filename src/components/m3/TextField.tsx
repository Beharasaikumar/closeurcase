import type { ReactNode, KeyboardEventHandler } from "react";
import { MdOutlinedTextFieldEl } from "./elements";

export type TextFieldType =
  "email" | "number" | "password" | "search" | "tel" | "text" | "url" | "textarea";

export function TextField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  disabled,
  required,
  error,
  errorText,
  supportingText,
  rows,
  maxLength,
  name,
  leadingIcon,
  trailingIcon,
  className,
  autoFocus,
  onKeyDown,
}: {
  label?: string;
  value: string;
  onChange: (value: string) => void;
  type?: TextFieldType;
  placeholder?: string;
  disabled?: boolean;
  required?: boolean;
  error?: boolean;
  errorText?: string;
  supportingText?: string;
  rows?: number;
  maxLength?: number;
  name?: string;
  leadingIcon?: ReactNode;
  trailingIcon?: ReactNode;
  className?: string;
  autoFocus?: boolean;
  onKeyDown?: KeyboardEventHandler<HTMLElement>;
}) {
  return (
    <MdOutlinedTextFieldEl
      label={label}
      value={value}
      type={type}
      placeholder={placeholder}
      disabled={disabled}
      required={required}
      error={error}
      errorText={errorText}
      supportingText={supportingText}
      rows={rows}
      maxLength={maxLength}
      name={name}
      className={className}
      autoFocus={autoFocus}
      onInput={(e) => onChange((e.target as HTMLInputElement).value)}
      onKeyDown={onKeyDown}
    >
      {leadingIcon && <span slot="leading-icon">{leadingIcon}</span>}
      {trailingIcon && <span slot="trailing-icon">{trailingIcon}</span>}
    </MdOutlinedTextFieldEl>
  );
}
