import { createFileRoute } from "@tanstack/react-router";
import { SharedNotificationsPage } from "../components/app/SharedNotificationsPage";

export const Route = createFileRoute("/citizen/notifications")({
  head: () => ({ meta: [{ title: "Notifications — CloseurCase" }] }),
  component: () => <SharedNotificationsPage role="citizen" />,
});
