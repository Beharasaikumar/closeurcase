import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/PageHeader";
import { cases, categories, lawyers } from "@/data/mock";
import {
  BarChart3,
  TrendingUp,
  Clock,
  CheckCircle2,
  Users,
  Scale,
  PieChart,
  Calendar,
} from "lucide-react";

export const Route = createFileRoute("/admin/reports")({
  component: Reports,
});

/* ── Minimal SVG Donut/Pie chart helper ─────────────────────────────────── */
interface PieSlice {
  label: string;
  value: number;
  color: string;
}

function DonutChart({ slices, size = 140 }: { slices: PieSlice[]; size?: number }) {
  const total = slices.reduce((s, x) => s + x.value, 0) || 1;
  const r = 44;
  const cx = size / 2;
  const cy = size / 2;
  const circumference = 2 * Math.PI * r;

  let cumulativePercent = 0;
  const segments = slices
    .filter((s) => s.value > 0)
    .map((s) => {
      const percent = s.value / total;
      const offset = circumference * (1 - cumulativePercent);
      const dashArray = `${percent * circumference} ${circumference}`;
      cumulativePercent += percent;
      return { ...s, dashArray, offset };
    });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      {/* Background ring */}
      <circle cx={cx} cy={cy} r={r} fill="none" strokeWidth="18" stroke="var(--color-muted)" />
      {segments.map((seg, i) => (
        <circle
          key={i}
          cx={cx}
          cy={cy}
          r={r}
          fill="none"
          strokeWidth="18"
          stroke={seg.color}
          strokeDasharray={seg.dashArray}
          strokeDashoffset={seg.offset}
          transform={`rotate(-90 ${cx} ${cy})`}
          strokeLinecap="butt"
          className="transition-all duration-700"
        />
      ))}
      {/* Centre count */}
      <text
        x={cx}
        y={cy - 5}
        textAnchor="middle"
        fontSize="16"
        fontWeight="700"
        fill="var(--color-foreground)"
      >
        {total}
      </text>
      <text
        x={cx}
        y={cy + 11}
        textAnchor="middle"
        fontSize="7.5"
        fill="var(--color-muted-foreground)"
      >
        TOTAL
      </text>
    </svg>
  );
}

/* ── Colour palette ─────────────────────────────────────────────────────── */
const PALETTE = [
  "#6366f1",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#06b6d4",
  "#8b5cf6",
  "#f97316",
  "#84cc16",
  "#ec4899",
  "#14b8a6",
];

