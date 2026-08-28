import { createFileRoute, redirect } from "@tanstack/react-router";
import {
  Mic,
  Sparkles,
  Activity,
  CheckCircle2,
  Building2,
  BookOpen,
  Download,
  MapPin,
  ShieldCheck,
} from "lucide-react";
import { PublicLayout } from "@/layouts/PublicLayout";
import { CitizenLoginButton, ProfessionalLoginLink } from "@/components/app/CitizenLoginButton";
import { CitizenLanguageButtons } from "@/features/citizen/CitizenLanguageButtons";
import { useCitizenLanguage } from "@/features/citizen/i18n/CitizenLanguageContext";
import { TrustedLawyers } from "@/components/app/TrustedLawyers";
import { WhatsAppInlineIcon, whatsappUrl } from "@/components/app/WhatsAppButton";
import { getCitizenSession } from "@/features/citizen/session";
import { isMobileStandalonePwa } from "@/lib/pwaInstall";
import { usePwaInstall } from "@/lib/usePwaInstall";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    if (typeof window !== "undefined" && isMobileStandalonePwa()) {
      const session = getCitizenSession();
      throw redirect({ to: session.authenticated ? "/citizen" : "/citizen-login" });
    }
  },
  head: () => ({ meta: [{ title: "CloseurCase — Legal Platform" }] }),
  component: LandingPage,
});

const TRUST_POINTS = ["Verified Lawyers", "AI case matching", "Real-time tracking"];

const STEPS = [
  {
    icon: Mic,
    title: "Describe your case",
    desc: "Tell us what happened — by text or voice, in your own words.",
  },
  {
    icon: Sparkles,
    title: "Get matched",
    desc: "Our AI matches you with a verified Lawyer in Hyderabad or Visakhapatnam.",
  },
  {
    icon: Activity,
    title: "Track progress",
    desc: "Follow every hearing, document, and status update in real time.",
  },
  {
    icon: CheckCircle2,
    title: "Case resolved",
    desc: "Reach resolution with a licensed Lawyer, start to finish.",
  },
];

const TRUST_DETAILS = [
  "Every Lawyer is bar-verified before they can accept a case",
  "You always know exactly who is representing you",
  "Status updates and hearing dates, never guesswork",
];

const ABOUT_POINTS = [
  {
    icon: Sparkles,
    text: "AI reads your case description and predicts the right legal category",
  },
  { icon: MapPin, text: "Matched with a verified Lawyer near you, or auto-assigned by our team" },
  { icon: Activity, text: "Track every hearing, document, and status update in real time" },
  { icon: ShieldCheck, text: "Every Lawyer is bar-verified before they can accept a case" },
];

