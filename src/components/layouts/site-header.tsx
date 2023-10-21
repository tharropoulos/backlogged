import { siteConfig } from "~/config/site";
import { MainNav } from "./main-nav";
import { ThemeToggle } from "../theme-selector";
import { signIn, signOut, useSession } from "next-auth/react";
import { Button } from "../ui/button";

export function SiteHeader() {
  const { data: sessionData } = useSession();
  return (
    <header className="sticky top-0 z-40 mb-7 w-full border-b border-gray-800 bg-background ">
      <div className="container flex h-16 items-center justify-between px-6 ">
        <MainNav items={siteConfig.mainNav} />
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button
            variant={sessionData ? "ghost" : "default"}
            onClick={sessionData ? () => void signOut() : () => void signIn()}
          >
            {sessionData ? "Sign out" : "Sign in"}
          </Button>
        </div>
      </div>
    </header>
  );
}
