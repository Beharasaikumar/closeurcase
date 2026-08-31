import { Link } from "@tanstack/react-router";
import { CalendarClock, Landmark, User, Hash, Download, ChevronRight } from "lucide-react";
import type { LegalCase } from "@/types";
import { StatusDot } from "@/components/app/StatusDot";
import { ChatButton } from "@/components/app/CaseChat";

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
  const hearing = formatDate(nextHearingDate(caseItem));
  const caseRef = caseItem.caseDetails.caseNumber;
  const isImported = caseItem.source === "ecourt";

  return (
    <div className="rounded-xl border border-border bg-surface p-4 shadow-2xs transition-all hover:border-primary/40 hover:shadow-sm sm:p-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
        <div className="min-w-0 space-y-1.5">
          <h3 className="text-sm font-bold text-foreground leading-snug sm:text-[15px]">
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
        <div className="mt-3 flex items-center justify-between border-t border-border/60 pt-3 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1">
            <Download className="h-3 w-3" />
            Imported from eCourts
          </span>
          <Link
            to="/lawyer/cases/$id"
            params={{ id: caseItem.id }}
            aria-label={`View details for case ${caseItem.title}`}
            className="inline-flex items-center gap-0.5 font-semibold text-primary hover:underline"
          >
            View Details
            <ChevronRight className="h-3 w-3" />
          </Link>
        </div>
      ) : (
        <div className="mt-3 flex items-center justify-end border-t border-border/60 pt-3">
          <ChatButton caseItem={caseItem} role="lawyer" />
        </div>
      )}
    </div>
  );
}
