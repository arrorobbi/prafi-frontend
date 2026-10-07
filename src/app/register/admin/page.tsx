import type { Metadata } from "next";
import { RegisterWizard } from "@/components/auth/RegisterWizard";

export const metadata: Metadata = { title: "Daftar Admin" };

export default function RegisterAdminPage() {
  return <RegisterWizard kind="admin" />;
}
