import { LayoutGrid, Users, Scale, Folder, BookOpen, Bell, User, IndianRupee } from "lucide-react";
import type { NavItem } from "@/layouts/DashboardLayout";

export const adminNav: NavItem[] = [
  { to: "/admin", label: "Dashboard", icon: LayoutGrid },
  { to: "/admin/users", label: "Users", icon: Users },
  { to: "/admin/lawyers", label: "Lawyers", icon: Scale },
  { to: "/admin/cases", label: "Case Management", icon: Folder },
  { to: "/admin/revenue", label: "Revenue", icon: IndianRupee },
  { to: "/admin/knowledge-base", label: "Knowledge Base", icon: BookOpen },
  { to: "/admin/notifications", label: "Notifications", icon: Bell },
  { to: "/admin/profile", label: "My Profile", icon: User },
];
