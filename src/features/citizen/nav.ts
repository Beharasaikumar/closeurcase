import { LayoutGrid, Search, CreditCard } from "lucide-react";
import type { NavItem } from "@/layouts/DashboardLayout";

export const citizenNav: NavItem[] = [
  { to: "/citizen", label: "Dashboard", icon: LayoutGrid },
  { to: "/citizen/create-case", label: "Find an Lawyer", icon: Search },
  { to: "/citizen/subscriptions", label: "My Subscriptions", icon: CreditCard },
];
