'use client';

import dynamic from 'next/dynamic';
import { DashboardSkeleton } from '@/components/ui/dashboard-skeleton';

// Dynamic imports para componentes pesados
const DashboardContent = dynamic(
  () => import('@/components/dashboard/DashboardContent').then((mod) => ({ default: mod.DashboardContent })),
  {
    loading: () => <DashboardSkeleton />,
    ssr: false,
  }
);

const DashboardStatus = dynamic(
  () => import('@/components/dashboard/DashboardStatus').then((mod) => ({ default: mod.DashboardStatus })),
  {
    loading: () => <DashboardSkeleton />,
    ssr: false,
  }
);

const CertificadosManager = dynamic(
  () => import('@/components/certificates/CertificadosManager').then((mod) => ({ default: mod.CertificadosManager })),
  {
    loading: () => <DashboardSkeleton />,
    ssr: false,
  }
);

const EmpresaManager = dynamic(
  () => import('@/components/empresas/EmpresaManager'),
  {
    loading: () => <DashboardSkeleton />,
    ssr: false,
  }
);

const IntegracionTest = dynamic(
  () => import('@/components/integration/IntegracionTest'),
  {
    loading: () => <DashboardSkeleton />,
    ssr: false,
  }
);

export {
  DashboardContent,
  DashboardStatus,
  CertificadosManager,
  EmpresaManager,
  IntegracionTest,
};
