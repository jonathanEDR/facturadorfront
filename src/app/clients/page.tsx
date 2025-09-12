import { AuthGuard } from "@/components/auth/AuthGuard";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { ClientManager } from "@/components/clients/ClientManager";

export default function ClientsPage() {
  return (
    <AuthGuard>
      <DashboardLayout showHeader={false}>
        <ClientManager />
      </DashboardLayout>
    </AuthGuard>
  );
}
