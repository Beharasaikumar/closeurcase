import { useState } from "react";
import { AlertTriangle, CheckCircle2, Loader2, ShieldCheck, XCircle } from "lucide-react";
import { AuthLayout } from "@/layouts/AuthLayout";
import {
  DEVICE_PERMISSIONS,
  getPermissionHint,
  requestDevicePermission,
  type DevicePermissionId,
  type DevicePermissionState,
} from "@/features/permissions/devicePermissions";

type StatusMap = Record<DevicePermissionId, DevicePermissionState>;

const initialStatus: StatusMap = {
  camera: "idle",
  microphone: "idle",
  location: "idle",
  notifications: "idle",
};

/** Full-screen gate shown once per browser session before any login/signup
 * screen, requesting the native camera/microphone/location/notifications
 * permissions up front with a plain-language reason for each. */
export function PermissionsGate({ onContinue }: { onContinue: () => void }) {
  const [status, setStatus] = useState<StatusMap>(initialStatus);
  const [requesting, setRequesting] = useState(false);
  const settled = DEVICE_PERMISSIONS.every(
    (p) => status[p.id] !== "idle" && status[p.id] !== "pending",
  );

  async function allowAll() {
    setRequesting(true);
    for (const permission of DEVICE_PERMISSIONS) {
      setStatus((prev) => ({ ...prev, [permission.id]: "pending" }));
      const result = await requestDevicePermission(permission.id);
      setStatus((prev) => ({ ...prev, [permission.id]: result }));
    }
    setRequesting(false);
  }

  return (
    <AuthLayout
      centerLogoOnMobile
      title="Before you continue"
      subtitle="CloseurCase needs a few device permissions to work well. We'll tell you why for each one."
    >
      <div className="space-y-3">
        {DEVICE_PERMISSIONS.map((permission) => {
          const hint = getPermissionHint(permission.id, status[permission.id]);
          return (
            <PermissionRow key={permission.id} state={status[permission.id]}>
              <permission.icon className="h-5 w-5 shrink-0 text-primary" />
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">{permission.label}</p>
                <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
                  {permission.reason}
                </p>
                {hint && (
                  <p className="mt-1.5 text-xs leading-relaxed font-medium text-amber-600">
                    {hint}
                  </p>
                )}
              </div>
            </PermissionRow>
          );
        })}

        <div className="flex items-start gap-2 rounded-lg bg-muted/50 p-3 text-xs text-muted-foreground">
          <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
          <span>
            Your browser will show its own permission prompts. You can allow or deny each one — you
            can always change your choice later in your browser or device settings.
          </span>
        </div>

        <button
          type="button"
          onClick={settled ? onContinue : allowAll}
          disabled={requesting}
          className="w-full rounded-xl bg-emerald-600 py-4 text-base font-bold text-white transition-all hover:bg-emerald-700 disabled:opacity-60 active:scale-[0.98]"
        >
          {requesting ? "Requesting…" : settled ? "Continue" : "Allow permissions & continue"}
        </button>

        {!settled && (
          <button
            type="button"
            onClick={onContinue}
            disabled={requesting}
            className="w-full text-center text-sm font-semibold text-muted-foreground hover:text-foreground disabled:opacity-60"
          >
            Skip for now
          </button>
        )}
      </div>
    </AuthLayout>
  );
}

function PermissionRow({
  state,
  children,
}: {
  state: DevicePermissionState;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-start gap-3 rounded-xl border border-border bg-surface p-3">
      {children}
      <div className="shrink-0 pt-0.5">
        <StatusBadge state={state} />
      </div>
    </div>
  );
}

function StatusBadge({ state }: { state: DevicePermissionState }) {
  switch (state) {
    case "pending":
      return <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />;
    case "granted":
      return <CheckCircle2 className="h-4 w-4 text-emerald-600" aria-label="Allowed" />;
    case "denied":
      return <XCircle className="h-4 w-4 text-destructive" aria-label="Denied" />;
    case "unavailable":
      return <AlertTriangle className="h-4 w-4 text-amber-600" aria-label="Turned off" />;
    case "unsupported":
      return <span className="text-[10px] font-semibold uppercase text-muted-foreground">N/A</span>;
    default:
      return null;
  }
}
