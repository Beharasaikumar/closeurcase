import { useNavigate } from "@tanstack/react-router";
import { CalendarClock, Landmark, User, Hash, Download, Eye } from "lucide-react";
import type { LegalCase } from "@/types";
import { StatusDot } from "@/components/app/StatusDot";
import { ChatButton } from "@/components/app/CaseChat";
import { IconButton } from "@/components/m3";

function nextHearingDate(caseItem: LegalCase): string | undefined {
  const today = new Date().toISOString().slice(0, 10);
  const upcoming = caseItem.caseDetails.historyOfCaseHearings
    .filter((h) => h.hearingDate && h.hearingDate >= today)
    .sort((a, b) => (a.hearingDate ?? "").localeCompare(b.hearingDate ?? ""));
  return upcoming[0]?.hearingDate;
}

function formatDate(iso?: string): string | undefined {
  if (!iso) return undefined;
  return new Date(iso).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function CaseListCard({ caseItem }: { caseItem: LegalCase }) {
  const navigate = useNavigate();
  const hearing = formatDate(nextHearingDate(caseItem));
  const caseRef = caseItem.caseDetails.caseNumber;
  const isImported = caseItem.source === "ecourt";

  return (
    <div className="flex h-full min-h-56 flex-col rounded-xl border border-border bg-surface p-3.5 shadow-2xs transition-all hover:border-primary/40 hover:shadow-sm sm:p-4">
      <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0 space-y-1">
          <h3 className="line-clamp-2 text-sm font-bold text-foreground leading-snug sm:text-[15px]">
            {caseItem.title}
          </h3>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
            <span className="font-mono font-semibold text-primary">{caseItem.id}</span>
            {caseRef && (
              <>
                <span aria-hidden>•</span>
                <span className="font-mono font-semibold text-foreground/80">{caseRef}</span>
              </>
            )}
            {caseItem.caseDetails.courtName && (
              <>
                <span aria-hidden>•</span>
                <span className="inline-flex items-center gap-1">
                  <Landmark className="h-3 w-3" />
                  {caseItem.caseDetails.courtName}
                </span>
              </>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted-foreground">
            <span className="inline-flex items-center gap-1">
              <User className="h-3 w-3" />
              Client: {caseItem.citizenName}
            </span>
            {caseItem.caseDetails.cnr && (
              <span className="inline-flex items-center gap-1">
                <Hash className="h-3 w-3" />
                CNR: <span className="font-mono">{caseItem.caseDetails.cnr}</span>
              </span>
            )}
          </div>
        </div>

        <div className="flex shrink-0 flex-row items-center justify-between gap-3 sm:flex-col sm:items-end sm:justify-start">
          <StatusDot status={caseItem.status} />
          {hearing && (
            <span className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground">
              <CalendarClock className="h-3.5 w-3.5 text-primary" />
              Next Hearing: {hearing}
            </span>
          )}
        </div>
      </div>

      {isImported ? (
        <div className="mt-auto flex items-center justify-between gap-1.5 border-t border-border/60 pt-2">
          <span className="inline-flex min-w-0 items-center gap-1 text-[11px] text-muted-foreground">
            <Download className="h-3 w-3 shrink-0" />
            <span className="truncate">Imported from eCourts</span>
          </span>
          <IconButton
            variant="tonal"
            title="View case details"
            ariaLabel={`View details for case ${caseItem.title}`}
            onClick={() => navigate({ to: "/lawyer/cases/$id", params: { id: caseItem.id } })}
          >
            <Eye className="h-4 w-4" />
          </IconButton>
        </div>
      ) : (
        <div className="mt-auto flex items-center justify-end gap-1.5 border-t border-border/60 pt-2">
          <ChatButton caseItem={caseItem} role="lawyer" />
        </div>
      )}
    </div>
  );
}
