import { Link } from "@tanstack/react-router";
import { Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { FILLED_LINK_BUTTON_CITIZEN_CLASS, OUTLINED_LINK_BUTTON_CLASS } from "@/components/m3";

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
        className={cn(FILLED_LINK_BUTTON_CITIZEN_CLASS, "whitespace-nowrap", className)}
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
      className={cn(FILLED_LINK_BUTTON_CITIZEN_CLASS, className)}
    >
      <Phone className="h-4 w-4 shrink-0" aria-hidden />
      <span>{label}</span>
      <span className="sr-only"> — {subtitle}</span>
    </Link>
  );
}

export function ProfessionalLoginLink({ className }: { className?: string }) {
  return (
    <Link to="/login" className={cn(OUTLINED_LINK_BUTTON_CLASS, className)}>
      Lawyer sign in
    </Link>
  );
}
