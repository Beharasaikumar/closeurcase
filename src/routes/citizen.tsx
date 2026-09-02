import { Outlet, createFileRoute, redirect, useRouterState } from "@tanstack/react-router";
import { useMemo } from "react";
import { LayoutGrid, Search, Folder, User, Bell, CreditCard } from "lucide-react";
import { DashboardLayout } from "@/layouts/DashboardLayout";
import { useCitizenLanguage } from "@/features/citizen/i18n/CitizenLanguageContext";
import { getCitizenSession } from "@/features/citizen/session";

export const Route = createFileRoute("/citizen")({
  beforeLoad: () => {
    if (typeof window !== "undefined") {
      const session = getCitizenSession();
      if (!session.authenticated) {
        throw redirect({ to: "/citizen-login" });
      }
    }
  },
  component: CitizenLayout,
});

function CitizenLayout() {
  const { translate } = useCitizenLanguage();
  // Demo citizen profile: Sai Teja Reddy (u_001) — must match /citizen/profile's
  // name so the avatar (derived from this name) stays consistent app-wide.
  const userName = "Sai Teja Reddy";
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isChatRoute = /^\/citizen\/chat\//.test(pathname);
  // The Find a Lawyer wizard manages its own fixed header/footer + internal
  // scroll region (no page-level scrolling), same reasoning as chat.
  const isCreateCaseRoute = pathname === "/citizen/create-case";

  const nav = useMemo(
    () => [
      { to: "/citizen", label: translate("navDashboard"), icon: LayoutGrid },
      { to: "/citizen/create-case", label: translate("navFindLawyer"), icon: Search },
      { to: "/citizen/my-cases", label: translate("navMyCases"), icon: Folder },
      {
        to: "/citizen/subscriptions",
        label: translate("navMySubscriptions"),
        icon: CreditCard,
      },
      { to: "/citizen/notifications", label: translate("navNotifications"), icon: Bell },
      { to: "/citizen/profile", label: translate("navMyProfile"), icon: User },
    ],
    [translate],
  );

  return (
    <DashboardLayout
      role="citizen"
      roleLabel="Citizen"
      userName={userName}
      nav={nav}
      fullBleed={isChatRoute || isCreateCaseRoute}
    >
      <Outlet />
    </DashboardLayout>
  );
}
