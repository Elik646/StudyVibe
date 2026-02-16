"use client";

import { useState } from "react";

type MemberOption = { userId: string; label: string; tag?: string | null };

export default function TaskEditor({
  taskId,
  initial,
  members,
}: {
  taskId: string;
  initial: { status: string; priority: number; dueAt: string; assigneeId: string };
  members: MemberOption[];
}) {
  const [status, setStatus] = useState(initial.status);
  const [priority, setPriority] = useState(initial.priority);
  const [dueAt, setDueAt] = useState(initial.dueAt);
  const [assigneeId, setAssigneeId] = useState(initial.assigneeId);

  const [pending, setPending] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function save() {
    setMsg(null);
    setPending(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status,
          priority,
          dueAt: dueAt ? new Date(dueAt + "T00:00:00.000Z").toISOString() : null,
          assigneeId: assigneeId || null,
        }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMsg(data?.error ?? "Failed to save.");
        return;
      }
      setMsg("Saved ✅");
    } catch {
      setMsg("Network error.");
    } finally {
      setPending(false);
    }
  }

  async function remove() {
    if (!confirm("Delete this task?")) return;
    setPending(true);
    try {
      const res = await fetch(`/api/tasks/${taskId}`, { method: "DELETE" });
      if (!res.ok) return alert("Failed to delete task.");
      window.history.back();
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-2">
          <label className="text-sm font-medium">Status</label>
          <select
            className="w-full rounded-xl border border-white/15 bg-transparent px-3 py-2 outline-none"
            value={status}
            onChange={(e) => setStatus(e.target.value)}
          >
            <option value="TODO">TODO</option>
            <option value="IN_PROGRESS">IN PROGRESS</option>
            <option value="REVIEW">REVIEW</option>
            <option value="DONE">DONE</option>
          </select>
        </div>

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
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="space-y-2">
          <label className="text-sm font-medium">Due date</label>
          <input
            type="date"
            className="w-full rounded-xl border border-white/15 bg-transparent px-3 py-2 outline-none"
            value={dueAt}
            onChange={(e) => setDueAt(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <label className="text-sm font-medium">Assignee</label>
          <select
            className="w-full rounded-xl border border-white/15 bg-transparent px-3 py-2 outline-none"
            value={assigneeId}
            onChange={(e) => setAssigneeId(e.target.value)}
          >
            <option value="">Unassigned</option>
            {members.map((m) => (
              <option key={m.userId} value={m.userId}>
                {m.label} {m.tag ? `(${m.tag})` : ""}
              </option>
            ))}
          </select>
        </div>
      </div>

      {msg && <div className="text-sm text-white/70">{msg}</div>}

      <div className="flex flex-col sm:flex-row gap-2">
        <button
          onClick={save}
          disabled={pending}
          className="w-full sm:w-auto rounded-xl bg-white text-black px-4 py-2 font-medium disabled:opacity-60"
        >
          {pending ? "Saving..." : "Save changes"}
        </button>

        <button
          onClick={remove}
          disabled={pending}
          className="w-full sm:w-auto rounded-xl border border-red-500/40 bg-red-500/10 text-red-300 px-4 py-2 font-medium disabled:opacity-60"
        >
          Delete task
        </button>
      </div>
    </div>
  );
}