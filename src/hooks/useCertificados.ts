// Hook personalizado para gestión de certificados digitales
import { useState, useCallback, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { 
  CertificadoInfo, 
  CertificadoUploadRequest, 
  CertificadoUploadResponse,
  CertificadoValidationResponse,
  CertificadosListResponse,
  UseCertificadosState,
  UseCertificadosActions,
  ErrorResponse
} from '@/types/certificates';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api/v1';

export function useCertificados(empresa_id?: string) {
  const { getToken } = useAuth();
  
  const [state, setState] = useState<UseCertificadosState>({
    certificados: [],
    certificado_activo: undefined,
    loading: false,
    error: undefined,
    uploading: false,
    validating: false,
  });

  // Función para obtener headers con autenticación
  const getAuthHeaders = useCallback(async () => {
    const token = await getToken();
    return {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    };
  }, [getToken]);

  // Función para obtener headers para multipart/form-data
  const getAuthHeadersMultipart = useCallback(async () => {
    const token = await getToken();
    return {
      'Authorization': `Bearer ${token}`,
    };
  }, [getToken]);

  // Cargar certificados de una empresa
  const loadCertificados = useCallback(async (empresaId: string) => {
    if (!empresaId) return;
    
    setState(prev => ({ ...prev, loading: true, error: undefined }));
    
    try {
      const headers = await getAuthHeaders();
      const response = await fetch(`${API_BASE_URL}/empresas/${empresaId}/certificados`, {
        headers,
      });

      if (!response.ok) {
        const errorData: ErrorResponse = await response.json();
        throw new Error(errorData.message || 'Error al cargar certificados');
      }

      const data: CertificadosListResponse = await response.json();
      
      // Encontrar certificado activo
      const certificado_activo = data.certificados.find(
        cert => cert.id === data.certificado_activo_id
      );

      setState(prev => ({
        ...prev,
        certificados: data.certificados,
        certificado_activo,
        loading: false,
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      }));
    }
  }, [getAuthHeaders]);

  // Subir nuevo certificado
  const uploadCertificado = useCallback(async (
    empresaId: string, 
    data: CertificadoUploadRequest
  ): Promise<CertificadoUploadResponse> => {
    setState(prev => ({ ...prev, uploading: true, error: undefined }));
    
    try {
      const headers = await getAuthHeadersMultipart();
      
      const formData = new FormData();
      formData.append('file', data.file);
      formData.append('password', data.password);
      formData.append('validar_sunat', String(data.validar_sunat ?? true));

      const response = await fetch(`${API_BASE_URL}/empresas/${empresaId}/certificados`, {
        method: 'POST',
        headers,
        body: formData,
      });

      if (!response.ok) {
        const errorData: ErrorResponse = await response.json();
        throw new Error(errorData.message || 'Error al subir certificado');
      }

      const result: CertificadoUploadResponse = await response.json();
      
      // Recargar lista de certificados
      await loadCertificados(empresaId);
      
      setState(prev => ({ ...prev, uploading: false }));
      return result;
    } catch (error) {
      setState(prev => ({
        ...prev,
        uploading: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      }));
      throw error;
    }
  }, [getAuthHeadersMultipart, loadCertificados]);

  // Activar certificado
  const activateCertificado = useCallback(async (
    empresaId: string, 
    certificadoId: string, 
    razon: string
  ) => {
    setState(prev => ({ ...prev, loading: true, error: undefined }));
    
    try {
      const headers = await getAuthHeaders();
      
      const response = await fetch(
        `${API_BASE_URL}/empresas/${empresaId}/certificados/${certificadoId}/activate`,
        {
          method: 'PUT',
          headers,
          body: JSON.stringify({ razon }),
        }
      );

      if (!response.ok) {
        const errorData: ErrorResponse = await response.json();
        throw new Error(errorData.message || 'Error al activar certificado');
      }

      // Recargar lista de certificados
      await loadCertificados(empresaId);
      setState(prev => ({ ...prev, loading: false }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      }));
      throw error;
    }
  }, [getAuthHeaders, loadCertificados]);

  // Desactivar certificado
  const deactivateCertificado = useCallback(async (
    empresaId: string, 
    certificadoId: string
  ) => {
    setState(prev => ({ ...prev, loading: true, error: undefined }));
    
    try {
      const headers = await getAuthHeaders();
      
      const response = await fetch(
        `${API_BASE_URL}/empresas/${empresaId}/certificados/${certificadoId}/deactivate`,
        {
          method: 'PUT',
          headers,
        }
      );

      if (!response.ok) {
        const errorData: ErrorResponse = await response.json();
        throw new Error(errorData.message || 'Error al desactivar certificado');
      }

      // Recargar lista de certificados
      await loadCertificados(empresaId);
      setState(prev => ({ ...prev, loading: false }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      }));
      throw error;
    }
  }, [getAuthHeaders, loadCertificados]);

  // Eliminar certificado
  const deleteCertificado = useCallback(async (
    empresaId: string, 
    certificadoId: string
  ) => {
    setState(prev => ({ ...prev, loading: true, error: undefined }));
    
    try {
      const headers = await getAuthHeaders();
      
      const response = await fetch(
        `${API_BASE_URL}/empresas/${empresaId}/certificados/${certificadoId}`,
        {
          method: 'DELETE',
          headers,
        }
      );

      if (!response.ok) {
        const errorData: ErrorResponse = await response.json();
        throw new Error(errorData.message || 'Error al eliminar certificado');
      }

      // Recargar lista de certificados
      await loadCertificados(empresaId);
      setState(prev => ({ ...prev, loading: false }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        loading: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      }));
      throw error;
    }
  }, [getAuthHeaders, loadCertificados]);

  // Validar certificado
  const validateCertificado = useCallback(async (
    empresaId: string, 
    certificadoId: string
  ): Promise<CertificadoValidationResponse> => {
    setState(prev => ({ ...prev, validating: true, error: undefined }));
    
    try {
      const headers = await getAuthHeaders();
      
      const response = await fetch(
        `${API_BASE_URL}/empresas/${empresaId}/certificados/${certificadoId}/validate`,
        {
          method: 'POST',
          headers,
          body: JSON.stringify({
            validacion_completa: true,
            verificar_cadena: true,
          }),
        }
      );

      if (!response.ok) {
        const errorData: ErrorResponse = await response.json();
        throw new Error(errorData.message || 'Error al validar certificado');
      }

      const result: CertificadoValidationResponse = await response.json();
      setState(prev => ({ ...prev, validating: false }));
      return result;
    } catch (error) {
      setState(prev => ({
        ...prev,
        validating: false,
        error: error instanceof Error ? error.message : 'Error desconocido',
      }));
      throw error;
    }
  }, [getAuthHeaders]);

  // Obtener certificados próximos a vencer
  const getCertificadosExpiring = useCallback(async (dias: number = 30): Promise<CertificadoInfo[]> => {
    try {
      const headers = await getAuthHeaders();
      
      const response = await fetch(
        `${API_BASE_URL}/certificados/expiring?dias=${dias}&solo_activos=true`,
        { headers }
      );

      if (!response.ok) {
        const errorData: ErrorResponse = await response.json();
        throw new Error(errorData.message || 'Error al obtener certificados por vencer');
      }

      const data = await response.json();
      return data.certificados;
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'Error desconocido',
      }));
      return [];
    }
  }, [getAuthHeaders]);

  // Refrescar certificados
  const refreshCertificados = useCallback(async () => {
    if (empresa_id) {
      await loadCertificados(empresa_id);
    }
  }, [empresa_id, loadCertificados]);

  // Cargar certificados al montar el componente o cambiar empresa_id
  useEffect(() => {
    if (empresa_id) {
      loadCertificados(empresa_id);
    }
  }, [empresa_id, loadCertificados]);

  // Crear objeto de acciones
  const actions: UseCertificadosActions = {
    loadCertificados,
    uploadCertificado,
    activateCertificado,
    deactivateCertificado,
    deleteCertificado,
    validateCertificado,
    getCertificadosExpiring,
    refreshCertificados,
  };

  return {
    ...state,
    actions,
  };
}

