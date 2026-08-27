import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/app/PageHeader";
import { StatusDot } from "@/components/app/StatusDot";
import { UserAvatar } from "@/components/app/UserAvatar";
import { getCases, subscribeToStore } from "@/data/appStore";
import type { CaseStatus, LegalCase } from "@/types";
import { Check, Clock, FileText, ChevronDown, Sparkles } from "lucide-react";

interface SearchParam {
  id?: string;
}

export const Route = createFileRoute("/citizen/track-case")({
  validateSearch: (s: Record<string, unknown>): SearchParam => ({
    id: typeof s.id === "string" ? s.id : undefined,
  }),
  component: TrackCase,
});

const STAGES: { status: CaseStatus; shortLabel: string; fullLabel: string; detail: string }[] = [
  {
    status: "Submitted",
    shortLabel: "Submitted",
    fullLabel: "Case Submitted",
    detail: "Case details and initial filing fee received.",
  },
  {
    status: "Assigned",
    shortLabel: "Assigned",
    fullLabel: "Lawyer Assigned",
    detail: "Legal counsel assigned to represent your case.",
  },
  {
    status: "Under Review",
    shortLabel: "Under Review",
    fullLabel: "Under Legal Review",
    detail: "Lawyer reviewing evidence, claims, and statutory acts.",
  },
  {
    status: "In Progress",
    shortLabel: "In Progress",
    fullLabel: "Proceedings In Progress",
    detail: "Active court filings, hearings, or arbitration ongoing.",
  },
  {
    status: "Awaiting Documents",
    shortLabel: "Awaiting Docs",
    fullLabel: "Awaiting Documents",
    detail: "Pending additional evidence, affidavits, or police reports.",
  },
  {
    status: "Resolved",
    shortLabel: "Resolved",
    fullLabel: "Case Resolved",
    detail: "Final verdict, decree, or settlement achieved.",
  },
  {
    status: "Closed",
    shortLabel: "Closed",
    fullLabel: "Matter Concluded",
    detail: "All legal proceedings officially closed.",
  },
];

