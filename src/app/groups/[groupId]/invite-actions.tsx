"use client";

import { useEffect, useMemo, useState } from "react";

export default function InviteActions({ inviteCode }: { inviteCode: string }) {
  const [open, setOpen] = useState(false);
  const [origin, setOrigin] = useState<string>(""); // client-only

  // Avoid hydration mismatch: origin is only known on client.
  useEffect(() => {
    setOrigin(window.location.origin);
  }, []);

  // Always render a RELATIVE link in the UI (SSR-safe).
  const joinPath = useMemo(() => `/groups/join?code=${inviteCode}`, [inviteCode]);

  // Full link is used only for copy/share (client-side).
  const fullJoinLink = useMemo(() => {
    return origin ? `${origin}${joinPath}` : joinPath;
  }, [origin, joinPath]);

  async function copyText(text: string) {
    await navigator.clipboard.writeText(text);
  }

  async function onCopyCode(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setOpen(false);
    try {
      await copyText(inviteCode);
    } catch {
      // fallback
      window.prompt("Copy invite code:", inviteCode);
    }
  }

  async function onCopyLink(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setOpen(false);
    try {
      await copyText(fullJoinLink);
    } catch {
      // fallback
      window.prompt("Copy invite link:", fullJoinLink);
    }
  }

  async function onShare(e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();
    setOpen(false);

    const text = `Join my StudyVibe group with code: ${inviteCode}`;

    // Prefer native share if available
    if (navigator.share) {
      try {
        await navigator.share({
          title: "StudyVibe invite",
          text,
          url: fullJoinLink,
        });
        return;
      } catch {
        // user cancelled -> do nothing
        return;
      }
    }

    // Fallback: copy link
    try {
      await copyText(fullJoinLink);
    } catch {
      window.prompt("Copy invite link:", fullJoinLink);
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* COPY dropdown */}
      <div className="relative">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            setOpen((v) => !v);
          }}
          className="inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm hover:bg-white/5"
        >
          Copy
          <span className="opacity-70">▾</span>
        </button>

        {open && (
          <div
            className="absolute left-0 top-full z-20 mt-2 w-56 rounded-xl border border-white/15 bg-black/90 p-1 shadow-lg"
            onClick={(e) => {
              // prevent bubbling into any parent click handlers
              e.preventDefault();
              e.stopPropagation();
            }}
          >
            <button
              type="button"
              onClick={onCopyCode}
              className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-white/10"
            >
              Copy invite code
            </button>

            <button
              type="button"
              onClick={onCopyLink}
              className="w-full rounded-lg px-3 py-2 text-left text-sm hover:bg-white/10"
            >
              Copy invite link
            </button>
          </div>
        )}
      </div>

      {/* SHARE */}
      <button
        type="button"
        onClick={onShare}
        className="inline-flex items-center rounded-xl border px-4 py-2 text-sm hover:bg-white/5"
      >
        Share
      </button>

      {/* Preview (SSR-safe, no hydration mismatch) */}
      <div className="hidden break-all text-xs opacity-60 sm:block">{joinPath}</div>
    </div>
  );
}