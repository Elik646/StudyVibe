import Link from "next/link";
import NewGroupForm from "./new-group-form";

export default function NewGroupPage() {
  return (
    <main className="min-h-screen p-8">
      <div className="mx-auto w-full max-w-md space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">Create a group</h1>
          <Link className="text-sm underline opacity-80" href="/groups">
            Back
          </Link>
        </div>

        <div className="rounded-2xl border p-6">
          <NewGroupForm />
        </div>
      </div>
    </main>
  );
}