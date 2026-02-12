import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export default async function Home() {
  const session = await getServerSession(authOptions);

  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <div className="w-full max-w-md rounded-2xl border p-6 space-y-4">
        <h1 className="text-2xl font-semibold">StudyVibe</h1>

        {!session ? (
          <a
            href="/api/auth/signin"
            className="block w-full text-center rounded-xl bg-black text-white py-3"
          >
            Sign in with Google
          </a>
        ) : (
          <>
            <p className="text-sm opacity-80">
              Signed in as <b>{session.user?.email}</b>
            </p>
            <a
              href="/api/auth/signout"
              className="block w-full text-center rounded-xl bg-red-600 text-white py-3"
            >
              Sign out
            </a>
          </>
        )}
      </div>
    </main>
  );
}