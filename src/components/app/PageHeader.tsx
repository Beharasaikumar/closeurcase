import type { ReactNode } from "react";
import { ArrowLeft } from "lucide-react";
import { IconButton } from "@/components/m3";

export function PageHeader({
  title,
  description,
  actions,
  onBack,
  backLabel,
  actionsPosition = "inline",
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
  onBack?: () => void;
  backLabel?: string;
  /** "below" stacks actions on their own right-aligned row under the title
   * block instead of beside it, and tightens the header's padding — used by
   * the citizen dashboard. */
  actionsPosition?: "inline" | "below";
}) {
  const titleBlock = (
    <div>
      <div className="flex items-center gap-2">
        {onBack && (
          <IconButton variant="outlined" onClick={onBack} ariaLabel={backLabel || "Go back"}>
            <ArrowLeft className="h-4 w-4 sm:h-5 sm:w-5" />
          </IconButton>
        )}
        <h1 className="text-base sm:text-2xl font-bold tracking-tight text-foreground">{title}</h1>
      </div>
      {description && (
        <p className="hidden sm:block mt-0.5 text-xs sm:text-sm text-muted-foreground leading-snug">
          {description}
        </p>
      )}
    </div>
  );

  if (actionsPosition === "below") {
    return (
      <div className="space-y-1.5 border-b border-border pb-2 sm:pb-3.5">
        {titleBlock}
        {actions && <div className="flex items-center justify-end gap-2">{actions}</div>}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-start justify-between gap-2 border-b border-border pb-2 sm:pb-3.5">
      {titleBlock}
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
