import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

type Ctx = { params: Promise<{ groupId: string; taskId: string }> };

async function getAuthedUserId() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) return null;

  const me = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  return me?.id ?? null;
}

async function requireMembership(groupId: string, userId: string) {
  const membership = await prisma.groupMember.findUnique({
    where: {
      groupId_userId: {
        groupId,
        userId,
      },
    },
    select: { id: true },
  });

  return !!membership;
}

export async function PATCH(req: Request, ctx: Ctx) {
  const userId = await getAuthedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ✅ Next 16: params can be a Promise
  const { groupId, taskId } = await ctx.params;

  if (!groupId || !taskId) {
    return NextResponse.json(
      { error: "Missing groupId/taskId in route params" },
      { status: 400 }
    );
  }

  const isMember = await requireMembership(groupId, userId);
  if (!isMember) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);

  // Build a safe update object (only allow these fields)
  const data: any = {};

  if (body?.status) {
    data.status = String(body.status);
  }

  if (body?.priority !== undefined) {
    const p = Number(body.priority);
    data.priority = [1, 2, 3].includes(p) ? p : 2;
  }

  if (body?.assigneeId !== undefined) {
    const assigneeId = body.assigneeId ? String(body.assigneeId) : null;

    // Optional safety: only allow assigning to group members
    if (assigneeId) {
      const assigneeMembership = await prisma.groupMember.findUnique({
        where: {
          groupId_userId: {
            groupId,
            userId: assigneeId,
          },
        },
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

  try {
    // Make sure the task belongs to this group (prevents cross-group edits)
    const existing = await prisma.task.findFirst({
      where: { id: taskId, groupId },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const updated = await prisma.task.update({
      where: { id: taskId },
      data,
      select: { id: true },
    });

    return NextResponse.json({ id: updated.id }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Failed to save." }, { status: 500 });
  }
}

// (Optional) If your client uses PUT instead of PATCH, this makes it work too:
export async function PUT(req: Request, ctx: Ctx) {
  return PATCH(req, ctx);
}

export async function DELETE(_req: Request, ctx: Ctx) {
  const userId = await getAuthedUserId();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { groupId, taskId } = await ctx.params;

  if (!groupId || !taskId) {
    return NextResponse.json(
      { error: "Missing groupId/taskId in route params" },
      { status: 400 }
    );
  }

  const isMember = await requireMembership(groupId, userId);
  if (!isMember) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  try {
    const existing = await prisma.task.findFirst({
      where: { id: taskId, groupId },
      select: { id: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    await prisma.task.delete({ where: { id: taskId } });
    return NextResponse.json({ ok: true }, { status: 200 });
  } catch {
    return NextResponse.json({ error: "Failed to delete." }, { status: 500 });
  }
}