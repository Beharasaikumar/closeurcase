import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";

export function AuthLayout({
  title,
  subtitle,
  children,
  footer,
  centerLogoOnMobile = false,
  wide = false,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Mobile only: shows a larger, centered logo + wordmark above the card
   * instead of the (mobile-hidden) navbar logo. */
  centerLogoOnMobile?: boolean;
  /** When true, expands container to full viewport width up to 1560px for rich forms. */
  wide?: boolean;
}) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header is mobile-hidden entirely — the centered logo (when
          centerLogoOnMobile) and the footer's cross-role links already cover
          navigation on small screens. */}
      <header className="hidden border-b border-border bg-surface sm:block">
        <div
          className={`mx-auto flex h-16 w-full items-center justify-between px-6 sm:px-8 ${
            wide ? "max-w-[1560px] px-8 lg:px-12" : "max-w-6xl"
          }`}
        >
          <Link
            to="/"
            className="flex items-center gap-3 font-semibold tracking-tight hover:opacity-90 transition-opacity"
          >
            <img src="/logo.png" alt="CloseurCase Logo" className="h-10 w-10 object-contain" />
            <span className="text-foreground text-xl font-extrabold tracking-tight">
              CloseurCase
            </span>
          </Link>
        </div>
      </header>
      <main
        className={`flex flex-1 items-start justify-center py-6 sm:py-8 md:py-10 ${
          wide ? "px-4 sm:px-8 lg:px-12 xl:px-16" : "px-6"
        }`}
      >
        <div
          className={`mx-auto w-full grid grid-cols-1 items-start gap-8 lg:gap-10 ${
            wide
              ? "max-w-[1560px] lg:grid-cols-12"
              : "max-w-6xl lg:grid-cols-2 lg:gap-12 items-center"
          }`}
        >
          {/* Left Side: Form Card */}
          <div
            className={`w-full ${
              wide ? "lg:col-span-7 xl:col-span-7" : "max-w-md mx-auto lg:max-w-none"
            }`}
          >
            {centerLogoOnMobile && (
              <div className="mb-6 flex flex-col items-center gap-3 sm:hidden">
                <img src="/logo.png" alt="CloseurCase Logo" className="h-24 w-24 object-contain" />
                <span className="text-2xl font-extrabold tracking-tight text-foreground">
                  CloseurCase
                </span>
              </div>
            )}
            <div className="rounded-2xl border border-border bg-surface p-6 sm:p-8 lg:p-10 shadow-sm">
              <h1 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
                {title}
              </h1>
              {subtitle && <p className="mt-1.5 text-sm text-muted-foreground">{subtitle}</p>}
              <div className="mt-6 space-y-4">{children}</div>
            </div>
            {footer && (
              <div className="mt-4 text-center text-sm text-muted-foreground">{footer}</div>
            )}
          </div>

          {/* Right Side: Law Related Image & Info */}
          <div
            className={`hidden lg:flex flex-col justify-start w-full ${
              wide ? "lg:col-span-5 xl:col-span-5 sticky top-8" : "items-center justify-center"
            }`}
          >
            <div
              className={`relative overflow-hidden rounded-2xl border border-border bg-surface shadow-md w-full ${
                wide ? "h-[640px]" : "max-w-lg"
              }`}
            >
              <img
                src="/law_image.png"
                alt="Law and Justice"
                className={`w-full object-cover ${wide ? "h-full" : "h-[460px]"}`}
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/95 via-background/40 to-transparent p-6 sm:p-8 flex flex-col justify-end">
                <span className="inline-block rounded-full bg-primary/20 px-3 py-1 text-xs font-semibold text-primary backdrop-blur-xs w-fit">
                  CloseurCase Platform
                </span>
                <h3 className="mt-2.5 text-xl font-bold text-foreground sm:text-2xl">
                  AI-Powered Legal Case Management
                </h3>
                <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground leading-relaxed">
                  Connecting citizens, lawyers, and administrators with structure, transparency, and
                  clarity.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
