import { signIn, signOut, useSession } from "next-auth/react";
import { SEO } from "~/components/SEO";

export default function Home() {
  return (
    <>
      <div className="container flex w-3/4 flex-col items-center justify-center">
        <div className="mb-8 gap-4">
          <h1 className="text-center text-4xl font-extrabold text-white">
            Backlogged
          </h1>
          <p className="text-center text-lg text-white">
            For All Your Gaming Needs
          </p>
        </div>
        <AuthShowcase />
      </div>
    </>
  );
}

function AuthShowcase() {
  const { data: sessionData } = useSession();

  // const { data: secretMessage } = api.example.getSecretMessage.useQuery(
  //   undefined, // no input
  //   { enabled: sessionData?.user !== undefined }
  // );

  return (
    <div className="flex flex-col items-center justify-center gap-4">
      <p className="text-center text-2xl text-white">
        {sessionData && <span>Logged in as {sessionData.user?.name}</span>}
        {/* {secretMessage && <span> - {secretMessage}</span>} */}
      </p>
      <button
        className="rounded-full bg-white/10 px-10 py-3 font-semibold text-white no-underline transition hover:bg-white/20"
        onClick={sessionData ? () => void signOut() : () => void signIn()}
      >
        {sessionData ? "Sign out" : "Sign in"}
      </button>
    </div>
  );
}
