import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ taskId: string }> };

async function getAuthedUserId() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;

  const me = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  return me?.id ?? null;
}

export async function PATCH(req: Request, ctx: Ctx) {
  const userId = await getAuthedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { taskId } = await ctx.params;
  if (!taskId) {
    return NextResponse.json({ error: "Missing taskId in route params" }, { status: 400 });
  }

  // 1) Find task + groupId
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { id: true, groupId: true },
  });

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  // 2) Ensure current user is a member of that group
  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId: task.groupId, userId } },
    select: { id: true },
  });

  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);

  // 3) Build safe update payload
  const data: any = {};

  if (body?.status !== undefined) data.status = String(body.status);

  if (body?.priority !== undefined) {
    const p = Number(body.priority);
    data.priority = [1, 2, 3].includes(p) ? p : 2;
  }

  if (body?.dueAt !== undefined) {
    if (!body.dueAt) {
      data.dueAt = null;
    } else {
      const d = new Date(String(body.dueAt));
      if (Number.isNaN(d.getTime())) {
        return NextResponse.json({ error: "Invalid due date" }, { status: 400 });
      }
      data.dueAt = d;
    }
  }

  if (body?.assigneeId !== undefined) {
    const assigneeId = body.assigneeId ? String(body.assigneeId) : null;

    // Optional safety: only allow assigning to group members
    if (assigneeId) {
      const assigneeMembership = await prisma.groupMember.findUnique({
        where: { groupId_userId: { groupId: task.groupId, userId: assigneeId } },
        select: { id: true },
      });

      if (!assigneeMembership) {
        return NextResponse.json(
          { error: "Assignee must be a member of the group." },
          { status: 400 }
        );
      }
    }

    data.assigneeId = assigneeId;
  }

  try {
    await prisma.task.update({
      where: { id: taskId },
      data,
      select: { id: true },
    });

    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Failed to save." }, { status: 500 });
  }
}

// If your client uses PUT, keep this:
export async function PUT(req: Request, ctx: Ctx) {
  return PATCH(req, ctx);
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const userId = await getAuthedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { taskId } = await ctx.params;
  if (!taskId) {
    return NextResponse.json({ error: "Missing taskId in route params" }, { status: 400 });
  }

  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { id: true, groupId: true },
  });

  if (!task) {
    return NextResponse.json({ error: "Task not found" }, { status: 404 });
  }

  const membership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId: task.groupId, userId } },
    select: { id: true },
  });

  if (!membership) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    await prisma.task.delete({ where: { id: taskId } });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Failed to delete." }, { status: 500 });
  }
}