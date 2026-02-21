import { Sidebar } from "@/components/layout/Sidebar";
import { Topbar } from "@/components/layout/Topbar";
import { AgentPanel } from "@/components/layout/Agentpanel";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen">
      <Sidebar />

      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar />

        <div className="flex min-w-0 flex-1">
          <main className="min-w-0 flex-1 p-6">{children}</main>
          <AgentPanel />
        </div>
      </div>
    </div>
  );
}