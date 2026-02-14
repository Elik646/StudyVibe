import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ groupId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { groupId } = await params;
  const body = await req.json().catch(() => null);
  const newAdminUserId: string | undefined = body?.newAdminUserId;

  if (!newAdminUserId) {
    return NextResponse.json({ error: "newAdminUserId is required" }, { status: 400 });
  }

  try {
    await prisma.$transaction(async (tx) => {
      // Ensure requester is ADMIN of this group
      const requester = await tx.groupMember.findFirst({
        where: {
          groupId,
          role: "ADMIN",
          user: { email: session.user.email },
        },
        select: { id: true, userId: true },
      });

      if (!requester) throw new Error("NOT_ADMIN");

      // Ensure target is a MEMBER of this group (cannot transfer to non-member)
      const target = await tx.groupMember.findFirst({
        where: { groupId, userId: newAdminUserId },
        select: { id: true, userId: true },
      });

      if (!target) throw new Error("TARGET_NOT_MEMBER");

      // Enforce exactly 1 admin:
      // 1) demote existing admin(s) to MEMBER
      await tx.groupMember.updateMany({
        where: { groupId, role: "ADMIN" },
        data: { role: "MEMBER" },
      });

      // 2) promote target to ADMIN
      await tx.groupMember.update({
        where: { id: target.id },
        data: { role: "ADMIN" },
      });
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    const msg = String(e?.message || "");
    if (msg === "NOT_ADMIN") return NextResponse.json({ error: "Only admin can transfer admin" }, { status: 403 });
    if (msg === "TARGET_NOT_MEMBER") return NextResponse.json({ error: "Target user is not a member" }, { status: 400 });
    return NextResponse.json({ error: "Failed to transfer admin" }, { status: 500 });
  }
}