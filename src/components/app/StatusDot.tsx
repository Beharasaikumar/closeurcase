import type { CaseStatus } from "@/types";

const colorFor: Record<CaseStatus, string> = {
  Pending: "var(--md-extended-color-warning)",
  Submitted: "var(--md-sys-color-on-surface-variant)",
  Assigned: "var(--md-sys-color-primary)",
  Rejected: "var(--md-sys-color-error)",
  "Under Review": "var(--md-extended-color-warning)",
  "In Progress": "var(--md-sys-color-primary)",
  "Awaiting Documents": "var(--md-extended-color-warning)",
  Resolved: "var(--md-extended-color-success)",
  Closed: "var(--md-sys-color-on-surface-variant)",
};

/** Compact M3-styled status pill — deliberately lighter-weight than a full
 * md-assist-chip since this renders inline in dense table rows. */
export function StatusDot({ status }: { status: CaseStatus }) {
  const color = colorFor[status];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold"
      style={{ color, backgroundColor: `color-mix(in srgb, ${color} 12%, transparent)` }}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full" style={{ backgroundColor: color }} />
      {status}
    </span>
  );
}
