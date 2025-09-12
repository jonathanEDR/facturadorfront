"use client";

import { useApi } from "@/hooks/useApi";
import { useState, useCallback } from "react";
import { 
  EmpresaCreate, 
  EmpresaUpdate, 
  EmpresaResponse, 
  EmpresaDetailResponse,
  EmpresasListResponse,
  ConfiguracionSunat,
  ConfiguracionCertificado,
  CertificadoConfig
} from "@/types/empresa";

interface UseEmpresaResult {
  // Estado
  empresas: EmpresaResponse[];
  empresaActual: EmpresaDetailResponse | null;
  loading: boolean;
  error: string | null;
  
  // Acciones CRUD
  listarEmpresas: () => Promise<void>;
  obtenerEmpresa: (id: string) => Promise<EmpresaDetailResponse | null>;
  crearEmpresa: (data: EmpresaCreate) => Promise<EmpresaDetailResponse | null>;
  actualizarEmpresa: (id: string, data: EmpresaUpdate) => Promise<EmpresaDetailResponse | null>;
  eliminarEmpresa: (id: string) => Promise<boolean>;
  
  // Acciones especiales
  establecerEmpresaDefecto: (id: string) => Promise<boolean>;
  activarEmpresa: (id: string) => Promise<boolean>;
  desactivarEmpresa: (id: string) => Promise<boolean>;
  configurarSunat: (id: string, config: ConfiguracionSunat) => Promise<boolean>;
  configurarCertificado: (id: string, config: ConfiguracionCertificado) => Promise<boolean>;
  
  // Nuevo sistema de certificados
  configurarCertificadoHybrid: (id: string, config: CertificadoConfig) => Promise<boolean>;
  sincronizarCertificados: (id: string) => Promise<boolean>;
  migrarCertificadoLegacy: (id: string, legacyConfig: ConfiguracionCertificado) => Promise<boolean>;
  
  // Utilidades
  refrescar: () => Promise<void>;
  limpiarError: () => void;
}

