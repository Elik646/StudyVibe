"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";

type MemberOption = { userId: string; label: string; tag?: string | null };

export default function NewTaskForm({
  groupId,
  members,
}: {
  groupId: string;
  members: MemberOption[];
}) {
  const router = useRouter();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState(2);
  const [dueAt, setDueAt] = useState<string>(""); // YYYY-MM-DD
  const [assigneeId, setAssigneeId] = useState<string>("");

  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const memberOptions = useMemo(() => members.filter((m) => m.label), [members]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    const t = title.trim();
    if (t.length < 2) {
      setError("Title must be at least 2 characters.");
      return;
    }

    setPending(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/tasks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: t,
          description: description.trim() || null,
          priority,
          dueAt: dueAt ? new Date(dueAt + "T00:00:00.000Z").toISOString() : null,
          assigneeId: assigneeId || null,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Failed to create task.");
        return;
      }

      router.push(`/tasks/${data.id}`);
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="space-y-2">
        <label className="text-sm font-medium">Title</label>
        <input
          className="w-full rounded-xl border border-white/15 bg-transparent px-3 py-2 outline-none"
          placeholder="e.g. Finish econometrics exercises"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
        />
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Description (optional)</label>
        <textarea
          className="w-full min-h-[90px] rounded-xl border border-white/15 bg-transparent px-3 py-2 outline-none"
          placeholder="Notes, links, what ‘done’ means…"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-2">
          <label className="text-sm font-medium">Priority</label>
          <select
            className="w-full rounded-xl border border-white/15 bg-transparent px-3 py-2 outline-none"
            value={priority}
            onChange={(e) => setPriority(Number(e.target.value))}
          >
            <option value={1}>1 (High)</option>
            <option value={2}>2 (Medium)</option>
            <option value={3}>3 (Low)</option>
          </select>
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Due date (optional)</label>
          <input
            type="date"
            className="w-full rounded-xl border border-white/15 bg-transparent px-3 py-2 outline-none"
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
          />
        </div>
      </div>

      <div className="space-y-2">
        <label className="text-sm font-medium">Assignee (optional)</label>
        <select
          className="w-full rounded-xl border border-white/15 bg-transparent px-3 py-2 outline-none"
          value={assigneeId}
          onChange={(e) => setAssigneeId(e.target.value)}
        >
          <option value="">Unassigned</option>
          {memberOptions.map((m) => (
            <option key={m.userId} value={m.userId}>
              {m.label} {m.tag ? `(${m.tag})` : ""}
            </option>
          ))}
        </select>
        <div className="text-xs text-white/60">
          Tip: tags show here to avoid choosing the wrong person.
        </div>
      </div>

      {error && (
        <div className="rounded-xl border border-white/15 p-3 text-sm text-red-400">
          {error}
        </div>
      )}

      <button
        disabled={pending}
        className="w-full rounded-xl bg-white text-black py-2 font-medium disabled:opacity-60"
      >
        {pending ? "Creating..." : "Create task"}
      </button>
    </form>
  );
}