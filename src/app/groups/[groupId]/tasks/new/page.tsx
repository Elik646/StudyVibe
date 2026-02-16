import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import NewTaskForm from "./task-form";

export default async function NewTaskPage({
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

  const membership = await prisma.groupMember.findFirst({
    where: { groupId, userId: me.id },
    select: {
      group: {
        select: {
          id: true,
          name: true,
          members: {
            select: {
              userId: true,
              role: true,
              user: { select: { name: true, email: true, tag: true } },
            },
            orderBy: { role: "asc" },
          },
        },
      },
    },
  });
  if (!membership) notFound();

  return (
    <main className="min-h-screen p-6 sm:p-8">
      <div className="mx-auto w-full max-w-xl space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <Link
              className="text-sm underline opacity-80"
              href={`/groups/${groupId}/tasks`}
            >
              ← Back to tasks
            </Link>
            <h1 className="mt-2 text-2xl font-semibold truncate">
              New task — {membership.group.name}
            </h1>
          </div>
        </div>

        <div className="rounded-2xl border border-white/15 p-5 sm:p-6">
          <NewTaskForm
            groupId={membership.group.id}
            members={membership.group.members.map((m) => ({
              userId: m.userId,
              label: m.user.name || m.user.email,
              tag: m.user.tag,
            }))}
          />
        </div>
      </div>
    </main>
  );
}