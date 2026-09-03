import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { PageHeader } from "@/components/app/PageHeader";
import { ProfileForm, type ProfileFormFields } from "@/components/app/ProfileForm";
import { getAdminProfile, updateAdminProfile } from "@/data/appStore";
import { ShieldCheck } from "lucide-react";

export const Route = createFileRoute("/admin/profile")({
  component: AdminProfilePage,
});

function AdminProfilePage() {
  const profile = useMemo(() => getAdminProfile(), []);

  function handleSave(fields: ProfileFormFields) {
    updateAdminProfile(fields);
  }

  return (
    <>
      <PageHeader
        title="Profile"
        description="Manage your platform administrator account details."
        actionsPosition="below"
      />

      <ProfileForm
        role="admin"
        defaults={profile}
        defaultPhotoUrl="/logo.png"
        wide
        onSave={handleSave}
        extraField={() => (
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3.5 space-y-2">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1">
              <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
              <span className="text-xs font-bold text-foreground uppercase tracking-wide">
                Access Level
              </span>
              <span className="ml-auto whitespace-nowrap text-[10px] font-semibold text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                Highest Privilege
              </span>
            </div>
            <p className="text-xs font-bold text-foreground">Super Admin</p>
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Full platform access — Lawyer verification, user management, case oversight, and
              knowledge base control.
            </p>
          </div>
        )}
      />
    </>
  );
}
