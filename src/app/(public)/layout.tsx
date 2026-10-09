import { SiteFooter } from "@/components/site/SiteFooter";
import { PendingContent } from "@/components/site/PendingContent";
import { SiteHeader } from "@/components/site/SiteHeader";

export default function PublicLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <SiteHeader />
      <main>
        <PendingContent>{children}</PendingContent>
      </main>
      <SiteFooter />
    </>
  );
}
