import { useState } from "react";
import { ShieldCheck } from "lucide-react";
import { AvatarUploadField } from "@/components/app/AvatarUploadField";
import { TextField, Button } from "@/components/m3";
import type { UserRole } from "@/types";

export function ProfileForm({
  role,
  defaults,
  defaultPhotoUrl,
  wide = false,
}: {
  role: UserRole;
  defaults: { name: string; email: string; phone: string; city: string; aadhar?: string };
  defaultPhotoUrl?: string;
  /** Spreads the form into a wider two-column layout (avatar column + field
   * column) instead of a single narrow stacked card — used by the citizen
   * dashboard, where the page otherwise leaves most of the viewport empty. */
  wide?: boolean;
}) {
  const [saved, setSaved] = useState(false);
  const [name, setName] = useState(defaults.name);
  const [email, setEmail] = useState(defaults.email);
  const [phone, setPhone] = useState(defaults.phone);
  const [city, setCity] = useState(defaults.city);
  const [aadhar, setAadhar] = useState(defaults.aadhar ?? "");

  const formatAadhar = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 12);
    return digits.replace(/(\d{4})(?=\d)/g, "$1 ").trim();
  };

  const aadharValid = aadhar.replace(/\s/g, "").length === 12;

  const nameAndContactFields = (
    <>
      <TextField
        label="Full Name"
        value={name}
        onChange={setName}
        placeholder="Enter your full name"
        className="w-full"
      />

      <div className={`grid grid-cols-1 gap-3 sm:grid-cols-2 ${wide ? "lg:grid-cols-3" : ""}`}>
        <TextField
          label="Email Address"
          type="email"
          value={email}
          onChange={setEmail}
          placeholder="email@example.com"
          className="w-full"
        />
        <TextField
          label="Phone Number"
          type="tel"
          value={phone}
          onChange={setPhone}
          placeholder="+91 98765 43210"
          className="w-full"
        />
        <TextField
          label="City / District"
          value={city}
          onChange={setCity}
          placeholder="e.g. Hyderabad, Visakhapatnam"
          className={`w-full ${wide ? "" : "sm:col-span-2"}`}
        />
      </div>
    </>
  );

  const aadhaarField = (
    <div className="rounded-lg border border-primary/20 bg-primary/5 p-3.5 space-y-2">
      <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1">
        <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
        <span className="text-xs font-bold text-foreground uppercase tracking-wide">
          Aadhaar Card Number
        </span>
        <span className="ml-auto whitespace-nowrap text-[10px] font-semibold text-muted-foreground bg-muted rounded-full px-2 py-0.5">
          Sensitive · Encrypted
        </span>
      </div>
      <TextField
        value={aadhar}
        onChange={(v) => setAadhar(formatAadhar(v))}
        placeholder="XXXX XXXX XXXX"
        maxLength={14}
        className="w-full font-mono tracking-widest"
        error={Boolean(aadhar && !aadharValid)}
      />
      {aadhar && !aadharValid && (
        <p className="text-[11px] text-destructive font-medium">
          Aadhaar number must be exactly 12 digits.
        </p>
      )}
      {aadharValid && (
        <p className="text-[11px] text-emerald-600 font-semibold flex items-center gap-1">
          <ShieldCheck className="h-3 w-3" /> Valid Aadhaar format
        </p>
      )}
      <p className="text-[10px] text-muted-foreground leading-relaxed">
        Your Aadhaar number is used for identity verification only and is never shared with third
        parties.
      </p>
    </div>
  );

  const saveRow = (
    <div className="flex items-center gap-3 pt-1">
      <Button type="submit">Save Changes</Button>
      {saved && (
        <span className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600">
          <ShieldCheck className="h-4 w-4" /> Profile saved successfully!
        </span>
      )}
    </div>
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  if (wide) {
    return (
      <form
        className="grid grid-cols-1 gap-6 rounded-xl border border-border bg-surface p-5 sm:p-6 lg:grid-cols-[280px_1fr] lg:gap-8"
        onSubmit={handleSubmit}
      >
        <div className="lg:pt-1">
          <AvatarUploadField role={role} name={defaults.name} defaultPhotoUrl={defaultPhotoUrl} />
        </div>
        <div className="min-w-0 space-y-4">
          {nameAndContactFields}
          {aadhaarField}
          {saveRow}
        </div>
      </form>
    );
  }

  return (
    <form
      className="max-w-xl space-y-4 rounded-xl border border-border bg-surface p-5 shadow-2xs"
      onSubmit={handleSubmit}
    >
      <AvatarUploadField role={role} name={defaults.name} defaultPhotoUrl={defaultPhotoUrl} />
      {nameAndContactFields}
      {aadhaarField}
      {saveRow}
    </form>
  );
}
