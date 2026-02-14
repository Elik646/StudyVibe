"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type Member = {
  role: "ADMIN" | "MEMBER";
  user: {
    id: string;
    name: string | null;
    email: string;
    tag: string | null;
  };
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
  const [open, setOpen] = useState(false);
  const [successorId, setSuccessorId] = useState<string>("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const otherMembers = useMemo(() => {
    return members
      .filter((m) => m.user.id !== myUserId)
      .map((m) => ({
        id: m.user.id,
        label: m.user.name || m.user.email,
        tag: m.user.tag,
        role: m.role,
      }));
  }, [members, myUserId]);

  const needsSuccessor = isAdmin && otherMembers.length > 0;

  async function doLeave() {
    setError(null);

    // If admin leaving but others exist, successor is required
    if (needsSuccessor && !successorId) {
      setError("Pick a successor admin before leaving.");
      return;
    }

    setPending(true);
    try {
      const res = await fetch(`/api/groups/${groupId}/leave`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          needsSuccessor ? { successorUserId: successorId } : {}
        ),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(data?.error ?? "Failed to leave group.");
        return;
      }

      // Leave succeeded → go back to groups
      router.push("/groups");
      router.refresh();
    } catch {
      setError("Network error.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="space-y-3">
      <button
        type="button"
        onClick={() => {
          setError(null);
          // If admin + others exist, open chooser; otherwise leave immediately
          if (needsSuccessor) setOpen((v) => !v);
          else void doLeave();
        }}
        disabled={pending}
        className="w-full rounded-xl border px-4 py-2 text-sm hover:bg-black/5 transition disabled:opacity-60"
      >
        {pending ? "Leaving..." : "Leave group"}
      </button>

      {/* Only show successor picker if admin AND there are other members */}
      {open && needsSuccessor && (
        <div className="rounded-2xl border p-4 space-y-3">
          <div className="text-sm font-medium">Choose successor admin</div>
          <div className="text-sm opacity-70">
            You’re the admin. Before leaving, pick exactly one member to become admin.
          </div>

          <div className="space-y-2">
            {otherMembers.map((m) => (
              <button
                key={m.id}
                type="button"
                onClick={() => setSuccessorId(m.id)}
                className={[
                  "w-full rounded-xl border px-3 py-2 text-left transition",
                  successorId === m.id ? "bg-black text-white" : "hover:bg-black/5",
                ].join(" ")}
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="truncate text-sm font-medium">{m.label}</div>
                    <div className="text-xs opacity-70">Role: {m.role}</div>
                  </div>

                  {/* Always visible tag in successor-selection UI */}
                  {m.tag && (
                    <div
                      className={[
                        "font-mono text-xs shrink-0",
                        successorId === m.id ? "opacity-90" : "opacity-70",
                      ].join(" ")}
                    >
                      {m.tag}
                    </div>
                  )}
                </div>
              </button>
            ))}
          </div>

          {error && <div className="text-sm text-red-600">{error}</div>}

          <button
            type="button"
            disabled={pending}
            onClick={doLeave}
            className="w-full rounded-xl bg-black text-white py-2 disabled:opacity-60"
          >
            {pending ? "Leaving..." : "Confirm leave"}
          </button>
        </div>
      )}

      {/* Non-admin leave errors show here */}
      {!open && error && <div className="text-sm text-red-600">{error}</div>}
    </div>
  );
}