import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { AuthLayout } from "@/layouts/AuthLayout";
import { CitizenLoginButton } from "@/components/app/CitizenLoginButton";
import { PermissionsGate } from "@/components/app/PermissionsGate";
import { usePermissionsGate } from "@/features/permissions/usePermissionsGate";
import { Scale } from "lucide-react";

export const Route = createFileRoute("/register")({
  head: () => ({ meta: [{ title: "Join CloseUrCase" }] }),
  component: Register,
});

function Register() {
  const navigate = useNavigate();
  const [permissionsAcknowledged, acknowledgePermissions] = usePermissionsGate();

  if (!permissionsAcknowledged) {
    return <PermissionsGate onContinue={acknowledgePermissions} />;
  }

  return (
    <AuthLayout
      centerLogoOnMobile
      title="Join CloseUrCase"
      subtitle="Citizens sign in with a mobile number. Lawyers register separately."
      footer={
        <>
          Lawyer or admin?{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            Email sign in
          </Link>
        </>
      }
    >
      <div className="space-y-3">
        <CitizenLoginButton label="Citizen Login" />
        <button
          type="button"
          onClick={() => navigate({ to: "/lawyer-register" })}
          className="flex w-full items-center gap-3 rounded-xl border border-border bg-surface p-4 text-left hover:border-primary hover:bg-muted/50 transition-colors"
        >
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-indigo-500/15 text-indigo-600">
            <Scale className="h-5 w-5" />
          </span>
          <span>
            <span className="block text-sm font-bold text-foreground">Register as Lawyer</span>
            <span className="block text-xs text-muted-foreground mt-0.5">
              Bar ID verification required
            </span>
          </span>
        </button>
      </div>
    </AuthLayout>
  );
}
