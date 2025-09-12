'use client';

import dynamic from 'next/dynamic';
import { Suspense } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui';
import { Monitor, Activity } from 'lucide-react';

// Componente de skeleton para el loading
const DashboardSkeleton = () => (
  <div className="space-y-6">
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Activity className="h-5 w-5 mr-2" />
          Cargando dashboard del sistema...
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="animate-pulse">
              <div className="h-24 bg-gray-200 rounded-lg"></div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  </div>
);

// Importación dinámica del dashboard
const SystemDashboard = dynamic(() => import('@/components/system/SystemDashboard'), {
  ssr: false,
  loading: () => <DashboardSkeleton />
});

export default function SystemPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 flex items-center">
            <Monitor className="h-8 w-8 mr-3" />
            Panel de Control del Sistema
          </h1>
          <p className="mt-2 text-gray-600">
            Monitoreo en tiempo real y herramientas de mantenimiento para el sistema Facturador
          </p>
        </div>

        <Suspense fallback={<DashboardSkeleton />}>
          <SystemDashboard />
        </Suspense>
      </div>
    </div>
  );
}
