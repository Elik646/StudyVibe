"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function DeleteGroupButton({ groupId }: { groupId: string }) {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onDelete() {
    const ok = confirm(
      "Delete this group permanently? This cannot be undone."
    );
    if (!ok) return;

    setPending(true);
    setError(null);

    try {
      const res = await fetch(`/api/groups/${groupId}`, { method: "DELETE" });
      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        setError(data?.error ?? `Failed (${res.status})`);
        setPending(false);
        return;
      }

      router.push("/groups");
      router.refresh();
    } catch {
      setError("Network error.");
      setPending(false);
    }
  }

  return (
    <div className="space-y-2">
      {error && (
        <div className="rounded-xl border p-3 text-sm">
          <span className="opacity-80">{error}</span>
        </div>
      )}

      <button
        onClick={onDelete}
        disabled={pending}
        className="rounded-xl bg-red-600 text-white px-4 py-2 disabled:opacity-60"
      >
        {pending ? "Deleting..." : "Delete group"}
      </button>
    </div>
  );
}