"use client";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  FileText, 
  Users, 
  Package,
  Activity,
  Calendar,
  ArrowUpRight,
  Plus
} from "lucide-react";
import { useRouter } from "next/navigation";

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  changeType: "increase" | "decrease";
  icon: React.ComponentType<{ className?: string }>;
}

function StatCard({ title, value, change, changeType, icon: Icon }: StatCardProps) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-gray-600">
          {title}
        </CardTitle>
        <Icon className="h-4 w-4 text-gray-400" />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-gray-900">{value}</div>
        <div className="flex items-center text-xs mt-1">
          {changeType === "increase" ? (
            <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
          ) : (
            <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
          )}
          <span className={changeType === "increase" ? "text-green-600" : "text-red-600"}>
            {change}
          </span>
          <span className="text-gray-500 ml-1">vs mes anterior</span>
        </div>
      </CardContent>
    </Card>
  );
}

interface QuickActionProps {
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  href: string;
  variant?: "default" | "outline";
}

function QuickActionCard({ title, description, icon: Icon, href, variant = "default" }: QuickActionProps) {
  const router = useRouter();
  
  const handleNavigation = () => {
    router.push(href);
  };

  return (
    <Card className="hover:shadow-md transition-shadow cursor-pointer">
      <CardHeader>
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-lg ${
            variant === "default" ? "bg-blue-100" : "bg-gray-100"
          }`}>
            <Icon className={`h-5 w-5 ${
              variant === "default" ? "text-blue-600" : "text-gray-600"
            }`} />
          </div>
          <div>
            <CardTitle className="text-base">{title}</CardTitle>
            <CardDescription className="text-sm">{description}</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <Button 
          variant={variant} 
          className="w-full group"
          onClick={handleNavigation}
        >
          {variant === "default" ? "Crear nuevo" : "Gestionar"}
          <ArrowUpRight className="h-4 w-4 ml-2 group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
        </Button>
      </CardContent>
    </Card>
  );
}

interface RecentActivityItem {
  id: string;
  type: "invoice" | "client" | "payment";
  title: string;
  description: string;
  amount?: string;
  time: string;
  status: "success" | "pending" | "error";
}

const recentActivities: RecentActivityItem[] = [
  {
    id: "1",
    type: "invoice",
    title: "Factura #F001-00000123",
    description: "Enviada a Cliente ABC S.A.C.",
    amount: "S/ 1,250.00",
    time: "Hace 2 horas",
    status: "success"
  },
  {
    id: "2",
    type: "payment",
    title: "Pago recibido",
    description: "Factura #F001-00000122",
    amount: "S/ 850.00",
    time: "Hace 4 horas",
    status: "success"
  },
  {
    id: "3",
    type: "client",
    title: "Nuevo cliente registrado",
    description: "XYZ Importaciones E.I.R.L.",
    time: "Hace 6 horas",
    status: "pending"
  },
  {
    id: "4",
    type: "invoice",
    title: "Factura #F001-00000121",
    description: "Error al enviar a SUNAT",
    amount: "S/ 2,100.00",
    time: "Hace 1 día",
    status: "error"
  }
];

function RecentActivity() {
  const getStatusBadge = (status: string) => {
    switch (status) {
      case "success":
        return <Badge variant="default" className="bg-green-100 text-green-800">Exitoso</Badge>;
      case "pending":
        return <Badge variant="secondary">Pendiente</Badge>;
      case "error":
        return <Badge variant="destructive">Error</Badge>;
      default:
        return null;
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "invoice":
        return <FileText className="h-4 w-4 text-blue-500" />;
      case "client":
        return <Users className="h-4 w-4 text-green-500" />;
      case "payment":
        return <DollarSign className="h-4 w-4 text-yellow-500" />;
      default:
        return <Activity className="h-4 w-4 text-gray-500" />;
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Actividad Reciente</CardTitle>
            <CardDescription>
              Últimas transacciones y eventos del sistema
            </CardDescription>
          </div>
          <Button variant="outline" size="sm">
            Ver todo
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentActivities.map((activity) => (
            <div key={activity.id} className="flex items-center space-x-4 p-3 rounded-lg hover:bg-gray-50 transition-colors">
              <div className="flex-shrink-0">
                {getTypeIcon(activity.type)}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-medium text-gray-900 truncate">
                  {activity.title}
                </p>
                <p className="text-sm text-gray-500 truncate">
                  {activity.description}
                </p>
              </div>
              <div className="flex items-center space-x-2">
                {activity.amount && (
                  <span className="font-semibold text-gray-900">
                    {activity.amount}
                  </span>
                )}
                {getStatusBadge(activity.status)}
              </div>
              <div className="text-xs text-gray-500 whitespace-nowrap">
                {activity.time}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function DashboardContent() {
  const stats = [
    {
      title: "Ingresos del Mes",
      value: "S/ 24,580",
      change: "+12.5%",
      changeType: "increase" as const,
      icon: DollarSign
    },
    {
      title: "Facturas Emitidas",
      value: "156",
      change: "+8.2%",
      changeType: "increase" as const,
      icon: FileText
    },
    {
      title: "Clientes Activos",
      value: "89",
      change: "+2.1%",
      changeType: "increase" as const,
      icon: Users
    },
    {
      title: "Productos",
      value: "234",
      change: "-1.5%",
      changeType: "decrease" as const,
      icon: Package
    }
  ];

  const quickActions = [
    {
      title: "Nueva Factura",
      description: "Crear factura para un cliente",
      icon: FileText,
      href: "/invoices/new"
    },
    {
      title: "Agregar Cliente",
      description: "Registrar nuevo cliente",
      icon: Users,
      href: "/clients/new"
    },
    {
      title: "Nuevo Producto",
      description: "Añadir producto al catálogo",
      icon: Package,
      href: "/products/new"
    },
    {
      title: "Ver Reportes",
      description: "Consultar informes de ventas",
      icon: Activity,
      href: "/reports",
      variant: "outline" as const
    }
  ];

  return (
    <div className="space-y-6">
      {/* Estadísticas Principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat) => (
          <StatCard key={stat.title} {...stat} />
        ))}
      </div>

      {/* Acciones Rápidas */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-gray-900">Acciones Rápidas</h2>
          <Button variant="outline" size="sm">
            <Plus className="h-4 w-4 mr-2" />
            Personalizar
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {quickActions.map((action) => (
            <QuickActionCard key={action.title} {...action} />
          ))}
        </div>
      </div>

      {/* Grid de contenido principal */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Actividad Reciente */}
        <div className="lg:col-span-2">
          <RecentActivity />
        </div>

        {/* Panel lateral */}
        <div className="space-y-6">
          {/* Recordatorios */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Recordatorios
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm font-medium text-yellow-800">
                  Declaración mensual
                </p>
                <p className="text-xs text-yellow-600">
                  Vence en 5 días
                </p>
              </div>
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-800">
                  Backup de datos
                </p>
                <p className="text-xs text-blue-600">
                  Programado para mañana
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Estado del Sistema */}
          <Card>
            <CardHeader>
              <CardTitle>Estado del Sistema</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">SUNAT</span>
                <Badge variant="default" className="bg-green-100 text-green-800">
                  Conectado
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Certificado</span>
                <Badge variant="secondary">
                  Válido
                </Badge>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Base de datos</span>
                <Badge variant="default" className="bg-green-100 text-green-800">
                  Online
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
