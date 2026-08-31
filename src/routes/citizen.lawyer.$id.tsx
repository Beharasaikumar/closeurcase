import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { PageHeader } from "@/components/app/PageHeader";
import { LawyerProfileCard } from "@/components/app/LawyerProfileCard";
import { Card, Button } from "@/components/m3";
import { getLawyers, subscribeToStore } from "@/data/appStore";
import type { Lawyer } from "@/types";

export const Route = createFileRoute("/citizen/lawyer/$id")({
  head: () => ({ meta: [{ title: "Lawyer Profile — CloseUrCase" }] }),
  component: CitizenLawyerDetail,
});

function CitizenLawyerDetail() {
  const { id } = Route.useParams();
  const navigate = useNavigate();
  const [lawyers, setLawyers] = useState<Lawyer[]>(getLawyers);

  useEffect(() => {
    const sync = () => setLawyers(getLawyers());
    return subscribeToStore(sync);
  }, []);

  const lawyer = lawyers.find((l) => l.id === id);

  if (!lawyer) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-3 px-6 text-center">
        <p className="text-sm font-bold text-foreground">Lawyer not found</p>
        <p className="max-w-xs text-xs text-muted-foreground">
          This profile may have been removed, or the link is incorrect.
        </p>
        <Button onClick={() => navigate({ to: "/citizen/create-case" })}>
          Back to Find a Lawyer
        </Button>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <PageHeader
        title="Lawyer Profile"
        description="Review credentials, practice areas, and courts before you choose."
        onBack={() => navigate({ to: "/citizen/create-case" })}
        backLabel="Back to Find a Lawyer"
      />
      <Card variant="elevated" className="p-4 sm:p-6 lg:p-8 w-full">
        <LawyerProfileCard lawyer={lawyer} />
      </Card>
    </div>
  );
}
