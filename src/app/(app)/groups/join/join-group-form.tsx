"use client";

import { useEffect, useState } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { joinGroup } from "./join-group-action";

export default function JoinGroupForm() {
  const searchParams = useSearchParams();
  const router = useRouter();

  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);
  const [autoJoined, setAutoJoined] = useState(false);

  // 1) Auto-fill from URL
  useEffect(() => {
    const c = searchParams.get("code");
    if (c) setCode(c.trim());
  }, [searchParams]);

  // 2) OPTIONAL: auto-join once if code is present
  useEffect(() => {
    const c = searchParams.get("code");
    if (!c) return;
    if (autoJoined) return;

    // auto join only if code looks non-empty
    const trimmed = c.trim();
    if (!trimmed) return;

    setAutoJoined(true);
    (async () => {
      setError(null);
      setPending(true);
      try {
        await joinGroup(trimmed);
        // joinGroup likely redirects; if it doesn't, refresh
        router.refresh();
      } catch (err: any) {
        setError(err?.message ?? "Something went wrong");
        setPending(false);
      }
    })();
  }, [searchParams, autoJoined, router]);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setPending(true);

    try {
      await joinGroup(code);
      // joinGroup redirects on success
    } catch (err: any) {
      setError(err?.message ?? "Something went wrong");
      setPending(false);
    }
  }

  return (
    <div className="rounded-2xl border p-6 space-y-4">
      <form onSubmit={onSubmit} className="space-y-3">
        <label className="block text-sm font-medium">Invite code</label>
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="e.g. 8F2KQ9"
          className="w-full rounded-xl border px-4 py-3 outline-none"
          autoComplete="off"
        />

        {error && (
          <div className="rounded-xl border p-3 text-sm">
            <span className="opacity-80">{error}</span>
          </div>
        )}

        <button
          disabled={pending || !code.trim()}
          className="w-full rounded-xl bg-black text-white py-3 disabled:opacity-50"
        >
          {pending ? "Joining..." : "Join group"}
        </button>
      </form>
    </div>
  );
}