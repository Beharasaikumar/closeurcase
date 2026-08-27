import { Link } from "@tanstack/react-router";
import { Phone } from "lucide-react";
import { cn } from "@/lib/utils";

type CitizenLoginButtonProps = {
  className?: string;
  size?: "hero" | "header" | "card";
  label?: string;
  subtitle?: string;
};

export function CitizenLoginButton({
  className,
  size = "card",
  label = "Citizen Login",
  subtitle = "Mobile number only · No password",
}: CitizenLoginButtonProps) {
  if (size === "header") {
    return (
      <Link
        to="/citizen-login"
        className={cn(
          "inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-3.5 py-2 text-sm font-bold text-white shadow-sm transition-colors hover:bg-emerald-700 whitespace-nowrap",
          className,
        )}
      >
        <Phone className="h-4 w-4 shrink-0" aria-hidden />
        {label}
      </Link>
    );
  }

  return (
    <Link
      to="/citizen-login"
      title={subtitle}
      className={cn(
        "inline-flex w-full items-center justify-center gap-2 rounded-xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition-all hover:bg-emerald-700 active:scale-[0.99] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500 focus-visible:ring-offset-2",
        className,
      )}
    >
      <Phone className="h-4 w-4 shrink-0" aria-hidden />
      <span>{label}</span>
      <span className="sr-only"> — {subtitle}</span>
    </Link>
  );
}

export function ProfessionalLoginLink({ className }: { className?: string }) {
  return (
    <Link
      to="/login"
      className={cn(
        "inline-flex w-full items-center justify-center rounded-xl border border-border bg-surface px-5 py-3 text-sm font-semibold text-foreground hover:bg-muted transition-colors",
        className,
      )}
    >
      Lawyer sign in
    </Link>
  );
}
