import { useState } from "react";
import { Switch } from "@/components/m3";

export function SettingsPanel() {
  return (
    <div className="max-w-2xl divide-y divide-border rounded-lg border border-border bg-surface">
      {[
        { title: "Email notifications", desc: "Receive updates when your case status changes." },
        { title: "SMS notifications", desc: "Get critical alerts by SMS." },
        {
          title: "Two-factor authentication",
          desc: "Add an extra layer of security to your account.",
        },
      ].map((s) => (
        <div key={s.title} className="flex items-center justify-between gap-4 px-5 py-3.5">
          <div className="min-w-0">
            <div className="text-sm font-medium text-foreground">{s.title}</div>
            <div className="text-sm text-muted-foreground">{s.desc}</div>
          </div>
          <ToggleSetting label={s.title} />
        </div>
      ))}
    </div>
  );
}

function ToggleSetting({ label }: { label: string }) {
  const [on, setOn] = useState(false);
  return <Switch selected={on} onChange={setOn} ariaLabel={label} />;
}
