import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";

export default async function GroupPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) notFound();

  const { groupId } = await params;

  const membership = await prisma.groupMember.findFirst({
    where: {
      groupId,
      user: { email: session.user.email },
    },
    select: {
      role: true,
      group: {
        select: {
          id: true,
          name: true,
          inviteCode: true,
          createdAt: true,
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
            Invite code: <span className="font-mono">{membership.group.inviteCode}</span>
          </div>
        </div>

        <div className="rounded-2xl border p-6">
          <p className="opacity-80">Next: tasks, members, invite-join flow.</p>
        </div>
      </div>
    </main>
  );
}