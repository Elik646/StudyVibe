import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function DELETE(
  req: Request,
  ctx?: { params?: { groupId?: string } }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // ✅ 1) Try normal Next param
  let groupId = ctx?.params?.groupId;

  // ✅ 2) Fallback: parse from URL path: /api/groups/<groupId>
  if (!groupId) {
    const pathname = new URL(req.url).pathname; // e.g. /api/groups/cmll3l...
    const parts = pathname.split("/").filter(Boolean);
    groupId = parts[parts.length - 1]; // last segment
  }

  // Guard
  if (!groupId || groupId === "groups") {
    return NextResponse.json(
      { error: "Missing groupId in URL" },
      { status: 400 }
    );
  }

  try {
    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
      select: { id: true },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const membership = await prisma.groupMember.findFirst({
      where: { groupId, userId: user.id },
      select: { role: true },
    });

    if (!membership) {
      return NextResponse.json({ error: "Not a member" }, { status: 403 });
    }

    if (membership.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    await prisma.group.delete({ where: { id: groupId } });

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("Delete group failed:", e);
    return NextResponse.json(
      { error: "Failed to delete group" },
      { status: 500 }
    );
  }
}