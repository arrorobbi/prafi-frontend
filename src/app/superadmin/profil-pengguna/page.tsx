"use client";

import { UserProfiles } from "@/components/dashboard/UserProfiles";
import { PageHeader } from "@/components/ui";

/** Every account as a card: user data, shop data (sellers) and the account's API log. */
export default function UserProfilesPage() {
  return (
    <>
      <PageHeader title="PROFIL PENGGUNA" />
      <UserProfiles />
    </>
  );
}
