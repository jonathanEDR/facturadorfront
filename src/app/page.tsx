import { Button } from "@/components/ui/button";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      <header className="bg-white/80 backdrop-blur-sm shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold">Facturador</h1>
            <div className="flex items-center space-x-4">
              <Link href="/sign-in">
                <Button variant="outline" size="sm">Iniciar Sesión</Button>
              </Link>
              <Link href="/sign-up">
                <Button size="sm">Registrarse</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-12">
        <div className="text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold mb-6">
              Sistema de Facturación
            </h1>
            <p className="text-lg text-muted-foreground mb-8">
              Gestiona tus facturas de manera eficiente y conforme a SUNAT.
            </p>
            
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <Card>
                <CardHeader className="text-center p-4">
                  <CardTitle className="text-base mb-2">Facturación</CardTitle>
                  <CardDescription>Crea facturas rápidamente</CardDescription>
                </CardHeader>
              </Card>
              
              <Card>
                <CardHeader className="text-center p-4">
                  <CardTitle className="text-base mb-2">Gestión</CardTitle>
                  <CardDescription>Administra clientes y productos</CardDescription>
                </CardHeader>
              </Card>
              
              <Card>
                <CardHeader className="text-center p-4">
                  <CardTitle className="text-base mb-2">SUNAT</CardTitle>
                  <CardDescription>Cumple con regulaciones</CardDescription>
                </CardHeader>
              </Card>
            </div>
            
            <div className="flex gap-4 justify-center">
              <Link href="/sign-up">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-white">
                  Crear Cuenta Gratis
                </Button>
              </Link>
              <Link href="/sign-in">
                <Button variant="outline" size="lg">
                  Iniciar Sesión
                </Button>
              </Link>
            </div>

            <div className="mt-8">
              <Link href="/dashboard">
                <Button variant="link" className="text-sm text-muted-foreground">
                  ¿Ya tienes cuenta? Ir al Dashboard →
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
