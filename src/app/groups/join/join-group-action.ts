"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function joinGroup(inviteCodeRaw: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) {
    throw new Error("Not authenticated");
  }

  const inviteCode = inviteCodeRaw.trim();
  if (!inviteCode) throw new Error("Invite code is required");

  const group = await prisma.group.findUnique({
    where: { inviteCode },
    select: { id: true },
  });

  if (!group) throw new Error("Invalid invite code");

  const existing = await prisma.groupMember.findFirst({
    where: {
      groupId: group.id,
      user: { email: session.user.email },
    },
    select: { id: true },
  });

  if (existing) {
    // already a member → just go to the group
    redirect(`/groups/${group.id}`);
  }

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    select: { id: true },
  });

  if (!user) throw new Error("User not found in DB (try signing in again)");

  await prisma.groupMember.create({
    data: {
      groupId: group.id,
      userId: user.id,
      role: "member",
    },
  });

  redirect(`/groups/${group.id}`);
}