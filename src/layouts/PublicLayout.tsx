import { Link } from "@tanstack/react-router";
import { useState } from "react";
import type { ReactNode } from "react";
import { Menu, X } from "lucide-react";
import { CitizenLoginButton } from "@/components/app/CitizenLoginButton";
import { CitizenLanguageButtons } from "@/features/citizen/CitizenLanguageButtons";
import { useCitizenLanguage } from "@/features/citizen/i18n/CitizenLanguageContext";

export function PublicLayout({ children }: { children: ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { translate } = useCitizenLanguage();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border bg-white/85 backdrop-blur-md sticky top-0 z-40">
        <div className="mx-auto flex h-16 w-full max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
          <Link to="/" className="flex items-center gap-2.5 shrink-0 hover:opacity-90">
            <img src="/logo.png" alt="CloseurCase Logo" className="h-9 w-9 object-contain" />
            <span className="flex flex-col leading-tight">
              <span className="text-base font-bold tracking-tight text-foreground">
                CloseurCase
              </span>
              <span className="text-[10px] font-medium tracking-wide text-muted-foreground">
                Just click for justice
              </span>
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-2 shrink-0">
            <CitizenLanguageButtons size="sm" showLabel={false} />
            <CitizenLoginButton size="header" label={translate("citizenLoginLabel")} />
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

        {isMobileMenuOpen && (
          <div className="md:hidden border-t border-border bg-surface px-4 py-4 space-y-3">
            <CitizenLanguageButtons size="sm" showLabel={false} />
            <CitizenLoginButton label={translate("citizenLoginLabel")} />
            <Link
              to="/login"
              onClick={() => setIsMobileMenuOpen(false)}
              className="block w-full text-center rounded-xl border border-border bg-background px-4 py-3 text-sm font-semibold text-foreground hover:bg-muted"
            >
              {translate("lawyerAdminLogin")}
            </Link>
          </div>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-border bg-surface">
        <div className="mx-auto w-full max-w-6xl px-4 sm:px-6 py-8">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm font-bold text-foreground hover:opacity-90"
            >
              <img src="/logo.png" alt="CloseurCase Logo" className="h-7 w-7 object-contain" />
              <span>CloseurCase</span>
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
            © 2026 CloseurCase. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
