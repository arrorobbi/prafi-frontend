"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Loading } from "@/components/ui";
import { roleHome, useAuth } from "@/lib/auth";

/** Old link target: sends every user to their own dashboard. */
export default function AccountPage() {
  const { status, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "guest") router.replace("/login");
    else if (user) router.replace(roleHome(user.role));
  }, [status, user, router]);

  return <Loading />;
}
