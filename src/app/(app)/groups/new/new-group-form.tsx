"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export default function NewGroupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const n = name.trim();
    if (n.length < 2) {
      setError("Group name must be at least 2 characters.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/groups", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: n }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Failed to create group.");
        return;
      }

      router.push(`/groups/${data.id}`);
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Group name</label>
        <input
          className="w-full rounded-xl border px-3 py-2 outline-none"
          placeholder="e.g. Econometrics Study Squad"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      {error && <div className="text-sm text-red-600">{error}</div>}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-xl bg-black text-white py-2 disabled:opacity-60"
      >
        {loading ? "Creating..." : "Create group"}
      </button>
    </form>
  );
}