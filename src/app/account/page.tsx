import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function AccountPage() {
  const session = await getServerSession(authOptions);

  if (!session?.user?.email) {
    return (
      <main className="min-h-screen flex items-center justify-center p-8">
        <div className="w-full max-w-md rounded-2xl border p-6 space-y-3">
          <h1 className="text-2xl font-semibold">Account</h1>
          <p className="text-sm opacity-80">Please sign in.</p>
          <Link className="underline" href="/">
            Go home
          </Link>
        </div>
      </main>
    );
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { name: true, email: true, tag: true, image: true },
  });

  const displayName = user?.name || user?.email || session.user.email;

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <Link className="text-sm underline opacity-80" href="/">
          ← Home
        </Link>

        <div className="rounded-2xl border p-6 space-y-4">
          <h1 className="text-2xl font-semibold">Account</h1>

          <div className="flex items-center gap-4">
            {user?.image ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={user.image}
                alt="Avatar"
                className="h-14 w-14 rounded-full border object-cover"
              />
            ) : (
              <div className="h-14 w-14 rounded-full border" />
            )}

            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <div className="font-medium">{displayName}</div>
                {user?.tag && (
                  <span className="text-xs rounded-full border px-2 py-1 font-mono opacity-70">
                    {user.tag}
                  </span>
                )}
              </div>
              <div className="text-sm opacity-70">{user?.email}</div>
            </div>
          </div>

          <div className="flex gap-2">
            <Link href="/groups" className="rounded-xl border px-4 py-2 text-sm">
              Go to groups
            </Link>
            <a
              href="/api/auth/signout"
              className="rounded-xl bg-red-600 text-white px-4 py-2 text-sm"
            >
              Sign out
            </a>
          </div>
        </div>
      </div>
    </main>
  );
}