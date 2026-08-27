import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/app/PageHeader";
import { DataTable, type Column } from "@/components/app/DataTable";
import { ConfirmDialog } from "@/components/app/ConfirmDialog";
import { UserAvatar } from "@/components/app/UserAvatar";
import { LawyerProfileCard } from "@/components/app/LawyerProfileCard";
import { FilterPanelButton, type FilterSection } from "@/components/app/FilterPanelButton";
import { getLawyers, updateLawyerStatus, subscribeToStore } from "@/data/appStore";
import type { Lawyer } from "@/types";
import { CheckCircle2, XCircle, AlertTriangle, Search, X } from "lucide-react";
import {
  TextField,
  AssistChip,
  Button,
  IconButton,
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogContent,
  DialogFooter,
} from "@/components/m3";

export const Route = createFileRoute("/admin/lawyers")({
  component: LawyersPage,
});

function countBy<T extends string>(rows: Lawyer[], pick: (l: Lawyer) => T) {
  const counts = new Map<T, number>();
  rows.forEach((r) => {
    const v = pick(r);
    counts.set(v, (counts.get(v) ?? 0) + 1);
  });
  return counts;
}

export function LawyersPage() {
  const [rows, setRows] = useState<Lawyer[]>(getLawyers);
  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [selectedLawyer, setSelectedLawyer] = useState<Lawyer | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  // md-dialog measures its own size once when it opens; content that only
  // mounts in the very same instant as the open flip (rather than already
  // sitting in the DOM) gets measured before it's actually laid out, so the
  // dialog can clip it. Keeping the last-picked lawyer around after close
  // (instead of resetting to null) keeps the dialog's content permanently
  // mounted, matching how ConfirmDialog stays correctly sized.
  const displayLawyer = selectedLawyer ?? rows[0] ?? null;
  // Confirm state for destructive actions
  const [confirmAction, setConfirmAction] = useState<{
    id: string;
    name: string;
    action: "Rejected" | "Suspended";
  } | null>(null);

  useEffect(() => {
    const sync = () => setRows(getLawyers());
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
      label: "Legal Domain",
      options: Array.from(categoryCounts.entries())
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([value, count]) => ({ value, label: `${value} Law`, count })),
    },
    {
      key: "status",
      label: "Verification Status",
      options: Array.from(statusCounts.entries()).map(([value, count]) => ({
        value,
        label: value,
        count,
      })),
    },
  ];

  const filtered = useMemo(() => {
    return rows.filter((r) => {
      const matchesSearch = !search.trim()
        ? true
        : `${r.name} ${r.email} ${r.phone} ${r.city} ${r.category} ${r.barId}`
            .toLowerCase()
            .includes(search.toLowerCase());
      const matchesFilters = Object.entries(filters).every(
        ([key, values]) => values.length === 0 || values.includes(String(r[key as keyof Lawyer])),
      );
      return matchesSearch && matchesFilters;
    });
  }, [rows, search, filters]);

  const handleUpdateStatus = (id: string, status: Lawyer["status"]) => {
    updateLawyerStatus(id, status);
  };

  const cols: Column<Lawyer>[] = [
    {
      key: "name",
      header: "Lawyer Name",
      render: (r) => (
        <button
          onClick={() => {
            setSelectedLawyer(r);
            setDetailOpen(true);
          }}
          className="flex min-w-0 cursor-pointer items-center gap-2 text-left"
        >
          <UserAvatar name={r.name} size="sm" />
          <span className="font-bold text-foreground hover:text-primary truncate text-xs">
            {r.name}
          </span>
        </button>
      ),
    },
    {
      key: "cat",
      header: "Category",
      render: (r) => (
        <span className="text-xs text-muted-foreground truncate block">{r.category} Law</span>
      ),
    },
    {
      key: "city",
      header: "Location",
      render: (r) => <span className="text-xs text-muted-foreground truncate block">{r.city}</span>,
    },
    {
      key: "bar",
      header: "Bar Reg. ID",
      render: (r) => (
        <code className="rounded bg-muted px-1.5 py-0.5 text-[11px] font-bold text-primary font-mono">
          {r.barId}
        </code>
      ),
    },
    {
      key: "exp",
      header: "Experience",
      render: (r) => (
        <span className="text-xs font-semibold text-foreground">{r.experienceYears} yrs</span>
      ),
    },
    {
      key: "status",
      header: "Verification Status",
      render: (r) => <StatusBadge v={r.status} />,
    },
    {
      key: "actions",
      header: "Action",
      width: "220px",
      render: (r) => (
        <div className="flex gap-1.5">
          {r.status === "Pending" && (
            <>
              <AssistChip
                label="Approve"
                icon={<CheckCircle2 className="h-3.5 w-3.5" />}
                onClick={() => handleUpdateStatus(r.id, "Approved")}
                style={
                  {
                    "--md-assist-chip-label-text-color": "var(--md-extended-color-success)",
                    "--md-assist-chip-outline-color": "var(--md-extended-color-success)",
                    "--md-assist-chip-leading-icon-color": "var(--md-extended-color-success)",
                  } as React.CSSProperties
                }
              />
              <AssistChip
                label="Reject"
                icon={<XCircle className="h-3.5 w-3.5" />}
                onClick={() => setConfirmAction({ id: r.id, name: r.name, action: "Rejected" })}
                style={
                  {
                    "--md-assist-chip-label-text-color": "var(--md-sys-color-error)",
                    "--md-assist-chip-outline-color": "var(--md-sys-color-error)",
                    "--md-assist-chip-leading-icon-color": "var(--md-sys-color-error)",
                  } as React.CSSProperties
                }
              />
            </>
          )}

          {r.status === "Approved" && (
            <AssistChip
              label="Suspend"
              icon={<AlertTriangle className="h-3.5 w-3.5" />}
              onClick={() => setConfirmAction({ id: r.id, name: r.name, action: "Suspended" })}
            />
          )}

          {(r.status === "Suspended" || r.status === "Rejected") && (
            <AssistChip label="Reinstate" onClick={() => handleUpdateStatus(r.id, "Approved")} />
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Lawyers"
        description="Review Lawyer registration applications, bar credentials, and account verification statuses."
      />

      {/* SEARCH BAR & FILTER CONTROL CARD */}
      <div className="flex justify-between items-center gap-3 rounded-2xl border border-border bg-surface p-4 shadow-2xs">
        <TextField
          value={search}
          onChange={setSearch}
          placeholder="Search by name, phone, email, location, Bar ID…"
          leadingIcon={<Search className="h-4 w-4" />}
          className="w-full sm:max-w-xs"
        />
        <FilterPanelButton sections={filterSections} selected={filters} onChange={setFilters} />
      </div>

      {/* Lawyers DATA TABLE */}
      <div className="rounded-2xl border border-border bg-surface p-4 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 justify-between border-b border-border pb-3">
          <span className="text-xs font-bold text-foreground">
            Registered Lawyers ({filtered.length})
          </span>
          <span className="text-xs text-muted-foreground">Showing verified legal counsel list</span>
        </div>
        <DataTable
          columns={cols}
          rows={filtered}
          empty="No Lawyers match your search query or filter."
        />
      </div>

      {/* Lawyer Detail Modal */}
      <Dialog open={detailOpen} onOpenChange={setDetailOpen} maxWidth="680px">
        {displayLawyer && (
          <>
            <DialogHeader>
              <DialogTitle className="flex items-center justify-between gap-3 w-full">
                <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                  Lawyer Profile
                </span>
                {/* Focus sink — absorbs md-dialog's auto-focus on open */}
                <span tabIndex={0} aria-hidden="true" className="sr-only" />
                <IconButton ariaLabel="Close" tabIndex={-1} onClick={() => setDetailOpen(false)}>
                  <X className="h-4 w-4 text-muted-foreground" />
                </IconButton>
              </DialogTitle>
            </DialogHeader>
            <DialogContent>
              <LawyerProfileCard lawyer={displayLawyer} />
            </DialogContent>
            {displayLawyer.status === "Pending" && (
              <DialogFooter className="flex flex-col sm:flex-row gap-2 w-full">
                <Button
                  className="w-full sm:flex-1"
                  icon={<CheckCircle2 className="h-4 w-4" />}
                  onClick={() => {
                    handleUpdateStatus(displayLawyer.id, "Approved");
                    setDetailOpen(false);
                  }}
                  style={
                    {
                      "--md-filled-button-container-color": "var(--md-extended-color-success)",
                      "--md-filled-button-label-text-color": "#fff",
                    } as React.CSSProperties
                  }
                >
                  Approve Application
                </Button>
                <Button
                  className="w-full sm:flex-1"
                  icon={<XCircle className="h-4 w-4" />}
                  onClick={() => {
                    setConfirmAction({
                      id: displayLawyer.id,
                      name: displayLawyer.name,
                      action: "Rejected",
                    });
                    setDetailOpen(false);
                  }}
                  style={
                    {
                      "--md-filled-button-container-color": "var(--md-sys-color-error)",
                      "--md-filled-button-label-text-color": "#fff",
                    } as React.CSSProperties
                  }
                >
                  Reject Application
                </Button>
              </DialogFooter>
            )}
          </>
        )}
      </Dialog>

      {/* CONFIRM ACTION DIALOG — Reject / Suspend */}
      <ConfirmDialog
        open={confirmAction !== null}
        title={
          confirmAction?.action === "Rejected"
            ? "Reject Lawyer Application"
            : "Suspend Lawyer Account"
        }
        message={
          confirmAction?.action === "Rejected"
            ? `Are you sure you want to reject ${confirmAction?.name ?? "this Lawyer"}'s registration application? They will be notified and their account will not be activated.`
            : `Are you sure you want to suspend ${confirmAction?.name ?? "this Lawyer"}'s account? They will lose access to the platform immediately and cannot accept new cases.`
        }
        confirmLabel={
          confirmAction?.action === "Rejected" ? "Yes, Reject Application" : "Yes, Suspend Account"
        }
        cancelLabel="Cancel"
        variant={confirmAction?.action === "Rejected" ? "danger" : "warning"}
        onConfirm={() => {
          if (confirmAction) handleUpdateStatus(confirmAction.id, confirmAction.action);
          setConfirmAction(null);
        }}
        onCancel={() => setConfirmAction(null)}
      />
    </div>
  );
}

function StatusBadge({ v }: { v: Lawyer["status"] }) {
  const color =
    v === "Approved"
      ? "var(--md-extended-color-success)"
      : v === "Pending"
        ? "var(--md-extended-color-warning)"
        : v === "Suspended"
          ? "var(--md-sys-color-on-surface-variant)"
          : "var(--md-sys-color-error)";
  return (
    <span
      className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{ color, backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)` }}
    >
      {v === "Approved" && <CheckCircle2 className="h-3.5 w-3.5" />}
      {v === "Pending" && <AlertTriangle className="h-3.5 w-3.5" />}
      {v}
    </span>
  );
}
