import { SiteChromeProvider } from "@/components/SiteChrome";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";

export default function ToolsLayout({ children }: LayoutProps<"/">) {
  return (
    <SiteChromeProvider>
      <div className="flex min-h-dvh flex-col">
        <SiteHeader />
        <div className="min-w-0 flex-[1_0_auto]">{children}</div>
        <SiteFooter />
      </div>
    </SiteChromeProvider>
  );
}
