import { AuthGuard } from "@/components/auth/AuthGuard";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { BarChart3, Download } from "lucide-react";

export default function ReportsPage() {
  return (
    <AuthGuard>
      <DashboardLayout showHeader={false}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Reportes</h1>
              <p className="text-sm text-gray-600 mt-1">
                Análisis y reportes de tu negocio
              </p>
            </div>
            <Button className="flex items-center space-x-2">
              <Download className="h-4 w-4" />
              <span>Exportar</span>
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <BarChart3 className="h-5 w-5" />
                <span>Próximamente</span>
              </CardTitle>
              <CardDescription>
                El módulo completo de reportes estará disponible pronto
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Aquí podrás ver gráficos detallados, exportar reportes y analizar el rendimiento de tu negocio.
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
