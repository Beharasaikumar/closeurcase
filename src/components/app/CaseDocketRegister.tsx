import { useState, useEffect, useMemo } from "react";
import { Search, ChevronDown, ChevronUp, Check, X, Bell, User, Landmark, Calendar, FileText } from "lucide-react";
import { ChipSet, FilterChip, TextField, Button, IconButton } from "@/components/m3";
import { FilterPanelButton, type FilterSection } from "@/components/app/FilterPanelButton";
import { ExpandableFilterChips } from "@/components/app/ExpandableFilterChips";
import { getCases, subscribeToStore, updateCaseStatus } from "@/data/appStore";
import type { LegalCase } from "@/types";
import { CasesTable, caseTypeOf } from "@/components/app/CasesTable";
import {
  STATUS_LIST,
  STATUS_META,
  STORED_STATUS_TO_FILTER,
  getNextEntry,
  nextHearingSortKey,
  fmtDate,
  todayISO,
} from "@/components/app/caseDocketShared";

function countBy<T extends string>(rows: LegalCase[], pick: (c: LegalCase) => T) {
  const counts = new Map<T, number>();
  rows.forEach((r) => {
    const v = pick(r);
    counts.set(v, (counts.get(v) ?? 0) + 1);
  });
  return counts;
}

export {
  STATUS_META,
  STATUS_LIST,
  STORED_STATUS_TO_FILTER,
  COURTS_DATA,
  COURTS_FLAT,
  fmtDate,
  todayISO,
  getCourtHistory,
  getNextEntry,
  StatusBadge,
  type StatusMetaItem,
  type CourtHistoryRow,
} from "@/components/app/caseDocketShared";

const NATIVE_DATE_INPUT_CLS =
  "h-9 rounded-lg border border-border bg-card px-2.5 text-xs text-foreground outline-hidden focus:border-primary focus:ring-1 focus:ring-primary";

