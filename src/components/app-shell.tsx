import SidebarNav from "./sidebar-nav";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-black text-white">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div className="flex min-h-screen gap-6">
          {/* Sidebar (desktop) */}
          <aside className="hidden lg:block w-64 py-6">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
              <div className="text-sm font-semibold tracking-wide opacity-90">
                StudyVibe
              </div>
              <div className="mt-4">
                <SidebarNav />
              </div>
            </div>
          </aside>

          {/* Main */}
          <div className="flex-1 py-6">
            <div className="rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}