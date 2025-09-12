'use client';

import React from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import ListadoFacturas from '@/components/facturas/ListadoFacturas';

const FacturasPage: React.FC = () => {
  return (
    <AuthGuard>
      <DashboardLayout showHeader={false}>
        <div className="container mx-auto p-6">
          <div className="mb-6">
            <h1 className="text-3xl font-bold text-gray-900">Gestión de Facturas</h1>
            <p className="text-gray-600 mt-2">
              Visualiza y gestiona todas las facturas electrónicas del sistema
            </p>
          </div>
          
          <ListadoFacturas limite={25} />
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
};

export default FacturasPage;
