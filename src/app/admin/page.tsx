import DashboardConsole from "@/components/dashboard/DashboardConsole";

export const metadata = {
  title: "Console — Notably",
};

// Single console for both staff and admin; the server action returns the
// caller's role and the UI adapts (admin gets mutation controls).
export default function AdminPage() {
  return <DashboardConsole />;
}
