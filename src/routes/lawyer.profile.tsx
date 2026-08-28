import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { PageHeader } from "@/components/app/PageHeader";
import { AvatarUploadField } from "@/components/app/AvatarUploadField";
import { ShieldCheck } from "lucide-react";
import { TextField, Button } from "@/components/m3";

export const Route = createFileRoute("/lawyer/profile")({
  component: LawyerProfilePage,
});

function LawyerProfilePage() {
  const [saved, setSaved] = useState(false);
  const [name, setName] = useState("Swathi Reddy");
  const [email, setEmail] = useState("swathi.reddy@closeur.legal");
  const [phone, setPhone] = useState("+91 98100 12345");
  const [city, setCity] = useState("Hyderabad");
  const [practiceArea, setPracticeArea] = useState("Criminal Law");
  const [barId, setBarId] = useState("TS/2014/1023");

  return (
    <>
      <PageHeader
        title="Profile"
        description="Manage your professional details and practice information."
        actionsPosition="below"
      />

      <form
        className="grid grid-cols-1 gap-6 rounded-xl border border-border bg-surface p-5 sm:p-6 lg:grid-cols-[280px_1fr] lg:gap-8 shadow-2xs"
        onSubmit={(e) => {
          e.preventDefault();
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        }}
      >
        <div className="lg:pt-1">
          <AvatarUploadField role="lawyer" name="Swathi Reddy" />
        </div>

        <div className="min-w-0 space-y-4">
          <TextField
            label="Full Name"
            value={name}
            onChange={setName}
            placeholder="Full legal name"
            className="w-full"
          />

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
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
              className="w-full"
            />
          </div>

          <TextField
            label="Practice Area"
            value={practiceArea}
            onChange={setPracticeArea}
            placeholder="e.g. Criminal Law, Family Law"
            className="w-full"
          />

          {/* Bar Registration Number */}
          <div className="rounded-lg border border-primary/20 bg-primary/5 p-3.5 space-y-2">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mb-1">
              <ShieldCheck className="h-4 w-4 text-primary shrink-0" />
              <span className="text-xs font-bold text-foreground uppercase tracking-wide">
                Bar Council Registration Number
              </span>
              <span className="ml-auto whitespace-nowrap text-[10px] font-semibold text-muted-foreground bg-muted rounded-full px-2 py-0.5">
                Verified
              </span>
            </div>
            <TextField
              value={barId}
              onChange={setBarId}
              placeholder="e.g. TS/2014/1023"
              className="w-full font-mono tracking-wider"
            />
            <p className="text-[10px] text-muted-foreground leading-relaxed">
              Your Bar Council registration number is used for identity verification and is visible
              to the platform admin only.
            </p>
          </div>

          <div className="flex items-center gap-3 pt-1">
            <Button type="submit">Save Changes</Button>
            {saved && (
              <span className="flex items-center gap-1.5 text-sm font-semibold text-emerald-600">
                <ShieldCheck className="h-4 w-4" /> Profile saved successfully!
              </span>
            )}
          </div>
        </div>
      </form>
    </>
  );
}
