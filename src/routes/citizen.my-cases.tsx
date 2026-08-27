import { createFileRoute } from "@tanstack/react-router";
import { CaseDocketRegister } from "@/components/app/CaseDocketRegister";

export const Route = createFileRoute("/citizen/my-cases")({
  component: MyCases,
});

function MyCases() {
  return <CaseDocketRegister role="citizen" />;
}