function LandingPage() {
  const { translate } = useCitizenLanguage();

  return (
    <PublicLayout>
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative flex items-center overflow-hidden bg-slate-950 lg:min-h-[calc(100vh-4rem)]">
        {/* Courtroom Background Image */}
        <div
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{ backgroundImage: "url('/bghero.png')" }}
        />
        {/* Gradient Overlay for Readability */}
        <div className="absolute inset-0 bg-gradient-to-r from-slate-950/90 via-slate-950/75 to-slate-950/55 backdrop-blur-[1px]" />

        <div className="relative z-10 mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16 grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10 items-center">
          <div className="lg:col-span-7 space-y-4 sm:space-y-6 lg:space-y-7">
            <div className="md:hidden">
              <CitizenLanguageButtons size="sm" showLabel={false} className="max-w-fit" />
            </div>

            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-3.5 py-1.5 text-xs font-bold text-white backdrop-blur-md border border-white/10">
              <Sparkles className="h-3.5 w-3.5 text-amber-300" />
              AI-Powered Legal Platform
            </span>

            <div>
              <h1 className="text-3xl font-bold tracking-tight text-white sm:text-5xl lg:text-[3.4rem] leading-[1.1] sm:leading-[1.08] drop-shadow-sm">
                {translate("heroTitle")}
              </h1>
              <p className="mt-3 sm:mt-5 max-w-xl text-sm sm:text-lg text-white/80 leading-relaxed">
                {translate("heroDesc")}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row gap-2.5 sm:gap-3 max-w-md">
              <CitizenLoginButton label={translate("citizenLoginLabel")} />
              <ProfessionalLoginLink className="border-white/25 bg-transparent text-white hover:bg-white/10" />
            </div>

            <div className="flex flex-wrap items-center gap-x-6 gap-y-2 pt-1">
              {TRUST_POINTS.map((point) => (
                <span
                  key={point}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-white/70"
                >
                  <CheckCircle2 className="h-3.5 w-3.5 text-emerald-400 shrink-0" />
                  {point}
                </span>
              ))}
            </div>
          </div>

          {/* Lawyer portrait */}
          <div className="lg:col-span-5">
            <div className="relative mx-auto max-h-[32vh] max-w-[220px] sm:max-h-[45vh] sm:max-w-xs lg:max-h-[60vh] lg:max-w-none">
              <div className="absolute -inset-6 -z-10 rounded-[2.5rem] bg-white/5 blur-2xl" />
              <img
                src="https://images.unsplash.com/photo-1742981365880-698cfb84492d?w=800&h=1000&fit=crop&crop=faces&q=80"
                alt="An Lawyer on the CloseurCase network, ready to take your case"
                className="aspect-square max-h-[32vh] sm:max-h-[45vh] lg:max-h-[60vh] w-full rounded-[2rem] object-cover shadow-[0_30px_70px_-20px_rgba(0,0,0,0.55)]"
                loading="eager"
              />
            </div>
          </div>
        </div>
      </section>

      {/* ── Trusted Lawyers ────────────────────────────────────────────── */}
      <TrustedLawyers />

      {/* ── About ────────────────────────────────────────────────────────── */}
      <section id="about" className="scroll-mt-20 border-t border-border py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl mb-8">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">
              About CloseurCase
            </span>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Structured legal help, backed by real Lawyers
            </h2>
          </div>

          <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8">
            <p className="max-w-3xl text-sm leading-relaxed text-muted-foreground">
              CloseurCase bridges the gap between citizens facing legal challenges and licensed
              legal professionals. AI helps you get started and finds the right fit fast — but every
              matter is ultimately handled by a bar-verified Lawyer, so you always know exactly
              who's representing you, from filing to resolution.
            </p>
            <ul className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {ABOUT_POINTS.map((point) => (
                <li key={point.text} className="flex items-start gap-2.5 text-sm text-foreground">
                  <point.icon className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <span>{point.text}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section className="border-t border-border py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl mb-14">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">
              How it works
            </span>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              From filing to resolution
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Four steps, fully tracked, from the moment you describe your matter.
            </p>
          </div>

          <div className="relative">
            <div className="absolute top-6 left-0 right-0 hidden h-px bg-border lg:block" />
            <div className="grid grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-4 lg:gap-8">
              {STEPS.map((step, i) => (
                <div key={step.title} className="relative">
                  <div className="relative z-10 flex h-12 w-12 items-center justify-center rounded-full bg-primary text-white ring-8 ring-background">
                    <step.icon className="h-5 w-5" />
                  </div>
                  <span className="mt-4 block text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                    Step {i + 1}
                  </span>
                  <h3 className="mt-1 text-base font-bold text-foreground">{step.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground leading-relaxed">
                    {step.desc}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ── Trust / consultation photo ───────────────────────────────────── */}
      <section className="border-t border-border py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid grid-cols-1 lg:grid-cols-2 gap-14 lg:gap-16 items-center">
          <div className="relative">
            <div className="absolute -inset-6 -z-10 hidden rounded-[2.5rem] bg-primary/5 blur-2xl sm:block" />
            <img
              src="/landing2.jpeg"
              alt="An Lawyer reviewing case details at her desk"
              className="aspect-4/3 w-full rounded-2xl object-cover shadow-[0_30px_60px_-25px_rgba(6,33,62,0.25)]"
              loading="lazy"
            />
          </div>

          <div className="space-y-6">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">
              Personal, not automated
            </span>
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl leading-tight">
              Every case is reviewed by a real Lawyer
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              AI helps you get started and finds the right fit fast — but every matter is ultimately
              handled by a licensed Lawyer verified by our platform, so you always know exactly
              who's representing you.
            </p>
            <ul className="space-y-3">
              {TRUST_DETAILS.map((point) => (
                <li key={point} className="flex items-start gap-3 text-sm text-foreground">
                  <CheckCircle2 className="h-4 w-4 mt-0.5 text-emerald-600 shrink-0" />
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* ── Platform highlights ──────────────────────────────────────────── */}
      <section className="border-t border-border py-14 sm:py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="max-w-xl mb-12">
            <span className="text-xs font-bold uppercase tracking-widest text-primary">
              Why CloseurCase
            </span>
            <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              Platform highlights
            </h2>
          </div>
          <div className="grid gap-10 sm:grid-cols-3">
            <Feature
              icon={<Sparkles className="h-5 w-5" />}
              title="AI Category Prediction"
              desc="Describe your issue in plain language and get a suggested legal category."
            />
            <Feature
              icon={<BookOpen className="h-5 w-5" />}
              title="Knowledge Base"
              desc="Statutory acts and rules indexed for Lawyer research and AI assistance."
            />
            <Feature
              icon={<Building2 className="h-5 w-5" />}
              title="Geo-Matching & Tracking"
              desc="Match with nearby Lawyers and follow case milestones in real time."
            />
          </div>
        </div>
      </section>

      {/* ── WhatsApp banner ──────────────────────────────────────────────── */}
      <section className="border-t border-border py-10 sm:py-14">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-5 rounded-2xl bg-emerald-50/70 px-6 py-6 sm:px-9 sm:py-7">
            <div className="flex items-center gap-4 text-center sm:text-left">
              <div className="hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#25D366] text-white">
                <WhatsAppInlineIcon className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-base font-bold text-foreground sm:text-lg">
                  Have a question? Chat with our WhatsApp assistant
                </h2>
                <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                  Get instant answers from our AI chatbot on WhatsApp, anytime.
                </p>
              </div>
            </div>
            <a
              href={whatsappUrl("Hi, I'd like to know more about CloseurCase.")}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex w-full sm:w-auto shrink-0 items-center justify-center gap-2 rounded-xl bg-[#25D366] px-6 py-3 text-sm font-bold text-white hover:bg-[#20bd5a] transition-colors"
            >
              <WhatsAppInlineIcon className="h-4 w-4" />
              Message us
            </a>
          </div>
        </div>
      </section>

      {/* ── Install app banner ───────────────────────────────────────────── */}
      <InstallAppBanner />
    </PublicLayout>
  );
}

function InstallAppBanner() {
  const { canInstall, promptInstall } = usePwaInstall();

  if (!canInstall) return null;

  return (
    <section className="border-t border-border py-10 sm:py-14">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row items-center justify-between gap-5 rounded-2xl bg-primary/5 px-6 py-6 sm:px-9 sm:py-7">
          <div className="flex items-center gap-4 text-center sm:text-left">
            <div className="hidden sm:flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-white">
              <Download className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-foreground sm:text-lg">
                Get the CloseurCase app
              </h2>
              <p className="mt-1 text-xs sm:text-sm text-muted-foreground">
                Install CloseurCase on your device for quick, one-tap access anytime.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={promptInstall}
            className="inline-flex w-full sm:w-auto shrink-0 items-center justify-center gap-2 rounded-xl bg-primary px-6 py-3 text-sm font-bold text-white hover:bg-primary/90 transition-colors"
          >
            <Download className="h-4 w-4" />
            Download now
          </button>
        </div>
      </div>
    </section>
  );
}

function Feature({ icon, title, desc }: { icon: React.ReactNode; title: string; desc: string }) {
  return (
    <div className="space-y-3">
      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-primary/10 text-primary">
        {icon}
      </div>
      <div>
        <h4 className="font-bold text-foreground text-sm">{title}</h4>
        <p className="mt-1.5 text-xs text-muted-foreground leading-relaxed">{desc}</p>
      </div>
    </div>
  );
}
