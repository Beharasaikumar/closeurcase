import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { PageHeader } from "@/components/app/PageHeader";
import { DataTable, type Column } from "@/components/app/DataTable";
import { ConfirmDialog } from "@/components/app/ConfirmDialog";
import { UserAvatar } from "@/components/app/UserAvatar";
import { FilterPanelButton, type FilterSection } from "@/components/app/FilterPanelButton";
import { getCitizens, updateCitizenStatus, subscribeToStore } from "@/data/appStore";
import type { Citizen } from "@/types";
import { Search } from "lucide-react";
import { TextField } from "@/components/m3";
import { Toggle } from "@/components/app/Toggle";

export const Route = createFileRoute("/admin/users")({
  head: () => ({ meta: [{ title: "Manage Users — CloseurCase" }] }),
  component: UsersPage,
});

function formatLastLogin(iso: string): string {
  return new Date(iso).toLocaleString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

function countBy<T extends string>(rows: Citizen[], pick: (c: Citizen) => T) {
  const counts = new Map<T, number>();
  rows.forEach((r) => {
    const v = pick(r);
    counts.set(v, (counts.get(v) ?? 0) + 1);
  });
  return counts;
}

function UsersPage() {
  const [q, setQ] = useState("");
  const [filters, setFilters] = useState<Record<string, string[]>>({});
  const [rows, setRows] = useState<Citizen[]>(getCitizens);
  // Confirm state for deactivation
  const [pendingDeactivate, setPendingDeactivate] = useState<Citizen | null>(null);

  useEffect(() => {
    const sync = () => setRows(getCitizens());
    return subscribeToStore(sync);
  }, []);

  const locationCounts = countBy(rows, (r) => r.city);
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
      key: "status",
      label: "Account Status",
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
        ([key, values]) => values.length === 0 || values.includes(String(r[key as keyof Citizen])),
      ),
    )
    .filter((r) =>
      !q.trim()
        ? true
        : `${r.name} ${r.email} ${r.phone} ${r.city} ${r.joinedAt} ${r.lastLoginAt}`
            .toLowerCase()
            .includes(q.toLowerCase()),
    );

  const handleToggleStatus = (c: Citizen) => {
    if (c.status === "Active") {
      // Deactivation requires confirmation
      setPendingDeactivate(c);
    } else {
      // Reactivation is safe — no confirmation needed
      updateCitizenStatus(c.id, "Active");
    }
  };

  const cols: Column<Citizen>[] = [
    {
      key: "name",
      header: "Citizen Name",
      render: (r) => (
        <div className="flex min-w-0 items-center gap-2">
          <UserAvatar name={r.name} size="sm" />
          <span className="font-bold text-foreground text-xs truncate">{r.name}</span>
        </div>
      ),
    },
    {
      key: "email",
      header: "Email Address",
      render: (r) => (
        <span className="text-xs text-muted-foreground truncate block">{r.email}</span>
      ),
    },
    {
      key: "phone",
      header: "Phone Number",
      render: (r) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">{r.phone}</span>
      ),
    },
    {
      key: "city",
      header: "Location",
      render: (r) => <span className="text-xs text-muted-foreground truncate block">{r.city}</span>,
    },
    {
      key: "joinedAt",
      header: "Registered On",
      render: (r) => <span className="text-xs text-muted-foreground">{r.joinedAt}</span>,
    },
    {
      key: "lastLoginAt",
      header: "Last Login",
      render: (r) => (
        <span className="text-xs text-muted-foreground whitespace-nowrap">
          {formatLastLogin(r.lastLoginAt)}
        </span>
      ),
    },
    {
      key: "status",
      header: "Account Status",
      render: (r) => {
        const color =
          r.status === "Active"
            ? "var(--md-extended-color-success)"
            : "var(--md-sys-color-on-surface-variant)";
        return (
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
            style={{ color, backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)` }}
          >
            <span
              className="h-1.5 w-1.5 shrink-0 rounded-full"
              style={{ backgroundColor: color }}
            />
            {r.status}
          </span>
        );
      },
    },
    {
      key: "actions",
      header: "Action",
      width: "120px",
      render: (r) => (
        <div className="flex items-center gap-2.5">
          <Toggle
            checked={r.status === "Active"}
            onChange={() => handleToggleStatus(r)}
            ariaLabel={`Toggle account status for ${r.name}`}
          />
          <span
            className="text-xs font-medium"
            style={{
              color:
                r.status === "Active"
                  ? "var(--md-extended-color-success)"
                  : "var(--md-sys-color-on-surface-variant)",
            }}
          >
            {r.status === "Active" ? "Active" : "Inactive"}
          </span>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Citizen Account Management"
        description="View registered citizen users, inspect contact details, and toggle account access."
      />

      <div className="flex justify-between items-center gap-3 rounded-2xl border border-border bg-surface p-4 shadow-2xs">
        <TextField
          value={q}
          onChange={setQ}
          placeholder="Search by name, email, phone, location…"
          leadingIcon={<Search className="h-4 w-4" />}
          className="w-full sm:max-w-xs"
        />
        <FilterPanelButton sections={filterSections} selected={filters} onChange={setFilters} />
      </div>

      <DataTable columns={cols} rows={filtered} empty="No citizens matching your search." />

      {/* CONFIRM DEACTIVATE DIALOG */}
      <ConfirmDialog
        open={pendingDeactivate !== null}
        title="Deactivate Citizen Account"
        message={`Are you sure you want to deactivate ${pendingDeactivate?.name ?? "this citizen"}'s account? They will immediately lose access to the platform, but their case history will be preserved.`}
        confirmLabel="Yes, Deactivate Account"
        cancelLabel="Cancel"
        variant="warning"
        onConfirm={() => {
          if (pendingDeactivate) updateCitizenStatus(pendingDeactivate.id, "Inactive");
          setPendingDeactivate(null);
        }}
        onCancel={() => setPendingDeactivate(null)}
      />
    </div>
  );
}
