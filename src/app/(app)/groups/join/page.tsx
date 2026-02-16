import Link from "next/link";
import JoinGroupForm from "./join-group-form";

export default function JoinGroupPage() {
  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto w-full max-w-md space-y-6">
        <Link className="text-sm underline opacity-80" href="/groups">
          ← Back to groups
        </Link>

        <div className="rounded-2xl border p-6 space-y-2">
          <h1 className="text-2xl font-semibold">Join a group</h1>
          <p className="text-sm opacity-70">
            Enter an invite code to join an existing group.
          </p>
        </div>

        <JoinGroupForm />
      </div>
    </main>
  );
}