'use client';

import dynamic from "next/dynamic";
import { useState, useRef } from "react";
import { Button, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DashboardSkeleton } from "@/components/ui";
import { Plus } from "lucide-react";

// Lazy loading de componentes pesados
const AuthGuard = dynamic(() => import("@/components/auth/AuthGuard").then(mod => ({ default: mod.AuthGuard })), {
  ssr: false,
  loading: () => <DashboardSkeleton />
});

const DashboardLayout = dynamic(() => import("@/components/layout/DashboardLayout").then(mod => ({ default: mod.DashboardLayout })), {
  ssr: false,
  loading: () => <DashboardSkeleton />
});

const InvoiceFormComplete = dynamic(() => import("@/components/invoices/InvoiceFormComplete").then(mod => ({ default: mod.InvoiceFormComplete })), {
  ssr: false,
  loading: () => <DashboardSkeleton />
});

const InvoiceList = dynamic(() => import("@/components/invoices/InvoiceList").then(mod => ({ default: mod.default })), {
  ssr: false,
  loading: () => <DashboardSkeleton />
});

export default function InvoicesPage() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const invoiceListRef = useRef<{ refreshFacturas: () => void } | null>(null);

  const handleFacturaCreated = () => {
    // Cerrar el modal
    setIsModalOpen(false);
    
    // Refrescar la lista de facturas
    if (invoiceListRef.current?.refreshFacturas) {
      invoiceListRef.current.refreshFacturas();
    }
  };
  return (
    <AuthGuard>
      <DashboardLayout showHeader={false}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Facturas</h1>
              <p className="text-sm text-gray-600 mt-1">
                Gestiona todas tus facturas electrónicas
              </p>
            </div>
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <Button className="flex items-center space-x-2">
                  <Plus className="h-4 w-4" />
                  <span>Nueva Factura</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-6xl">
                <DialogHeader>
                  <DialogTitle>Nueva Factura Electrónica</DialogTitle>
                  <DialogDescription>
                    Complete la información para emitir una factura conforme SUNAT
                  </DialogDescription>
                </DialogHeader>
                <InvoiceFormComplete onFacturaCreated={handleFacturaCreated} />
              </DialogContent>
            </Dialog>
          </div>

          {/* Lista de facturas emitidas */}
          <InvoiceList ref={invoiceListRef} />
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
