import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useMemo } from "react";
import { PageHeader } from "@/components/app/PageHeader";
import { getCases, getLawyers, getCitizens, subscribeToStore } from "@/data/appStore";
import { categories } from "@/data/mock";
import type { Citizen, Lawyer } from "@/types";
import {
  Users,
  UserCheck,
  Briefcase,
  ShieldCheck,
  LineChart,
  BarChart3,
  TrendingUp,
  Calendar,
  PieChart,
  Scale,
} from "lucide-react";
import { Card } from "@/components/m3";

export const Route = createFileRoute("/admin/")({
  head: () => ({ meta: [{ title: "Super Admin Dashboard — CloseUrCase" }] }),
  component: AdminDashboard,
});

/* ── Minimal SVG Donut/Pie chart helper (moved in from the former Reports page) ── */
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

/* ── Daily registrations (citizens + lawyers) line chart ────────────────── */
interface DailyRegPoint {
  date: string;
  label: string;
  citizens: number;
  lawyers: number;
}

function buildDailyRegistrations(lawyers: Lawyer[], citizens: Citizen[]): DailyRegPoint[] {
  const days: DailyRegPoint[] = [];
  const now = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const iso = d.toISOString().slice(0, 10);
    const label = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
    days.push({
      date: iso,
      label,
      citizens: citizens.filter((c) => c.joinedAt === iso).length,
      lawyers: lawyers.filter((l) => l.joinedAt === iso).length,
    });
  }
  return days;
}

function getBezierPath(points: { x: number; y: number }[]): string {
  if (points.length === 0) return "";
  if (points.length === 1) return `M ${points[0].x} ${points[0].y}`;

  let d = `M ${points[0].x} ${points[0].y}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[i === 0 ? i : i - 1];
    const p1 = points[i];
    const p2 = points[i + 1];
    const p3 = points[i + 2 < points.length ? i + 2 : i + 1];

    const cp1x = p1.x + (p2.x - p0.x) / 6;
    const cp1y = p1.y + (p2.y - p0.y) / 6;
    const cp2x = p2.x - (p3.x - p1.x) / 6;
    const cp2y = p2.y - (p3.y - p1.y) / 6;

    d += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${p2.x} ${p2.y}`;
  }
  return d;
}

function getAreaPath(points: { x: number; y: number }[], bottomY: number): string {
  if (points.length === 0) return "";
  const lineD = getBezierPath(points);
  const last = points[points.length - 1];
  const first = points[0];
  return `${lineD} L ${last.x} ${bottomY} L ${first.x} ${bottomY} Z`;
}

