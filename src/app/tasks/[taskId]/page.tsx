import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import TaskEditor from "./task-editor";

export default async function TaskPage({
  params,
}: {
  params: Promise<{ taskId: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) notFound();

  const { taskId } = await params;

  const me = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!me) notFound();

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: {
      id: true,
      groupId: true,
      title: true,
      description: true,
      status: true,
      priority: true,
      dueAt: true,
      assigneeId: true,
      group: {
        select: {
          id: true,
          name: true,
          members: {
            select: {
              userId: true,
              user: { select: { name: true, email: true, tag: true } },
            },
          },
        },
      },
    },
  });
  if (!task) notFound();

  const membership = await prisma.groupMember.findFirst({
    where: { groupId: task.groupId, userId: me.id },
    select: { id: true },
  });
  if (!membership) notFound();

  return (
    <main className="min-h-screen p-6 sm:p-8">
      <div className="mx-auto w-full max-w-2xl space-y-6">
        <Link className="text-sm underline opacity-80" href={`/groups/${task.groupId}/tasks`}>
          ← Back to tasks
        </Link>

        <div className="rounded-2xl border border-white/15 p-5 sm:p-6 space-y-2">
          <div className="text-sm text-white/60">{task.group.name}</div>
          <h1 className="text-2xl font-semibold">{task.title}</h1>
          {task.description && <p className="text-white/80">{task.description}</p>}
        </div>

        <div className="rounded-2xl border border-white/15 p-5 sm:p-6">
          <TaskEditor
            taskId={task.id}
            initial={{
              status: task.status,
              priority: task.priority,
              dueAt: task.dueAt ? task.dueAt.toISOString().slice(0, 10) : "",
              assigneeId: task.assigneeId ?? "",
            }}
            members={task.group.members.map((m) => ({
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