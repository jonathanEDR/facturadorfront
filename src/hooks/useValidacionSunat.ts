/**
 * Hook personalizado para gestionar validaciones SUNAT
 * Maneja la comunicación con la API backend para validaciones SUNAT
 */
'use client';

import { useState, useCallback } from 'react';
import { useAuth } from '@clerk/nextjs';

interface ValidationResult {
  success: boolean;
  message: string;
  empresa_id: string;
  validacion_exitosa: boolean;
  datos_actualizados: boolean;
  fuente_datos: string;
  detalles: {
    estado?: string;
    condicion?: string;
    tipo?: string;
    direccion_fiscal?: string;
    distrito?: string;
    provincia?: string;
    departamento?: string;
    actividad_economica?: string;
    sistema_emision?: string;
    sistema_contabilidad?: string;
  };
  timestamp: string;
}

interface UseValidacionSunatOptions {
  onSuccess?: (result: ValidationResult) => void;
  onError?: (error: Error) => void;
}

export const useValidacionSunat = (options?: UseValidacionSunatOptions) => {
  const { getToken } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastResult, setLastResult] = useState<ValidationResult | null>(null);

  const validarEmpresa = useCallback(async (empresaId: string): Promise<ValidationResult> => {
    setIsLoading(true);
    setError(null);

    try {
      // Obtener token de Clerk
      const token = await getToken();
      
      console.log('🔍 Clerk Token:', token ? `${token.slice(0, 20)}...` : 'No token');
      
      if (!token) {
        throw new Error('No se pudo obtener el token de autenticación');
      }

      // Llamar al endpoint de validación usando Next.js API route
      const fullUrl = `/api/empresas/${empresaId}/validar-sunat`;
      
      console.log('🔍 Validación SUNAT - URL:', fullUrl);
      console.log('🔍 Validación SUNAT - Token length:', token.length);
      
      const response = await fetch(fullUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
      }

      const result: ValidationResult = await response.json();
      
      setLastResult(result);
      
      if (options?.onSuccess) {
        options.onSuccess(result);
      }

      return result;

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido en validación SUNAT';
      setError(errorMessage);
      
      if (options?.onError) {
        options.onError(err instanceof Error ? err : new Error(errorMessage));
      }
      
      throw err;
    } finally {
      setIsLoading(false);
    }
  }, [getToken, options]);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const clearResult = useCallback(() => {
    setLastResult(null);
  }, []);

  return {
    validarEmpresa,
    isLoading,
    error,
    lastResult,
    clearError,
    clearResult
  };
};

export default useValidacionSunat;
