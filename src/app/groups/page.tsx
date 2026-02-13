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
            select: { name: true, email: true, tag: true },
          },
        },
        orderBy: { role: "asc" },
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
              // Find YOUR role in this group
              const myRole =
                group.members.find((m) => m.user.email === session.user.email)
                  ?.role ?? "member";

              // Build list of members with label + tag + unique key
              const displayMembers = group.members
                .map((m) => ({
                  key: m.user.email, // unique (good for React keys)
                  label: m.user.name || m.user.email,
                  tag: m.user.tag,
                }))
                .filter((m) => Boolean(m.label));

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
                        Invite code:{" "}
                        <span className="font-mono">{group.inviteCode}</span>
                      </div>

                      {/* MEMBERS: only render once (pills) */}
                      {preview.length > 0 && (
                        <div className="mt-3 flex flex-wrap gap-2">
                          {preview.map((m) => (
                            <span key={m.key} className="relative group">
                              {/* pill */}
                              <span className="inline-flex items-center rounded-full border border-white/20 bg-white/5 px-3 py-1 text-xs text-white/90">
                                {m.label}
                              </span>

                              {/* tooltip shown only on hover */}
                              {m.tag && (
                                <span className="pointer-events-none absolute left-1/2 top-full z-10 mt-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-white/15 bg-black/90 px-2 py-1 text-[11px] font-mono text-white shadow-lg opacity-0 transition group-hover:opacity-100">
                                  {m.tag}
                                </span>
                              )}
                            </span>
                          ))}

                          {remaining > 0 && (
                            <span className="inline-flex items-center rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-white/70">
                              +{remaining} more
                            </span>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Your role */}
                    <div className="text-sm text-white/70 shrink-0">
                      {myRole}
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