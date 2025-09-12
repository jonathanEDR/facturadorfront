import { AuthGuard } from "@/components/auth/AuthGuard";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Package, Plus } from "lucide-react";

export default function ProductsPage() {
  return (
    <AuthGuard>
      <DashboardLayout showHeader={false}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Productos</h1>
              <p className="text-sm text-gray-600 mt-1">
                Gestiona tu catálogo de productos y servicios
              </p>
            </div>
            <Button className="flex items-center space-x-2">
              <Plus className="h-4 w-4" />
              <span>Nuevo Producto</span>
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Package className="h-5 w-5" />
                <span>Próximamente</span>
              </CardTitle>
              <CardDescription>
                El módulo completo de productos estará disponible pronto
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Aquí podrás gestionar tu inventario, agregar nuevos productos y controlar el stock.
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
