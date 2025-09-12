"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  LayoutDashboard, 
  FileText, 
  Users, 
  Package, 
  BarChart3, 
  Settings, 
  ChevronLeft,
  ChevronRight,
  Building2,
  CreditCard,
  Bell,
  HelpCircle
} from "@/components/icons";
import { SignedIn, useUser } from "@clerk/nextjs";

interface NavigationItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
  badge?: string;
  description?: string;
}

interface NavigationSection {
  title: string;
  items: NavigationItem[];
}

const navigationSections: NavigationSection[] = [
  {
    title: "Principal",
    items: [
      {
        name: "Dashboard",
        href: "/dashboard",
        icon: LayoutDashboard,
        description: "Vista general del sistema"
      },
      {
        name: "Facturación",
        href: "/invoices",
        icon: FileText,
        badge: "New",
        description: "Crear y gestionar facturas"
      },
      {
        name: "Clientes",
        href: "/clients",
        icon: Users,
        description: "Base de datos de clientes"
      },
      {
        name: "Productos",
        href: "/products",
        icon: Package,
        description: "Catálogo de productos y servicios"
      }
    ]
  },
  {
    title: "Documentos",
    items: [
      {
        name: "Facturas",
        href: "/facturas",
        icon: FileText,
        description: "Gestión de facturas"
      },
      {
        name: "Diseñador",
        href: "/diseno-invoice",
        icon: Settings,
        description: "Personalizar diseño de facturas"
      },
      {
        name: "Certificados",
        href: "/certificates",
        icon: CreditCard,
        description: "Certificados digitales"
      }
    ]
  },
  {
    title: "Análisis",
    items: [
      {
        name: "Reportes",
        href: "/reports",
        icon: BarChart3,
        description: "Informes y análisis de ventas"
      },
      {
        name: "Auditoría",
        href: "/auditoria",
        icon: Bell,
        description: "Registro de actividades"
      }
    ]
  },
  {
    title: "Configuración",
    items: [
      {
        name: "Empresa",
        href: "/company",
        icon: Building2,
        description: "Datos de la empresa"
      },
      {
        name: "Sistema",
        href: "/system",
        icon: Settings,
        description: "Configuración del sistema"
      },
      {
        name: "Ayuda SUNAT",
        href: "/ayuda-sunat",
        icon: HelpCircle,
        description: "Ayuda y soporte SUNAT"
      }
    ]
  }
];

const quickActions = [
  {
    name: "Notificaciones",
    href: "/notifications",
    icon: Bell,
    badge: "3"
  }
];

interface SidebarProps {
  isCollapsed: boolean;
  onToggle: () => void;
}

export function Sidebar({ isCollapsed, onToggle }: SidebarProps) {
  const pathname = usePathname();
  const { user } = useUser();

  return (
    <div 
      className={cn(
        "fixed left-0 top-0 z-40 h-screen bg-card border-r border-border transition-all duration-300 ease-in-out shadow-lg",
        isCollapsed ? "w-14" : "w-56"
      )}
    >
      {/* Header del Sidebar */}
      <div className="flex h-14 items-center justify-between px-3 border-b border-border">
        {!isCollapsed && (
          <Link href="/dashboard" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center shadow-md">
              <span className="text-white font-bold text-sm">F</span>
            </div>
            <span className="font-bold text-foreground text-lg">Facturador</span>
          </Link>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onToggle}
          className="h-8 w-8 p-0 hover:bg-accent rounded-lg"
        >
          {isCollapsed ? (
            <ChevronRight className="h-3.5 w-3.5" />
          ) : (
            <ChevronLeft className="h-3.5 w-3.5" />
          )}
        </Button>
      </div>

      {/* Información del Usuario */}
      <SignedIn>
        <div className="p-3 border-b border-border">
          {!isCollapsed ? (
            <div className="flex items-center space-x-2">
              <div className="w-7 h-7 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center shadow-md">
                <span className="text-white text-xs font-semibold">
                  {user?.firstName?.charAt(0) || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-xs font-semibold text-foreground truncate">
                  {user?.fullName || user?.emailAddresses[0]?.emailAddress}
                </p>
                <p className="text-xs text-muted-foreground">
                  Administrador
                </p>
              </div>
            </div>
          ) : (
            <div className="flex justify-center">
              <div className="w-6 h-6 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-lg flex items-center justify-center">
                <span className="text-white text-xs font-semibold">
                  {user?.firstName?.charAt(0) || 'U'}
                </span>
              </div>
            </div>
          )}
        </div>
      </SignedIn>

      {/* Navegación Principal */}
      <div className="flex-1 overflow-y-auto p-2">
        <nav className="space-y-4">
          {navigationSections.map((section) => (
            <div key={section.title}>
              {!isCollapsed && (
                <h3 className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                  {section.title}
                </h3>
              )}
              <ul className={cn("space-y-1", !isCollapsed && "mt-1")}>
                {section.items.map((item) => {
                  const isActive = pathname === item.href;
                  const Icon = item.icon;
                  
                  return (
                    <li key={item.name}>
                      <Link
                        href={item.href}
                        prefetch={true}
                        className={cn(
                          "group flex items-center rounded-lg px-2 py-2 text-xs font-medium transition-all duration-200",
                          isActive
                            ? "bg-primary text-primary-foreground shadow-md"
                            : "text-foreground hover:bg-accent hover:text-accent-foreground",
                          isCollapsed && "justify-center"
                        )}
                        title={isCollapsed ? item.name : undefined}
                      >
                        <Icon
                          className={cn(
                            "flex-shrink-0 h-4 w-4",
                            isActive ? "text-primary-foreground" : "text-muted-foreground group-hover:text-accent-foreground",
                            !isCollapsed && "mr-2"
                          )}
                        />
                        {!isCollapsed && (
                          <>
                            <span className="flex-1 text-xs">{item.name}</span>
                            {item.badge && (
                              <Badge variant="secondary" className="ml-1 text-xs bg-muted text-muted-foreground px-1.5 py-0.5">
                                {item.badge}
                              </Badge>
                            )}
                          </>
                        )}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      {/* Acciones Rápidas */}
      <div className="border-t border-border p-2">
        {!isCollapsed && (
          <h3 className="px-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Acciones
          </h3>
        )}
        <ul className="space-y-1">
          {quickActions.map((item) => {
            const Icon = item.icon;
            
            return (
              <li key={item.name}>
                <Link
                  href={item.href}
                  className={cn(
                    "group flex items-center rounded-lg px-2 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 hover:text-gray-900 transition-colors",
                    isCollapsed && "justify-center"
                  )}
                  title={isCollapsed ? item.name : undefined}
                >
                  <Icon
                    className={cn(
                      "flex-shrink-0 h-4 w-4 text-gray-400 group-hover:text-gray-500",
                      !isCollapsed && "mr-2"
                    )}
                  />
                  {!isCollapsed && (
                    <>
                      <span className="flex-1 text-xs">{item.name}</span>
                      {item.badge && (
                        <Badge variant="destructive" className="ml-1 text-xs px-1.5 py-0.5">
                          {item.badge}
                        </Badge>
                      )}
                    </>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </div>
    </div>
  );
}
