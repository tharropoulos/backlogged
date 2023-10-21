import { api } from "~/lib/api";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { useSession } from "next-auth/react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Skeleton } from "../ui/skeleton";
import { useTransition } from "react";
import { z } from "zod";
import { Icons } from "../icons";
import { useForm } from "react-hook-form";
import { toast, Toaster } from "sonner";
import { createFranchiseSchema } from "~/lib/validations/franchise";
import {
  Form,
  FormControl,
  FormItem,
  FormLabel,
  UncontrolledFormMessage,
} from "../ui/form";

type Inputs = z.infer<typeof createFranchiseSchema>;
export function CreateFranchiseForm() {
  const session = useSession();

  const form = useForm<Inputs>({
    resolver: zodResolver(createFranchiseSchema),
  });

  const [isPending, startTransition] = useTransition();

  const mutation = api.franchise.create.useMutation();

  function onSubmit(data: Inputs) {
    startTransition(async () => {
      try {
        await mutation.mutateAsync(data);
        form.reset();
        toast.success("Franchise created successfully");
      } catch (error) {
        toast.error(
          mutation.error ? "Invalid input parameters" : "Something went wrong"
        );
      }
    });
  }
  if (session.status === "loading") {
    return (
      <form className="mx-2 flex w-1/3 flex-col  items-start gap-3 ">
        <div className="mb-4 flex w-full flex-col gap-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-full" />
        </div>
        <div className="mb-4 flex w-full flex-col gap-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-full" />
        </div>
        <div className="mb-4 flex w-full flex-col gap-3">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-8 w-full" />
        </div>
      </form>
    );
  }
  if (session.status === "unauthenticated") {
    return (
      <div className="flex flex-col items-center justify-start gap-8">
        <h1 className="text-8xl"> :( </h1>
        <h4>You&apos;re not logged in</h4>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form
        className="mx-2 flex w-1/3 flex-col  items-start gap-6 "
        onSubmit={(...args) => void form.handleSubmit(onSubmit)(...args)}
      >
        <FormItem className="w-full">
          <FormLabel>Name</FormLabel>
          <FormControl>
            <Input {...form.register("name")} placeholder="Franchise Name" />
          </FormControl>
          <UncontrolledFormMessage
            message={form.formState.errors.name?.message}
          />
        </FormItem>
        <FormItem className="w-full">
          <FormLabel>Description</FormLabel>
          <FormControl>
            <Input
              {...form.register("description")}
              placeholder="Franchise Description"
            />
          </FormControl>
          <UncontrolledFormMessage
            message={form.formState.errors.description?.message}
          />
        </FormItem>
        <FormItem className="w-full">
          <FormLabel>Image</FormLabel>
          <FormControl>
            <Input
              {...form.register("backgroundImage")}
              placeholder="Franchise Image"
            />
          </FormControl>
          <UncontrolledFormMessage
            message={form.formState.errors.backgroundImage?.message}
          />
        </FormItem>
        <div className="flex gap-5">
          <Button type="submit" disabled={isPending}>
            {isPending && (
              <Icons.spinner
                className="mr-2 h-4 w-4 animate-spin"
                aria-hidden="true"
              />
            )}
            Create
          </Button>
          <Button type="reset" variant={"ghost"} onClick={() => form.reset()}>
            Cancel
          </Button>
        </div>
        <Toaster
          toastOptions={{
            style: {
              background: "hsl(var(--background))",
              color: "hsl(var(--foreground))",
              border: "1px solid hsl(var(--border))",
            },
          }}
        />
      </form>
    </Form>
  );
}
