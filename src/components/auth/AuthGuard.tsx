'use client';

import dynamic from "next/dynamic";
import { ReactNode } from "react";
import { DashboardSkeleton } from "@/components/ui/dashboard-skeleton";

// Importaciones dinámicas de Clerk para evitar bloquear el render inicial
const SignedIn = dynamic(() => import("@clerk/nextjs").then(mod => ({ default: mod.SignedIn })), {
  ssr: false,
  loading: () => <DashboardSkeleton />
});

const SignedOut = dynamic(() => import("@clerk/nextjs").then(mod => ({ default: mod.SignedOut })), {
  ssr: false,
  loading: () => <DashboardSkeleton />
});

interface AuthGuardProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export function AuthGuard({ children, fallback }: AuthGuardProps) {
  return (
    <>
      <SignedIn>{children}</SignedIn>
      <SignedOut>
        {fallback || (
          <div className="flex items-center justify-center min-h-[400px]">
            <div className="text-center">
              <h2 className="text-2xl font-semibold text-gray-900 mb-4">
                Acceso Requerido
              </h2>
              <p className="text-gray-600 mb-8">
                Por favor, inicia sesión para acceder a esta página.
              </p>
            </div>
          </div>
        )}
      </SignedOut>
    </>
  );
}
