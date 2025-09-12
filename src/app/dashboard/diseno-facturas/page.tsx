'use client';

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function DisenoFacturasRedirect() {
  const router = useRouter();
  
  useEffect(() => {
    // Redirigir a la ruta original que funciona
    router.replace('/diseno-invoice');
  }, [router]);

  return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p>Redirigiendo al diseñador de facturas...</p>
      </div>
    </div>
  );
}
