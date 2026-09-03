import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AuthLayout } from "@/layouts/AuthLayout";
import { Phone, ArrowLeft, ChevronRight, Tag } from "lucide-react";
import { OtpInput, TextField, Button } from "@/components/m3";
import { FormStepper } from "@/components/app/FormStepper";
import type { FormStep } from "@/components/app/FormStepper";
import { PermissionsGate } from "@/components/app/PermissionsGate";
import { usePermissionsGate } from "@/features/permissions/usePermissionsGate";
import { setCitizenSession } from "@/features/citizen/session";
import { CitizenLanguageButtons } from "@/features/citizen/CitizenLanguageButtons";
import { useCitizenLanguage } from "@/features/citizen/i18n/CitizenLanguageContext";

interface SearchParams {
  area?: string;
  specialization?: string;
  service?: string;
}

export const Route = createFileRoute("/citizen-login")({
  head: () => ({ meta: [{ title: "Citizen sign in — CloseUrCase" }] }),

  validateSearch: (s: Record<string, unknown>): SearchParams => ({
    area: typeof s.area === "string" ? s.area : undefined,
    specialization: typeof s.specialization === "string" ? s.specialization : undefined,
    service: typeof s.service === "string" ? s.service : undefined,
  }),

  component: CitizenLogin,
});

type Step = "phone" | "otp";

const STATIC_OTP = "0000";

/** Numeric id per `Step`, for the shared `FormStepper` (which is id-based,
 * matching its other caller in lawyer-register.tsx) — kept separate from the
 * `Step` union so the rest of this file's phone/otp branching is untouched. */
const STEP_IDS: Record<Step, number> = { phone: 1, otp: 2 };
const LOGIN_STEPS: FormStep[] = [
  { id: 1, label: "Mobile number" },
  { id: 2, label: "Verify OTP" },
];

export function CitizenLogin() {
  const navigate = useNavigate();

  const { area, specialization, service } = Route.useSearch();

  const { translate } = useCitizenLanguage();

  const [permissionsAcknowledged, acknowledgePermissions] = usePermissionsGate();

  const [step, setStep] = useState<Step>("phone");

  const [phone, setPhone] = useState("");

  const [otp, setOtp] = useState("");

  const [otpError, setOtpError] = useState("");

  const phoneDigits = phone.replace(/\D/g, "");

  const phoneValid = phoneDigits.length === 10;

  const submitPhone = (e: React.FormEvent) => {
    e.preventDefault();

    if (!phoneValid) return;

    setStep("otp");

    setOtp("");

    setOtpError("");
  };

  const verifyOtp = () => {
    if (otp !== STATIC_OTP) {
      setOtpError("Invalid OTP. Use 0000 for demo access.");

      return;
    }

    setOtpError("");

    setCitizenSession({ phone: phoneDigits, authenticated: true, casePath: "new" });

    navigate({ to: "/citizen" });
  };

  const handleFormEnterKey = (e: React.KeyboardEvent<HTMLElement>) => {
    if (e.key !== "Enter") return;
    const target = e.target as HTMLElement;
    if (target.closest("textarea")) return;
    const form = target.closest("form");
    if (!form) return;
    e.preventDefault();
    form.requestSubmit();
  };

  if (!permissionsAcknowledged) {
    return <PermissionsGate onContinue={acknowledgePermissions} image="/citizen-login.png" />;
  }

  return (
    <AuthLayout
      centerLogoOnMobile
      image="/citizen-login.png"
      title={step === "phone" ? translate("citizenLoginLabel") : translate("verifyOtpTitle")}

      subtitle={
        step === "phone"
          ? translate("citizenLoginSubtitle")
          : `${translate("verifyOtpDesc")} (+91 ${phoneDigits.slice(0, 5)} ${phoneDigits.slice(5)})`
      }

      footer={
        <>
          {translate("LawyerAdminSignIn")}{" "}
          <Link to="/login" className="font-semibold text-primary hover:underline">
            {translate("lawyerAdminLogin")}
          </Link>
        </>
      }
    >
      <div className="space-y-5">
        <div className="hidden lg:block lg:shrink-0">
          <FormStepper
            steps={LOGIN_STEPS}
            current={STEP_IDS[step]}
            furthest={STEP_IDS[step]}
            onStepClick={(id) => setStep(id === 1 ? "phone" : "otp")}
            ariaLabel="Citizen sign-in progress"
          />
        </div>

        {(area || specialization || service) && (
          <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-primary/20 bg-primary/5 px-3 py-2 text-xs text-muted-foreground">
            <Tag className="h-3.5 w-3.5 shrink-0 text-primary" />
            {area && <span>{area}</span>}
            {specialization && (
              <>
                <ChevronRight className="h-3 w-3 shrink-0" />
                <span>{specialization}</span>
              </>
            )}
            {service && (
              <>
                <ChevronRight className="h-3 w-3 shrink-0" />
                <span className="font-semibold text-foreground">{service}</span>
              </>
            )}
          </div>
        )}

        <CitizenLanguageButtons size="sm" showLabel={false} className="max-w-fit" />

        {step === "phone" && (
          <form onKeyDown={handleFormEnterKey} onSubmit={submitPhone} className="space-y-5">
            <TextField
              label={translate("mobileNumber")}
              type="tel"
              required
              value={phone}
              onChange={(v) => setPhone(v.replace(/\D/g, "").slice(0, 10))}
              placeholder="10-digit number"
              leadingIcon={<Phone className="h-4 w-4" />}
              prefixText="+91"
              maxLength={10}
              className="w-full"
            />

            <Button type="submit" variant="filled" disabled={!phoneValid} className="w-full">
              {translate("continueBtn")}
            </Button>
          </form>
        )}

        {step === "otp" && (
          <div className="space-y-5">
            <Button
              variant="text"
              icon={<ArrowLeft className="h-4 w-4" />}
              onClick={() => setStep("phone")}
            >
              {translate("changeNumber")}
            </Button>

            <div className="flex justify-center">
              <OtpInput
                length={4}
                value={otp}
                onChange={setOtp}
                error={!!otpError}
                autoFocus
                ariaLabel={translate("verifyOtpTitle")}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && otp.length === 4) {
                    e.preventDefault();
                    verifyOtp();
                  }
                }}
              />
            </div>

            {otpError && (
              <p className="text-center text-sm font-medium text-destructive">{otpError}</p>
            )}

            <Button
              type="button"
              variant="filled"
              onClick={verifyOtp}
              disabled={otp.length !== 4}
              className="w-full"
            >
              {translate("verifyContinue")}
            </Button>
          </div>
        )}
      </div>
    </AuthLayout>
  );
}