export function useEmpresa(): UseEmpresaResult {
  const { get, post, put, delete: del, loading, error } = useApi();
  
  const [empresas, setEmpresas] = useState<EmpresaResponse[]>([]);
  const [empresaActual, setEmpresaActual] = useState<EmpresaDetailResponse | null>(null);

  // Listar todas las empresas del usuario
  const listarEmpresas = useCallback(async () => {
    try {
      const response = await get<EmpresasListResponse>("/empresas");
      if (response.data) {
        setEmpresas(response.data.empresas); // Extraer el array de empresas
      }
    } catch {
      // ...
    }
  }, [get]);

  // Obtener empresa específica
  const obtenerEmpresa = useCallback(async (id: string): Promise<EmpresaDetailResponse | null> => {
    try {
      const response = await get<EmpresaDetailResponse>(`/empresas/${id}`);
      if (response.data) {
        setEmpresaActual(response.data);
        return response.data;
      }
      return null;
    } catch {
      console.error("Error en operaci�n");
      return null;
    }
  }, [get]);

  // Crear nueva empresa
  const crearEmpresa = useCallback(async (data: EmpresaCreate): Promise<EmpresaDetailResponse | null> => {
    try {
      const response = await post<EmpresaDetailResponse>("/empresas", data);
      if (response.data) {
        // Refrescar lista
        await listarEmpresas();
        return response.data;
      }
      return null;
    } catch {
      return null;
    }
  }, [post, listarEmpresas]);

  // Actualizar empresa existente
  const actualizarEmpresa = useCallback(async (
    id: string, 
    data: EmpresaUpdate
  ): Promise<EmpresaDetailResponse | null> => {
    try {
      const response = await put<EmpresaDetailResponse>(`/empresas/${id}`, data);
      if (response.data) {
        // Actualizar empresa actual si es la misma
        if (empresaActual?.id === id) {
          setEmpresaActual(response.data);
        }
        // Refrescar lista
        await listarEmpresas();
        return response.data;
      }
      return null;
    } catch {
      return null;
    }
  }, [put, empresaActual, listarEmpresas]);

  // Eliminar empresa
  const eliminarEmpresa = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await del(`/empresas/${id}`);
      if (response.data) {
        // Limpiar empresa actual si es la misma
        if (empresaActual?.id === id) {
          setEmpresaActual(null);
        }
        // Refrescar lista
        await listarEmpresas();
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [del, empresaActual, listarEmpresas]);

  // Establecer empresa como defecto
  const establecerEmpresaDefecto = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await post(`/empresas/${id}/establecer-defecto`);
      if (response.data) {
        // Refrescar lista para actualizar estados
        await listarEmpresas();
        // Actualizar empresa actual si es la misma
        if (empresaActual?.id === id) {
          await obtenerEmpresa(id);
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [post, listarEmpresas, empresaActual, obtenerEmpresa]);

  // Activar empresa
  const activarEmpresa = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await post(`/empresas/${id}/activar`);
      if (response.data) {
        // Refrescar lista para actualizar estados
        await listarEmpresas();
        // Actualizar empresa actual si es la misma
        if (empresaActual?.id === id) {
          await obtenerEmpresa(id);
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [post, listarEmpresas, empresaActual, obtenerEmpresa]);

  // Desactivar empresa
  const desactivarEmpresa = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await post(`/empresas/${id}/desactivar`);
      if (response.data) {
        // Refrescar lista para actualizar estados
        await listarEmpresas();
        // Actualizar empresa actual si es la misma
        if (empresaActual?.id === id) {
          await obtenerEmpresa(id);
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [post, listarEmpresas, empresaActual, obtenerEmpresa]);

  // Configurar SUNAT
  const configurarSunat = useCallback(async (
    id: string, 
    config: ConfiguracionSunat
  ): Promise<boolean> => {
    try {
      const response = await post(`/empresas/${id}/configurar-sunat`, config);
      if (response.data) {
        // Actualizar empresa actual si es la misma
        if (empresaActual?.id === id) {
          await obtenerEmpresa(id);
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [post, empresaActual, obtenerEmpresa]);

  // Configurar certificado digital
  const configurarCertificado = useCallback(async (
    id: string, 
    config: ConfiguracionCertificado
  ): Promise<boolean> => {
    try {
      const response = await post(`/empresas/${id}/configurar-certificado`, config);
      if (response.data) {
        // Actualizar empresa actual si es la misma
        if (empresaActual?.id === id) {
          await obtenerEmpresa(id);
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [post, empresaActual, obtenerEmpresa]);

  // Configurar certificado con sistema híbrido
  const configurarCertificadoHybrid = useCallback(async (
    id: string, 
    config: CertificadoConfig
  ): Promise<boolean> => {
    try {
      const response = await post(`/empresas/${id}/configurar-certificado-hybrid`, config);
      if (response.data) {
        // Actualizar empresa actual si es la misma
        if (empresaActual?.id === id) {
          await obtenerEmpresa(id);
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [post, empresaActual, obtenerEmpresa]);

  // Sincronizar certificados entre sistemas
  const sincronizarCertificados = useCallback(async (id: string): Promise<boolean> => {
    try {
      const response = await post(`/empresas/${id}/sincronizar-certificados`, {});
      if (response.data) {
        // Actualizar empresa actual si es la misma
        if (empresaActual?.id === id) {
          await obtenerEmpresa(id);
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [post, empresaActual, obtenerEmpresa]);

  // Migrar certificado del sistema legacy al nuevo
  const migrarCertificadoLegacy = useCallback(async (
    id: string, 
    legacyConfig: ConfiguracionCertificado
  ): Promise<boolean> => {
    try {
      const response = await post(`/empresas/${id}/migrar-certificado-legacy`, legacyConfig);
      if (response.data) {
        // Actualizar empresa actual si es la misma
        if (empresaActual?.id === id) {
          await obtenerEmpresa(id);
        }
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [post, empresaActual, obtenerEmpresa]);

  // Refrescar datos
  const refrescar = useCallback(async () => {
    await listarEmpresas();
    if (empresaActual) {
      await obtenerEmpresa(empresaActual.id);
    }
  }, [listarEmpresas, empresaActual, obtenerEmpresa]);

  // Limpiar error
  const limpiarError = useCallback(() => {
    // El error se maneja en useApi, aquí podríamos agregar lógica adicional
  }, []);

  return {
    // Estado
    empresas,
    empresaActual,
    loading,
    error,
    
    // Acciones CRUD
    listarEmpresas,
    obtenerEmpresa,
    crearEmpresa,
    actualizarEmpresa,
    eliminarEmpresa,
    
  // Acciones especiales
  establecerEmpresaDefecto,
  activarEmpresa,
  desactivarEmpresa,
  configurarSunat,
  configurarCertificado,    // Nuevo sistema de certificados
    configurarCertificadoHybrid,
    sincronizarCertificados,
    migrarCertificadoLegacy,
    
    // Utilidades
    refrescar,
    limpiarError
  };
}