export function Reports() {
  const totalCases = cases.length;
  const resolvedCases = cases.filter((c) => c.status === "Resolved").length;
  const activeCases = cases.filter((c) => c.status !== "Resolved" && c.status !== "Closed").length;
  const totalLawyers = lawyers.length;
  const approvedLawyers = lawyers.filter((l) => l.status === "Approved").length;

  const resolutionRate = totalCases > 0 ? Math.round((resolvedCases / totalCases) * 100) : 0;

  // Monthly Intake Mock Data
  const monthlyIntake = [
    { month: "Jun", count: 12, height: "40%" },
    { month: "Jul", count: 18, height: "55%" },
    { month: "Aug", count: 24, height: "70%" },
    { month: "Sep", count: 31, height: "85%" },
    { month: "Oct", count: 28, height: "78%" },
    { month: "Nov", count: 39, height: "100%" },
  ];

  // Cases by category
  const categoryStats = categories
    .map((cat, i) => {
      const count = cases.filter((x) => x.category === cat).length;
      const lawyerCount = lawyers.filter((x) => x.category === cat).length;
      const percentage = totalCases > 0 ? Math.round((count / totalCases) * 100) : 0;
      return { category: cat, count, lawyerCount, percentage, color: PALETTE[i % PALETTE.length] };
    })
    .sort((a, b) => b.count - a.count);

  // Cases by status
  const statusData = [
    { status: "Submitted", color: "#3b82f6" },
    { status: "Assigned", color: "#6366f1" },
    { status: "Under Review", color: "#8b5cf6" },
    { status: "In Progress", color: "#f59e0b" },
    { status: "Awaiting Documents", color: "#ef4444" },
    { status: "Resolved", color: "#10b981" },
  ].map((d) => ({
    ...d,
    count: cases.filter((c) => c.status === d.status).length,
    percentage:
      totalCases > 0
        ? Math.round((cases.filter((c) => c.status === d.status).length / totalCases) * 100)
        : 0,
  }));

  // Lawyer status distribution
  const LawyerstatusSlices: PieSlice[] = [
    {
      label: "Approved",
      value: lawyers.filter((l) => l.status === "Approved").length,
      color: "#10b981",
    },
    {
      label: "Pending",
      value: lawyers.filter((l) => l.status === "Pending").length,
      color: "#f59e0b",
    },
    {
      label: "Suspended",
      value: lawyers.filter((l) => l.status === "Suspended").length,
      color: "#6b7280",
    },
    {
      label: "Rejected",
      value: lawyers.filter((l) => l.status === "Rejected").length,
      color: "#ef4444",
    },
  ];

  // Category pie slices for cases
  const categoryPieSlices: PieSlice[] = categoryStats
    .filter((c) => c.count > 0)
    .map((c) => ({ label: c.category, value: c.count, color: c.color }));

  // Status pie slices
  const statusPieSlices: PieSlice[] = statusData
    .filter((s) => s.count > 0)
    .map((s) => ({ label: s.status, value: s.count, color: s.color }));

  return (
    <div className="max-w-5xl space-y-6">
      <PageHeader
        title="Reports & Analytics"
        description="Visual stats, pie charts, category breakdowns, and platform metrics."
      />

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <div className="rounded-2xl border border-border bg-surface p-5 space-y-1 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-bold uppercase tracking-wider">
              Total Filed Cases
            </span>
            <BarChart3 className="h-4 w-4 text-primary" />
          </div>
          <div className="text-2xl font-extrabold text-foreground">{totalCases}</div>
          <p className="text-[11px] text-emerald-600 font-medium flex items-center gap-1">
            <TrendingUp className="h-3 w-3" /> +12% this month
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 space-y-1 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-bold uppercase tracking-wider">Resolution Rate</span>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="text-2xl font-extrabold text-emerald-600">{resolutionRate}%</div>
          <p className="text-[11px] text-muted-foreground font-medium">Avg. 18 days to resolve</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 space-y-1 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-bold uppercase tracking-wider">Active Matters</span>
            <Clock className="h-4 w-4 text-amber-600" />
          </div>
          <div className="text-2xl font-extrabold text-foreground">{activeCases}</div>
          <p className="text-[11px] text-muted-foreground font-medium">In active proceedings</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 space-y-1 shadow-2xs">
          <div className="flex items-center justify-between text-muted-foreground">
            <span className="text-[11px] font-bold uppercase tracking-wider">Verified Lawyers</span>
            <Users className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="text-2xl font-extrabold text-foreground">{approvedLawyers}</div>
          <p className="text-[11px] text-muted-foreground font-medium">
            {totalLawyers} registered counsel
          </p>
        </div>
      </div>

      {/* MONTHLY INTAKE TREND COLUMN BAR CHART */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <Calendar className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">Monthly Case Filing Trend (2025)</h3>
          </div>
          <span className="text-xs font-semibold text-emerald-600 flex items-center gap-1">
            <TrendingUp className="h-3.5 w-3.5" /> +28% Growth Rate
          </span>
        </div>

        <div className="flex items-end justify-between gap-3 h-44 pt-4 px-4 pb-2 border-b border-border bg-background/50 rounded-xl">
          {monthlyIntake.map((m) => (
            <div
              key={m.month}
              className="flex-1 flex flex-col items-center gap-2 h-full justify-end group"
            >
              <span className="text-[10px] font-bold font-mono text-muted-foreground group-hover:text-primary transition-colors">
                {m.count}
              </span>
              <div
                className="w-full max-w-[36px] bg-primary/20 rounded-t-lg group-hover:bg-primary transition-all duration-300 relative overflow-hidden"
                style={{ height: m.height }}
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-primary" />
              </div>
              <span className="text-xs font-bold text-foreground">{m.month}</span>
            </div>
          ))}
        </div>
      </div>

      {/* PIE CHARTS ROW */}
      <div className="grid gap-6 md:grid-cols-3">
        {/* Pie Chart 1: Cases by Category */}
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <PieChart className="h-4 w-4 text-primary" />
            <h3 className="text-xs font-bold text-foreground">Cases by Legal Domain</h3>
          </div>
          <div className="flex flex-col items-center gap-4">
            <DonutChart slices={categoryPieSlices} size={140} />
            <div className="w-full space-y-1.5">
              {categoryPieSlices.map((s) => (
                <div key={s.label} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: s.color }}
                    />
                    <span className="text-foreground font-medium">{s.label}</span>
                  </div>
                  <span className="font-bold text-foreground font-mono">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pie Chart 2: Cases by Status */}
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Scale className="h-4 w-4 text-indigo-600" />
            <h3 className="text-xs font-bold text-foreground">Cases by Pipeline Status</h3>
          </div>
          <div className="flex flex-col items-center gap-4">
            <DonutChart slices={statusPieSlices} size={140} />
            <div className="w-full space-y-1.5">
              {statusPieSlices.map((s) => (
                <div key={s.label} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: s.color }}
                    />
                    <span className="text-foreground font-medium">{s.label}</span>
                  </div>
                  <span className="font-bold text-foreground font-mono">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Pie Chart 3: Lawyer Verification Status */}
        <div className="rounded-2xl border border-border bg-surface p-5 shadow-2xs space-y-4">
          <div className="flex items-center gap-2 border-b border-border pb-3">
            <Users className="h-4 w-4 text-emerald-600" />
            <h3 className="text-xs font-bold text-foreground">Lawyer Verification Status</h3>
          </div>
          <div className="flex flex-col items-center gap-4">
            <DonutChart slices={LawyerstatusSlices} size={140} />
            <div className="w-full space-y-1.5">
              {LawyerstatusSlices.map((s) => (
                <div key={s.label} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5">
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: s.color }}
                    />
                    <span className="text-foreground font-medium">{s.label}</span>
                  </div>
                  <span className="font-bold text-foreground font-mono">{s.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* BAR CHART METERS GRID */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Category Distribution Bar Meters */}
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold text-foreground">Category Distribution</h3>
            </div>
            <span className="text-xs text-muted-foreground">By Legal Domain</span>
          </div>
          <div className="space-y-3 pt-1">
            {categoryStats
              .filter((c) => c.count > 0)
              .map((item) => (
                <div key={item.category} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-foreground">{item.category} Law</span>
                    <span className="text-muted-foreground font-mono">
                      {item.count} cases ({item.percentage}%)
                    </span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(item.percentage, 8)}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              ))}
          </div>
        </div>

        {/* Status Pipeline Bar Meters */}
        <div className="rounded-2xl border border-border bg-surface p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <Scale className="h-4 w-4 text-indigo-600" />
              <h3 className="text-sm font-bold text-foreground">Case Pipeline Status</h3>
            </div>
            <span className="text-xs text-muted-foreground">Real-time status</span>
          </div>
          <div className="space-y-3 pt-1">
            {statusData.map((item) => (
              <div key={item.status} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-2 w-2 rounded-full shrink-0"
                      style={{ backgroundColor: item.color }}
                    />
                    <span className="font-semibold text-foreground">{item.status}</span>
                  </div>
                  <span className="text-muted-foreground font-mono">
                    {item.count} ({item.percentage}%)
                  </span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-500"
                    style={{
                      width: `${Math.max(item.percentage, 6)}%`,
                      backgroundColor: item.color,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Lawyer DOMAIN AVAILABILITY GRID */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-2xs space-y-3">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 justify-between border-b border-border pb-3">
          <h3 className="text-sm font-bold text-foreground">
            Lawyer Availability by Practice Domain
          </h3>
          <span className="text-xs text-muted-foreground">{totalLawyers} Total Counsel</span>
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          {categoryStats.map((item) => (
            <div
              key={item.category}
              className="rounded-xl border border-border bg-background p-4 space-y-1"
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-foreground">{item.category} Law</span>
                <span
                  className="rounded-md px-2 py-0.5 text-[10px] font-bold"
                  style={{ backgroundColor: `${item.color}18`, color: item.color }}
                >
                  {item.lawyerCount} Lawyers
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground">{item.count} Cases Logged</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
