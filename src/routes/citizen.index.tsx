import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect } from "react";
import { Briefcase, Clock, CheckCircle2, CalendarClock } from "lucide-react";
import { PageHeader } from "@/components/app/PageHeader";
import { CasesTable } from "@/components/app/CasesTable";
import { LocationIndicator } from "@/components/app/LocationIndicator";
import { getCases, subscribeToStore } from "@/data/appStore";
import type { LegalCase } from "@/types";
import { useCitizenLanguage } from "@/features/citizen/i18n/CitizenLanguageContext";
import { Card } from "@/components/m3";
import { nextHearingSortKey } from "@/components/app/caseDocketShared";

export const Route = createFileRoute("/citizen/")({
  component: CitizenDashboard,
});

function CitizenDashboard() {
  const { translate } = useCitizenLanguage();
  const [allCases, setAllCases] = useState<LegalCase[]>(getCases);

  useEffect(() => {
    const sync = () => setAllCases(getCases());
    return subscribeToStore(sync);
  }, []);

  const activeCases = allCases.filter((c) => c.status !== "Resolved" && c.status !== "Closed");
  const resolvedCases = allCases.filter((c) => c.status === "Resolved" || c.status === "Closed");

  const today = new Date().toISOString().slice(0, 10);
  const upcomingHearingsCount = allCases.reduce(
    (count, c) => count + c.hearings.filter((h) => h.date >= today).length,
    0,
  );

  const pendingCases = [...allCases.filter((c) => c.status === "Pending")].sort((a, b) =>
    nextHearingSortKey(a).localeCompare(nextHearingSortKey(b)),
  );

  return (
    <div className="space-y-5 sm:space-y-6">
      {/* Desktop already shows this in the top app bar — mobile only, here. */}
      <div className="md:hidden">
        <LocationIndicator />
      </div>

      <PageHeader
        title={translate("dashboardTitle")}
        description={translate("dashboardDesc")}
        actionsPosition="below"
      />

      {/* Stat cards */}
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Card className="flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--md-sys-shape-corner-medium)] bg-primary/10 text-primary">
            <Briefcase className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xl font-extrabold leading-none text-foreground">
              {allCases.length}
            </div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              My Cases
            </div>
          </div>
        </Card>

        <Card className="flex items-center gap-3 p-4">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--md-sys-shape-corner-medium)]"
            style={{
              backgroundColor:
                "color-mix(in srgb, var(--md-extended-color-warning) 15%, transparent)",
              color: "var(--md-extended-color-warning)",
            }}
          >
            <Clock className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xl font-extrabold leading-none text-foreground">
              {activeCases.length}
            </div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Active
            </div>
          </div>
        </Card>

        <Card className="flex items-center gap-3 p-4">
          <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--md-sys-shape-corner-medium)]"
            style={{
              backgroundColor:
                "color-mix(in srgb, var(--md-extended-color-success) 15%, transparent)",
              color: "var(--md-extended-color-success)",
            }}
          >
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xl font-extrabold leading-none text-foreground">
              {resolvedCases.length}
            </div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Resolved
            </div>
          </div>
        </Card>

        <Card className="flex items-center gap-3 p-4">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--md-sys-shape-corner-medium)] bg-primary/10 text-primary">
            <CalendarClock className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <div className="text-xl font-extrabold leading-none text-foreground">
              {upcomingHearingsCount}
            </div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Hearings
            </div>
          </div>
        </Card>
      </div>

      {/* Upcoming hearings — pending cases only, soonest hearing first */}
      <div className="space-y-3">
        <div className="flex items-center gap-2">
          <CalendarClock className="h-5 w-5 text-primary" />
          <h2 className="text-sm font-bold text-foreground">Upcoming Hearings</h2>
        </div>

        {pendingCases.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border bg-background p-4 text-center text-xs text-muted-foreground">
            No pending cases with upcoming hearings.
          </p>
        ) : (
          <CasesTable cases={pendingCases} role="citizen" />
        )}
      </div>
    </div>
  );
}
