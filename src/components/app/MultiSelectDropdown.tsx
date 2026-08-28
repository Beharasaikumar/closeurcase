import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, X } from "lucide-react";

interface MultiSelectDropdownProps {
  label: string;
  placeholder?: string;
  options: string[];
  selected: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
  emptyMessage?: string;
}

/** Checkbox-style multi-select dropdown — the app has no existing multi-select
 * primitive (only single `<select>`s and free-text "add a tag" fields), so
 * this fills that gap. Click the trigger to open a checkbox list; selections
 * also render as removable chips underneath, matching the TagListField chip
 * style already used elsewhere on this form. */
export function MultiSelectDropdown({
  label,
  placeholder = "Select…",
  options,
  selected,
  onChange,
  disabled = false,
  emptyMessage = "Nothing to select yet.",
}: MultiSelectDropdownProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("mousedown", onClickOutside);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  function toggle(option: string) {
    onChange(
      selected.includes(option) ? selected.filter((v) => v !== option) : [...selected, option],
    );
  }

  const summary =
    selected.length === 0
      ? placeholder
      : selected.length <= 2
        ? selected.join(", ")
        : `${selected.length} selected`;

  return (
    <div ref={rootRef} className="relative">
      <span className="mb-1 block text-xs font-semibold text-foreground">{label}</span>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((v) => !v)}
        className={`flex w-full items-center justify-between gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-left text-xs focus:border-primary focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 ${
          selected.length === 0 ? "text-muted-foreground" : "text-foreground"
        }`}
      >
        <span className="truncate">{summary}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 shrink-0 transition-transform duration-150 ${
            open ? "rotate-180" : ""
          }`}
        />
      </button>

      {open && !disabled && (
        <div className="absolute left-0 top-full z-30 mt-1 max-h-64 w-full min-w-56 overflow-y-auto rounded-lg border border-border bg-white p-1.5 shadow-lg">
          {options.length === 0 ? (
            <p className="px-2.5 py-2 text-[11px] text-muted-foreground">{emptyMessage}</p>
          ) : (
            options.map((option) => {
              const isSelected = selected.includes(option);
              return (
                <button
                  key={option}
                  type="button"
                  onClick={() => toggle(option)}
                  className="flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-xs text-foreground hover:bg-muted"
                >
                  <span
                    className={`flex h-4 w-4 shrink-0 items-center justify-center rounded border ${
                      isSelected ? "border-primary bg-primary text-white" : "border-border"
                    }`}
                  >
                    {isSelected && <Check className="h-3 w-3" />}
                  </span>
                  <span className="truncate">{option}</span>
                </button>
              );
            })
          )}
        </div>
      )}

      {selected.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {selected.map((v) => (
            <span
              key={v}
              className="inline-flex items-center gap-1 rounded-full border border-border bg-muted px-2.5 py-1 text-[11px] font-medium text-foreground"
            >
              {v}
              <button
                type="button"
                onClick={() => toggle(v)}
                className="text-muted-foreground hover:text-destructive"
                aria-label={`Remove ${v}`}
              >
                <X className="h-3 w-3" />
              </button>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}
