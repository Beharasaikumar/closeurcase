import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/app/PageHeader";
import { StatusDot } from "@/components/app/StatusDot";
import { UserAvatar } from "@/components/app/UserAvatar";
import { FilterPanelButton, type FilterSection } from "@/components/app/FilterPanelButton";
import {
  getCases,
  getLawyers,
  assignLawyerToCase,
  updateCaseFields,
  subscribeToStore,
} from "@/data/appStore";
import { categories } from "@/data/mock";
import type { CaseStatus, LegalCase, LegalCategory } from "@/types";
import { Search, UserCheck, X, Siren, AlertTriangle, Eye } from "lucide-react";
import {
  TextField,
  Select,
  Button,
  IconButton,
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
} from "@/components/m3";

export const Route = createFileRoute("/admin/cases")({
  head: () => ({ meta: [{ title: "Manage Platform Cases — CloseUrCase" }] }),
  component: CasesPage,
});

function countBy<T extends string>(rows: LegalCase[], pick: (c: LegalCase) => T) {
  const counts = new Map<T, number>();
  rows.forEach((r) => {
    const v = pick(r);
    counts.set(v, (counts.get(v) ?? 0) + 1);
  });
  return counts;
}

function CasesPage() {
  const [rows, setRows] = useState<LegalCase[]>(getCases);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  // Pagination — set to 8 rows per page
  const PAGE_SIZE = 8;
  const [page, setPage] = useState(1);

  useEffect(() => {
    const sync = () => setRows(getCases());
    return subscribeToStore(sync);
  }, []);

  const locationCounts = countBy(rows, (r) => r.city);
  const categoryCounts = countBy(rows, (r) => r.category);
  const statusCounts = countBy(rows, (r) => r.status);

  const filterSections: FilterSection[] = [
    {
      key: "city",
      label: "Location",
      options: Array.from(locationCounts.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([value, count]) => ({ value, label: value, count })),
    },
    {
      key: "category",
      label: "Legal Category",
      options: Array.from(categoryCounts.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([value, count]) => ({ value, label: `${value} Law`, count })),
    },
    {
      key: "status",
      label: "Case Status",
      options: Array.from(statusCounts.entries()).map(([value, count]) => ({
        value,
        label: value,
        count,
      })),
    },
  ];

  const filtered = rows
    .filter((r) =>
      Object.entries(filters).every(
        ([key, values]) =>
          values.length === 0 || values.includes(String(r[key as keyof LegalCase])),
      ),
    )
    .filter((r) => {
      if (!search.trim()) return true;
      const haystack = `${r.id} ${r.title} ${r.citizenName} ${r.lawyerName || ""} ${r.city} ${r.createdAt} ${r.status} ${r.emergencyReason || ""}`;
      return haystack.toLowerCase().includes(search.toLowerCase());
    })
    .sort((a, b) => {
      // Pin unassigned emergency cases to the top, then assigned emergency cases, then normal cases
      const aScore = a.isEmergency && !a.lawyerId ? 2 : a.isEmergency ? 1 : 0;
      const bScore = b.isEmergency && !b.lawyerId ? 2 : b.isEmergency ? 1 : 0;
      return bScore - aScore;
    });

  const selectedCase = selectedId ? rows.find((r) => r.id === selectedId) : undefined;

  // Reset page when search/filters change
  useEffect(() => {
    setPage(1);
  }, [search, filters]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <div className="space-y-5 w-full">
      <PageHeader
        title="Case Management & Lawyer Assignment"
        description="Review case records, assign or reassign Lawyers to citizen cases, and override case statuses."
      />

      <div className="flex justify-between items-center gap-3 rounded-2xl border border-border bg-surface p-3.5 shadow-2xs">
        <TextField
          value={search}
          onChange={setSearch}
          placeholder="Search by case ID, title, client, Lawyer, location…"
          leadingIcon={<Search className="h-4 w-4" />}
          className="w-full sm:max-w-xs"
        />
        <FilterPanelButton sections={filterSections} selected={filters} onChange={setFilters} />
      </div>

      {/* Cases Cards */}
      {pageRows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center text-xs text-muted-foreground">
          No platform cases found matching your search.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {pageRows.map((r) => {
            const isOpen = selectedId === r.id;
            return (
              <div
                key={r.id}
                className={`flex h-full min-h-56 flex-col rounded-xl border p-3.5 shadow-2xs transition-all hover:border-primary/40 hover:shadow-sm sm:p-4 ${
                  isOpen ? "border-primary bg-primary/5" : "border-border bg-surface"
                }`}
              >
                <div className="flex flex-col gap-2.5 sm:flex-row sm:items-start sm:justify-between sm:gap-4">
                  <div className="min-w-0 flex-1 space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        onClick={() => setSelectedId(r.id)}
                        className="font-mono text-xs font-bold text-primary hover:underline"
                      >
                        {r.id}
                      </button>
                      {r.isEmergency && (
                        <span className="inline-flex shrink-0 items-center rounded-full bg-red-600 px-1.5 py-0.5 text-[8.5px] font-extrabold text-white uppercase tracking-wider shadow-2xs">
                          Emergency
                        </span>
                      )}
                    </div>

                    <div>
                      <div
                        className="line-clamp-2 text-sm font-bold text-foreground leading-snug sm:text-[15px]"
                        title={r.title}
                      >
                        {r.title}
                      </div>
                      {r.isEmergency && r.emergencyReason && (
                        <div className="mt-0.5 flex items-center gap-1 text-[11px] font-semibold text-red-700">
                          <AlertTriangle className="h-3 w-3 shrink-0 text-red-600" />
                          <span>{r.emergencyReason}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[11px] text-muted-foreground">
                      <div className="flex items-center gap-1.5">
                        <UserAvatar name={r.citizenName} size="sm" />
                        <span>
                          <span className="font-semibold text-foreground">{r.citizenName}</span> ·{" "}
                          {r.city}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {r.lawyerName ? (
                          <>
                            <UserAvatar name={r.lawyerName} size="sm" />
                            <span className="font-semibold text-foreground">{r.lawyerName}</span>
                          </>
                        ) : (
                          <span
                            className="font-semibold italic"
                            style={{ color: "var(--md-extended-color-warning)" }}
                          >
                            Unassigned
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="shrink-0">
                    <StatusDot status={r.status} />
                  </div>
                </div>

                <div className="mt-auto flex items-center justify-end gap-1.5 border-t border-border/60 pt-2">
                  <IconButton
                    variant="tonal"
                    title="Manage case"
                    ariaLabel={`Manage case ${r.id}`}
                    onClick={() => setSelectedId(r.id)}
                  >
                    <Eye className="h-4 w-4" />
                  </IconButton>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Manage Case Modal */}
      <Dialog
        open={selectedCase != null}
        onOpenChange={(o) => !o && setSelectedId(null)}
        maxWidth="640px"
      >
        {selectedCase && (
          <>
            <DialogHeader>
              <DialogTitle className="flex w-full items-center justify-between gap-3">
                <span className="flex min-w-0 flex-1 items-center gap-2">
                  <span
                    className={`inline-block shrink-0 rounded-md px-2 py-0.5 text-[11px] font-bold ${
                      selectedCase.isEmergency
                        ? "bg-red-600 text-white"
                        : "bg-primary/10 text-primary"
                    }`}
                  >
                    {selectedCase.id}
                  </span>
                  <span className="min-w-0 flex-1 truncate text-sm font-bold text-foreground">
                    {selectedCase.title}
                  </span>
                </span>
                {/* Focus sink — absorbs md-dialog's auto-focus on open */}
                <span tabIndex={0} aria-hidden="true" className="sr-only" />
                <IconButton ariaLabel="Close" tabIndex={-1} onClick={() => setSelectedId(null)}>
                  <X className="h-4 w-4 text-muted-foreground" />
                </IconButton>
              </DialogTitle>
            </DialogHeader>
            <DialogContent>
              <div className="space-y-4">
                {selectedCase.isEmergency && (
                  <div className="flex items-start gap-2.5 rounded-xl border border-red-200 bg-red-50 p-3 text-red-900 text-xs font-semibold">
                    <Siren className="h-4 w-4 shrink-0 text-red-600 mt-0.5 animate-pulse" />
                    <div>
                      <div className="font-extrabold uppercase tracking-wide text-red-700 text-[10px]">
                        Emergency Action Required
                      </div>
                      <p className="mt-0.5 text-red-900">
                        {selectedCase.emergencyReason || "Immediate Lawyer assignment required."}
                      </p>
                    </div>
                  </div>
                )}

                <p className="text-xs text-muted-foreground">
                  Client: <strong className="text-foreground">{selectedCase.citizenName}</strong> ·{" "}
                  {selectedCase.category} Law · {selectedCase.city}
                </p>

                <CaseManageControls key={selectedCase.id} c={selectedCase} />
              </div>
            </DialogContent>
          </>
        )}
      </Dialog>

      {/* Pagination */}
      {filtered.length > 0 && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between px-1">
          <span className="text-[11px] text-muted-foreground">
            Showing {(safePage - 1) * PAGE_SIZE + 1}–
            {Math.min(safePage * PAGE_SIZE, filtered.length)} of {filtered.length} cases
          </span>
          <div className="flex flex-wrap items-center gap-1">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage === 1}
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-border bg-background text-muted-foreground hover:bg-muted disabled:opacity-40"
            >
              ‹
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`h-7 min-w-[28px] cursor-pointer rounded-lg border px-2 text-xs font-semibold transition-all ${
                  safePage === p
                    ? "border-primary bg-primary text-primary-foreground"
                    : "border-border bg-background text-muted-foreground hover:bg-muted"
                }`}
              >
                {p}
              </button>
            ))}
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={safePage === totalPages}
              className="flex h-7 w-7 cursor-pointer items-center justify-center rounded-lg border border-border bg-background text-muted-foreground hover:bg-muted disabled:opacity-40"
            >
              ›
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

function CaseManageControls({ c }: { c: LegalCase }) {
  const isUnassigned = !c.lawyerId;

  const approvedLawyers = useMemo(() => getLawyers().filter((l) => l.status === "Approved"), []);

  const [category, setCategory] = useState<LegalCategory>(c.category);
  const [lawyerId, setLawyerId] = useState(c.lawyerId ?? "");

  const sortedLawyers = useMemo(
    () =>
      [...approvedLawyers].sort((a, b) => {
        const aMatch = a.category === category ? 0 : 1;
        const bMatch = b.category === category ? 0 : 1;
        return aMatch - bMatch || a.name.localeCompare(b.name);
      }),
    [approvedLawyers, category],
  );

  function handleSave() {
    if (!isUnassigned || !lawyerId) return;
    const lawyer = approvedLawyers.find((l) => l.id === lawyerId);
    if (!lawyer) return;
    if (category !== c.category) {
      updateCaseFields(c.id, { category });
    }
    assignLawyerToCase(c.id, lawyer.id, lawyer.name);
  }

  return (
    <div className="rounded-xl border border-border bg-background p-4 space-y-3">
      <div className="flex items-center gap-2 text-xs font-bold text-foreground">
        <UserCheck className="h-4 w-4 text-emerald-600" />
        <span>Assigned Lawyer</span>
      </div>
      <p className="text-[11px] text-muted-foreground">
        {isUnassigned
          ? "Set the case type and assign a Lawyer. Both are locked once this case is assigned."
          : "Lawyer assignment is locked from this panel."}
      </p>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <Select
          label="Case Type"
          value={category}
          onChange={(v) => setCategory(v as LegalCategory)}
          disabled={!isUnassigned}
          options={categories.map((cat) => ({ value: cat, label: `${cat} Law` }))}
        />
        <Select
          label="Assign Lawyer"
          value={lawyerId}
          onChange={setLawyerId}
          disabled={!isUnassigned}
          options={[
            { value: "", label: "-- Unassigned --" },
            ...sortedLawyers.map((l) => ({
              value: l.id,
              label: `${l.name} — ${l.category}`,
            })),
          ]}
        />
      </div>

      <div className="flex justify-end">
        <Button disabled={!isUnassigned || !lawyerId} onClick={handleSave}>
          Save Lawyer
        </Button>
      </div>
    </div>
  );
}
