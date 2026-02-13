"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteGroupButton({ groupId }: { groupId: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onDelete() {
    setError(null);

    const ok = window.confirm(
      "Delete this group permanently? This will remove tasks and members too."
    );
    if (!ok) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/groups/${groupId}`, { method: "DELETE" });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setError(data?.error ?? "Failed to delete group.");
        return;
      }

      router.push("/groups");
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-2">
      {error && <div className="text-sm text-red-600">{error}</div>}

      <button
        onClick={onDelete}
        disabled={loading}
        className="w-full rounded-xl bg-red-600 text-white py-3 disabled:opacity-60"
      >
        {loading ? "Deleting..." : "Delete group"}
      </button>
    </div>
  );
}