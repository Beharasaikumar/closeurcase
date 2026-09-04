import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/PageHeader";
import { IndianRupee, TrendingUp, Wallet, CheckCircle2, Clock } from "lucide-react";

export const Route = createFileRoute("/admin/revenue")({
  head: () => ({ meta: [{ title: "Platform Revenue — CloseUrCase Admin" }] }),
  component: AdminRevenuePage,
});

const recentSettlements = [
  { id: "ADM-9011", caseTitle: "Property boundary dispute", client: "Sai Teja Reddy", advocate: "Swathi Reddy", gross: "₹25,000", share: "₹5,000", status: "Settled" },
  { id: "ADM-9010", caseTitle: "Ex-parte Injunction Demolition", client: "Lakshmi Prasanna", advocate: "Radha Krishna", gross: "₹32,000", share: "₹6,400", status: "Settled" },
  { id: "ADM-9008", caseTitle: "Cyber fraud UPI phishing", client: "Divya Sri Chowdary", advocate: "Swathi Reddy", gross: "₹18,000", share: "₹3,600", status: "Settled" },
  { id: "ADM-9005", caseTitle: "Urgent Bail Application", client: "Ananya Sharma", advocate: "Swathi Reddy", gross: "₹22,000", share: "₹4,400", status: "Settled" },
  { id: "ADM-8998", caseTitle: "Consumer complaint", client: "Lakshmi Prasanna", advocate: "Venkatesh Rao", gross: "₹8,500", share: "₹1,700", status: "Processing" },
];

const chartData = [
  { month: "Mar", platformNet: 84000 },
  { month: "Apr", platformNet: 116000 },
  { month: "May", platformNet: 148000 },
  { month: "Jun", platformNet: 190000 },
  { month: "Jul", platformNet: 256000 },
  { month: "Aug", platformNet: 336000 },
];

export function AdminRevenuePage() {
  const maxAmount = Math.max(...chartData.map((d) => d.platformNet));

  return (
    <div className="space-y-6 w-full max-w-5xl mx-auto">
      <PageHeader
        title="Platform Revenue"
        description="Monitor CloseUrCase 20% platform commission and lawyer payout settlements."
      />

      {/* 3 Key Metric Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/5 p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-emerald-700 dark:text-emerald-300 uppercase tracking-wider">Platform Revenue (20%)</span>
            <TrendingUp className="h-5 w-5 text-emerald-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-foreground font-mono">₹3,69,000</div>
          <p className="mt-1 text-[11px] text-muted-foreground">CloseUrCase net commission</p>
        </div>

        <div className="rounded-2xl border border-primary/20 bg-primary/5 p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Gross GMV Billed</span>
            <IndianRupee className="h-5 w-5 text-primary" />
          </div>
          <div className="mt-2 text-2xl font-black text-foreground font-mono">₹18,45,000</div>
          <p className="mt-1 text-[11px] text-muted-foreground font-semibold">Total client transactions</p>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-5 shadow-2xs">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Advocate Payouts (80%)</span>
            <Wallet className="h-5 w-5 text-indigo-600" />
          </div>
          <div className="mt-2 text-2xl font-black text-foreground font-mono">₹14,76,000</div>
          <p className="mt-1 text-[11px] text-muted-foreground">Disbursed to verified lawyers</p>
        </div>
      </div>

      {/* Platform Net Growth Bar Chart */}
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-2xs space-y-3">
        <h3 className="text-sm font-bold text-foreground">Monthly Platform Commission Trend</h3>
        <div className="grid grid-cols-6 items-end gap-3 h-36 border-b border-border pb-2 pt-4 px-2">
          {chartData.map((d, i) => {
            const heightPct = Math.round((d.platformNet / maxAmount) * 100);
            return (
              <div key={i} className="flex flex-col items-center gap-1.5 h-full justify-end">
                <div
                  style={{ height: `${heightPct}%` }}
                  className="w-full max-w-[32px] rounded-t-md bg-emerald-600 transition-all shadow-2xs"
                  title={`₹${d.platformNet.toLocaleString()}`}
                />
                <span className="text-[11px] font-bold text-muted-foreground">{d.month}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Recent Platform Settlements Table */}
      <div className="rounded-2xl border border-border bg-surface p-5 shadow-2xs space-y-3">
        <h3 className="text-sm font-bold text-foreground">Recent Case Transactions</h3>
        <div className="overflow-x-auto rounded-xl border border-border/80">
          <table className="w-full text-left text-xs">
            <thead className="bg-muted/70 text-[10.5px] uppercase font-extrabold text-muted-foreground tracking-wider border-b border-border">
              <tr>
                <th className="py-2.5 px-3.5">Case & Client</th>
                <th className="py-2.5 px-3.5">Assigned Advocate</th>
                <th className="py-2.5 px-3.5 text-right">Gross GMV</th>
                <th className="py-2.5 px-3.5 text-right">Platform Share (20%)</th>
                <th className="py-2.5 px-3.5 text-center">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border/60 bg-surface">
              {recentSettlements.map((s) => (
                <tr key={s.id} className="hover:bg-muted/30">
                  <td className="py-2.5 px-3.5">
                    <div className="font-bold text-foreground">{s.caseTitle}</div>
                    <div className="text-[10.5px] text-muted-foreground">Client: {s.client}</div>
                  </td>
                  <td className="py-2.5 px-3.5 font-semibold text-foreground">{s.advocate}</td>
                  <td className="py-2.5 px-3.5 text-right font-mono font-bold text-foreground">{s.gross}</td>
                  <td className="py-2.5 px-3.5 text-right font-mono font-bold text-emerald-600">{s.share}</td>
                  <td className="py-2.5 px-3.5 text-center">
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold ${
                        s.status === "Settled"
                          ? "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300"
                          : "bg-amber-500/15 text-amber-700 dark:text-amber-300"
                      }`}
                    >
                      {s.status === "Settled" ? <CheckCircle2 className="h-3 w-3" /> : <Clock className="h-3 w-3" />}
                      <span>{s.status}</span>
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
