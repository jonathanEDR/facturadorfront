"use client";

import { useState, useCallback } from "react";
import { useAuth } from "@clerk/nextjs";

interface ConsultaState {
  loading: boolean;
  error: string | null;
  success: boolean;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
}

export function useConsultas() {
  const { getToken, isSignedIn } = useAuth();
  
  const [rucState, setRucState] = useState<ConsultaState>({
    loading: false,
    error: null,
    success: false,
  });

  const [dniState, setDniState] = useState<ConsultaState>({
    loading: false,
    error: null,
    success: false,
  });

  const consultarRuc = useCallback(async (ruc: string) => {
    if (!isSignedIn) {
      setRucState({
        loading: false,
        error: 'Usuario no autenticado',
        success: false,
      });
      return null;
    }

    setRucState({
      loading: true,
      error: null,
      success: false,
    });

    try {
      const token = await getToken();
      if (!token) {
        throw new Error('No se pudo obtener el token de autenticación');
      }

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';
      const response = await fetch(`${baseUrl}/consultas/ruc/${ruc}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const resultado = await response.json();
      
      setRucState({
        loading: false,
        error: null,
        success: true,
        data: resultado,
      });

      return resultado;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al consultar RUC';
      
      setRucState({
        loading: false,
        error: errorMessage,
        success: false,
      });

      console.error('Error consultando RUC:', error);
      return null;
    }
  }, [getToken, isSignedIn]);

  const consultarDni = useCallback(async (dni: string) => {
    if (!isSignedIn) {
      setDniState({
        loading: false,
        error: 'Usuario no autenticado',
        success: false,
      });
      return null;
    }

    setDniState({
      loading: true,
      error: null,
      success: false,
    });

    try {
      const token = await getToken();
      if (!token) {
        throw new Error('No se pudo obtener el token de autenticación');
      }

      const baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';
      const response = await fetch(`${baseUrl}/consultas/dni/${dni}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const resultado = await response.json();
      
      setDniState({
        loading: false,
        error: null,
        success: true,
        data: resultado,
      });

      return resultado;

    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al consultar DNI';
      
      setDniState({
        loading: false,
        error: errorMessage,
        success: false,
      });

      console.error('Error consultando DNI:', error);
      return null;
    }
  }, [getToken, isSignedIn]);

  const consultarDocumento = useCallback(async (numeroDoc: string) => {
    if (!numeroDoc) return null;

    if (numeroDoc.length === 11) {
      return await consultarRuc(numeroDoc);
    } else if (numeroDoc.length === 8) {
      return await consultarDni(numeroDoc);
    }
    return null;
  }, [consultarRuc, consultarDni]);

  const limpiarConsultas = useCallback(() => {
    setRucState({
      loading: false,
      error: null,
      success: false,
    });
    setDniState({
      loading: false,
      error: null,
      success: false,
    });
  }, []);

  const limpiarEstadoRuc = useCallback(() => {
    setRucState({
      loading: false,
      error: null,
      success: false,
    });
  }, []);

  const limpiarEstadoDni = useCallback(() => {
    setDniState({
      loading: false,
      error: null,
      success: false,
    });
  }, []);

  return {
    // Estados principales
    rucState,
    dniState,
    
    // Métodos
    consultarRuc,
    consultarDni,
    consultarDocumento,
    limpiarConsultas,
    limpiarEstadoRuc,
    limpiarEstadoDni,
    
    // Estado general
    loading: rucState.loading || dniState.loading,
    hasError: !!rucState.error || !!dniState.error,
    
    // Compatibilidad con módulo de empresas
    rucLoading: rucState.loading,
    rucError: rucState.error,
    rucSuccess: rucState.success,
    dniLoading: dniState.loading,
    dniError: dniState.error,
    dniSuccess: dniState.success,
  };
}

export default useConsultas;