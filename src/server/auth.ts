import { PrismaAdapter } from "@next-auth/prisma-adapter";
import { type GetServerSidePropsContext } from "next";
import {
  getServerSession,
  type DefaultSession,
  type NextAuthOptions,
} from "next-auth";
import EmailProvider from "next-auth/providers/email";
import DiscordProvider from "next-auth/providers/discord";
import GithubProvider from "next-auth/providers/github";
import { env } from "~/env.mjs";
import { prisma } from "~/server/db";
import { Resend } from "resend";
import { SignInEmail } from "~/components/email/sign-in-email";
import Error from "next/error";
import SignUpEmail from "~/components/email/sign-up-email";

const resend = new Resend(process.env.RESEND_KEY);

/**
 * Module augmentation for `next-auth` types. Allows us to add custom properties to the `session`
 * object and keep type safety.
 *
 * @see https://next-auth.js.org/getting-started/typescript#module-augmentation
 */
type UserRole = "Admin" | "User";
declare module "next-auth" {
  interface Session extends DefaultSession {
    user: {
      id: string;
      // ...other properties
      role: UserRole;
    } & DefaultSession["user"];
  }

  interface User {
    // ...other properties
    role: UserRole;
  }
}

/**
 * Options for NextAuth.js used to configure adapters, providers, callbacks, etc.
 *
 * @see https://next-auth.js.org/configuration/options
 */
export const authOptions: NextAuthOptions = {
  callbacks: {
    session({ session, user }) {
      if (session?.user) {
        session.user.id = user.id;
        session.user.role = user.role;
      }
      return session;
    },
  },
  adapter: PrismaAdapter(prisma),
  pages: {
    signIn: "/auth/signin",
  },
  providers: [
    EmailProvider({
      server: {
        host: process.env.EMAIL_SERVER_HOST,
        port: process.env.EMAIL_SERVER_PORT,
        auth: {
          user: process.env.EMAIL_SERVER_USER,
          pass: process.env.EMAIL_SERVER_PASSWORD,
        },
      },
      from: process.env.EMAIL_FROM,
      sendVerificationRequest: async ({ identifier, url, provider }) => {
        const host = new URL(url);
        const escapedHost = host.protocol + "//" + host.hostname;

        const user = await prisma.user.findUnique({
          where: {
            email: identifier,
          },
          select: {
            name: true,
            image: true,
            emailVerified: true,
          },
        });
        if (user?.emailVerified) {
          try {
            const { data, error } = await resend.emails.send({
              from: process.env.EMAIL_FROM ?? "",
              to: identifier,
              subject: "Sign in",
              react: SignInEmail({
                imageUrl: user?.image ?? undefined,
                email: identifier,
                host: escapedHost,
                url: url,
                username: user?.name ?? undefined,
              }),
            });

            console.log(data);

            if (error) {
              console.log(error);
              throw new Error({ statusCode: 500, title: error.message });
            }
            return;
          } catch (error) {
            console.log(error);
          }
        }
        try {
          const { data, error } = await resend.emails.send({
            from: process.env.EMAIL_FROM ?? "",
            to: identifier,
            subject: "Sign Up",
            react: SignUpEmail({
              email: identifier,
              host: escapedHost,
              url: url,
            }),
          });

          console.log(data);

          if (error) {
            console.log(error);
            throw new Error({ statusCode: 500, title: error.message });
          }
        } catch (error) {
          console.log(error);
          throw new Error({ statusCode: 500, title: "Something went wrong." });
        }
      },
    }),
    GithubProvider({
      id: "github",
      clientId: env.GITHUB_ID,
      clientSecret: env.GITHUB_SECRET,
    }),
    DiscordProvider({
      clientId: env.DISCORD_CLIENT_ID,
      clientSecret: env.DISCORD_CLIENT_SECRET,
    }),
    /**
     * ...add more providers here.
     *
     * Most other providers require a bit more work than the Discord provider. For example, the
     * GitHub provider requires you to add the `refresh_token_expires_in` field to the Account
     * model. Refer to the NextAuth.js docs for the provider you want to use. Example:
     *
     * @see https://next-auth.js.org/providers/github
     */
  ],
};

/**
 * Wrapper for `getServerSession` so that you don't need to import the `authOptions` in every file.
 *
 * @see https://next-auth.js.org/configuration/nextjs
 */
export const getServerAuthSession = (ctx: {
  req: GetServerSidePropsContext["req"];
  res: GetServerSidePropsContext["res"];
}) => {
  return getServerSession(ctx.req, ctx.res, authOptions);
};