export function CaseDocketRegister({
  role,
  upcomingOnly,
}: {
  role: "lawyer" | "citizen";
  /** Pre-filters to hearings from today onward — used by the dashboard's "All Upcoming" link. */
  upcomingOnly?: boolean;
}) {
  const [cases, setCases] = useState<LegalCase[]>([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [hearingFrom, setHearingFrom] = useState(upcomingOnly ? todayISO() : "");
  const [hearingTo, setHearingTo] = useState("");
  const [clientFilter, setClientFilter] = useState("All");
  // Universal filter panel (lawyer only) — Case Type + Case Status, matching
  // the admin Users page's multi-select-with-counts filter pattern.
  const [panelFilters, setPanelFilters] = useState<Record<string, string[]>>({});

  const isLawyer = role === "lawyer";

  useEffect(() => {
    const sync = () => {
      setCases(getCases());
    };
    sync();
    return subscribeToStore(sync);
  }, []);

  const clientOptions = useMemo(
    () => Array.from(new Set(cases.map((c) => c.citizenName).filter(Boolean))).sort(),
    [cases],
  );

  const filteredCases = useMemo(() => {
    const filtered = cases.filter((c) => {
      // Map stored CaseStatus value → display filter key, then compare
      const filterKey = STORED_STATUS_TO_FILTER[c.status] ?? c.status;

      if (isLawyer) {
        const statusSelected = panelFilters.status ?? [];
        if (statusSelected.length > 0 && !statusSelected.includes(filterKey)) return false;

        const typeSelected = panelFilters.caseType ?? [];
        if (typeSelected.length > 0 && !typeSelected.includes(caseTypeOf(c))) return false;

        if (clientFilter !== "All" && c.citizenName !== clientFilter) return false;
      } else {
        const matchFilter = activeFilter === "all" || filterKey === activeFilter;
        if (!matchFilter) return false;
      }

      if (searchTerm) {
        const hay =
          `${c.title} ${c.caseDetails.caseNumber ?? ""} ${c.caseDetails.cnr ?? ""}`.toLowerCase();
        if (!hay.includes(searchTerm.toLowerCase())) return false;
      }

      if (hearingFrom || hearingTo) {
        const entry = getNextEntry(c);
        const nextDate = entry?.hearingDate ?? entry?.businessOnDate;
        if (!nextDate) return false;
        if (hearingFrom && nextDate < hearingFrom) return false;
        if (hearingTo && nextDate > hearingTo) return false;
      }

      return true;
    });

    return filtered.sort((a, b) => {
      // Lawyer view: cases still awaiting Approve/Reject float to the top,
      // ahead of everything else — then hearing date breaks ties within each group.
      if (isLawyer) {
        const aPending = a.status === "Submitted" ? 0 : 1;
        const bPending = b.status === "Submitted" ? 0 : 1;
        if (aPending !== bPending) return aPending - bPending;
      }
      return nextHearingSortKey(a).localeCompare(nextHearingSortKey(b));
    });
  }, [
    cases,
    activeFilter,
    searchTerm,
    hearingFrom,
    hearingTo,
    panelFilters,
    clientFilter,
    isLawyer,
  ]);

  const caseTypeCounts = countBy(cases, caseTypeOf);
  const statusCounts = countBy(cases, (c) => STORED_STATUS_TO_FILTER[c.status] ?? c.status);

  const filterSections: FilterSection[] = [
    {
      key: "caseType",
      label: "Case Type",
      options: (["New", "Existing"] as const).map((t) => ({
        value: t,
        label: t,
        count: caseTypeCounts.get(t) ?? 0,
      })),
    },
    {
      key: "status",
      label: "Case Status",
      options: STATUS_LIST.map((s) => ({
        value: s,
        label: STATUS_META[s].label,
        count: statusCounts.get(s) ?? 0,
      })),
    },
  ];

  // Split into pending requests vs active cases
  const pendingRequests = filteredCases.filter((c) => c.status === "Submitted");
  const activeCases = filteredCases.filter((c) => c.status !== "Submitted");

  function handleApprove(c: LegalCase) {
    updateCaseStatus(c.id, "Assigned", "Lawyer approved and accepted the case");
  }

  function handleReject(c: LegalCase) {
    if (confirm(`Reject case ${c.id} (${c.title})? The citizen will be notified.`)) {
      updateCaseStatus(c.id, "Rejected", "Lawyer declined to take up the case");
    }
  }

  return (
    <div className="mx-auto max-w-[1180px] space-y-6 pb-20 pt-2">
      {/* Top App Bar */}
      {/* <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-foreground">
            Case Register
          </h1>
          <div className="mt-0.5 text-xs text-muted-foreground">
            {cases.length} case{cases.length !== 1 ? "s" : ""} on record
          </div>
        </div>
      </div> */}

      {/* Toolbar: Search + Hearing Date Range + Filter Chips */}
      <div className="space-y-3">
        <div className="flex flex-col justify-between gap-3 sm:flex-row sm:flex-wrap sm:items-end">
          <div className="flex w-full items-center gap-2 sm:w-auto">
            <TextField
              value={searchTerm}
              onChange={setSearchTerm}
              placeholder="Search by party name, case no. or CNR…"
              leadingIcon={<Search className="h-4 w-4 text-muted-foreground" />}
              className="min-w-0 flex-1 sm:w-80"
            />
            {isLawyer && (
              <FilterPanelButton
                sections={filterSections}
                selected={panelFilters}
                onChange={setPanelFilters}
              />
            )}
          </div>

          <div className="flex w-full flex-wrap items-end gap-2 sm:w-auto">
            <label className="flex items-center gap-1">
              <span className="text-[11px] font-semibold text-muted-foreground">Hearing</span>
              <input
                type="date"
                value={hearingFrom}
                onChange={(e) => setHearingFrom(e.target.value)}
                className={NATIVE_DATE_INPUT_CLS}
              />
            </label>
            <label className="flex items-center gap-1">
              <span className="text-[11px] font-semibold text-muted-foreground">To</span>
              <input
                type="date"
                value={hearingTo}
                onChange={(e) => setHearingTo(e.target.value)}
                className={NATIVE_DATE_INPUT_CLS}
              />
            </label>
          </div>
        </div>

        {isLawyer && clientOptions.length > 0 && (
          <ExpandableFilterChips
            label="Client Name"
            options={["All", ...clientOptions]}
            selected={clientFilter}
            onSelect={setClientFilter}
          />
        )}

        {!isLawyer && (
          <div className="flex flex-row items-center gap-1">
            <ChipSet className="flex items-center gap-1">
              <FilterChip
                label="All"
                selected={activeFilter === "all"}
                onClick={() => setActiveFilter("all")}
              />
              {STATUS_LIST.map((s) => {
                const meta = STATUS_META[s];
                return (
                  <FilterChip
                    key={s}
                    label={meta.label}
                    selected={activeFilter === s}
                    onClick={() => setActiveFilter(s)}
                  />
                );
              })}
            </ChipSet>
          </div>
        )}
      </div>

      {/* ── Pending Requests Inbox ──────────────────────────────────────────── */}
      {isLawyer && pendingRequests.length > 0 && (
        <PendingRequestsInbox
          cases={pendingRequests}
          onApprove={handleApprove}
          onReject={handleReject}
        />
      )}

      <CasesTable cases={activeCases} role={role} />
    </div>
  );
}

// ── Pending Requests Inbox Component ───────────────────────────────────────

function PendingRequestsInbox({
  cases,
  onApprove,
  onReject,
}: {
  cases: LegalCase[];
  onApprove: (c: LegalCase) => void;
  onReject: (c: LegalCase) => void;
}) {
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div
      className="overflow-hidden rounded-2xl shadow-sm"
      style={{
        borderWidth: "1.5px",
        borderStyle: "solid",
        borderColor: "color-mix(in srgb, var(--md-extended-color-warning) 45%, transparent)",
        backgroundColor: "color-mix(in srgb, var(--md-extended-color-warning) 5%, var(--md-sys-color-surface))",
      }}
    >
      {/* Header */}
      <button
        type="button"
        onClick={() => setCollapsed((p) => !p)}
        className="flex w-full cursor-pointer items-center justify-between gap-3 px-4 py-3 sm:px-5 sm:py-3.5 transition-colors hover:bg-black/5"
      >
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full"
            style={{ backgroundColor: "color-mix(in srgb, var(--md-extended-color-warning) 18%, transparent)" }}
          >
            <Bell className="h-3.5 w-3.5" style={{ color: "var(--md-extended-color-warning)" }} />
          </div>
          <div className="text-left">
            <span className="text-sm font-bold text-foreground">
              Pending Requests
            </span>
            <span
              className="ml-2 inline-flex items-center justify-center rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white"
              style={{ backgroundColor: "var(--md-extended-color-warning)" }}
            >
              {cases.length}
            </span>
          </div>
          <span className="hidden sm:inline text-xs text-muted-foreground">
            — Awaiting your Accept or Decline
          </span>
        </div>
        {collapsed ? (
          <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" />
        ) : (
          <ChevronUp className="h-4 w-4 shrink-0 text-muted-foreground" />
        )}
      </button>

      {/* Cards */}
      {!collapsed && (
        <div className="border-t border-dashed px-3 pt-3 pb-4 sm:px-5 sm:pb-5" style={{ borderColor: "color-mix(in srgb, var(--md-extended-color-warning) 35%, transparent)" }}>
          <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
            {cases.map((c) => (
              <PendingRequestCard key={c.id} c={c} onApprove={onApprove} onReject={onReject} />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function PendingRequestCard({
  c,
  onApprove,
  onReject,
}: {
  c: LegalCase;
  onApprove: (c: LegalCase) => void;
  onReject: (c: LegalCase) => void;
}) {
  const entry = getNextEntry(c);

  return (
    <div
      className="flex flex-col gap-3 rounded-xl border bg-white p-3.5 shadow-xs sm:p-4"
      style={{
        borderColor: "color-mix(in srgb, var(--md-extended-color-warning) 30%, transparent)",
      }}
    >
      {/* Case Title + ID */}
      <div className="min-w-0 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h3 className="line-clamp-2 text-sm font-bold text-foreground leading-snug">
            {c.title || "Untitled Matter"}
          </h3>
          <span
            className="shrink-0 inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold"
            style={{
              backgroundColor: "color-mix(in srgb, var(--md-extended-color-warning) 15%, transparent)",
              color: "var(--md-extended-color-warning)",
            }}
          >
            New Request
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[11px] text-muted-foreground">
          <span className="font-mono font-semibold text-primary">{c.id}</span>
          {c.caseDetails.caseNumber && (
            <>
              <span aria-hidden>•</span>
              <span className="font-mono font-semibold text-foreground/80">
                CASE NO - {c.caseDetails.caseNumber}
              </span>
            </>
          )}
        </div>
      </div>

      {/* Meta info row */}
      <div className="flex flex-wrap gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <User className="h-3 w-3 shrink-0" />
          {c.citizenName}
        </span>
        {c.caseDetails.courtName && (
          <span className="inline-flex items-center gap-1">
            <Landmark className="h-3 w-3 shrink-0" />
            <span className="line-clamp-1">{c.caseDetails.courtName}</span>
          </span>
        )}
        {c.category && (
          <span className="inline-flex items-center gap-1">
            <FileText className="h-3 w-3 shrink-0" />
            {c.category}
          </span>
        )}
        {entry && (
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3 w-3 shrink-0" />
            Next hearing: {fmtDate(entry.hearingDate ?? entry.businessOnDate)}
          </span>
        )}
      </div>

      {/* Accept / Decline buttons */}
      <div className="mt-auto flex items-center justify-end gap-2 border-t pt-2.5" style={{ borderColor: "color-mix(in srgb, var(--md-extended-color-warning) 25%, transparent)" }}>
        <span className="mr-auto text-[11px] text-muted-foreground">Action required</span>
        <Button
          variant="outlined"
          icon={<X className="h-3.5 w-3.5" />}
          onClick={() => onReject(c)}
          className="!text-[var(--md-sys-color-error)] !border-[var(--md-sys-color-error)]/40 hover:!bg-[var(--md-sys-color-error)]/8 !h-8 !text-xs"
        >
          Decline
        </Button>
        <Button
          icon={<Check className="h-3.5 w-3.5" />}
          onClick={() => onApprove(c)}
          className="!bg-[var(--md-extended-color-success)] !h-8 !text-xs"
        >
          Accept
        </Button>
      </div>
    </div>
  );
}
