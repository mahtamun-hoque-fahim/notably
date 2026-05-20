import { Sidebar } from "@/components/sidebar/Sidebar";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <main
        className="flex-1 flex flex-col min-w-0 overflow-hidden"
        style={{ background: "var(--bg)" }}
      >
        {children}
      </main>
    </div>
  );
}
