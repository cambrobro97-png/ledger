import { SiteChromeProvider } from "@/components/SiteChrome";
import { SiteFooter } from "@/components/SiteFooter";
import { SiteHeader } from "@/components/SiteHeader";
import styles from "./layout.module.css";

export default function ToolsLayout({ children }: LayoutProps<"/">) {
  return (
    <SiteChromeProvider>
      <div className={styles.shell}>
        <SiteHeader />
        <main className={styles.main}>{children}</main>
        <SiteFooter />
      </div>
    </SiteChromeProvider>
  );
}
