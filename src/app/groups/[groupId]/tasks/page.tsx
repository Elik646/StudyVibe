import Link from "next/link";
import { notFound } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function fmtDate(d: Date) {
  // Stable (no hydration mismatch): YYYY-MM-DD
  return d.toISOString().slice(0, 10);
}

function statusLabel(s: string) {
  // Pretty labels for UI
  return s.replaceAll("_", " ");
}

export default async function GroupTasksPage({
  params,
}: {
  params: Promise<{ groupId: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) notFound();

  const { groupId } = await params;

  // Find current user
  const me = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!me) notFound();

  // Must be a member of the group
  const membership = await prisma.groupMember.findFirst({
    where: { groupId, userId: me.id },
    select: {
      role: true,
      group: { select: { id: true, name: true } },
    },
  });
  if (!membership) notFound();

  const tasks = await prisma.task.findMany({
    where: { groupId },
    orderBy: [{ createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      status: true,
      priority: true,
      dueAt: true,
      assignee: {
        select: { name: true, email: true, tag: true },
      },
      createdAt: true,
    },
  });

  return (
    <main className="min-h-screen p-6 sm:p-8">
      <div className="mx-auto w-full max-w-3xl space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <Link className="text-sm underline opacity-80" href={`/groups/${groupId}`}>
              ← Back to group
            </Link>
            <h1 className="mt-2 text-2xl font-semibold truncate">
              Tasks — {membership.group.name}
            </h1>
            <div className="text-sm text-white/60">
              You are: {membership.role}
            </div>
          </div>

          <Link
            href={`/groups/${groupId}/tasks/new`}
            className="shrink-0 rounded-xl bg-white text-black px-4 py-2 text-sm font-medium hover:opacity-90"
          >
            + New task
          </Link>
        </div>

        <div className="rounded-2xl border border-white/15 overflow-hidden">
          {tasks.length === 0 ? (
            <div className="p-6">
              <div className="text-white/80">No tasks yet.</div>
              <div className="text-sm text-white/60 mt-1">
                Create the first task for this group.
              </div>
            </div>
          ) : (
            <div className="divide-y divide-white/10">
              {tasks.map((t) => (
                <Link
                  key={t.id}
                  href={`/tasks/${t.id}`}
                  className="block p-4 sm:p-5 hover:bg-white/5 transition"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="min-w-0">
                      <div className="font-medium truncate">{t.title}</div>

                      <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
                        <span className="rounded-full border border-white/15 bg-white/5 px-2 py-1 text-white/80">
                          {statusLabel(t.status)}
                        </span>

                        <span className="rounded-full border border-white/15 bg-white/5 px-2 py-1 text-white/70">
                          Priority: {t.priority}
                        </span>

                        {t.dueAt && (
                          <span className="rounded-full border border-white/15 bg-white/5 px-2 py-1 text-white/70">
                            Due: {fmtDate(t.dueAt)}
                          </span>
                        )}

                        {t.assignee && (
                          <span
                            className="rounded-full border border-white/15 bg-white/5 px-2 py-1 text-white/70"
                            title={t.assignee.tag ?? undefined}
                          >
                            Assignee: {t.assignee.name || t.assignee.email}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="text-xs text-white/50 shrink-0">
                      {fmtDate(t.createdAt)}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </main>
  );
}