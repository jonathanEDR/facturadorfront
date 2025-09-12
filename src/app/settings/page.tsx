import { AuthGuard } from "@/components/auth/AuthGuard";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Settings, Save } from "lucide-react";

export default function SettingsPage() {
  return (
    <AuthGuard>
      <DashboardLayout showHeader={false}>
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-gray-900">Configuración</h1>
              <p className="text-sm text-gray-600 mt-1">
                Preferencias y configuración del sistema
              </p>
            </div>
            <Button className="flex items-center space-x-2">
              <Save className="h-4 w-4" />
              <span>Guardar</span>
            </Button>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>Próximamente</span>
              </CardTitle>
              <CardDescription>
                El módulo completo de configuración estará disponible pronto
              </CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">
                Aquí podrás personalizar las preferencias del sistema, notificaciones y configuraciones avanzadas.
              </p>
            </CardContent>
          </Card>
        </div>
      </DashboardLayout>
    </AuthGuard>
  );
}