function DailyRegistrationsChart({ data }: { data: DailyRegPoint[] }) {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [showCitizens, setShowCitizens] = useState(true);
  const [showLawyers, setShowLawyers] = useState(true);

  const height = 240;
  const width = Math.max(600, data.length * 90);
  const padding = { top: 24, right: 30, bottom: 36, left: 36 };
  const plotW = width - padding.left - padding.right;
  const plotH = height - padding.top - padding.bottom;

  const rawMax = Math.max(1, ...data.map((d) => Math.max(d.citizens, d.lawyers)));
  const maxVal = Math.ceil(rawMax * 1.2) || 4;

  const xFor = (i: number) =>
    padding.left + (data.length <= 1 ? plotW / 2 : (i / (data.length - 1)) * plotW);
  const yFor = (v: number) => padding.top + plotH - (v / maxVal) * plotH;

  const citizenPoints = data.map((d, i) => ({ x: xFor(i), y: yFor(d.citizens) }));
  const lawyerPoints = data.map((d, i) => ({ x: xFor(i), y: yFor(d.lawyers) }));

  const bottomY = padding.top + plotH;

  // Grid steps (4 horizontal lines)
  const gridSteps = [0, 0.33, 0.66, 1];

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mouseX = ((e.clientX - rect.left) / rect.width) * width;
    let closestIdx = 0;
    let minDiff = Infinity;
    data.forEach((_, i) => {
      const diff = Math.abs(xFor(i) - mouseX);
      if (diff < minDiff) {
        minDiff = diff;
        closestIdx = i;
      }
    });
    setHoverIndex(closestIdx);
  };

  const activePoint = hoverIndex !== null ? data[hoverIndex] : null;

  return (
    <div className="space-y-3">
      {/* Legend & Toggle Controls */}
      <div className="flex items-center justify-between gap-3 text-xs font-semibold px-1">
        <div className="text-muted-foreground text-[11px]">
          {activePoint ? (
            <span>
              Hovering: <strong className="text-foreground">{activePoint.label}</strong>
            </span>
          ) : (
            <span>Hover over a dot to inspect that day's new registrations</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowCitizens((v) => !v || !showLawyers)}
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold border transition-all cursor-pointer ${
              showCitizens
                ? "border-blue-500/40 bg-blue-50 text-blue-700 shadow-2xs"
                : "border-border bg-muted/40 text-muted-foreground opacity-50"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-blue-500" />
            Citizens
          </button>
          <button
            onClick={() => setShowLawyers((v) => !v || !showCitizens)}
            className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-bold border transition-all cursor-pointer ${
              showLawyers
                ? "border-rose-500/40 bg-rose-50 text-rose-700 shadow-2xs"
                : "border-border bg-muted/40 text-muted-foreground opacity-50"
            }`}
          >
            <span className="h-2 w-2 rounded-full bg-rose-500" />
            Lawyers
          </button>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="relative overflow-x-auto rounded-xl border border-border/60 bg-background/50 p-2">
        <svg
          width={width}
          height={height}
          viewBox={`0 0 ${width} ${height}`}
          className="min-w-full cursor-crosshair select-none"
          onMouseMove={handleMouseMove}
          onMouseLeave={() => setHoverIndex(null)}
        >
          <defs>
            <linearGradient id="citizenGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#3b82f6" stopOpacity="0.0" />
            </linearGradient>
            <linearGradient id="lawyerGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f43f5e" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#f43f5e" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Horizontal Gridlines & Y-axis labels */}
          {gridSteps.map((step) => {
            const y = padding.top + plotH * (1 - step);
            const val = Math.round(maxVal * step);
            return (
              <g key={step}>
                <line
                  x1={padding.left}
                  y1={y}
                  x2={width - padding.right}
                  y2={y}
                  stroke="var(--color-border)"
                  strokeDasharray="4 4"
                  strokeOpacity="0.6"
                />
                <text
                  x={padding.left - 8}
                  y={y + 3}
                  textAnchor="end"
                  fontSize="10"
                  fontFamily="mono"
                  fill="var(--color-muted-foreground)"
                >
                  {val}
                </text>
              </g>
            );
          })}

          {/* Citizens Area, Line & Dots */}
          {showCitizens && (
            <g className="transition-all duration-300">
              <path d={getAreaPath(citizenPoints, bottomY)} fill="url(#citizenGradient)" />
              <path
                d={getBezierPath(citizenPoints)}
                fill="none"
                stroke="#3b82f6"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {citizenPoints.map((p, i) => (
                <circle
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r={hoverIndex === i ? 5.5 : 4}
                  fill="#3b82f6"
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="transition-all"
                />
              ))}
            </g>
          )}

          {/* Lawyers Area, Line & Dots */}
          {showLawyers && (
            <g className="transition-all duration-300">
              <path d={getAreaPath(lawyerPoints, bottomY)} fill="url(#lawyerGradient)" />
              <path
                d={getBezierPath(lawyerPoints)}
                fill="none"
                stroke="#f43f5e"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              {lawyerPoints.map((p, i) => (
                <circle
                  key={i}
                  cx={p.x}
                  cy={p.y}
                  r={hoverIndex === i ? 5.5 : 4}
                  fill="#f43f5e"
                  stroke="#ffffff"
                  strokeWidth="2"
                  className="transition-all"
                />
              ))}
            </g>
          )}

          {/* X Axis Labels (dates) */}
          {data.map((d, i) => {
            const x = xFor(i);
            const isHovered = hoverIndex === i;
            return (
              <g key={d.date}>
                <text
                  x={x}
                  y={height - 10}
                  textAnchor="middle"
                  fontSize="10"
                  fontWeight={isHovered ? "700" : "500"}
                  fill={isHovered ? "var(--color-foreground)" : "var(--color-muted-foreground)"}
                  className="transition-colors"
                >
                  {d.label}
                </text>
              </g>
            );
          })}

          {/* Hover Crosshair Guideline */}
          {hoverIndex !== null && (
            <line
              x1={xFor(hoverIndex)}
              y1={padding.top}
              x2={xFor(hoverIndex)}
              y2={bottomY}
              stroke="var(--color-primary)"
              strokeWidth="1.5"
              strokeDasharray="3 3"
              strokeOpacity="0.8"
              className="pointer-events-none"
            />
          )}
        </svg>

        {/* Floating Tooltip Card on Hover */}
        {hoverIndex !== null && activePoint && (
          <div
            className="pointer-events-none absolute z-30 transform -translate-x-1/2 rounded-xl border border-border bg-surface/95 p-3 shadow-lg backdrop-blur-md transition-all duration-150 text-xs space-y-1.5 min-w-37.5"
            style={{
              left: `${(xFor(hoverIndex) / width) * 100}%`,
              top: "12px",
            }}
          >
            <div className="border-b border-border pb-1 text-[11px] font-bold text-foreground flex items-center justify-between">
              <span>{activePoint.label}</span>
              <span className="text-[10px] text-muted-foreground font-normal">
                New Registrations
              </span>
            </div>
            {showCitizens && (
              <div className="flex items-center justify-between gap-3 text-blue-700">
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="h-2 w-2 rounded-full bg-blue-500" />
                  Citizens:
                </span>
                <span className="font-bold font-mono text-sm">{activePoint.citizens}</span>
              </div>
            )}
            {showLawyers && (
              <div className="flex items-center justify-between gap-3 text-rose-700">
                <span className="flex items-center gap-1.5 font-medium">
                  <span className="h-2 w-2 rounded-full bg-rose-500" />
                  Lawyers:
                </span>
                <span className="font-bold font-mono text-sm">{activePoint.lawyers}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

interface IntakePoint {
  month: string;
  fullName: string;
  count: number;
  prevCount?: number;
  breakdown: { category: string; count: number }[];
}

const MONTHLY_INTAKE_DATA: IntakePoint[] = [
  {
    month: "Jun",
    fullName: "June 2025",
    count: 12,
    prevCount: 10,
    breakdown: [
      { category: "Property", count: 4 },
      { category: "Criminal", count: 3 },
      { category: "Cyber", count: 3 },
      { category: "Family", count: 2 },
    ],
  },
  {
    month: "Jul",
    fullName: "July 2025",
    count: 18,
    prevCount: 12,
    breakdown: [
      { category: "Property", count: 6 },
      { category: "Criminal", count: 5 },
      { category: "Cyber", count: 4 },
      { category: "Family", count: 3 },
    ],
  },
  {
    month: "Aug",
    fullName: "August 2025",
    count: 24,
    prevCount: 18,
    breakdown: [
      { category: "Property", count: 8 },
      { category: "Criminal", count: 7 },
      { category: "Cyber", count: 5 },
      { category: "Family", count: 4 },
    ],
  },
  {
    month: "Sep",
    fullName: "September 2025",
    count: 31,
    prevCount: 24,
    breakdown: [
      { category: "Property", count: 10 },
      { category: "Criminal", count: 9 },
      { category: "Cyber", count: 7 },
      { category: "Family", count: 5 },
    ],
  },
  {
    month: "Oct",
    fullName: "October 2025",
    count: 28,
    prevCount: 31,
    breakdown: [
      { category: "Property", count: 9 },
      { category: "Criminal", count: 8 },
      { category: "Cyber", count: 6 },
      { category: "Family", count: 5 },
    ],
  },
  {
    month: "Nov",
    fullName: "November 2025",
    count: 39,
    prevCount: 28,
    breakdown: [
      { category: "Property", count: 14 },
      { category: "Criminal", count: 11 },
      { category: "Cyber", count: 8 },
      { category: "Family", count: 6 },
    ],
  },
];

function MonthlyFilingBarChart() {
  const [hoverIndex, setHoverIndex] = useState<number | null>(null);

  const monthlyIntake = [
    { month: "Jun", fullName: "June 2025", count: 12, height: "40%" },
    { month: "Jul", fullName: "July 2025", count: 18, height: "55%" },
    { month: "Aug", fullName: "August 2025", count: 24, height: "70%" },
    { month: "Sep", fullName: "September 2025", count: 31, height: "85%" },
    { month: "Oct", fullName: "October 2025", count: 28, height: "78%" },
    { month: "Nov", fullName: "November 2025", count: 39, height: "100%" },
  ];

  return (
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

      <div className="flex items-end justify-between gap-3 h-44 pt-4 px-4 pb-2 border-b border-border bg-background/50 rounded-xl relative">
        {monthlyIntake.map((m, i) => {
          const isHovered = hoverIndex === i;
          return (
            <div
              key={m.month}
              onMouseEnter={() => setHoverIndex(i)}
              onMouseLeave={() => setHoverIndex(null)}
              className="flex-1 flex flex-col items-center gap-2 h-full justify-end group cursor-pointer relative"
            >
              {/* Floating Tooltip Pill on Hover */}
              {isHovered && (
                <div className="absolute -top-7 z-20 rounded-md bg-foreground px-2 py-1 text-[10px] font-bold text-background shadow-sm whitespace-nowrap animate-in fade-in zoom-in-95">
                  {m.fullName}: {m.count} cases
                </div>
              )}

              <span
                className={`text-[10px] font-bold font-mono transition-colors ${
                  isHovered ? "text-primary scale-110" : "text-muted-foreground"
                }`}
              >
                {m.count}
              </span>
              <div
                className={`w-full max-w-[36px] rounded-t-lg transition-all duration-300 relative overflow-hidden ${
                  isHovered ? "bg-primary shadow-sm scale-105" : "bg-primary/20 hover:bg-primary/40"
                }`}
                style={{ height: m.height }}
              >
                <div className="absolute inset-x-0 top-0 h-1 bg-primary" />
              </div>
              <span
                className={`text-xs font-bold transition-colors ${
                  isHovered ? "text-primary" : "text-foreground"
                }`}
              >
                {m.month}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AdminDashboard() {
  const [casesList, setCasesList] = useState(getCases);
  const [lawyersList, setLawyersList] = useState(getLawyers);
  const [citizensList, setCitizensList] = useState(getCitizens);

  useEffect(() => {
    const sync = () => {
      setCasesList(getCases());
      setLawyersList(getLawyers());
      setCitizensList(getCitizens());
    };
    return subscribeToStore(sync);
  }, []);

  const pendingLawyers = lawyersList.filter((l) => l.status === "Pending");
  const approvedLawyers = lawyersList.filter((l) => l.status === "Approved");
  const openCases = casesList.filter((c) => c.status !== "Resolved" && c.status !== "Closed");

  const dailyRegData = useMemo(
    () => buildDailyRegistrations(lawyersList, citizensList),
    [lawyersList, citizensList],
  );

  // Monthly Intake Mock Data — carried over from the former Reports page (no live
  // time-series equivalent exists yet in appStore).
  const monthlyIntake = [
    { month: "Jun", count: 12, height: "40%" },
    { month: "Jul", count: 18, height: "55%" },
    { month: "Aug", count: 24, height: "70%" },
    { month: "Sep", count: 31, height: "85%" },
    { month: "Oct", count: 28, height: "78%" },
    { month: "Nov", count: 39, height: "100%" },
  ];

  const totalCases = casesList.length;
  const totalLawyers = lawyersList.length;

  const categoryStats = categories
    .map((cat, i) => {
      const count = casesList.filter((x) => x.category === cat).length;
      const lawyerCount = lawyersList.filter((x) => x.category === cat).length;
      const percentage = totalCases > 0 ? Math.round((count / totalCases) * 100) : 0;
      return { category: cat, count, lawyerCount, percentage, color: PALETTE[i % PALETTE.length] };
    })
    .sort((a, b) => b.count - a.count);

  const statusData = [
    { status: "Submitted", color: "#3b82f6" },
    { status: "Assigned", color: "#6366f1" },
    { status: "Under Review", color: "#8b5cf6" },
    { status: "In Progress", color: "#f59e0b" },
    { status: "Awaiting Documents", color: "#ef4444" },
    { status: "Resolved", color: "#10b981" },
  ].map((d) => ({
    ...d,
    count: casesList.filter((c) => c.status === d.status).length,
    percentage:
      totalCases > 0
        ? Math.round((casesList.filter((c) => c.status === d.status).length / totalCases) * 100)
        : 0,
  }));

  const LawyerstatusSlices: PieSlice[] = [
    { label: "Approved", value: approvedLawyers.length, color: "#10b981" },
    { label: "Pending", value: pendingLawyers.length, color: "#f59e0b" },
    {
      label: "Suspended",
      value: lawyersList.filter((l) => l.status === "Suspended").length,
      color: "#6b7280",
    },
    {
      label: "Rejected",
      value: lawyersList.filter((l) => l.status === "Rejected").length,
      color: "#ef4444",
    },
  ];

  const categoryPieSlices: PieSlice[] = categoryStats
    .filter((c) => c.count > 0)
    .map((c) => ({ label: c.category, value: c.count, color: c.color }));

  const statusPieSlices: PieSlice[] = statusData
    .filter((s) => s.count > 0)
    .map((s) => ({ label: s.status, value: s.count, color: s.color }));

  return (
    <div className="space-y-6">
      <PageHeader
        title="Super Admin Control Panel"
        description="Full administrative control over knowledge base indexing, Lawyer verification, user management, and case assignments."
      />

      {/* Metrics Row */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <Card variant="outlined" className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Total Citizens
            </span>
            <Users className="h-4 w-4 text-primary" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-foreground">{citizensList.length}</div>
        </Card>

        <Card variant="outlined" className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Verified Lawyers
            </span>
            <UserCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-foreground">
            {approvedLawyers.length}
          </div>
        </Card>

        <Card variant="outlined" className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Pending Approval
            </span>
            <ShieldCheck
              className="h-4 w-4"
              style={{ color: "var(--md-extended-color-warning)" }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-2xl font-extrabold text-foreground">{pendingLawyers.length}</span>
            {pendingLawyers.length > 0 && (
              <span
                className="rounded-full px-2 py-0.5 text-[10px] font-bold animate-pulse"
                style={{
                  backgroundColor:
                    "color-mix(in srgb, var(--md-extended-color-warning) 15%, transparent)",
                  color: "var(--md-extended-color-warning)",
                }}
              >
                Action Req.
              </span>
            )}
          </div>
        </Card>

        <Card variant="outlined" className="p-5">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Open Cases
            </span>
            <Briefcase className="h-4 w-4 text-indigo-600" />
          </div>
          <div className="mt-2 text-2xl font-extrabold text-foreground">{openCases.length}</div>
        </Card>
      </div>

      {/* New Registrations — Last 7 Days */}
      <div className="rounded-2xl border border-border bg-surface p-6 shadow-2xs space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-2 justify-between border-b border-border pb-3">
          <div className="flex items-center gap-2">
            <LineChart className="h-4 w-4 text-primary" />
            <h3 className="text-sm font-bold text-foreground">New Registrations — Last 7 Days</h3>
          </div>
        </div>
        <DailyRegistrationsChart data={dailyRegData} />
      </div>

      {/* MONTHLY INTAKE TREND COLUMN BAR CHART */}
      <MonthlyFilingBarChart />

      {/* PIE CHARTS ROW */}
      <div className="grid gap-6 md:grid-cols-3">
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
