import { LayoutGrid, Search, Activity } from "lucide-react";
import type { NavItem } from "@/layouts/DashboardLayout";

export const citizenNav: NavItem[] = [
  { to: "/citizen", label: "Dashboard", icon: LayoutGrid },
  { to: "/citizen/create-case", label: "Find an Lawyer", icon: Search },
  { to: "/citizen/track-case", label: "Track Case", icon: Activity },
];
