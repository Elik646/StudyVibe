"use client";

import { useState } from "react";

export default function MemberRowActions({
  groupId,
  isAdmin,
  myUserId,
  memberUserId,
  memberRole,
}: {
  groupId: string;
  isAdmin: boolean;
  myUserId: string;
  memberUserId: string;
  memberRole: "ADMIN" | "MEMBER";
}) {
  const [loading, setLoading] = useState<"makeAdmin" | "remove" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const isMe = memberUserId === myUserId;

  async function makeAdmin() {
    setError(null);
    setLoading("makeAdmin");
    try {
      const res = await fetch(`/api/groups/${groupId}/transfer-admin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newAdminUserId: memberUserId }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Failed to transfer admin.");
      window.location.reload();
    } catch (e: any) {
      setError(e?.message ?? "Failed to transfer admin.");
    } finally {
      setLoading(null);
    }
  }

  async function removeMember() {
    setError(null);
    setLoading("remove");
    try {
      const res = await fetch(`/api/groups/${groupId}/members/${memberUserId}`, {
        method: "DELETE",
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(data?.error ?? "Failed to remove member.");
      window.location.reload();
    } catch (e: any) {
      setError(e?.message ?? "Failed to remove member.");
    } finally {
      setLoading(null);
    }
  }

  // Non-admins: no actions
  if (!isAdmin) {
    return <div className="text-sm opacity-60">{isMe ? "You" : ""}</div>;
  }

  // Admin viewing self: no actions here (use your LeaveGroup flow)
  if (isMe) {
    return <div className="text-sm opacity-60">You</div>;
  }

  return (
    <div className="flex flex-col items-stretch gap-2 sm:flex-row sm:items-center sm:justify-end">
      {memberRole !== "ADMIN" && (
        <button
          onClick={makeAdmin}
          disabled={loading !== null}
          className="rounded-xl border px-3 py-2 text-sm hover:bg-white/5 disabled:opacity-50"
          title="Transfer admin role to this member"
        >
          {loading === "makeAdmin" ? "Transferring..." : "Make admin"}
        </button>
      )}

      <button
        onClick={removeMember}
        disabled={loading !== null || memberRole === "ADMIN"}
        className="rounded-xl border px-3 py-2 text-sm hover:bg-white/5 disabled:opacity-50"
        title={
          memberRole === "ADMIN"
            ? "Transfer admin first to remove admin"
            : "Remove this member from the group"
        }
      >
        {loading === "remove" ? "Removing..." : "Remove"}
      </button>

      {error && (
        <div className="text-xs text-red-400 sm:max-w-[220px]">{error}</div>
      )}
    </div>
  );
}