export function TrackCase() {
  const { id } = Route.useSearch();
  const [allCases, setAllCases] = useState<LegalCase[]>(getCases);

  useEffect(() => {
    const sync = () => setAllCases(getCases());
    return subscribeToStore(sync);
  }, []);

  const [selected, setSelected] = useState<string>(id ?? allCases[0]?.id ?? "");
  const c = allCases.find((x) => x.id === selected) ?? allCases[0];

  if (!c) {
    return (
      <div className="space-y-4">
        <PageHeader title="Track Case" description="Monitor the real-time progress of your case." />
        <div className="rounded-xl border border-border/80 bg-surface p-8 text-center text-xs text-muted-foreground">
          No active cases found.
        </div>
      </div>
    );
  }

  const currentIdx = STAGES.findIndex((s) => s.status === c.status);
  const activeIdx = currentIdx >= 0 ? currentIdx : 0;
  const activeStageObj = STAGES[activeIdx];
  const activeEvent = c.timeline.find((t) => t.status === activeStageObj.status);

  return (
    <div className="max-w-5xl space-y-4">
      {/* Top Header & Selector Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border/80 bg-surface px-4 py-3 shadow-2xs">
        <div>
          <h1 className="text-base font-bold text-foreground tracking-tight">Track Case</h1>
          <p className="text-[11px] text-muted-foreground">
            Real-time horizontal progress tracker.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center gap-3 w-full sm:w-auto min-w-0">
          <div className="relative w-full sm:w-auto min-w-0">
            <select
              value={selected}
              onChange={(e) => setSelected(e.target.value)}
              className="appearance-none w-full sm:w-auto min-w-0 truncate rounded-lg border border-border bg-background pl-3 pr-8 py-1 text-xs font-bold text-foreground focus:border-primary focus:outline-none"
            >
              {allCases.map((x) => (
                <option key={x.id} value={x.id}>
                  {x.id} — {x.title}
                </option>
              ))}
            </select>
            <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          </div>
          <StatusDot status={c.status} />
        </div>
      </div>

      {/* Case Details Summary Panel */}
      <div className="rounded-xl border border-border/80 bg-surface p-4 shadow-2xs space-y-3">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-2.5">
          <div className="flex items-center gap-2">
            <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary tracking-wider">
              {c.id}
            </span>
            <h2 className="text-sm font-bold text-foreground">{c.title}</h2>
            <span className="text-xs text-muted-foreground">
              ({c.category} Law · {c.city})
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            Filed: <strong className="text-foreground">{c.createdAt}</strong>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 text-xs sm:grid-cols-4">
          <div className="rounded-lg bg-background p-2.5 border border-border/40">
            <span className="text-[10px] text-muted-foreground font-semibold block uppercase">
              Lawyer
            </span>
            {c.lawyerName ? (
              <div className="mt-1 flex items-center gap-1.5">
                <UserAvatar name={c.lawyerName} size="sm" />
                <span className="font-bold text-foreground truncate">{c.lawyerName}</span>
              </div>
            ) : (
              <span className="font-bold text-foreground mt-0.5 block truncate">
                Pending Assignment
              </span>
            )}
          </div>
          <div className="rounded-lg bg-background p-2.5 border border-border/40">
            <span className="text-[10px] text-muted-foreground font-semibold block uppercase">
              Current Stage
            </span>
            <span className="font-bold text-primary mt-0.5 block truncate">{c.status}</span>
          </div>
          <div className="rounded-lg bg-background p-2.5 border border-border/40">
            <span className="text-[10px] text-muted-foreground font-semibold block uppercase">
              Last Updated
            </span>
            <span className="font-bold text-foreground mt-0.5 block truncate">{c.updatedAt}</span>
          </div>
          <div className="rounded-lg bg-background p-2.5 border border-border/40">
            <span className="text-[10px] text-muted-foreground font-semibold block uppercase">
              Files Attached
            </span>
            <span className="font-bold text-foreground mt-0.5 block truncate">
              {c.documents.length} document(s)
            </span>
          </div>
        </div>
      </div>

      {/* ── Single-Screen Horizontal Progress Tracking Card ── */}
      <div className="rounded-2xl border border-border/80 bg-surface p-5 shadow-2xs space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" />
            <h3 className="text-xs font-bold uppercase tracking-wider text-foreground">
              Progress Timeline
            </h3>
          </div>
          <span className="rounded-md bg-primary/10 px-2.5 py-0.5 text-[10px] font-bold text-primary">
            Step {activeIdx + 1} of {STAGES.length}
          </span>
        </div>

        {/* Horizontal Progress Bar Row */}
        <div className="relative py-2 px-1">
          {/* Background Connecting Line */}
          <div className="absolute top-[21px] left-6 right-6 h-0.5 bg-border/70" />

          {/* Active Completed Line fill */}
          <div
            className="absolute top-[21px] left-6 h-0.5 bg-emerald-600 transition-all duration-300"
            style={{
              width: `${(activeIdx / (STAGES.length - 1)) * 100}%`,
              maxWidth: "calc(100% - 3rem)",
            }}
          />

          {/* Stepper Items Grid */}
          <div className="relative z-10 grid grid-cols-7 gap-1 text-center">
            {STAGES.map((st, idx) => {
              const isDone = idx < activeIdx;
              const isCurrent = idx === activeIdx;

              return (
                <div key={st.status} className="flex flex-col items-center group">
                  {/* Circle Node */}
                  <div
                    className={`flex h-7 w-7 items-center justify-center rounded-full transition-all shadow-2xs ${
                      isDone
                        ? "bg-emerald-600 text-white"
                        : isCurrent
                          ? "bg-primary text-primary-foreground ring-4 ring-primary/20 scale-110"
                          : "border-2 border-border bg-background text-muted-foreground"
                    }`}
                  >
                    {isDone ? (
                      <Check className="h-3.5 w-3.5 stroke-[3]" />
                    ) : isCurrent ? (
                      <Clock className="h-3.5 w-3.5 animate-spin" />
                    ) : (
                      <span className="text-[10px] font-semibold">{idx + 1}</span>
                    )}
                  </div>

                  {/* Stage Label Below */}
                  <span
                    className={`mt-2 text-[10px] font-bold leading-tight line-clamp-1 transition-colors ${
                      isCurrent
                        ? "text-primary font-extrabold"
                        : isDone
                          ? "text-foreground font-semibold"
                          : "text-muted-foreground"
                    }`}
                  >
                    {st.shortLabel}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Active Stage Details Banner */}
        <div className="rounded-xl border border-primary/25 bg-primary/5 p-3.5 text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="space-y-0.5">
            <div className="flex items-center gap-2">
              <span className="font-bold text-foreground">{activeStageObj.fullLabel}</span>
              <span className="rounded bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary">
                Active Stage
              </span>
            </div>
            <p className="text-[11px] text-muted-foreground">{activeStageObj.detail}</p>
            {activeEvent?.note && (
              <div className="mt-1 flex items-center gap-1.5 text-[11px] font-semibold text-foreground">
                <FileText className="h-3 w-3 text-primary shrink-0" />
                <span>Note: {activeEvent.note}</span>
              </div>
            )}
          </div>

          <div className="shrink-0 text-left sm:text-right text-[11px] text-muted-foreground">
            <span>Timestamp:</span>
            <div className="font-semibold text-foreground">{activeEvent?.at ?? c.createdAt}</div>
          </div>
        </div>
      </div>
    </div>
  );
}
