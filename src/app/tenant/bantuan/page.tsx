import { GuideList } from "@/components/GuideList";
import { PageHeader } from "@/components/ui";
import { GUIDES } from "@/lib/guides";

export default function TenantHelpPage() {
  return (
    <>
      <PageHeader title="BANTUAN & KETENTUAN" />
      <GuideList guides={GUIDES.filter((g) => g.audience.includes("tenant"))} />
    </>
  );
}
