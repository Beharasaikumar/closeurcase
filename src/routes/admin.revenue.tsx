import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { PageHeader } from "@/components/app/PageHeader";
import { CardPagination } from "@/components/app/CardPagination";
import { Card } from "@/components/m3";
import { getPayments, subscribeToStore } from "@/data/appStore";
import type { Payment, PaymentSource } from "@/types";
import { IndianRupee, TrendingUp, Wallet, CheckCircle2, Clock } from "lucide-react";

export const Route = createFileRoute("/admin/revenue")({
  head: () => ({ meta: [{ title: "Platform Revenue — CloseUrCase Admin" }] }),
  component: AdminRevenuePage,
});

const NATIVE_DATE_INPUT_CLS =
  "h-9 rounded-lg border border-border bg-card px-2.5 text-xs text-foreground outline-hidden focus:border-primary focus:ring-1 focus:ring-primary";

const todayIso = () => new Date().toISOString().slice(0, 10);

const firstOfMonthIso = () => {
  const d = new Date();
  return new Date(d.getFullYear(), d.getMonth(), 1).toISOString().slice(0, 10);
};

const formatInr = (n: number) => `₹${n.toLocaleString("en-IN")}`;

const monthLabel = (iso: string) =>
  new Date(`${iso}T00:00:00`).toLocaleDateString("en-IN", { month: "short", year: "2-digit" });

const SOURCE_LABEL: Record<PaymentSource, string> = {
  commission: "Lawyer Commission",
  subscription: "Citizen Subscription",
};

