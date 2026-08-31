import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowLeft, ChevronRight, Landmark, MapPin, Calendar, FileText, Image as ImageIcon } from "lucide-react";
import { getCases, subscribeToStore } from "@/data/appStore";
import { IconButton } from "@/components/m3";
import type { LegalCase } from "@/types";
import {
  STORED_STATUS_TO_FILTER,
  PRE_CNR_STAGES,
  StatusBadge,
  fmtDate,
  getJourney,
  getStageHistory,
} from "@/components/app/caseDocketShared";

export const Route = createFileRoute("/citizen/cases/$id")({
  component: CitizenCaseDetailPage,
});

function CitizenCaseDetailPage() {
  const { id } = Route.useParams();
  const [allCases, setAllCases] = useState<LegalCase[]>(getCases);

  useEffect(() => {
    const sync = () => setAllCases(getCases());
    sync();
    return subscribeToStore(sync);
  }, []);

  const c = allCases.find((x) => x.id === id);

  if (!c) {
    return (
      <div className="max-w-3xl space-y-4 py-16 text-center">
        <p className="text-sm font-bold text-foreground">Case not found</p>
        <p className="text-xs text-muted-foreground">
          This case may have been removed, or the link is incorrect.
        </p>
        <Link
          to="/citizen/my-cases"
          className="inline-block text-xs font-bold text-primary hover:underline"
        >
          Back to My Cases
        </Link>
      </div>
    );
  }

  const filterKey = STORED_STATUS_TO_FILTER[c.status] ?? c.status;
  const journey = getJourney(c);
  const showStageHistory = PRE_CNR_STAGES.includes(filterKey);

  return (
    <div className="max-w-4xl space-y-5">
      {/* Back + breadcrumb */}
      <div className="flex items-center gap-2.5">
        <Link to="/citizen/my-cases">
          <IconButton variant="outlined" ariaLabel="Back to My Cases">
            <ArrowLeft className="h-5 w-5" />
          </IconButton>
        </Link>
        <div className="flex min-w-0 items-center gap-1.5 text-xs text-muted-foreground">
          <Link
            to="/citizen/my-cases"
            className="shrink-0 font-semibold hover:text-foreground hover:underline"
          >
            My Cases
          </Link>
          <ChevronRight className="h-3 w-3 shrink-0" />
          <span className="max-w-[240px] truncate sm:max-w-md">{c.title}</span>
        </div>
      </div>

      {/* Case Identity */}
      <div className="rounded-2xl border border-border bg-card p-5 shadow-xs">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Party Names
            </span>
            <div className="mt-0.5 text-base font-semibold text-foreground">{c.title || "—"}</div>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Case No.
            </span>
            <div className="mt-0.5 font-mono text-sm font-medium text-foreground">
              {c.caseNumber || "—"}
            </div>
          </div>
          <div>
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              CNR No.
            </span>
            <div className="mt-0.5 font-mono text-sm font-medium text-foreground">
              {c.cnrNumber || "—"}
            </div>
          </div>
          <div className="sm:col-span-2">
            <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
              Case Status
            </span>
            <div className="mt-1">
              <StatusBadge status={c.status} />
            </div>
          </div>
        </div>
      </div>

      {/* Key Facts */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-xl border border-border bg-card p-3.5">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <Landmark className="h-3.5 w-3.5" /> Court
          </div>
          <div className="mt-1 text-xs font-semibold text-foreground">{c.courtName || "—"}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-3.5">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <MapPin className="h-3.5 w-3.5" /> City
          </div>
          <div className="mt-1 text-xs font-semibold text-foreground">{c.city || "—"}</div>
        </div>
        <div className="rounded-xl border border-border bg-card p-3.5">
          <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            <Calendar className="h-3.5 w-3.5" /> Filing Date
          </div>
          <div className="mt-1 text-xs font-semibold text-foreground">
            {c.filingDate ? fmtDate(c.filingDate) : "—"}
          </div>
        </div>
      </div>

      {c.description && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="mb-2 text-[11px] font-bold uppercase tracking-wider text-primary">
            Description
          </div>
          <p className="whitespace-pre-wrap text-xs leading-relaxed text-foreground">
            {c.description}
          </p>
        </div>
      )}

      {/* Stage History */}
      {showStageHistory && (
        <div>
          <div className="mb-3 text-[11px] font-bold uppercase tracking-wider text-primary">
            STAGE HISTORY
          </div>
          <div className="relative ml-3 space-y-3.5 border-l-2 border-border py-1 pl-6">
            {getStageHistory(c).map((stage) => (
              <div key={stage.key} className="relative">
                <span
                  className={`absolute -left-[29px] top-0.5 h-[14px] w-[14px] rounded-full border-2 ${
                    stage.at ? "border-primary bg-primary" : "border-muted-foreground/50 bg-card"
                  }`}
                />
                <div className="flex items-center justify-between gap-3">
                  <span
                    className={`text-xs font-semibold ${
                      stage.isCurrent
                        ? "text-primary"
                        : stage.at
                          ? "text-foreground"
                          : "text-muted-foreground"
                    }`}
                  >
                    {stage.label}
                    {stage.isCurrent && (
                      <span className="ml-2 rounded-md bg-primary/10 px-1.5 py-0.5 text-[9.5px] font-bold uppercase tracking-wider text-primary">
                        Current
                      </span>
                    )}
                  </span>
                  <span className="shrink-0 font-mono text-[11px] text-muted-foreground">
                    {stage.at ? `${fmtDate(stage.at)}${stage.time ? ", " + stage.time : ""}` : "—"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Case Roadmap */}
      <div>
        <div className="mb-3 text-[11px] font-bold uppercase tracking-wider text-primary">
          CASE ROADMAP
        </div>
        {journey.length === 0 ? (
          <div className="py-2 text-xs italic text-muted-foreground">No hearings logged yet.</div>
        ) : (
          <div className="relative ml-3 space-y-4 border-l-2 border-border py-1 pl-6">
            {[...journey].reverse().map((e) => (
              <div key={e.id} className="relative">
                <span className="absolute -left-[35px] top-3.5 h-[18px] w-[18px] rounded-full border-2 border-muted-foreground bg-card" />
                <div className="rounded-xl border border-border bg-card p-3.5 text-xs">
                  <div className="font-mono text-[12.5px] font-semibold text-foreground">
                    {fmtDate(e.date)}
                  </div>
                  {e.place && (
                    <div className="mt-1 font-semibold leading-snug text-foreground">{e.place}</div>
                  )}
                  <div className="mt-1 text-[12.5px] leading-relaxed text-muted-foreground">
                    {e.purpose}
                    {e.purpose && e.natureOfSuit ? " · " : ""}
                    {e.natureOfSuit}
                  </div>
                  {e.adv && <div className="mt-1 text-[12px] text-muted-foreground">Adv: {e.adv}</div>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Documents */}
      <div>
        <div className="mb-3 text-[11px] font-bold uppercase tracking-wider text-primary">
          Documents &amp; Images ({c.documents.length})
        </div>
        {c.documents.length === 0 ? (
          <p className="text-xs italic text-muted-foreground">No attachments uploaded yet.</p>
        ) : (
          <ul className="space-y-2">
            {c.documents.map((d) => {
              const isImage = d.fileMimeType?.startsWith("image/");
              return (
                <li
                  key={d.id}
                  className="flex items-center gap-2.5 rounded-xl border border-border bg-card p-3"
                >
                  <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
                    {isImage ? <ImageIcon className="h-4 w-4" /> : <FileText className="h-4 w-4" />}
                  </span>
                  <div className="min-w-0">
                    <div className="truncate text-xs font-semibold text-foreground" title={d.name}>
                      {d.name}
                    </div>
                    <div className="text-[10px] text-muted-foreground">
                      {d.size} · {d.uploadedAt}
                      {d.uploadedBy ? ` · added by ${d.uploadedBy}` : ""}
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
