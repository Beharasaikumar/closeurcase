import { useRef, type ClipboardEventHandler, type KeyboardEventHandler } from "react";

/**
 * M3-styled one-time-passcode input. @material/web has no OTP/PIN primitive
 * (same category as Card/Badge/Skeleton — hand-built against M3 tokens
 * rather than wrapping a md-* element), and there's no third-party
 * dependency here either: unlike the shadcn `input-otp` package this
 * replaces, each digit box is a real, independently-focusable `<input>`
 * rather than one hidden input with N derived display boxes — so native
 * click-into-box-N, selection, and caret blink all come for free instead of
 * being reimplemented by hand.
 */
export function OtpInput({
  length = 4,
  value,
  onChange,
  disabled,
  error,
  autoFocus,
  className,
  ariaLabel,
  onKeyDown,
}: {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
  autoFocus?: boolean;
  className?: string;
  ariaLabel?: string;
  onKeyDown?: KeyboardEventHandler<HTMLInputElement>;
}) {
  const boxRefs = useRef<(HTMLInputElement | null)[]>([]);

  const setDigit = (index: number, digit: string) => {
    const digits = value.padEnd(length, " ").split("");
    digits[index] = digit;
    onChange(digits.join("").trimEnd());
  };

  const handleChange = (index: number, raw: string) => {
    const digit = raw.replace(/\D/g, "").slice(-1);
    setDigit(index, digit);
    if (digit && index < length - 1) boxRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !value[index] && index > 0) {
      e.preventDefault();
      boxRefs.current[index - 1]?.focus();
      setDigit(index - 1, "");
    } else if (e.key === "ArrowLeft" && index > 0) {
      e.preventDefault();
      boxRefs.current[index - 1]?.focus();
    } else if (e.key === "ArrowRight" && index < length - 1) {
      e.preventDefault();
      boxRefs.current[index + 1]?.focus();
    }
  };

  const handlePaste: ClipboardEventHandler<HTMLInputElement> = (e) => {
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "");
    if (!pasted) return;
    e.preventDefault();
    onChange(pasted.slice(0, length));
    const nextIndex = Math.min(pasted.length, length - 1);
    boxRefs.current[nextIndex]?.focus();
  };

  return (
    <div className={`flex gap-2 sm:gap-3 ${className ?? ""}`} role="group" aria-label={ariaLabel}>
      {Array.from({ length }).map((_, i) => (
        <input
          key={i}
          ref={(el) => {
            boxRefs.current[i] = el;
          }}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          autoComplete="one-time-code"
          maxLength={1}
          disabled={disabled}
          autoFocus={autoFocus && i === 0}
          value={value[i] ?? ""}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => {
            handleKeyDown(i, e);
            onKeyDown?.(e);
          }}
          onPaste={handlePaste}
          onFocus={(e) => e.target.select()}
          aria-label={`Digit ${i + 1} of ${length}`}
          className={`h-14 w-12 sm:h-16 sm:w-14 rounded-(--md-sys-shape-corner-small) border-2 bg-(--md-sys-color-surface) text-center text-xl font-semibold text-(--md-sys-color-on-surface) outline-none transition-colors disabled:opacity-40 ${
            error
              ? "border-(--md-sys-color-error)"
              : "border-(--md-sys-color-outline-variant) focus:border-(--md-sys-color-primary)"
          }`}
        />
      ))}
    </div>
  );
}
