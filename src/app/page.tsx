import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function Home() {
  const session = await getServerSession(authOptions);

  // If signed in, also load the user from DB so we can show the tag
  const dbUser =
    session?.user?.email
      ? await prisma.user.findUnique({
          where: { email: session.user.email },
          select: { name: true, email: true, tag: true },
        })
      : null;

  const displayName = dbUser?.name || dbUser?.email || session?.user?.email || "User";
  const displayEmail = dbUser?.email || session?.user?.email;

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
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="text-sm opacity-80">
                  Signed in as <b>{displayName}</b>
                </div>

                {dbUser?.tag && (
                  <span className="text-xs rounded-full border px-2 py-1 font-mono opacity-70">
                    {dbUser.tag}
                  </span>
                )}
              </div>

              {displayEmail && (
                <div className="text-xs opacity-60">{displayEmail}</div>
              )}
            </div>

            <a
              href="/groups"
              className="block w-full text-center rounded-xl border py-3"
            >
              Go to groups
            </a>

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