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
  const successorUserId: string | undefined = body?.successorUserId;

  try {
    await prisma.$transaction(async (tx) => {
      const me = await tx.groupMember.findFirst({
        where: { groupId, user: { email: session.user.email } },
        select: { id: true, role: true, userId: true },
      });

      if (!me) throw new Error("NOT_MEMBER");

      // If not admin: just delete membership
      if (me.role !== "ADMIN") {
        await tx.groupMember.delete({ where: { id: me.id } });
        return;
      }

      // Admin leaving: must choose successor
      if (!successorUserId) throw new Error("SUCCESSOR_REQUIRED");
      if (successorUserId === me.userId) throw new Error("SUCCESSOR_INVALID");

      const successor = await tx.groupMember.findFirst({
        where: { groupId, userId: successorUserId },
        select: { id: true },
      });

      if (!successor) throw new Error("SUCCESSOR_NOT_MEMBER");

      // Transfer admin to successor
      await tx.groupMember.updateMany({
        where: { groupId, role: "ADMIN" },
        data: { role: "MEMBER" },
      });

      await tx.groupMember.update({
        where: { id: successor.id },
        data: { role: "ADMIN" },
      });

      // Now remove admin's membership
      await tx.groupMember.delete({ where: { id: me.id } });
    });

    return NextResponse.json({ ok: true });
  } catch (e: any) {
    const msg = String(e?.message || "");
    if (msg === "NOT_MEMBER") return NextResponse.json({ error: "Not a member" }, { status: 404 });
    if (msg === "SUCCESSOR_REQUIRED") return NextResponse.json({ error: "Admin must choose a successor to leave" }, { status: 400 });
    if (msg === "SUCCESSOR_NOT_MEMBER") return NextResponse.json({ error: "Successor is not a member" }, { status: 400 });
    if (msg === "SUCCESSOR_INVALID") return NextResponse.json({ error: "Choose a different successor" }, { status: 400 });
    return NextResponse.json({ error: "Failed to leave group" }, { status: 500 });
  }
}