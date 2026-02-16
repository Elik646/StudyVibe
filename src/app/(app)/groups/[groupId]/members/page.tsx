import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import MemberRowActions from "./member-row-actions";

export default async function MembersPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) notFound();

  const { groupId } = await params;

  const me = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!me) notFound();

  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: me.id } },
    select: {
      role: true,
      group: {
        select: {
          id: true,
          name: true,
          members: {
            select: {
              role: true,
              userId: true,
              user: { select: { name: true, email: true, tag: true } },
            },
            orderBy: [{ role: "asc" }], // ADMIN first (enum sorts)
          },
        },
      },
    },
  });

  if (!membership) notFound();

  const isAdmin = membership.role === "ADMIN";

  const members = membership.group.members.map((m) => ({
    userId: m.userId,
    role: m.role,
    label: m.user.name || m.user.email,
    email: m.user.email,
    tag: m.user.tag,
  }));

  return (
    <main className="min-h-screen p-4 sm:p-8">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-1">
            <Link className="text-sm underline opacity-80" href={`/groups/${groupId}`}>
              ← Back to group
            </Link>
            <h1 className="text-2xl font-semibold">Members</h1>
            <p className="text-sm opacity-70">
              Group: <span className="font-medium">{membership.group.name}</span>
            </p>
          </div>

          <div className="rounded-xl border px-3 py-2 text-sm opacity-80 w-fit">
            Your role: <span className="font-semibold">{membership.role}</span>
          </div>
        </div>

        {/* Members list */}
        <div className="rounded-2xl border overflow-hidden">
          <div className="px-4 py-3 border-b">
            <div className="text-sm opacity-80">
              {members.length} member{members.length === 1 ? "" : "s"}
            </div>
          </div>

          <div className="p-3 sm:p-4 space-y-3">
            {members.map((m) => (
              <div
                key={m.userId}
                className="rounded-2xl border p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
              >
                {/* Left: identity */}
                <div className="min-w-0">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="font-medium truncate">{m.label}</div>

                    {/* Role badge */}
                    <span
                      className={
                        "shrink-0 rounded-full px-2 py-0.5 text-xs border " +
                        (m.role === "ADMIN"
                          ? "border-red-500/40 text-red-300 bg-red-500/10"
                          : "border-white/20 text-white/70 bg-white/5")
                      }
                    >
                      {m.role}
                    </span>
                  </div>

                  {/* tag (always visible here) */}
                  {m.tag && (
                    <div className="mt-1 text-xs font-mono text-white/60 truncate">
                      {m.tag}
                    </div>
                  )}
                </div>

                {/* Right: actions */}
                <div className="shrink-0">
                  <MemberRowActions
                    groupId={groupId}
                    isAdmin={isAdmin}
                    myUserId={me.id}
                    memberUserId={m.userId}
                    memberRole={m.role}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Note */}
        <div className="rounded-2xl border p-4 text-sm opacity-70">
          Tip: Admin transfer keeps the rule “exactly 1 admin exists”.
        </div>
      </div>
    </main>
  );
}