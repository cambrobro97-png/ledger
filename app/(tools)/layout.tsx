import { SiteChromeProvider } from "@/components/SiteChrome";
import { SiteHeader } from "@/components/SiteHeader";

export default function ToolsLayout({ children }: LayoutProps<"/">) {
  return (
    <SiteChromeProvider>
      <SiteHeader />
      {children}
    </SiteChromeProvider>
  );
}
