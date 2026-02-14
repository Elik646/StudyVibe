import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ groupId: string; userId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { groupId, userId } = await params;

  const me = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });
  if (!me) return NextResponse.json({ error: "User not found" }, { status: 401 });

  // Must be admin
  const myMembership = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId: me.id } },
    select: { role: true },
  });

  if (!myMembership || myMembership.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Can't remove yourself via this endpoint (use Leave flow)
  if (userId === me.id) {
    return NextResponse.json(
      { error: "Use Leave Group to remove yourself." },
      { status: 400 }
    );
  }

  // Target membership must exist
  const target = await prisma.groupMember.findUnique({
    where: { groupId_userId: { groupId, userId } },
    select: { role: true },
  });

  if (!target) {
    return NextResponse.json({ error: "Member not found" }, { status: 404 });
  }

  // Can't remove admin — must transfer first
  if (target.role === "ADMIN") {
    return NextResponse.json(
      { error: "Transfer admin first before removing the admin." },
      { status: 400 }
    );
  }

  await prisma.groupMember.delete({
    where: { groupId_userId: { groupId, userId } },
  });

  return NextResponse.json({ ok: true });
}