import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { AuthLayout } from "@/layouts/AuthLayout";
import { PermissionsGate } from "@/components/app/PermissionsGate";
import { usePermissionsGate } from "@/features/permissions/usePermissionsGate";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";

export const Route = createFileRoute("/login")({
  head: () => ({ meta: [{ title: "Lawyer & Admin sign in — CloseurCase" }] }),
  component: Login,
});

export function Login() {
  const navigate = useNavigate();
  const [email, setEmail] = useState("lawyer@closeurcase.app");
  const [password, setPassword] = useState("••••••••");
  const [showPassword, setShowPassword] = useState(false);
  const [permissionsAcknowledged, acknowledgePermissions] = usePermissionsGate();

  const getRole = (e: string) => (e.includes("admin") ? "admin" : "lawyer");

  if (!permissionsAcknowledged) {
    return <PermissionsGate onContinue={acknowledgePermissions} />;
  }

  return (
    <AuthLayout
      centerLogoOnMobile
      title="Lawyer & Admin sign in"
      subtitle="Email and password for Lawyers and platform administrators."
      footer={
        <>
          Citizen user?{" "}
          <Link to="/citizen-login" className="font-semibold text-primary hover:underline">
            Sign in with mobile number
          </Link>
          {" · "}
          New Lawyer?{" "}
          <Link to="/lawyer-register" className="font-semibold text-primary hover:underline">
            Register
          </Link>
        </>
      }
    >
      <form
        className="space-y-5"
        onSubmit={(e) => {
          e.preventDefault();
          const role = getRole(email);
          navigate({ to: role === "lawyer" ? "/lawyer" : "/admin" });
        }}
      >
        <div className="space-y-1.5">
          <label className="block text-sm font-medium text-foreground">Email address</label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              className="w-full rounded-lg border border-border bg-surface pl-9 pr-4 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <label className="block text-sm font-medium text-foreground">Password</label>
            <button type="button" className="text-xs text-primary hover:underline">
              Forgot password?
            </button>
          </div>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type={showPassword ? "text" : "password"}
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-lg border border-border bg-surface pl-9 pr-10 py-2.5 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/30"
            />
            <button
              type="button"
              onClick={() => setShowPassword((v) => !v)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        <button
          type="submit"
          className="w-full rounded-lg bg-primary py-3 text-sm font-semibold text-primary-foreground hover:bg-primary/90 active:scale-[0.98]"
        >
          Sign in
        </button>
      </form>
    </AuthLayout>
  );
}
