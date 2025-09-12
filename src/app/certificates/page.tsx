'use client';

import React from 'react';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { CertificadosManager } from '@/components/certificates/CertificadosManager';

export default function CertificatesPage() {
  // En producción, estos datos vendrían del contexto o API
  const empresa_id = 'demo_empresa';
  const empresa_nombre = 'Empresa Demo';
  const empresa_ruc = '20123456789';

  return (
    <AuthGuard>
      <DashboardLayout showHeader={false}>
        <div className="container mx-auto px-4 py-8">
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Gestión de Certificados Digitales
              </h1>
              <p className="mt-2 text-gray-600">
                Administra los certificados digitales para firma electrónica de documentos.
              </p>
            </div>
            
            <CertificadosManager 
              empresa_id={empresa_id}
              empresa_nombre={empresa_nombre}
              empresa_ruc={empresa_ruc}
            />
          </div>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
