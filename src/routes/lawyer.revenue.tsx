import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/PageHeader";
import { IndianRupee, TrendingUp, Clock, CheckCircle2 } from "lucide-react";

export const Route = createFileRoute("/lawyer/revenue")({
  head: () => ({ meta: [{ title: "Revenue Overview — CloseUrCase" }] }),
  component: LawyerRevenuePage,
});

const recentPayments = [
  { id: "TXN-88401", client: "Sai Teja Reddy", caseTitle: "Property boundary dispute", amount: "₹21,250", date: "28 Aug 2026", status: "Completed" },
  { id: "TXN-88392", client: "Divya Sri Chowdary", caseTitle: "Cyber fraud UPI phishing", amount: "₹1,275", date: "25 Aug 2026", status: "Completed" },
  { id: "TXN-88350", client: "Ananya Sharma", caseTitle: "Urgent Bail Application", amount: "₹15,300", date: "21 Aug 2026", status: "Completed" },
  { id: "TXN-88290", client: "Lakshmi Prasanna", caseTitle: "Consumer complaint", amount: "₹3,825", date: "18 Aug 2026", status: "Processing" },
  { id: "TXN-88210", client: "Padmavathi Rao", caseTitle: "Mutual consent divorce", amount: "₹29,750", date: "12 Aug 2026", status: "Completed" },
];

const chartData = [
  { month: "Mar", amount: 27200 },
  { month: "Apr", amount: 40800 },
  { month: "May", amount: 55250 },
  { month: "Jun", amount: 69700 },
  { month: "Jul", amount: 93500 },
  { month: "Aug", amount: 125800 },
];

export function LawyerRevenuePage() {
  const maxAmount = Math.max(...chartData.map((d) => d.amount));

  return (
    <div className="space-y-6 w-full max-w-5xl mx-auto">
      <PageHeader
        title="Revenue Overview"
        description="View your net earnings and recent client payout settlements."
      />

      {/* 3 Key Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Total Earnings</span>
            <IndianRupee className="h-5 w-5 text-primary" />
          </div>
          <div className="mt-2 text-2xl font-black text-foreground font-mono">₹1,25,800</div>
          <p className="mt-1 text-[11px] text-muted-foreground">Net payout after platform fee</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">This Month</span>
            <TrendingUp className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-foreground font-mono">₹42,500</div>
          <p className="mt-1 text-[11px] text-emerald-600 font-semibold">+18.4% vs last month</p>
        </div>

        <div className="rounded-2xl border border-amber-500/30 bg-amber-500/5 p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-amber-700 dark:text-amber-300 uppercase tracking-wider">Pending Clearance</span>
            <Clock className="h-5 w-5 text-amber-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-foreground font-mono">₹3,825</div>
          <p className="mt-1 text-[11px] text-muted-foreground">Processing to bank account</p>
        </div>
      </div>

      {/* Monthly Earnings Bar Chart */}
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-2xs space-y-3">
        <h3 className="text-sm font-bold text-foreground">Monthly Earnings Trend</h3>
        <div className="grid grid-cols-6 items-end gap-3 h-36 border-b border-border pb-2 pt-4 px-2">
          {chartData.map((d, i) => {
            const heightPct = Math.round((d.amount / maxAmount) * 100);
            return (
              <div key={i} className="flex flex-col items-center gap-1.5 h-full justify-end">
                <div
                  style={{ height: `${heightPct}%` }}
                  className="w-full max-w-[32px] rounded-t-md bg-primary transition-all shadow-2xs"
                  title={`₹${d.amount.toLocaleString()}`}
                />
                <span className="text-[11px] font-bold text-muted-foreground">{d.month}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Payments Table */}
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-2xs space-y-3">
        <h3 className="text-sm font-bold text-foreground">Recent Client Payments</h3>
        <div className="overflow-x-auto rounded-xl border border-border/80">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/70 text-[10.5px] uppercase font-extrabold text-muted-foreground tracking-wider border-b border-border">
              <tr>
                <th className="py-2.5 px-3.5">Client & Case</th>
                <th className="py-2.5 px-3.5">Date</th>
                <th className="py-2.5 px-3.5 text-right">Net Amount</th>
                <th className="py-2.5 px-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 bg-surface">
              {recentPayments.map((p) => (
                <tr key={p.id} className="hover:bg-muted/30">
                  <td className="py-2.5 px-3.5">
                    <div className="font-bold text-foreground">{p.client}</div>
                    <div className="text-[10.5px] text-muted-foreground">{p.caseTitle}</div>
                  </td>
                  <td className="py-2.5 px-3.5 text-muted-foreground font-mono">{p.date}</td>
                  <td className="py-2.5 px-3.5 text-right font-mono font-bold text-emerald-600">{p.amount}</td>
                  <td className="py-2.5 px-3.5 text-center">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        p.status === "Completed"
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                          : "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                      }`}
                    >
                      {p.status === "Completed" ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                      <span>{p.status}</span>
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
