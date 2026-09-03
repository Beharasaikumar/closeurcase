import { createFileRoute, redirect, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { PublicLayout } from "@/layouts/PublicLayout";
import { getCitizenSession } from "@/features/citizen/session";
import { isMobileStandalonePwa } from "@/lib/pwaInstall";
import { Hero } from "@/landing-page/sections/Hero";
import { RecognitionStrip } from "@/landing-page/sections/RecognitionStrip";
import { About } from "@/landing-page/sections/About";
import { PracticeCategories } from "@/landing-page/sections/PracticeCategories";
import { TrustedLawyers } from "@/landing-page/TrustedLawyers";
import { HowItWorks } from "@/landing-page/sections/HowItWorks";
import { CourtExplainer } from "@/landing-page/sections/CourtExplainer";
import { PersonalNotAutomated } from "@/landing-page/sections/PersonalNotAutomated";
import { Testimonials } from "@/landing-page/sections/Testimonials";
import { PracticeAreasGrid } from "@/landing-page/sections/PracticeAreasGrid";
import { FinalCta } from "@/landing-page/sections/FinalCta";
import { ContactBanner } from "@/landing-page/sections/ContactBanner";

export const Route = createFileRoute("/")({
  beforeLoad: () => {
    if (typeof window !== "undefined" && isMobileStandalonePwa()) {
      const session = getCitizenSession();
      throw redirect({ to: session.authenticated ? "/citizen" : "/citizen-login" });
    }
  },
  head: () => ({ meta: [{ title: "CloseUrCase — Legal Platform" }] }),
  component: LandingPage,
});

function LandingPage() {
  const navigate = useNavigate();
  const hash = useRouterState({ select: (s) => s.location.hash });

  // `scroll-behavior: smooth` plus a lingering `#about`/`#contact` in the URL
  // can fight the user's own scrolling afterwards (the browser keeps
  // re-honoring the anchor target) — once the smooth-scroll has had time to
  // land, drop the hash so nothing keeps pulling the page back to it.
  useEffect(() => {
    if (hash !== "about" && hash !== "contact") return;
    const timer = setTimeout(() => {
      navigate({ to: "/", hash: "", replace: true, resetScroll: false });
    }, 900);
    return () => clearTimeout(timer);
  }, [hash, navigate]);

  return (
    <PublicLayout>
      <Hero />
      <RecognitionStrip />
      <About />
      <PracticeCategories />
      <TrustedLawyers />
      <HowItWorks />
      <CourtExplainer />
      <PersonalNotAutomated />
      <Testimonials />
      <PracticeAreasGrid />
      <FinalCta />
      <ContactBanner />
    </PublicLayout>
  );
}
