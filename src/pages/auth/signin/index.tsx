import { Metadata } from "next";
import Link from "next/link";

import { cn } from "@/lib/utils";
import { buttonVariants } from "@/components/ui/button";
import { Icons } from "@/components/icons";
import UserAuthForm from "~/components/forms/user-auth-form";
import { CSSProperties } from "react";
import { Toaster } from "sonner";

export const metadata: Metadata = {
  title: "Login",
  description: "Login to your account",
};

export default function LoginPage() {
  return (
    <div className=" flex h-screen w-screen items-center justify-center ">
      <Link
        href="/"
        className={cn(
          buttonVariants({ variant: "ghost" }),
          "absolute left-4 top-4 z-30 lg:left-8 lg:top-8"
        )}
      >
        <>
          <Icons.chevronLeft className="mr-2 h-4 w-4" />
          Back
        </>
      </Link>
      <div className="absolute top-0 z-[-2] h-screen w-screen bg-[radial-gradient(ellipse_80%_80%_at_50%_-20%,rgba(31,41,55,0.8),rgba(255,255,255,0))]"></div>
      <section className="flex justify-center  px-4 lg:h-full lg:w-2/3 lg:flex-col ">
        <div className="flex h-full flex-col justify-center lg:bg-[radial-gradient(#374151,transparent_2px)] lg:[background-size:48px_48px] lg:[mask-image:radial-gradient(ellipse_50%_50%_at_50%_50%,#000_70%,transparent_100%)] ">
          <div className="z-20">
            <div className="mx-auto flex w-full flex-col justify-center space-y-2 sm:w-[350px]">
              <div className="flex flex-col space-y-2 text-center">
                <h1 className="text-2xl font-bold tracking-tight">
                  Backlogged
                </h1>
                <p className="text-sm text-muted-foreground">
                  Sign in or create an account
                </p>
              </div>
              <UserAuthForm />
              <p className="px-8 text-center text-sm text-muted-foreground">
                <Link
                  href="/register"
                  className="hover:text-brand underline underline-offset-4"
                ></Link>
              </p>
            </div>
          </div>
        </div>
        <Toaster
          position="bottom-left"
          toastOptions={{
            style: {
              background: "hsl(var(--bacground))",
              placeSelf: "flex-start",
              color: "hsl(var(--foreground))",
              border: "1px solid hsl(var(--border))",
            },
          }}
        />
      </section>
      <section
        style={
          {
            "--background": "3 7 18",
            "--highlight": "255 255 255",

            "--bg-color": "linear-gradient(transparent, transparent)",
            "--border-color": `linear-gradient( rgb(var(--highlight) / 0 ) 0%, rgb(var(--highlight) / 0.8) 33.33%, rgb(var(--highlight) / 0.9) 66.67%, rgb(var(--highlight) / 0) 100%) left / 1px no-repeat border-box
          `,
          } as CSSProperties
        }
        className="  hidden justify-center border  border-transparent text-start  [background:padding-box_var(--bg-color),border-box_var(--border-color)]
      lg:flex lg:h-full lg:w-1/3 lg:flex-col  lg:items-center lg:justify-center lg:border-l lg:px-4 "
      >
        <div className="relative my-auto w-full lg:mx-0 ">
          <div className=" py-4 pt-4 lg:-ml-[65px]">
            <Icons.logo
              className=" h-[100px] dark:bg-gray-950"
              aria-hidden="true"
            />
          </div>
        </div>
      </section>
    </div>
  );
}
