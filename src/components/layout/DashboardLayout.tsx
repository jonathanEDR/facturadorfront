"use client";

import { useState, Suspense } from "react";
import { Sidebar } from "./Sidebar";
import { cn } from "@/lib/utils";
import { PageTransition } from "@/components/ui/page-transition";
import { ClientesProvider } from "@/contexts/ClientesContext";

interface DashboardLayoutProps {
  children: React.ReactNode;
  showHeader?: boolean;
  headerTitle?: string;
  headerDescription?: string;
}

export function DashboardLayout({ 
  children, 
  showHeader = true, 
  headerTitle = "Dashboard", 
  headerDescription = "Bienvenido al sistema de facturación electrónica" 
}: DashboardLayoutProps) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  return (
    <ClientesProvider>
      <div className="h-screen flex bg-background">
        {/* Sidebar */}
        <Sidebar isCollapsed={sidebarCollapsed} onToggle={toggleSidebar} />
        
        {/* Main Content */}
        <div 
          className={cn(
            "flex-1 flex flex-col transition-all duration-300 ease-in-out",
            sidebarCollapsed ? "ml-16" : "ml-64"
          )}
        >
          {/* Header condicional */}
          {showHeader && (
            <header className="bg-card border-b border-border px-6 py-6 shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-3xl font-bold text-foreground">{headerTitle}</h1>
                  <p className="text-muted-foreground mt-2 text-base">
                    {headerDescription}
                  </p>
                </div>
                <div className="flex items-center space-x-4">
                  {/* Aquí pueden ir notificaciones, búsqueda, etc. */}
                </div>
              </div>
            </header>
          )}

          {/* Content Area */}
          <main className={cn(
            "flex-1 overflow-y-auto bg-background",
            showHeader ? "p-8" : "p-0"
          )}>
            <div className={cn(
              showHeader ? "max-w-7xl mx-auto" : "w-full h-full"
            )}>
              <Suspense fallback={
                <div className="animate-pulse p-8">
                  <div className="h-8 bg-muted rounded w-1/4 mb-4"></div>
                  <div className="h-4 bg-muted rounded w-1/2 mb-8"></div>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {Array.from({ length: 6 }, (_, i) => (
                      <div key={i} className="bg-card border border-border rounded-xl p-6">
                        <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-muted rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                </div>
              }>
                <PageTransition>
                  {children}
                </PageTransition>
              </Suspense>
            </div>
          </main>
        </div>
      </div>
    </ClientesProvider>
  );
}
