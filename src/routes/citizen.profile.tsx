import { createFileRoute } from "@tanstack/react-router";
import { PageHeader } from "@/components/app/PageHeader";
import { ProfileForm } from "@/components/app/ProfileForm";

export const Route = createFileRoute("/citizen/profile")({
  component: () => (
    <>
      <PageHeader
        title="Profile"
        description="Manage your personal information."
        actionsPosition="below"
      />
      <ProfileForm
        role="citizen"
        defaults={{
          name: "Sai Teja Reddy",
          email: "saiteja.reddy@example.com",
          phone: "+91 98110 22111",
          city: "Hyderabad",
          aadhar: "",
        }}
        wide
      />
    </>
  ),
});
