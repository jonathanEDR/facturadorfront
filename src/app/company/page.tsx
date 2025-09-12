'use client';

import dynamic from "next/dynamic";
import { DashboardSkeleton } from "@/components/ui";

// Lazy loading de componentes pesados
const AuthGuard = dynamic(() => import("@/components/auth/AuthGuard").then(mod => ({ default: mod.AuthGuard })), {
  ssr: false,
  loading: () => <DashboardSkeleton />
});

const DashboardLayout = dynamic(() => import("@/components/layout/DashboardLayout").then(mod => ({ default: mod.DashboardLayout })), {
  ssr: false,
  loading: () => <DashboardSkeleton />
});

const EmpresaManager = dynamic(() => import("@/components/empresas").then(mod => ({ default: mod.EmpresaManager })), {
  ssr: false,
  loading: () => <DashboardSkeleton />
});

export default function CompanyPage() {
  return (
    <AuthGuard>
      <DashboardLayout showHeader={false}>
        <EmpresaManager />
      </DashboardLayout>
    </AuthGuard>
  );
}
