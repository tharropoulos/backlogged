import * as React from "react";
import { useForm } from "react-hook-form";
import { useSearchParams } from "next/navigation";
import type z from "zod";

import { cn } from "@/lib/utils";
import { userAuthSchema } from "~/lib/validations/user";
import { toast } from "sonner";
import { Input } from "../ui/input";
import { Icons } from "../icons";
import {
  Form,
  FormControl,
  FormItem,
  FormLabel,
  UncontrolledFormMessage,
} from "../ui/form";
import { Button } from "../ui/button";
import { signIn } from "next-auth/react";
import { zodResolver } from "@hookform/resolvers/zod";

type Inputs = z.infer<typeof userAuthSchema>;

type UserAuthFormProps = React.HTMLAttributes<HTMLDivElement>;

export function UserAuthForm({ className, ...props }: UserAuthFormProps) {
  const form = useForm<Inputs>({
    resolver: zodResolver(userAuthSchema),
  });

  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [isGitHubLoading, setIsGitHubLoading] = React.useState<boolean>(false);
  const [isDiscordLoading, setIsDiscordLoading] =
    React.useState<boolean>(false);

  const searchParams = useSearchParams();
  async function onSubmit(data: Inputs) {
    setIsLoading(true);

    try {
      const signInResult = await signIn("email", {
        email: data.email.toLowerCase().trim(),
        redirect: false,
        callbackUrl: searchParams?.get("from") || "/auth/register",
      });

      setIsLoading(false);

      if (signInResult?.error) {
        throw new Error(signInResult.error);
      }
      return toast.success("Email Sent, check your inbox");
    } catch (err) {
      setIsLoading(false);
      return toast.error("Something went wrong");
    }
  }

  return (
    <div
      className={cn("flex flex-col gap-6 text-center", className)}
      {...props}
    >
      <Form {...form}>
        <form
          className="mx=2 flex w-full flex-col items-start gap-5"
          onSubmit={(...args) => void form.handleSubmit(onSubmit)(...args)}
        >
          <FormItem className="w-full">
            <FormLabel htmlFor="email" className="sr-only">
              Email
            </FormLabel>
            <FormControl>
              <Input
                id="email"
                placeholder="johncarmack@example.com"
                autoCapitalize="none"
                autoCorrect="off"
                disabled={isLoading || isGitHubLoading || isDiscordLoading}
                {...form.register("email")}
              />
            </FormControl>
            <UncontrolledFormMessage
              className="mt-0 text-start"
              message={form.formState?.errors?.email?.message}
            />
          </FormItem>
          <Button
            className="w-full"
            disabled={isLoading || isGitHubLoading || isDiscordLoading}
          >
            {isLoading ? (
              <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Icons.mail className="mr-2 h-4 w-4" />
            )}{" "}
            Continue with Email
          </Button>
        </form>
      </Form>
      <div className="relative">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-muted-foreground">OR</span>
        </div>
      </div>
      <div className="flex w-full gap-3">
        <Button
          type="button"
          variant="outline"
          className={cn(
            "flex w-1/2 items-center justify-center gap-2 rounded-sm px-1 py-1",
            className
          )}
          onClick={async () => {
            void setIsGitHubLoading(true);
            await signIn("github");
            return;
          }}
          disabled={isLoading || isGitHubLoading || isDiscordLoading}
        >
          {isGitHubLoading ? (
            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Icons.gitHub className="mr-2 h-4 w-4" />
          )}{" "}
          Github
        </Button>
        <Button
          type="button"
          variant="outline"
          className={cn(
            "flex w-1/2 items-center justify-center gap-2 rounded-sm px-2 py-3",
            className
          )}
          onClick={async (): Promise<void> => {
            setIsDiscordLoading(true);
            await signIn("discord");
          }}
          disabled={isLoading || isDiscordLoading || isGitHubLoading}
        >
          {isDiscordLoading ? (
            <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Icons.discord className="mr-2 h-4 w-4" />
          )}{" "}
          Discord
        </Button>
      </div>
    </div>
  );
}
export default UserAuthForm;
