import { ThemeProvider } from "next-themes";
import { SiteHeader } from "~/components/layouts/site-header";

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <div className="flex min-h-screen flex-col">
        <SiteHeader />
        <main className="flex flex-grow">{children}</main>
      </div>
    </ThemeProvider>
  );
}
