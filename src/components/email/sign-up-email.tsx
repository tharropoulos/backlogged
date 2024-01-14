import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Preview,
  Section,
  Tailwind,
  Text,
} from "@react-email/components";
import { Icons } from "../icons";

interface SignUpEmailProps {
  url: string;
  host: string;
  email: string;
}

export const SignUpEmail = ({ url, email, host }: SignUpEmailProps) => {
  const username = email.split("@")[0];
  return (
    <Html>
      <Head>
        <Preview>Sign Up to Backlogged</Preview>
      </Head>
      <Tailwind>
        <Body className="my-aut0 mx-auto bg-white font-sans">
          <Container className="mx-auto my-9 w-[400px] rounded border border-solid border-gray-200 p-5">
            <Section className="flex justify-center justify-items-center ">
              <Icons.logo className="h-[100px]" aria-hidden="true" />
            </Section>
            <Heading className="mb-10 mt-0 text-center text-2xl font-bold">
              Join Backlogged
            </Heading>
            <Text className="mb-0 text-black">
              Hello {username ? username : email},{" "}
            </Text>
            <Text className="mt-2 text-black">
              Join more than <strong>1000</strong> gamers globally on{" "}
              <strong>Backlogged</strong>. Click the button below to sign up.
            </Text>
            <Section className="mb-12 mt-12 text-center">
              <Button
                className="rounded bg-gray-950 px-8 py-4 text-center font-semibold text-white no-underline"
                href={url}
              >
                Sign Up
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

export default SignUpEmail;