// Hook para utilidades de certificados
export function useCertificadoUtils() {
  const formatFecha = useCallback((fecha: string): string => {
    return new Date(fecha).toLocaleDateString('es-PE', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }, []);

  const formatDiasVencimiento = useCallback((dias: number): string => {
    if (dias < 0) {
      return `Vencido hace ${Math.abs(dias)} días`;
    } else if (dias === 0) {
      return 'Vence hoy';
    } else if (dias === 1) {
      return 'Vence mañana';
    } else {
      return `Vence en ${dias} días`;
    }
  }, []);

  const getEstadoColor = useCallback((certificado: CertificadoInfo): string => {
    if (!certificado.vigente) return 'red';
    if (certificado.requiere_renovacion) return 'orange';
    if (certificado.activo) return 'green';
    return 'gray';
  }, []);

  const isVencido = useCallback((certificado: CertificadoInfo): boolean => {
    return !certificado.vigente;
  }, []);

  const isProximoAVencer = useCallback((certificado: CertificadoInfo, dias: number = 30): boolean => {
    return certificado.vigente && certificado.dias_para_vencer <= dias;
  }, []);

  const getRucFromSubject = useCallback((subject_dn: string): string | null => {
    // Extraer RUC del subject DN
    const match = subject_dn.match(/CN=(\d{11})/);
    return match ? match[1] : null;
  }, []);

  return {
    formatFecha,
    formatDiasVencimiento,
    getEstadoColor,
    isVencido,
    isProximoAVencer,
    getRucFromSubject,
  };
}
