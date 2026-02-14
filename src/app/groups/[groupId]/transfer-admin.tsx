"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Member = {
  role: "ADMIN" | "MEMBER";
  user: { id: string; name: string | null; email: string; tag: string | null };
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
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [newAdmin, setNewAdmin] = useState("");

  const candidates = useMemo(() => {
    return members
      .filter((m) => m.user.id !== myUserId)
      .map((m) => ({
        id: m.user.id,
        label: `${m.user.name || m.user.email}`,
      }));
  }, [members, myUserId]);

  async function submit() {
    if (!newAdmin) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/transfer-admin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ newAdminUserId: newAdmin }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to transfer admin");
        return;
      }

      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border p-6 space-y-3">
      <h2 className="text-lg font-semibold">Admin</h2>
      <p className="text-sm opacity-70">
        Choose a new admin. Exactly one admin will exist at all times.
      </p>

      <div className="flex gap-2">
        <select
          className="w-full rounded-xl border px-3 py-2 bg-transparent"
          value={newAdmin}
          onChange={(e) => setNewAdmin(e.target.value)}
        >
          <option value="">Select member…</option>
          {candidates.map((c) => (
            <option key={c.id} value={c.id}>
              {c.label}
            </option>
          ))}
        </select>

        <button
          onClick={submit}
          disabled={loading || !newAdmin}
          className="rounded-xl bg-black text-white px-4 py-2 disabled:opacity-50"
        >
          {loading ? "Saving…" : "Make admin"}
        </button>
      </div>
    </div>
  );
}