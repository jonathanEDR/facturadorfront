"use client";

import { useUser } from "@clerk/nextjs";
import { useAuthStatus, useUserProfile } from "@/hooks/useApi";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface AuthStatus {
  authenticated: boolean;
  user: UserData | null;
  token_expires_at: string | null;
}

interface UserData {
  id?: string;
  email?: string;
  clerk_user_id?: string;
  [key: string]: unknown;
}

interface UserProfile {
  id: string;
  clerk_user_id: string;
  email: string;
  first_name: string;
  last_name: string;
  full_name: string;
  display_name: string;
  image_url: string | null;
  status: string;
  roles: string[];
  email_verified: boolean;
  created_at: string;
  updated_at: string;
}

export function DashboardStatus() {
  const { user: clerkUser, isLoaded } = useUser();
  const { checkAuthStatus } = useAuthStatus();
  const { getUserProfile } = useUserProfile();
  const router = useRouter();
  
  const [authStatus, setAuthStatus] = useState<AuthStatus | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const handleRefresh = () => {
    router.refresh();
  };

  const handleOpenApiDocs = () => {
    if (typeof window !== 'undefined') {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
      const docsUrl = apiUrl.replace('/api/v1', '/docs');
      window.open(docsUrl, '_blank');
    }
  };

  const handleHealthCheck = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';
      const response = await fetch(`${apiUrl.replace('/api/v1', '')}/api/v1/health`);
      const data = await response.json();
      if (typeof window !== 'undefined') {
        alert(`Backend Status: ${data.status}`);
      }
    } catch {
      if (typeof window !== 'undefined') {
        alert('Error al conectar con el backend');
      }
    }
  };

  useEffect(() => {
    const loadData = async () => {
      if (!isLoaded) return;

      try {
        setLoading(true);
        setError(null);

        // Solo verificar estado si el usuario está autenticado en Clerk
        if (clerkUser) {
          // Verificar estado de autenticación en el backend
          const authResult = await checkAuthStatus();
          if (authResult.error) {
            setError(`Error al verificar autenticación: ${authResult.error}`);
          } else {
            setAuthStatus(authResult.data as AuthStatus);
          }

          // Obtener perfil completo
          const profileResult = await getUserProfile();
          if (profileResult.error) {
            console.warn(`Error al obtener perfil: ${profileResult.error}`);
          } else {
            setUserProfile(profileResult.data as UserProfile);
          }
        } else {
          // Usuario no autenticado en Clerk
          setAuthStatus({
            authenticated: false,
            user: null,
            token_expires_at: null
          });
        }

      } catch (err) {
        setError(err instanceof Error ? err.message : 'Error desconocido');
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [isLoaded, clerkUser, checkAuthStatus, getUserProfile]);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Estado de Autenticación</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-4">
            <div className="text-gray-500">Cargando...</div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estado de Autenticación */}
      <Card>
        <CardHeader>
          <CardTitle>Estado de Autenticación</CardTitle>
          <CardDescription>
            Conexión entre frontend (Clerk) y backend
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-md">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-600">Frontend (Clerk)</p>
              <div className="flex items-center gap-2">
                <Badge variant={clerkUser ? "default" : "secondary"}>
                  {clerkUser ? "Autenticado" : "No autenticado"}
                </Badge>
              </div>
            </div>
            
            <div>
              <p className="text-sm text-gray-600">Backend (API)</p>
              <div className="flex items-center gap-2">
                <Badge variant={authStatus?.authenticated ? "default" : "secondary"}>
                  {authStatus?.authenticated ? "Conectado" : "Desconectado"}
                </Badge>
              </div>
            </div>
          </div>

          {clerkUser && (
            <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-md">
              <p className="text-green-700 font-medium">Usuario Clerk:</p>
              <p className="text-green-600 text-sm">{clerkUser.emailAddresses[0]?.emailAddress}</p>
              <p className="text-green-600 text-sm">ID: {clerkUser.id}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Perfil del Usuario */}
      {userProfile && (
        <Card>
          <CardHeader>
            <CardTitle>Perfil del Usuario</CardTitle>
            <CardDescription>
              Datos sincronizados del backend
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-600">Nombre completo</p>
                <p className="font-medium">{userProfile.full_name}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Email</p>
                <p className="font-medium">{userProfile.email}</p>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Estado</p>
                <Badge variant="outline">{userProfile.status}</Badge>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Roles</p>
                <div className="flex gap-1">
                  {userProfile.roles.map((role) => (
                    <Badge key={role} variant="secondary">{role}</Badge>
                  ))}
                </div>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Email verificado</p>
                <Badge variant={userProfile.email_verified ? "default" : "destructive"}>
                  {userProfile.email_verified ? "Sí" : "No"}
                </Badge>
              </div>
              
              <div>
                <p className="text-sm text-gray-600">Registrado</p>
                <p className="text-sm">{new Date(userProfile.created_at).toLocaleDateString()}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Acciones Rápidas */}
      <Card>
        <CardHeader>
          <CardTitle>Pruebas de Integración</CardTitle>
          <CardDescription>
            Probar la comunicación con el backend
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex flex-wrap gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRefresh}
            >
              Refrescar Estado
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleOpenApiDocs}
            >
              Ver API Docs
            </Button>
            
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleHealthCheck}
            >
              Test Health Check
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
