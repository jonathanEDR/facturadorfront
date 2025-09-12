"use client";

import { useAuth } from "@clerk/nextjs";
import { useState, useCallback } from "react";

interface ApiResponse<T> {
  data: T | null;
  error: string | null;
  loading: boolean;
}

interface ApiOptions extends RequestInit {
  requireAuth?: boolean;
}

const API_BASE_URL = typeof window !== 'undefined' 
  ? (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1")
  : "http://localhost:8000/api/v1";

export function useApi() {
  const { getToken, isLoaded, isSignedIn, userId } = useAuth();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const apiCall = useCallback(async <T = unknown>(
    endpoint: string,
    options: ApiOptions = {}
  ): Promise<ApiResponse<T>> => {
    const { requireAuth = true, ...fetchOptions } = options;

    setLoading(true);
    setError(null);

    try {
      // Si requiere autenticación, verificar que el usuario esté autenticado
      if (requireAuth) {
        // Esperar hasta que Clerk esté completamente cargado
        let attempts = 0;
        const maxAttempts = 30; // 3 segundos máximo (30 * 100ms)
        
        while (!isLoaded && attempts < maxAttempts) {
          await new Promise(resolve => setTimeout(resolve, 100));
          attempts++;
        }
        
        if (!isLoaded) {
          throw new Error("Timeout: Clerk no se pudo cargar después de 3 segundos");
        }
        
        if (!isSignedIn) {
          throw new Error("Usuario no autenticado");
        }

        // Dar un pequeño tiempo adicional para que Clerk esté completamente listo
        if (!userId) {
          await new Promise(resolve => setTimeout(resolve, 200)); // 200ms de espera
        }
      }

      // Configurar headers
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(fetchOptions.headers as Record<string, string> || {}),
      };

      // Agregar token de autorización si es necesario
      if (requireAuth && isSignedIn) {
        let token: string | null = null;
        let retryCount = 0;
        const maxRetries = 3;
        
        // Retry mechanism para obtener el token
        while (!token && retryCount < maxRetries) {
          try {
            token = await getToken();
            if (!token && retryCount < maxRetries - 1) {
              await new Promise(resolve => setTimeout(resolve, 200 * (retryCount + 1))); // Backoff exponencial
              retryCount++;
            } else {
              break;
            }
          } catch (tokenError) {
            if (retryCount < maxRetries - 1) {
              await new Promise(resolve => setTimeout(resolve, 200 * (retryCount + 1)));
              retryCount++;
            } else {
              throw tokenError;
            }
          }
        }
        
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        } else {
          throw new Error("No se pudo obtener el token de autenticación");
        }
      }

      // Realizar la llamada
      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        ...fetchOptions,
        headers,
      });

      // Verificar si la respuesta es exitosa
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
      }

      // Parsear respuesta
      const data = await response.json();

      setLoading(false);
      return { data, error: null, loading: false };

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMessage);
      setLoading(false);
      return { data: null, error: errorMessage, loading: false };
    }
  }, [getToken, isLoaded, isSignedIn]);

  // Métodos específicos para diferentes tipos de requests
  const get = useCallback(<T = unknown>(endpoint: string, options: ApiOptions = {}) => {
    return apiCall<T>(endpoint, { ...options, method: 'GET' });
  }, [apiCall]);

  const post = useCallback(<T = unknown>(endpoint: string, data?: unknown, options: ApiOptions = {}) => {
    return apiCall<T>(endpoint, {
      ...options,
      method: 'POST',
      body: data ? JSON.stringify(data) : undefined,
    });
  }, [apiCall]);

  const put = useCallback(<T = unknown>(endpoint: string, data?: unknown, options: ApiOptions = {}) => {
    return apiCall<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: data ? JSON.stringify(data) : undefined,
    });
  }, [apiCall]);

  const del = useCallback(<T = unknown>(endpoint: string, options: ApiOptions = {}) => {
    return apiCall<T>(endpoint, { ...options, method: 'DELETE' });
  }, [apiCall]);

  return {
    apiCall,
    get,
    post,
    put,
    delete: del,
    loading,
    error,
  };
}

// Hook específico para verificar el estado de autenticación
export function useAuthStatus() {
  const { get } = useApi();
  
  const checkAuthStatus = useCallback(async () => {
    return await get('/auth/status', { requireAuth: true });
  }, [get]);

  return { checkAuthStatus };
}

// Hook para obtener el perfil del usuario
export function useUserProfile() {
  const { get, put } = useApi();
  
  const getUserProfile = useCallback(async () => {
    return await get('/auth/profile');
  }, [get]);

  const updateUserProfile = useCallback(async (profileData: Record<string, unknown>) => {
    return await put('/auth/profile', profileData);
  }, [put]);

  return { getUserProfile, updateUserProfile };
}
