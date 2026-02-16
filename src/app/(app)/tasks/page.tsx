import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export default async function MyTasksPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/");

  const me = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!me) redirect("/");

  const tasks = await prisma.task.findMany({
    where: { assigneeId: me.id },
    orderBy: [{ dueAt: "asc" }, { createdAt: "desc" }],
    select: {
      id: true,
      title: true,
      status: true,
      priority: true,
      dueAt: true,
      group: { select: { id: true, name: true } },
    },
    take: 50,
  });

  return (
    <main className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold">My tasks</h1>
        <Link
          href="/groups"
          className="inline-flex items-center rounded-xl border px-4 py-2 text-sm hover:bg-white/5"
        >
          Go to groups
        </Link>
      </div>

      {tasks.length === 0 ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 text-sm text-white/70">
          No assigned tasks yet.
        </div>
      ) : (
        <div className="space-y-3">
          {tasks.map((t) => (
            <Link
              key={t.id}
              href={`/tasks/${t.id}`}
              className="block rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition"
            >
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="font-medium">{t.title}</div>
                <div className="text-xs text-white/60">
                  {t.group.name} • {t.status.replaceAll("_", " ")} • P{t.priority}
                  {t.dueAt ? ` • due ${new Date(t.dueAt).toLocaleDateString()}` : ""}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}