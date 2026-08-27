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
      <div className="flex items-center gap-3">
        {onBack && (
          <IconButton variant="outlined" onClick={onBack} ariaLabel={backLabel || "Go back"}>
            <ArrowLeft className="h-5 w-5" />
          </IconButton>
        )}
        <h1 className="text-2xl font-semibold text-foreground">{title}</h1>
      </div>
      {description && <p className="mt-1.5 text-sm text-muted-foreground">{description}</p>}
    </div>
  );

  if (actionsPosition === "below") {
    return (
      <div className="space-y-3 border-b border-border pb-4">
        {titleBlock}
        {actions && <div className="flex items-center justify-end gap-2">{actions}</div>}
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
      {titleBlock}
      {actions && <div className="flex items-center gap-2">{actions}</div>}
    </div>
  );
}
