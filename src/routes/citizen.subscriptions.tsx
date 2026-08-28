import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { CheckCircle2, CreditCard, History, IndianRupee } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { Button, Card, CircularProgress } from "@/components/m3";
import { addSubscription, getSubscriptions, subscribeToStore } from "@/data/appStore";
import { SUBSCRIPTION_PLANS } from "@/data/subscriptionPlans";
import type { Subscription, SubscriptionPlanId } from "@/types";

const CITIZEN_ID = "u_001";

export const Route = createFileRoute("/citizen/subscriptions")({
  head: () => ({ meta: [{ title: "My Subscriptions — CloseurCase" }] }),
  component: MySubscriptions,
});

const STATUS_STYLE: Record<Subscription["status"], string> = {
  Active: "bg-emerald-50 text-emerald-700",
  Expired: "bg-muted text-muted-foreground",
  Cancelled: "bg-destructive/10 text-destructive",
};

function MySubscriptions() {
  const [subscriptions, setSubscriptions] = useState<Subscription[]>(() =>
    getSubscriptions(CITIZEN_ID),
  );
  const [subscribingPlan, setSubscribingPlan] = useState<SubscriptionPlanId | null>(null);

  useEffect(() => subscribeToStore(() => setSubscriptions(getSubscriptions(CITIZEN_ID))), []);

  const activePlanId = subscriptions.find((s) => s.status === "Active")?.planId;

  function handleSubscribe(planId: SubscriptionPlanId, label: string, amount: number) {
    setSubscribingPlan(planId);
    setTimeout(() => {
      addSubscription({ citizenId: CITIZEN_ID, planId, planLabel: label, amount });
      setSubscribingPlan(null);
    }, 900);
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My Subscriptions"
        description="Manage your Auto-Assign plan and view your billing history."
      />

      <Card variant="elevated" className="space-y-4 p-4 sm:p-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
            <CreditCard className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-foreground">Auto-Assign Plans</h2>
            <p className="text-[11px] text-muted-foreground">
              Subscribe so new cases get routed straight to our admin team for fast Lawyer
              assignment.
            </p>
          </div>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {SUBSCRIPTION_PLANS.map((plan) => {
            const isCurrent = activePlanId === plan.id;
            const isSubscribing = subscribingPlan === plan.id;
            return (
              <Card
                key={plan.id}
                variant="outlined"
                className={`relative p-4 ${
                  isCurrent ? "border-primary ring-1 ring-primary bg-primary/5" : ""
                }`}
              >
                {plan.badge && (
                  <span className="absolute -top-2.5 right-4 rounded-full bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white">
                    {plan.badge}
                  </span>
                )}
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="text-sm font-bold text-foreground">{plan.label}</div>
                    <div className="mt-1 flex items-baseline gap-0.5">
                      <IndianRupee className="h-3.5 w-3.5 text-primary" />
                      <span className="text-lg font-extrabold text-primary">{plan.price}</span>
                      <span className="text-[11px] text-muted-foreground">{plan.cadence}</span>
                    </div>
                  </div>
                  {isCurrent && <CheckCircle2 className="h-5 w-5 shrink-0 text-primary" />}
                </div>
                <p className="mt-2 text-[11px] text-muted-foreground">{plan.description}</p>
                <Button
                  className="mt-3 w-full"
                  variant={isCurrent ? "outlined" : "filled"}
                  disabled={isCurrent || isSubscribing}
                  onClick={() => handleSubscribe(plan.id, plan.label, plan.price)}
                >
                  {isSubscribing ? (
                    <span className="flex items-center justify-center gap-2">
                      <CircularProgress indeterminate ariaLabel="Subscribing" className="h-4 w-4" />
                      Subscribing…
                    </span>
                  ) : isCurrent ? (
                    "Current Plan"
                  ) : (
                    "Subscribe"
                  )}
                </Button>
              </Card>
            );
          })}
        </div>
      </Card>

      <Card variant="elevated" className="space-y-3 p-4 sm:p-6">
        <div className="flex items-center gap-2">
          <History className="h-4 w-4 text-muted-foreground" />
          <h2 className="text-sm font-bold text-foreground">Subscription History</h2>
        </div>

        {subscriptions.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border bg-background p-4 text-center text-xs text-muted-foreground">
            No subscriptions yet — subscribe to a plan above to get started.
          </p>
        ) : (
          <ul className="space-y-2">
            {subscriptions.map((sub) => (
              <li
                key={sub.id}
                className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-border/60 bg-background p-3 text-xs"
              >
                <div className="min-w-0">
                  <div className="font-bold text-foreground">{sub.planLabel} Plan</div>
                  <div className="mt-0.5 text-[11px] text-muted-foreground">
                    Started {sub.startedAt}
                    {sub.caseId ? ` · Case ${sub.caseId}` : ""}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className="flex items-center font-bold text-foreground">
                    <IndianRupee className="h-3 w-3" />
                    {sub.amount}
                  </span>
                  <span
                    className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${STATUS_STYLE[sub.status]}`}
                  >
                    {sub.status}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
