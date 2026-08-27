import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/PageHeader";
import { SettingsPanel } from "@/components/app/SettingsPanel";

export const Route = createFileRoute("/lawyer/settings")({
  component: () => (
    <>
      <PageHeader title="Settings" />
      <SettingsPanel />
    </>
  ),
});
