import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

import LeaveGroupButton from "./leave-group-button";
import TransferAdmin from "./transfer-admin";
import DeleteGroupButton from "./delete-group-button";

export default async function GroupPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) notFound();

  const { groupId } = await params;

const me = await prisma.user.findUnique({
  where: { email: session.user.email },
  select: { id: true, email: true },
});

if (!me) notFound();

    const membership = await prisma.groupMember.findFirst({
      where: {
        groupId,
        userId: me.id,
      },
      select: {
        role: true,
        userId: true,
        group: {
          select: {
            id: true,
            name: true,
            inviteCode: true,
            createdAt: true,
            members: {
              select: {
                id: true,
                userId: true,
                role: true,
                user: { select: { id: true, name: true, email: true, tag: true } },
              },
              orderBy: { role: "asc" },
            },
          },
        },
      },
    });

  if (!membership) notFound();

  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <Link className="text-sm underline opacity-80" href="/groups">
          ← Back to groups
        </Link>

        <div className="rounded-2xl border p-6 space-y-2">
          <h1 className="text-2xl font-semibold">{membership.group.name}</h1>
          <div className="text-sm opacity-70">Your role: {membership.role}</div>
          <div className="text-sm opacity-70">
            Invite code:{" "}
            <span className="font-mono">{membership.group.inviteCode}</span>
          </div>
        </div>

        <Link
          href={`/groups/${membership.group.id}/members`}
          className="inline-flex items-center rounded-xl border px-4 py-2 text-sm hover:bg-white/5"
        >
          View members
        </Link>

        {/* Membership card */}
        <div className="rounded-2xl border p-6 space-y-3">
          <h2 className="text-lg font-semibold">Membership</h2>
          <p className="text-sm opacity-70">
            Leave the group if you no longer want access to it.
          </p>

          <LeaveGroupButton
            groupId={membership.group.id}
            members={membership.group.members}
            isAdmin={membership.role === "ADMIN"}
            myUserId={membership.userId}
          />

          {membership.role === "ADMIN" && (
            <TransferAdmin
              groupId={membership.group.id}
              members={membership.group.members}
              myUserId={membership.userId}
            />
          )}
        </div>

        {/* Admin-only delete */}
        {membership.role === "ADMIN" && (
          <div className="rounded-2xl border p-6 space-y-3">
            <h2 className="text-lg font-semibold">Admin</h2>
            <p className="text-sm opacity-70">
              Deleting the group will permanently remove all data inside it.
            </p>
            <DeleteGroupButton groupId={membership.group.id} />
          </div>
        )}

        <div className="rounded-2xl border p-6">
          <p className="opacity-80">Next: tasks, members, invite-join flow.</p>
        </div>
      </div>
    </main>
  );
}