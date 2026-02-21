import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { AgentPanel } from "@/components/layout/Agentpanel";
import { ThemeController } from "@/components/layout/ThemeController";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen flex-col md:flex-row">
      <ThemeController />
      <div className="pointer-events-none absolute inset-0 -z-10 bg-[radial-gradient(circle_at_80%_20%,rgba(16,185,129,0.12)_0%,transparent_34%)]" />
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />

        <div className="flex min-w-0 flex-1">
          <main className="min-w-0 flex-1 p-4 md:p-6">{children}</main>
          <AgentPanel />
        </div>
      </div>
    </div>
  );
}
