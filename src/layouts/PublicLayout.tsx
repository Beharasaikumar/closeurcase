import { Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import type { ReactNode } from "react";
import { ChevronDown, Menu, X } from "lucide-react";
import { CitizenLoginButton } from "@/components/app/CitizenLoginButton";
import { CitizenLanguageButtons } from "@/features/citizen/CitizenLanguageButtons";
import { PublicNav } from "@/components/app/PublicNav";
import { LAWYER_PRACTICE_AREAS } from "@/components/app/lawyerPracticeAreas";
import { GOVERNMENT_SERVICES } from "@/data/governmentServices";
import { useCitizenLanguage } from "@/features/citizen/i18n/CitizenLanguageContext";

export function PublicLayout({ children }: { children: ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false);
  const [openAreaName, setOpenAreaName] = useState<string | null>(null);
  const [openSpecName, setOpenSpecName] = useState<string | null>(null);
  const [govServicesOpen, setGovServicesOpen] = useState(false);
  const [openGovCategory, setOpenGovCategory] = useState<string | null>(null);
  const { translate } = useCitizenLanguage();

  function closeMobileMenu() {
    setIsMobileMenuOpen(false);
    setMobileCategoriesOpen(false);
    setOpenAreaName(null);
    setOpenSpecName(null);
    setGovServicesOpen(false);
    setOpenGovCategory(null);
  }

  // Lock background scroll while the drawer is open, and let Escape close it.
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") closeMobileMenu();
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isMobileMenuOpen]);

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border bg-white/85 backdrop-blur-md sticky top-0 z-40">
        <div className="mx-auto grid h-16 w-full max-w-7xl grid-cols-[auto_1fr_auto] items-center gap-3 px-4 sm:px-6 lg:px-8">
          <Link to="/" className="flex items-center gap-2.5 shrink-0 hover:opacity-90">
            <img src="/logo.png" alt="CloseUrCase Logo" className="h-9 w-9 object-contain" />
            <span className="flex flex-col leading-tight">
              <span className="text-base font-bold tracking-tight text-foreground">
                CloseUrCase
              </span>
              <span className="text-[10px] font-medium tracking-wide text-muted-foreground">
                Just click for justice
              </span>
            </span>
          </Link>

          <PublicNav />

          <div className="flex items-center gap-2 justify-self-end">
            <div className="hidden md:flex items-center gap-2 shrink-0">
              <CitizenLanguageButtons size="sm" showLabel={false} />
              <CitizenLoginButton size="header" label="File a Case" />
              <Link
                to="/login"
                className="rounded-lg px-3.5 py-2 text-xs font-semibold text-foreground hover:bg-muted whitespace-nowrap transition-colors"
              >
                {translate("lawyerAdminLogin")}
              </Link>
            </div>

            <button
              type="button"
              onClick={() => setIsMobileMenuOpen((v) => !v)}
              className="md:hidden p-2 text-foreground hover:bg-muted rounded-md"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Backdrop + slide-in drawer live outside <header> on purpose: the header's
          backdrop-blur-md gives it a `backdrop-filter`, which makes it the containing
          block for any `position: fixed` descendant — inset-y-0 would then resolve
          against the header's own ~64px box instead of the viewport. */}
      <div
        className={`fixed inset-0 z-40 bg-black/40 transition-opacity duration-300 md:hidden ${
          isMobileMenuOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        onClick={closeMobileMenu}
        aria-hidden="true"
      />

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Mobile menu"
        className={`fixed inset-y-0 right-0 z-50 w-4/5 max-w-sm overflow-y-auto border-l border-border bg-surface shadow-2xl transition-transform duration-300 ease-out md:hidden ${
          isMobileMenuOpen ? "translate-x-0" : "translate-x-full"
        }`}
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-4">
          <span className="text-sm font-bold text-foreground">Menu</span>
          <button
            type="button"
            onClick={closeMobileMenu}
            className="p-2 text-foreground hover:bg-muted rounded-md"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="space-y-3 px-4 py-4">
          <CitizenLanguageButtons size="sm" showLabel={false} />

          <div className="overflow-hidden rounded-xl border border-border bg-background">
            <button
              type="button"
              onClick={() => setMobileCategoriesOpen((v) => !v)}
              className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-foreground hover:bg-muted"
            >
              Find a Lawyer
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-200 ${
                  mobileCategoriesOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            <div
              className={`overflow-hidden transition-[max-height] duration-300 ease-out ${
                mobileCategoriesOpen ? "max-h-500" : "max-h-0"
              }`}
            >
              <div className="border-t border-border">
                {LAWYER_PRACTICE_AREAS.map((area) => {
                  const isAreaOpen = openAreaName === area.name;
                  return (
                    <div key={area.name} className="border-b border-border last:border-b-0">
                      <button
                        type="button"
                        onClick={() => {
                          setOpenAreaName(isAreaOpen ? null : area.name);
                          setOpenSpecName(null);
                        }}
                        className="flex w-full items-center justify-between px-4 py-2.5 text-left text-xs font-semibold text-foreground hover:bg-muted"
                      >
                        {area.name}
                        <ChevronDown
                          className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${
                            isAreaOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>

                      {isAreaOpen && (
                        <div className="space-y-1 bg-muted/30 px-4 pb-2">
                          {area.specializations.map((spec) => {
                            const isSpecOpen = openSpecName === spec.name;
                            return (
                              <div key={spec.name}>
                                <button
                                  type="button"
                                  onClick={() => setOpenSpecName(isSpecOpen ? null : spec.name)}
                                  className="flex w-full items-center justify-between rounded-md px-2 py-2 text-left text-xs font-medium text-foreground hover:bg-muted"
                                >
                                  {spec.name}
                                  <ChevronDown
                                    className={`h-3 w-3 shrink-0 transition-transform duration-200 ${
                                      isSpecOpen ? "rotate-180" : ""
                                    }`}
                                  />
                                </button>

                                {isSpecOpen && (
                                  <ul className="mb-1 ml-2 space-y-0.5 border-l border-border pl-3">
                                    {spec.legalServices.map((service) => (
                                      <li key={service}>
                                        <Link
                                          to="/citizen-login"
                                          search={{
                                            area: area.name,
                                            specialization: spec.name,
                                            service,
                                          }}
                                          onClick={closeMobileMenu}
                                          className="block py-1 text-[11px] text-muted-foreground hover:text-primary"
                                        >
                                          {service}
                                        </Link>
                                      </li>
                                    ))}
                                  </ul>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>  

          <div className="overflow-hidden rounded-xl border border-border bg-background">
            <button
              type="button"
              onClick={() => setGovServicesOpen((v) => !v)}
              className="flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-foreground hover:bg-muted"
            >
              Government Services
              <ChevronDown
                className={`h-4 w-4 transition-transform duration-200 ${
                  govServicesOpen ? "rotate-180" : ""
                }`}
              />
            </button>
            <div
              className={`overflow-hidden transition-[max-height] duration-300 ease-out ${
                govServicesOpen ? "max-h-500" : "max-h-0"
              }`}
            >
              <div className="max-h-96 overflow-y-auto border-t border-border">
                {GOVERNMENT_SERVICES.map((category) => {
                  const isOpen = openGovCategory === category.title;
                  return (
                    <div key={category.title} className="border-b border-border last:border-b-0">
                      <button
                        type="button"
                        onClick={() => setOpenGovCategory(isOpen ? null : category.title)}
                        className="flex w-full items-center justify-between px-4 py-2.5 text-left text-xs font-semibold text-foreground hover:bg-muted"
                      >
                        {category.title}
                        <ChevronDown
                          className={`h-3.5 w-3.5 shrink-0 transition-transform duration-200 ${
                            isOpen ? "rotate-180" : ""
                          }`}
                        />
                      </button>
                      {isOpen && (
                        <ul className="space-y-1 bg-muted/30 px-4 pb-2">
                          {category.links.map((link) => (
                            <li key={link.url + link.label}>
                              <a
                                href={link.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                onClick={closeMobileMenu}
                                className="block py-1 text-[11px] text-muted-foreground hover:text-primary"
                              >
                                {link.label}
                              </a>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

               <Link
            to="/"
            hash="about"
            onClick={closeMobileMenu}
            className="block w-full text-center rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground hover:bg-muted"
          >
            About
          </Link>

          <div onClick={closeMobileMenu}>
            <CitizenLoginButton label="File a Case" />
          </div>

          <Link
            to="/login"
            onClick={closeMobileMenu}
            className="block w-full text-center rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground hover:bg-muted"
          >
            {translate("lawyerAdminLogin")}
          </Link>

      
        </div>

        
      </div>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border bg-surface">
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm font-bold text-foreground hover:opacity-90"
            >
              <img src="/logo.png" alt="CloseUrCase Logo" className="h-7 w-7 object-contain" />
              <span>CloseUrCase</span>
            </Link>
            <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs text-muted-foreground">
              <Link to="/citizen-login" className="font-semibold text-emerald-700 hover:underline">
                {translate("citizenLoginLabel")}
              </Link>
              <Link to="/lawyer-register" className="hover:text-foreground">
                Lawyer registration
              </Link>
              <Link to="/login" className="hover:text-foreground">
                {translate("lawyerAdminLogin")}
              </Link>
            </div>
          </div>
          <p className="mt-6 text-center text-xs text-muted-foreground">
            © 2026 CloseUrCase. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
