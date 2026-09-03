import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/citizen/track-case")({
  beforeLoad: () => {
    throw redirect({ to: "/citizen/subscriptions" });
  },
  component: () => null,
});

