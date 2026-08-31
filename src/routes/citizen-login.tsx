import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";

import { useState } from "react";

import { AuthLayout } from "@/layouts/AuthLayout";

import { Phone, ArrowLeft, ChevronRight, Tag } from "lucide-react";

import { InputOTP, InputOTPGroup, InputOTPSlot } from "@/components/ui/input-otp";

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

  if (!permissionsAcknowledged) {
    return <PermissionsGate onContinue={acknowledgePermissions} />;
  }

  return (
    <AuthLayout
      centerLogoOnMobile
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
          <form onSubmit={submitPhone} className="space-y-5">
            <div className="space-y-1.5">
              <label className="block text-base font-semibold text-foreground">
                {translate("mobileNumber")}
              </label>

              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground pointer-events-none" />

                <span className="absolute left-10 top-1/2 -translate-y-1/2 text-base font-bold text-muted-foreground">
                  +91
                </span>

                <input
                  type="tel"

                  inputMode="numeric"

                  autoComplete="tel"

                  maxLength={10}

                  required

                  value={phone}

                  onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}

                  placeholder="10-digit number"

                  className="w-full rounded-xl border-2 border-border bg-surface pl-20 pr-4 py-4 text-lg text-foreground focus:border-emerald-600 focus:outline-none focus:ring-2 focus:ring-emerald-600/20"
                />
              </div>
            </div>

            <button
              type="submit"

              disabled={!phoneValid}

              className="w-full rounded-xl bg-emerald-600 py-4 text-base font-bold text-white transition-all hover:bg-emerald-700 disabled:opacity-40 active:scale-[0.98]"
            >
              {translate("continueBtn")}
            </button>
          </form>
        )}

        {step === "otp" && (
          <div className="space-y-5">
            <button
              type="button"

              onClick={() => setStep("phone")}

              className="inline-flex items-center gap-1 text-sm font-semibold text-muted-foreground hover:text-foreground"
            >
              <ArrowLeft className="h-4 w-4" /> {translate("changeNumber")}
            </button>

            <div className="flex justify-center">
              <InputOTP maxLength={4} value={otp} onChange={setOtp}>
                <InputOTPGroup className="gap-2 sm:gap-3">
                  <InputOTPSlot index={0} className="h-14 w-12 sm:h-16 sm:w-14 text-xl border-2" />

                  <InputOTPSlot index={1} className="h-14 w-12 sm:h-16 sm:w-14 text-xl border-2" />

                  <InputOTPSlot index={2} className="h-14 w-12 sm:h-16 sm:w-14 text-xl border-2" />

                  <InputOTPSlot index={3} className="h-14 w-12 sm:h-16 sm:w-14 text-xl border-2" />
                </InputOTPGroup>
              </InputOTP>
            </div>

            {otpError && (
              <p className="text-center text-sm font-medium text-destructive">{otpError}</p>
            )}

            <button
              type="button"

              onClick={verifyOtp}

              disabled={otp.length !== 4}

              className="w-full rounded-xl bg-emerald-600 py-4 text-base font-bold text-white hover:bg-emerald-700 disabled:opacity-40 active:scale-[0.98]"
            >
              {translate("verifyContinue")}
            </button>
          </div>
        )}
      </div>
    </AuthLayout>
  );
}
