import { ThemeProvider } from "next-themes";
import { SiteHeader } from "~/components/layouts/site-header";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <SiteHeader />
      <main className="mt-8">{children}</main>
    </ThemeProvider>
  );
}
