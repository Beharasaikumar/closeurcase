import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { PageHeader } from "@/components/app/PageHeader";
import { ProfileForm, type ProfileFormFields } from "@/components/app/ProfileForm";
import { getCitizens, updateCitizenProfile } from "@/data/appStore";

export const Route = createFileRoute("/citizen/profile")({
  component: CitizenProfilePage,
});

// No real per-session citizen identity exists in this mock app (see
// CLAUDE.md — citizen "auth" only writes a session object, not a full
// profile) — fall back to the first seeded citizen record, matching the
// demo record this page has always shown.
function CitizenProfilePage() {
  const citizen = useMemo(() => getCitizens()[0], []);

  if (!citizen) return null;

  function handleSave(fields: ProfileFormFields) {
    updateCitizenProfile(citizen.id, fields);
  }

  return (
    <>
      <PageHeader
        title="Profile"
        description="Manage your personal information."
        actionsPosition="below"
      />
      <ProfileForm
        role="citizen"
        defaults={{
          name: citizen.name,
          email: citizen.email,
          phone: citizen.phone,
          city: citizen.city,
          aadhar: "",
        }}
        wide
        onSave={handleSave}
      />
    </>
  );
}
