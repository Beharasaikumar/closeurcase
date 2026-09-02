import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { PageHeader } from "@/components/app/PageHeader";
import { ProfileForm, type ProfileFormFields } from "@/components/app/ProfileForm";
import { getLawyers, updateLawyerProfile } from "@/data/appStore";
import { ShieldCheck } from "lucide-react";
import { TextField } from "@/components/m3";

export const Route = createFileRoute("/lawyer/profile")({
  component: LawyerProfilePage,
});

// No real per-session lawyer identity exists in this mock app (see
// CLAUDE.md — lawyer/admin login doesn't persist a session) — fall back to
// the first seeded lawyer record, matching the demo record this page has
// always shown.
function LawyerProfilePage() {
  const lawyer = useMemo(() => getLawyers()[0], []);
  const [barId, setBarId] = useState(lawyer?.barId ?? "");
  const [practiceArea, setPracticeArea] = useState(
    lawyer?.category ? `${lawyer.category} Law` : "",
  );

  if (!lawyer) return null;

  function handleSave(fields: ProfileFormFields) {
    updateLawyerProfile(lawyer.id, fields);
  }

  return (
    <>
      <PageHeader
        title="Profile"
        description="Manage your professional details and practice information."
        actionsPosition="below"
      />

      <ProfileForm
        role="lawyer"
        defaults={{
          name: lawyer.name,
          email: lawyer.email,
          phone: lawyer.phone,
          city: lawyer.city,
        }}
        wide
        onSave={handleSave}
        extraField={() => (
          <div className="space-y-4">
            <TextField
              label="Practice Area"
              value={practiceArea}
              onChange={setPracticeArea}
              placeholder="e.g. Criminal Law, Family Law"
              className="w-full"
            />
            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3.5 space-y-2">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1">
                <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
                <span className="text-xs font-bold text-foreground uppercase tracking-wide">
                  Bar Council Registration Number
                </span>
                <span className="ml-auto whitespace-nowrap text-[10px] font-semibold text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                  Verified
                </span>
              </div>
              <TextField
                value={barId}
                onChange={setBarId}
                placeholder="e.g. TS/2014/1023"
                className="w-full font-mono tracking-wider"
              />
              <p className="text-[10px] text-muted-foreground leading-relaxed">
                Your Bar Council registration number is used for identity verification and is
                visible to the platform admin only.
              </p>
            </div>
          </div>
        )}
      />
    </>
  );
}
