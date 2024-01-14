import {
  Body,
  Button,
  Container,
  Column,
  Head,
  Heading,
  Hr,
  Html,
  Img,
  Link,
  Preview,
  Row,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";
import { Icons } from "../icons";
import * as React from "react";

interface SignInEmailProps {
  url: string;
  host: string;
  imageUrl?: string;
  email: string;
  username?: string;
}

export const SignInEmail = ({
  url,
  email,
  imageUrl,
  username,
  host,
}: SignInEmailProps) => {
  return (
    <Html>
      <Head>
        <Preview>Sign in to Backlogged</Preview>
      </Head>
      <Tailwind>
        <Body className="my-aut0 mx-auto bg-white font-sans">
          <Container className="mx-auto my-9 w-[400px] rounded border border-solid border-gray-200 p-5">
            <Section className="flex justify-center justify-items-center ">
              <Icons.logo className="h-[100px]" aria-hidden="true" />
            </Section>
            <Heading className="mb-10 mt-0 text-center text-2xl font-bold">
              Sign in to Backlogged
            </Heading>
            {imageUrl && (
              <Section>
                <Img
                  src={imageUrl}
                  placeholder="https://via.placeholder.com/64"
                  alt="user-avtar"
                  width="64"
                  className="mx-auto rounded-full"
                />
              </Section>
            )}
            <Text className="mb-0 text-black">
              Hello {username ? username : email},{" "}
            </Text>
            <Text className="mt-2 text-black">
              click the button below to sign in to <strong>Backlogged</strong>.
            </Text>
            <Section className="mb-12 mt-12 text-center">
              <Button
                className="rounded bg-gray-950 px-8 py-4 text-center font-semibold text-white no-underline"
                href={url}
              >
                Sign In
              </Button>
            </Section>
            <Hr className="mb-6 bg-gray-200" />
            <Text className="text-sm text-muted">
              This invitation was intended for{" "}
              <span className="text-blue-500 underline">{email} </span>. This
              invite was sent from <span className="text-black">{host}</span>.
              If you did not request this email you can safely ignore it.
            </Text>
          </Container>
        </Body>
      </Tailwind>
    </Html>
  );
};

export default SignInEmail;
