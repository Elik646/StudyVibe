import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  ctx: { params: Promise<{ groupId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ✅ Next.js 16: params can be a Promise
  const { groupId } = await ctx.params;

  if (!groupId) {
    return NextResponse.json(
      { error: "Missing groupId in route params" },
      { status: 400 }
    );
  }

  // Find current user
  const me = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  if (!me) {
    return NextResponse.json(
      { error: "User not found (try signing out/in)" },
      { status: 401 }
    );
  }

  // ✅ Any MEMBER or ADMIN can create tasks (membership required)
  const membership = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: {
        groupId,
        userId: me.id,
      },
    },
    select: { id: true },
  });

  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);

  const title = String(body?.title ?? "").trim();
  if (title.length < 2) {
    return NextResponse.json(
      { error: "Title must be at least 2 characters." },
      { status: 400 }
    );
  }

  const description =
    body?.description === null || body?.description === undefined
      ? null
      : String(body.description).trim() || null;

  const priorityRaw = Number(body?.priority ?? 2);
  const priority = [1, 2, 3].includes(priorityRaw) ? priorityRaw : 2;

  const assigneeId = body?.assigneeId ? String(body.assigneeId) : null;

  const dueAt = body?.dueAt ? new Date(String(body.dueAt)) : null;
  if (body?.dueAt && Number.isNaN(dueAt?.getTime())) {
    return NextResponse.json({ error: "Invalid due date" }, { status: 400 });
  }

  const created = await prisma.task.create({
    data: {
      groupId,
      title,
      description,
      priority,
      assigneeId,
      dueAt,
    },
    select: { id: true },
  });

  return NextResponse.json({ id: created.id }, { status: 201 });
}