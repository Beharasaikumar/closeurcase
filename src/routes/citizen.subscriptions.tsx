import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  CheckCircle2,
  CreditCard,
  History,
  IndianRupee,
  Sparkles,
  ShieldCheck,
  Zap,
  Crown,
  Check,
  Calendar,
} from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { Button, Card, CircularProgress } from "@/components/m3";
import { addSubscription, getSubscriptions, subscribeToStore } from "@/data/appStore";
import { SUBSCRIPTION_PLANS } from "@/data/subscriptionPlans";
import type { Subscription, SubscriptionPlanId } from "@/types";

const CITIZEN_ID = "u_001";

export const Route = createFileRoute("/citizen/subscriptions")({
  head: () => ({ meta: [{ title: "My Subscriptions — CloseUrCase" }] }),
  component: MySubscriptions,
});

const STATUS_STYLE: Record<Subscription["status"], string> = {
  Active:
    "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/25",
  Expired: "bg-muted text-muted-foreground border border-border",
  Cancelled: "bg-destructive/15 text-destructive border border-destructive/25",
};

export function MySubscriptions() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(() =>
    getSubscriptions(CITIZEN_ID),
  );
  const [subscribingPlan, setSubscribingPlan] = useState<SubscriptionPlanId | null>(null);

  useEffect(() => subscribeToStore(() => setSubscriptions(getSubscriptions(CITIZEN_ID))), []);

  const activeSub = subscriptions.find((s) => s.status === "Active");
  const activePlanId = activeSub?.planId;

  function handleSubscribe(planId: SubscriptionPlanId, label: string, amount: number) {
    setSubscribingPlan(planId);
    setTimeout(() => {
      addSubscription({ citizenId: CITIZEN_ID, planId, planLabel: label, amount });
      setSubscribingPlan(null);
    }, 900);
  }

  const totalSpent = subscriptions.reduce((sum, s) => sum + s.amount, 0);

  return (
    <div className="space-y-6 max-w-6xl pb-8">
      <PageHeader
        title="My Subscriptions"
        description="Manage your Auto-Assign plan, view active VIP perks, and track your billing history."
      />

      {/* ── ACTIVE VIP MEMBERSHIP CARD / HERO BANNER ──────────────── */}
      {activeSub ? (
        <div className="relative overflow-hidden rounded-3xl border border-indigo-500/40 bg-gradient-to-br from-slate-950 via-indigo-950 to-slate-900 text-white p-6 sm:p-8 shadow-2xl">
          {/* Ambient Glows */}
          <div className="absolute -top-20 -right-20 h-56 w-56 rounded-full bg-indigo-500/20 blur-3xl pointer-events-none" />
          <div className="absolute -bottom-20 -left-20 h-56 w-56 rounded-full bg-purple-500/20 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <span className="flex h-2.5 w-2.5 rounded-full bg-emerald-400 ring-4 ring-emerald-400/25 animate-pulse" />
                <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/20 border border-indigo-400/30 px-3 py-0.5 text-[10px] font-black uppercase tracking-widest text-indigo-300">
                  <Crown className="h-3 w-3 text-amber-400" /> ACTIVE VIP SUBSCRIPTION
                </span>
              </div>

              <div>
                <h2 className="text-2xl sm:text-3xl font-black tracking-tight text-white flex items-center gap-3">
                  {activeSub.planLabel} Priority Pass
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-indigo-200/80 leading-relaxed max-w-xl">
                  Your active membership routes all your legal cases straight to senior legal admins for instant specialist advocate allocation.
                </p>
              </div>

              {/* VIP Perks Chips */}
              <div className="flex flex-wrap items-center gap-2 pt-1 text-xs">
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 backdrop-blur-md px-3 py-1 font-semibold text-white border border-white/15">
                  <Zap className="h-3.5 w-3.5 text-amber-400" /> Fast-Track Admin Match
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 backdrop-blur-md px-3 py-1 font-semibold text-white border border-white/15">
                  <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" /> Verified Advocates
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-xl bg-white/10 backdrop-blur-md px-3 py-1 font-semibold text-white border border-white/15">
                  <Calendar className="h-3.5 w-3.5 text-purple-300" /> Billed {activeSub.planLabel}
                </span>
              </div>
            </div>

            <div className="shrink-0 flex flex-col items-start md:items-end gap-2 border-t md:border-t-0 md:border-l border-indigo-800/60 pt-4 md:pt-0 md:pl-6">
              <div className="text-[11px] uppercase tracking-wider font-bold text-indigo-300">
                Subscription Status
              </div>
              <div className="text-2xl font-black text-white flex items-baseline gap-1">
                ₹{activeSub.amount}
                <span className="text-xs font-normal text-indigo-300">/ period</span>
              </div>
              <div className="text-[11px] text-indigo-300/80">
                Subscribed on {activeSub.startedAt}
              </div>
              <Button
                variant="outlined"
                className="mt-2 border-white/30 text-white hover:bg-white/10 text-xs font-bold h-9 px-4 rounded-xl"
              >
                Manage Subscription
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative overflow-hidden rounded-3xl border border-primary/30 bg-gradient-to-r from-primary/10 via-primary/5 to-transparent p-6 sm:p-8 shadow-md">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="space-y-1.5 max-w-2xl">
              <div className="inline-flex items-center gap-1.5 rounded-full bg-primary/15 px-3 py-0.5 text-[10px] font-black uppercase tracking-widest text-primary border border-primary/20">
                <Sparkles className="h-3 w-3 text-primary" /> Auto-Assign Legal Dispatch
              </div>
              <h2 className="text-xl sm:text-2xl font-black text-foreground">
                Get Instant Advocate Assignment with VIP Subscriptions
              </h2>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
                Choose a plan to automatically route your legal cases directly to our admin team. No manual searching needed.
              </p>
            </div>
            <div className="shrink-0">
              <span className="inline-flex items-center gap-1 rounded-2xl bg-primary text-primary-foreground px-4 py-2 text-xs font-extrabold shadow-md">
                <ShieldCheck className="h-4 w-4" /> 100% Satisfaction Guarantee
              </span>
            </div>
          </div>
        </div>
      )}

      {/* ── SUBSCRIPTION PLANS GRID ─────────────────────────────────── */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-extrabold text-foreground flex items-center gap-2">
              <CreditCard className="h-4.5 w-4.5 text-primary" />
              Available Plans
            </h2>
            <p className="text-xs text-muted-foreground">
              Select or upgrade your Auto-Assign plan for priority lawyer matching.
            </p>
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          {SUBSCRIPTION_PLANS.map((plan) => {
            const isCurrent = activePlanId === plan.id;
            const isSubscribing = subscribingPlan === plan.id;
            const isYearly = plan.id === "yearly" || plan.badge;

            return (
              <Card
                key={plan.id}
                variant="outlined"
                className={`relative overflow-hidden p-6 rounded-3xl transition-all duration-300 flex flex-col justify-between ${
                  isCurrent
                    ? isYearly
                      ? "border-emerald-500 ring-2 ring-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-transparent shadow-xl"
                      : "border-indigo-500 ring-2 ring-indigo-500/30 bg-gradient-to-br from-indigo-500/10 via-purple-500/5 to-transparent shadow-xl"
                    : "border-border bg-card hover:border-primary/50 hover:shadow-lg"
                }`}
              >
                {/* Top Corner Ribbon Banner */}
                {plan.badge && (
                  <div className="absolute top-0 right-0">
                    <span className="inline-block bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 text-white text-[9.5px] font-black tracking-widest px-4 py-1 rounded-bl-2xl shadow-md uppercase">
                      🔥 {plan.badge}
                    </span>
                  </div>
                )}

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span
                      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-0.5 text-[10px] font-black tracking-wider uppercase ${
                        isYearly
                          ? "bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20"
                          : "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 border border-indigo-500/20"
                      }`}
                    >
                      {isYearly ? "ANNUAL PASS" : "FLEXIBLE PLAN"}
                    </span>
                    {isCurrent && (
                      <span className="inline-flex items-center gap-1 text-xs font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/10 px-2.5 py-0.5 rounded-full border border-emerald-500/20">
                        <CheckCircle2 className="h-3.5 w-3.5" /> Current Plan
                      </span>
                    )}
                  </div>

                  <div>
                    <h3 className="text-lg font-black text-foreground">{plan.label}</h3>
                    <div className="mt-1 flex items-baseline gap-1">
                      <span className="text-3xl font-black text-foreground">₹{plan.price}</span>
                      <span className="text-xs font-semibold text-muted-foreground">
                        {plan.cadence}
                      </span>
                      {isYearly && (
                        <span className="ml-2 text-[11px] font-bold text-emerald-600 dark:text-emerald-400 bg-emerald-500/15 px-2 py-0.5 rounded-md">
                          Save 17% (~₹416/mo)
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="text-xs text-muted-foreground leading-relaxed">
                    {plan.description}
                  </p>

                  {/* Plan Features Checklist */}
                  <div className="space-y-2 pt-2 border-t border-border/50 text-xs">
                    <div className="flex items-center gap-2 font-medium text-foreground/90">
                      <span className={`flex h-4 w-4 items-center justify-center rounded-full text-white ${isYearly ? 'bg-emerald-500' : 'bg-indigo-500'}`}>
                        <Check className="h-2.5 w-2.5" />
                      </span>
                      <span>Auto-dispatch to top verified specialists</span>
                    </div>
                    <div className="flex items-center gap-2 font-medium text-foreground/90">
                      <span className={`flex h-4 w-4 items-center justify-center rounded-full text-white ${isYearly ? 'bg-emerald-500' : 'bg-indigo-500'}`}>
                        <Check className="h-2.5 w-2.5" />
                      </span>
                      <span>Priority admin allocation & case tracking</span>
                    </div>
                    <div className="flex items-center gap-2 font-medium text-foreground/90">
                      <span className={`flex h-4 w-4 items-center justify-center rounded-full text-white ${isYearly ? 'bg-emerald-500' : 'bg-indigo-500'}`}>
                        <Check className="h-2.5 w-2.5" />
                      </span>
                      <span>{isYearly ? "2 Months FREE + Priority Support" : "Cancel anytime with 1 click"}</span>
                    </div>
                  </div>
                </div>

                <div className="pt-5">
                  <Button
                    className={`w-full h-10 text-xs font-bold rounded-xl transition-all ${
                      isCurrent
                        ? "border-border text-muted-foreground cursor-default"
                        : isYearly
                          ? "bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-500 text-white hover:opacity-95 shadow-md shadow-emerald-500/20"
                          : "bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-500 text-white hover:opacity-95 shadow-md shadow-indigo-500/20"
                    }`}
                    variant={isCurrent ? "outlined" : "filled"}
                    disabled={isCurrent || isSubscribing}
                    onClick={() => handleSubscribe(plan.id, plan.label, plan.price)}
                  >
                    {isSubscribing ? (
                      <span className="flex items-center justify-center gap-2">
                        <CircularProgress indeterminate ariaLabel="Subscribing" className="h-4 w-4 text-white" />
                        Processing Subscription…
                      </span>
                    ) : isCurrent ? (
                      "Active Membership"
                    ) : (
                      <span className="flex items-center justify-center gap-1.5">
                        <Zap className="h-3.5 w-3.5" /> Subscribe Now
                      </span>
                    )}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>
      </div>

      {/* ── BILLING & TRANSACTION HISTORY ──────────────────────────── */}
      <Card variant="elevated" className="space-y-4 p-5 sm:p-7 rounded-3xl border border-border/80 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border/60 pb-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <History className="h-4.5 w-4.5" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-foreground">Billing & Subscription History</h2>
              <p className="text-[11px] text-muted-foreground">
                All receipts and subscription transactions associated with your citizen account.
              </p>
            </div>
          </div>

          {subscriptions.length > 0 && (
            <div className="flex items-center gap-2 text-xs">
              <span className="text-muted-foreground">Total Invested:</span>
              <span className="font-black text-foreground text-sm flex items-center">
                <IndianRupee className="h-3.5 w-3.5 text-primary" />
                {totalSpent}
              </span>
            </div>
          )}
        </div>

        {subscriptions.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-background/50 p-8 text-center space-y-2">
            <CreditCard className="h-8 w-8 mx-auto text-muted-foreground/50" />
            <p className="text-xs font-semibold text-foreground">No subscription history yet</p>
            <p className="text-[11px] text-muted-foreground max-w-sm mx-auto">
              Subscribe to an Auto-Assign plan above to start routing cases directly to expert advocates.
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {subscriptions.map((sub) => (
              <div
                key={sub.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 rounded-2xl border border-border/70 bg-background/80 hover:bg-accent/40 p-4 transition-all text-xs"
              >
                <div className="flex items-center gap-3.5 min-w-0">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 font-bold border border-indigo-500/20">
                    <CreditCard className="h-5 w-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-extrabold text-foreground text-sm truncate flex items-center gap-2">
                      {sub.planLabel} Subscription Pass
                      {sub.caseId && (
                        <span className="text-[10px] font-bold bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                          Case: {sub.caseId}
                        </span>
                      )}
                    </div>
                    <div className="mt-0.5 text-[11px] text-muted-foreground flex items-center gap-2">
                      <span>Purchased on {sub.startedAt}</span>
                      <span>•</span>
                      <span>Transaction ID: #{sub.id}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 border-t sm:border-t-0 border-border/40 pt-2 sm:pt-0">
                  <div className="text-right">
                    <div className="flex items-center font-black text-foreground text-base">
                      <IndianRupee className="h-4 w-4 text-primary" />
                      {sub.amount}
                    </div>
                    <div className="text-[10px] text-muted-foreground">GST Inclusive</div>
                  </div>

                  <div className="flex items-center gap-2">
                    <span
                      className={`rounded-full px-3 py-1 text-[11px] font-extrabold ${STATUS_STYLE[sub.status]}`}
                    >
                      {sub.status}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </Card>
    </div>
  );
}

