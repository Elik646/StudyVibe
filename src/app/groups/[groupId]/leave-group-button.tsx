"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Member = {
  role: "ADMIN" | "MEMBER";
  user: { id: string; name: string | null; email: string; tag: string | null };
};

export default function LeaveGroupButton({
  groupId,
  members,
  isAdmin,
  myUserId,
}: {
  groupId: string;
  members: Member[];
  isAdmin: boolean;
  myUserId: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [successor, setSuccessor] = useState("");

  const candidates = useMemo(() => {
    return members
      .filter((m) => m.user.id !== myUserId)
      .map((m) => ({
        id: m.user.id,
        label: `${m.user.name || m.user.email}`,
      }));
  }, [members, myUserId]);

  async function leave() {
    if (isAdmin && !successor) {
      alert("As admin, you must choose a successor before leaving.");
      return;
    }

    if (!confirm("Leave this group?")) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/leave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(isAdmin ? { successorUserId: successor } : {}),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        alert(data.error || "Failed to leave group");
        return;
      }

      router.push("/groups");
      router.refresh();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="rounded-2xl border p-6 space-y-3">
      <h2 className="text-lg font-semibold">Membership</h2>
      <p className="text-sm opacity-70">
        Leave the group if you no longer want access to it.
      </p>

      {isAdmin && (
        <div className="space-y-2">
          <p className="text-sm opacity-70">
            You’re the admin — pick a successor to leave.
          </p>
          <select
            className="w-full rounded-xl border px-3 py-2 bg-transparent"
            value={successor}
            onChange={(e) => setSuccessor(e.target.value)}
          >
            <option value="">Select successor…</option>
            {candidates.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <button
        onClick={leave}
        disabled={loading || (isAdmin && !successor)}
        className="w-full rounded-xl border py-3 disabled:opacity-50"
      >
        {loading ? "Leaving…" : "Leave group"}
      </button>
    </div>
  );
}