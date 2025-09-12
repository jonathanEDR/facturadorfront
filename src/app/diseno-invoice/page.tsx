'use client';

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { DashboardSkeleton } from "@/components/ui";

// Lazy loading del componente principal
const AuthGuard = dynamic(() => import("@/components/auth/AuthGuard").then(mod => ({ default: mod.AuthGuard })), {
  ssr: false,
  loading: () => <DashboardSkeleton />
});

const DashboardLayout = dynamic(() => import("@/components/layout/DashboardLayout").then(mod => ({ default: mod.DashboardLayout })), {
  ssr: false,
  loading: () => <DashboardSkeleton />
});

const DisenadorFacturas = dynamic(() => import("@/components/diseno-invoice/DisenadorFacturas"), {
  ssr: false,
  loading: () => <DashboardSkeleton />
});

export default function DisenoInvoicePage() {
  return (
    <AuthGuard>
      <DashboardLayout showHeader={false}>
        <div className="container mx-auto p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold">Diseñador de Facturas</h1>
            <p className="text-muted-foreground mt-2">
              Personaliza el diseño y la apariencia de tus facturas electrónicas
            </p>
          </div>
          
          <Suspense fallback={<DashboardSkeleton />}>
            <DisenadorFacturas />
          </Suspense>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