export function AdminRevenuePage() {
  const [payments, setPayments] = useState<Payment[]>(() => getPayments());
  useEffect(() => subscribeToStore(() => setPayments(getPayments())), []);

  const [from, setFrom] = useState(firstOfMonthIso());
  const [to, setTo] = useState(todayIso());

  const today = todayIso();

  const todaysRevenue = payments
    .filter((p) => p.date === today)
    .reduce((sum, p) => sum + p.platformAmount, 0);

  const monthlyRevenue = payments
    .filter((p) => p.date >= firstOfMonthIso() && p.date <= today)
    .reduce((sum, p) => sum + p.platformAmount, 0);

  const commissionRevenue = payments
    .filter((p) => p.source === "commission")
    .reduce((sum, p) => sum + p.platformAmount, 0);

  const subscriptionRevenue = payments
    .filter((p) => p.source === "subscription")
    .reduce((sum, p) => sum + p.platformAmount, 0);

  const filteredPayments = payments.filter((p) => p.date >= from && p.date <= to);

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(8);
  useEffect(() => setPage(1), [from, to]);
  const totalPages = Math.max(1, Math.ceil(filteredPayments.length / pageSize));
  const safePage = Math.min(page, totalPages);
  const pagePayments = filteredPayments.slice((safePage - 1) * pageSize, safePage * pageSize);

  const chartData = useMemo(() => {
    const byMonth = new Map<string, number>();
    for (const p of filteredPayments) {
      const key = p.date.slice(0, 7);
      byMonth.set(key, (byMonth.get(key) ?? 0) + p.platformAmount);
    }
    return [...byMonth.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([key, amount]) => ({ label: monthLabel(`${key}-01`), amount }));
  }, [filteredPayments]);

  const maxAmount = Math.max(1, ...chartData.map((d) => d.amount));

  return (
    <div className="space-y-6 w-full max-w-5xl mx-auto">
      <PageHeader
        title="Platform Revenue"
        description="Monitor CloseUrCase commission and subscription income across lawyers and citizens."
      />

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <Card variant="outlined" className="p-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Today
            </span>
            <IndianRupee className="h-3.5 w-3.5 text-primary" />
          </div>
          <div className="mt-1 text-base font-extrabold text-foreground font-mono">
            {formatInr(todaysRevenue)}
          </div>
        </Card>

        <Card variant="outlined" className="p-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              This Month
            </span>
            <TrendingUp className="h-3.5 w-3.5 text-emerald-600" />
          </div>
          <div className="mt-1 text-base font-extrabold text-foreground font-mono">
            {formatInr(monthlyRevenue)}
          </div>
        </Card>

        <Card variant="outlined" className="p-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Lawyers
            </span>
            <Wallet className="h-3.5 w-3.5 text-primary" />
          </div>
          <div className="mt-1 text-base font-extrabold text-foreground font-mono">
            {formatInr(commissionRevenue)}
          </div>
        </Card>

        <Card variant="outlined" className="p-3">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              Citizens
            </span>
            <IndianRupee className="h-3.5 w-3.5 text-emerald-600" />
          </div>
          <div className="mt-1 text-base font-extrabold text-foreground font-mono">
            {formatInr(subscriptionRevenue)}
          </div>
        </Card>
      </div>

      <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-2xs space-y-3">
        <h3 className="text-sm font-bold text-foreground">Platform Income Trend</h3>
        <div className="flex flex-wrap items-center gap-2">
          <label className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-muted-foreground">From</span>
            <input
              type="date"
              value={from}
              max={to}
              onChange={(e) => setFrom(e.target.value)}
              className={NATIVE_DATE_INPUT_CLS}
            />
          </label>
          <label className="flex items-center gap-1.5">
            <span className="text-[11px] font-semibold text-muted-foreground">To</span>
            <input
              type="date"
              value={to}
              min={from}
              max={today}
              onChange={(e) => setTo(e.target.value)}
              className={NATIVE_DATE_INPUT_CLS}
            />
          </label>
        </div>

        {chartData.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted-foreground">
            No revenue in the selected date range.
          </p>
        ) : (
          <div className="grid items-end gap-3 h-36 border-b border-border pb-2 pt-4 px-2 grid-flow-col auto-cols-fr">
            {chartData.map((d, i) => {
              const heightPct = Math.round((d.amount / maxAmount) * 100);
              return (
                <div key={i} className="flex flex-col items-center gap-1.5 h-full justify-end">
                  <div
                    style={{ height: `${heightPct}%` }}
                    className="w-full max-w-[32px] rounded-t-md bg-primary transition-all shadow-2xs"
                    title={formatInr(d.amount)}
                  />
                  <span className="text-[11px] font-bold text-muted-foreground">{d.label}</span>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className="rounded-2xl border border-border bg-surface p-4 sm:p-5 shadow-2xs space-y-3">
        <h3 className="text-sm font-bold text-foreground">Payments</h3>

        {filteredPayments.length === 0 ? (
          <p className="py-8 text-center text-xs text-muted-foreground">
            No payments in the selected date range.
          </p>
        ) : (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            {pagePayments.map((p) => (
              <div
                key={p.id}
                className="rounded-xl border border-border/80 bg-background/70 p-3.5 shadow-2xs space-y-2.5"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate font-bold text-foreground text-sm">
                      {SOURCE_LABEL[p.source]}
                    </div>
                    {p.caseTitle && (
                      <div className="truncate text-[10.5px] text-muted-foreground">
                        {p.caseTitle}
                      </div>
                    )}
                  </div>
                  <span
                    className={`inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                      p.status === "Completed"
                        ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                        : "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                    }`}
                  >
                    {p.status === "Completed" ? (
                      <CheckCircle2 className="h-3 w-3" />
                    ) : (
                      <Clock className="h-3 w-3" />
                    )}
                    <span>{p.status}</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2.5 rounded-lg border border-border/50 bg-surface p-2.5 text-[11px]">
                  <div>
                    <div className="text-[9.5px] uppercase font-extrabold text-muted-foreground tracking-wider">
                      Citizen
                    </div>
                    <div className="truncate font-semibold text-foreground">
                      {p.citizenName ?? "—"}
                    </div>
                  </div>
                  <div>
                    <div className="text-[9.5px] uppercase font-extrabold text-muted-foreground tracking-wider">
                      Lawyer
                    </div>
                    <div className="truncate font-semibold text-foreground">
                      {p.lawyerName ?? "—"}
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-2 border-t border-border/50 pt-2.5">
                  <span className="text-[11px] text-muted-foreground font-mono">
                    {new Date(`${p.date}T00:00:00`).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                    })}
                  </span>
                  <div className="text-right">
                    <div className="font-mono font-bold text-foreground">
                      {formatInr(p.grossAmount)}
                    </div>
                    <div className="text-[10px] font-mono font-bold text-emerald-600">
                      {formatInr(p.platformAmount)} share
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {filteredPayments.length > 0 && (
          <CardPagination
            page={safePage}
            totalPages={totalPages}
            onPageChange={setPage}
            pageSize={pageSize}
            onPageSizeChange={(size) => {
              setPageSize(size);
              setPage(1);
            }}
          />
        )}
      </div>
    </div>
  );
}
