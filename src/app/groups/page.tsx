import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export default async function GroupsPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return (
      <main className="min-h-screen flex items-center justify-center p-8">
        <div className="w-full max-w-md rounded-2xl border p-6 space-y-3">
          <h1 className="text-2xl font-semibold">Groups</h1>
          <p className="text-sm opacity-80">Please sign in to view your groups.</p>
          <Link className="underline" href="/">Go home</Link>
        </div>
      </main>
    );
  }

  const groups = await prisma.groupMember.findMany({
    where: { user: { email: session.user.email } },
    select: {
      role: true,
      group: { select: { id: true, name: true, inviteCode: true } },
    },
    orderBy: { group: { createdAt: "desc" } },
  });

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Your groups</h1>
          <Link
            href="/groups/new"
            className="rounded-xl bg-black text-white px-4 py-2"
          >
            + New group
          </Link>
        </div>

        {groups.length === 0 ? (
          <div className="rounded-2xl border p-6">
            <p className="opacity-80">No groups yet.</p>
            <div className="space-y-3">
            <p className="text-sm opacity-70">Create your first group to start.</p>

            <Link
                href="/groups/join"
                className="inline-flex items-center rounded-xl border px-4 py-2 text-sm"
            >
                Join group
            </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {groups.map((m) => (
              <Link
                key={m.group.id}
                href={`/groups/${m.group.id}`}
                className="block rounded-2xl border p-5 hover:bg-black/5 transition"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium">{m.group.name}</div>
                    <div className="text-sm opacity-60">
                      Invite code: {m.group.inviteCode}
                    </div>
                  </div>
                  <div className="text-sm opacity-70">{m.role}</div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}