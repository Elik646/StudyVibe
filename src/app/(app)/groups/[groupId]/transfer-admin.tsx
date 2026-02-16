"use client";

import { useState } from "react";

type Member = {
  userId: string; // IMPORTANT
  role: "ADMIN" | "MEMBER";
  user: {
    id: string;
    name: string | null;
    email: string;
    tag: string;
  };
};

export default function TransferAdmin({
  groupId,
  members,
  myUserId,
}: {
  groupId: string;
  members: Member[];
  myUserId: string;
}) {
  const [newAdminUserId, setNewAdminUserId] = useState<string>("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // candidates: everyone except me
  const candidates = members.filter((m) => m.userId !== myUserId);

  async function onConfirm() {
    setError(null);

    if (!newAdminUserId) {
      setError("newAdminUserId is required");
      return;
    }

    setPending(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/transfer-admin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newAdminUserId }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Failed to transfer admin.");
        return;
      }

      // easiest refresh
      window.location.reload();
    } catch {
      setError("Network error.");
    } finally {
      setPending(false);
    }
  }

  // if there is nobody to transfer to, show nothing
  if (candidates.length === 0) return null;

  return (
    <div className="mt-4 rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
      <div className="space-y-1">
        <div className="text-sm font-medium">Choose the new admin</div>
        <div className="text-xs text-white/70">
          Exactly one admin must exist. Pick the member carefully.
        </div>
      </div>

      <select
        value={newAdminUserId}
        onChange={(e) => setNewAdminUserId(e.target.value)}
        className="w-full rounded-xl border border-white/15 bg-black/40 px-3 py-2 text-sm outline-none"
      >
        <option value="">Select member...</option>
        {candidates.map((m) => (
          <option key={m.userId} value={m.userId}>
            {m.user.name || m.user.email} — {m.user.tag}
          </option>
        ))}
      </select>

      {error && <div className="text-xs text-red-500">{error}</div>}

      <button
        disabled={pending || !newAdminUserId}
        onClick={onConfirm}
        className="w-full rounded-xl bg-black text-white py-2 disabled:opacity-50"
      >
        {pending ? "Transferring..." : "Confirm transfer"}
      </button>
    </div>
  );
}