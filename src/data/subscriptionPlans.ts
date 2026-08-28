import type { SubscriptionPlanId } from "@/types";

export interface SubscriptionPlan {
  id: SubscriptionPlanId;
  label: string;
  price: number;
  cadence: string;
  badge?: string;
  description: string;
}

/** Auto-Assign plan catalogue — shown on the "Find a Lawyer" wizard's
 * admin-assign step and on the citizen "My Subscriptions" page, so both
 * stay in sync on price/copy. */
export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: "monthly",
    label: "Monthly",
    price: 499,
    cadence: "/month",
    description: "Priority admin-assigned Lawyer support, billed every month.",
  },
  {
    id: "yearly",
    label: "Yearly",
    price: 4999,
    cadence: "/year",
    badge: "Save 17%",
    description: "Priority admin-assigned Lawyer support, billed once a year.",
  },
];
