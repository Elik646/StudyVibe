"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function joinGroup(rawCode: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) throw new Error("Unauthorized");

  const inviteCode = String(rawCode || "").trim().toUpperCase();
  if (!inviteCode) throw new Error("Invite code is required.");

  const group = await prisma.group.findUnique({
    where: { inviteCode },
    select: { id: true },
  });

  if (!group) throw new Error("Invalid invite code.");

  await prisma.$transaction(async (tx) => {
    // 1) ensure user exists
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
        emailVerified: null,
      },
      select: { id: true },
    });

    // 2) if already a member, don't duplicate
    const existing = await tx.groupMember.findUnique({
      where: {
        groupId_userId: {
          groupId: group.id,
          userId: user.id,
        },
      },
      select: { id: true },
    });

    if (!existing) {
      await tx.groupMember.create({
        data: {
          groupId: group.id,
          userId: user.id,
          role: "MEMBER",
        },
      });
    }
  });

  redirect(`/groups/${group.id}`);
}