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
          <Link className="underline" href="/">
            Go home
          </Link>
        </div>
      </main>
    );
  }

  const groups = await prisma.group.findMany({
    where: {
      members: {
        some: { user: { email: session.user.email } },
      },
    },
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      inviteCode: true,
      members: {
        select: {
          role: true,
          user: {
            select: { name: true, email: true },
          },
        },
        orderBy: { role: "asc" }, // optional
      },
    },
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
          <div className="rounded-2xl border p-6 space-y-4">
            <div className="space-y-1">
              <p className="opacity-80">No groups yet.</p>
              <p className="text-sm opacity-70">Create your first group to start.</p>
            </div>

            <Link
              href="/groups/join"
              className="inline-flex items-center rounded-xl border px-4 py-2 text-sm"
            >
              Join group
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {groups.map((group) => {
              const displayMembers = group.members
                .map((m) => m.user.name || m.user.email)
                .filter(Boolean);

              const preview = displayMembers.slice(0, 4);
              const remaining = displayMembers.length - preview.length;

              return (
                <Link
                  key={group.id}
                  href={`/groups/${group.id}`}
                  className="block rounded-2xl border p-5 hover:bg-black/5 transition"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{group.name}</div>
                      <div className="text-sm opacity-60">
                        Invite code: <span className="font-mono">{group.inviteCode}</span>
                      </div>

                      {/* Members preview */}
                      {preview.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {preview.map((label) => (
                            <span
                              key={label}
                              className="rounded-full border px-3 py-1 text-xs opacity-90"
                            >
                              {label}
                            </span>
                          ))}

                          {remaining > 0 && (
                            <span className="rounded-full border px-3 py-1 text-xs opacity-70">
                              +{remaining} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Your role in this group */}
                    <div className="text-sm opacity-70 shrink-0">
                      {
                        group.members.find((m) => m.user.email === session.user.email)
                          ?.role
                      }
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}