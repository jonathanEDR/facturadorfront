'use client';

import dynamic from "next/dynamic";
import { Suspense } from "react";
import { DashboardSkeleton, Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui";

// Lazy loading de componentes pesados
const AuthGuard = dynamic(() => import("@/components/auth/AuthGuard").then(mod => ({ default: mod.AuthGuard })), {
  ssr: false,
  loading: () => <DashboardSkeleton />
});

const DashboardLayout = dynamic(() => import("@/components/layout/DashboardLayout").then(mod => ({ default: mod.DashboardLayout })), {
  ssr: false,
  loading: () => <DashboardSkeleton />
});

const DashboardContent = dynamic(() => import("@/components/dashboard/DashboardContent").then(mod => ({ default: mod.DashboardContent })), {
  ssr: false,
  loading: () => <DashboardSkeleton />
});

const DashboardStatus = dynamic(() => import("@/components/dashboard/DashboardStatus").then(mod => ({ default: mod.DashboardStatus })), {
  ssr: false,
  loading: () => <DashboardSkeleton />
});

export default function DashboardPage() {
  return (
    <AuthGuard>
      <DashboardLayout>
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-1/3">
            <TabsTrigger value="overview">Resumen</TabsTrigger>
            <TabsTrigger value="status">Estado</TabsTrigger>
            <TabsTrigger value="analytics">Análisis</TabsTrigger>
          </TabsList>
          
          <TabsContent value="overview" className="space-y-6">
            <Suspense fallback={<DashboardSkeleton />}>
              <DashboardContent />
            </Suspense>
          </TabsContent>
          
          <TabsContent value="status" className="space-y-6">
            <Suspense fallback={<DashboardSkeleton />}>
              <DashboardStatus />
            </Suspense>
          </TabsContent>
          
          <TabsContent value="analytics" className="space-y-6">
            <Suspense fallback={<DashboardSkeleton />}>
              <div className="text-center py-12">
                <h3 className="text-lg font-medium text-foreground mb-2">
                  Análisis Avanzado
                </h3>
                <p className="text-muted-foreground">
                  Próximamente: Gráficos detallados de ventas y rendimiento
                </p>
              </div>
            </Suspense>
          </TabsContent>
        </Tabs>
      </DashboardLayout>
    </AuthGuard>
  );
}
