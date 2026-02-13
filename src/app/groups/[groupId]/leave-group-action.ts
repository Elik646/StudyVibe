"use server";

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { redirect } from "next/navigation";

export async function leaveGroup(groupId: string) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) throw new Error("Not authenticated");

  const membership = await prisma.groupMember.findFirst({
    where: {
      groupId,
      user: { email: session.user.email },
    },
    select: { id: true, role: true },
  });

  if (!membership) throw new Error("You are not a member of this group");

  // Simple rule for now: admin can't leave (prevents orphaned groups)
  if (membership.role === "admin") {
    throw new Error("Admins can't leave the group. Delete it instead.");
  }

  await prisma.groupMember.delete({
    where: { id: membership.id },
  });

  redirect("/groups");
}