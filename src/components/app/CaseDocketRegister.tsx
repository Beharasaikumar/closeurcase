import { useState, useEffect, useMemo } from "react";
import { Search } from "lucide-react";
import { ChipSet, FilterChip, TextField } from "@/components/m3";
import { FilterPanelButton, type FilterSection } from "@/components/app/FilterPanelButton";
import { ExpandableFilterChips } from "@/components/app/ExpandableFilterChips";
import { getCases, subscribeToStore } from "@/data/appStore";
import type { LegalCase } from "@/types";
import { CasesTable, caseTypeOf } from "@/components/app/CasesTable";
import {
  STATUS_LIST,
  STATUS_META,
  STORED_STATUS_TO_FILTER,
  getNextEntry,
  nextHearingSortKey,
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
  getJourney,
  getNextEntry,
  StatusBadge,
  type StatusMetaItem,
  type DocketHearing,
} from "@/components/app/caseDocketShared";

const NATIVE_DATE_INPUT_CLS =
  "h-9 rounded-lg border border-border bg-card px-2.5 text-xs text-foreground outline-hidden focus:border-primary focus:ring-1 focus:ring-primary";

export function CaseDocketRegister({ role }: { role: "lawyer" | "citizen" }) {
  const [cases, setCases] = useState<LegalCase[]>([]);
  const [activeFilter, setActiveFilter] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [hearingFrom, setHearingFrom] = useState("");
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
        const hay = `${c.title} ${c.caseNumber ?? ""} ${c.cnrNumber ?? ""}`.toLowerCase();
        if (!hay.includes(searchTerm.toLowerCase())) return false;
      }

      if (hearingFrom || hearingTo) {
        const nextDate = getNextEntry(c)?.date;
        if (!nextDate) return false;
        if (hearingFrom && nextDate < hearingFrom) return false;
        if (hearingTo && nextDate > hearingTo) return false;
      }

      return true;
    });

    return filtered.sort((a, b) => nextHearingSortKey(a).localeCompare(nextHearingSortKey(b)));
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

      <CasesTable cases={filteredCases} role={role} />
    </div>
  );
}
