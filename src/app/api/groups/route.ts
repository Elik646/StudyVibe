import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

function makeInviteCode() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let out = "";
  for (let i = 0; i < 8; i++) out += alphabet[Math.floor(Math.random() * alphabet.length)];
  return out;
}

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const name = String(body?.name || "").trim();

  if (name.length < 2) {
    return NextResponse.json(
      { error: "Group name must be at least 2 characters." },
      { status: 400 }
    );
  }

  try {
    const created = await prisma.$transaction(async (tx) => {
      // 1) Ensure user exists
      const user = await tx.user.upsert({
        where: { email: session.user!.email! },
        update: {
          name: session.user?.name ?? undefined,
          image: session.user?.image ?? undefined,
        },
        create: {
          email: session.user!.email!,
          name: session.user?.name ?? null,
          image: session.user?.image ?? null,
        },
        select: { id: true },
      });

      // 2) Create group (retry inviteCode if collision)
      let group: { id: string } | null = null;

      for (let attempt = 0; attempt < 5; attempt++) {
        const inviteCode = makeInviteCode();
        try {
          group = await tx.group.create({
            data: { name, inviteCode },
            select: { id: true },
          });
          break;
        } catch (e: any) {
          if (attempt === 4) throw e;
        }
      }

      if (!group) throw new Error("Failed to create group");

      // 3) Creator becomes ADMIN (enum-safe)
      await tx.groupMember.create({
        data: {
          groupId: group.id,
          userId: user.id,
          role: "ADMIN",
        },
      });

      return group;
    });

    return NextResponse.json({ id: created.id }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create group." }, { status: 500 });
  }
}