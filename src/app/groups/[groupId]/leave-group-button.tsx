"use client";

import { useState } from "react";
import { leaveGroup } from "./leave-group-action";

export default function LeaveGroupButton({ groupId }: { groupId: string }) {
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onLeave() {
    setError(null);

    const ok = confirm("Leave this group? You will lose access to its tasks.");
    if (!ok) return;

    setPending(true);
    try {
      await leaveGroup(groupId);
      // server action redirects
    } catch (e: any) {
      setError(e?.message ?? "Failed to leave group");
      setPending(false);
    }
  }

  return (
    <div className="space-y-2">
      <button
        onClick={onLeave}
        disabled={pending}
        className="w-full rounded-xl bg-zinc-900 text-white py-3 disabled:opacity-50"
      >
        {pending ? "Leaving..." : "Leave group"}
      </button>

      {error && <p className="text-sm opacity-80">{error}</p>}
    </div>
  );
}