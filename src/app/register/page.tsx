import type { Metadata } from "next";
import { RegisterWizard } from "@/components/auth/RegisterWizard";

export const metadata: Metadata = { title: "Daftar Penjual" };

export default function RegisterTenantPage() {
  return <RegisterWizard kind="tenant" />;
}
