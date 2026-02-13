import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";

function makeInviteCode(len = 10) {
  // URL-safe-ish short code
  return crypto.randomBytes(len).toString("base64url").slice(0, len);
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const name = typeof body?.name === "string" ? body.name.trim() : "";

  if (!name || name.length < 2) {
    return NextResponse.json({ error: "Group name is required" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  if (!user) {
    // Shouldn't happen if NextAuth created user already, but safe guard:
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  // Ensure inviteCode uniqueness (rare collision, but safe)
  let inviteCode = makeInviteCode(10);
  for (let i = 0; i < 5; i++) {
    const exists = await prisma.group.findUnique({ where: { inviteCode } });
    if (!exists) break;
    inviteCode = makeInviteCode(10);
  }

  const group = await prisma.group.create({
    data: {
      name,
      inviteCode,
      members: {
        create: {
          userId: user.id,
          role: "admin",
        },
      },
    },
    select: { id: true },
  });

  return NextResponse.json({ id: group.id }, { status: 201 });
}