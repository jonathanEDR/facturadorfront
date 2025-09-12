/**
 * Servicio para gestión de numeración de facturas
 * Usa el hook useApi para autenticación automática
 */

import { useApi } from '@/hooks/useApi';

export interface ConfiguracionNumeracion {
  serie: string;
  numero_inicial: number;
  numero_actual: number;
  activo: boolean;
  empresa_id?: string;
}

export interface ConfigurarNumeracionRequest {
  serie: string;
  numero_inicial: number;
  activo?: boolean;
}

export interface ContadorResponse {
  id: string;
  serie: string;
  numero_actual: number;
  numero_inicial: number;
  activo: boolean;
  fecha_creacion: string;
  fecha_actualizacion: string;
  empresa_id: string;
}

export interface EstadisticasSerieResponse {
  serie: string;
  total_emitidos: number;
  ultimo_numero: number;
  fecha_ultimo_documento: string | null;
  documentos_pendientes: number;
  numeracion_consecutiva: boolean;
}

export interface ValidacionNumeracionResponse {
  serie: string;
  es_valida: boolean;
  numero_actual: number;
  siguiente_numero: number;
  numeros_faltantes: number[];
  errores: string[];
}

export interface SiguienteNumeroResponse {
  serie: string;
  siguiente_numero: number;
}

// Hook que proporciona funciones de API autenticadas
export function useNumeracionApi() {
  const { get, post, put } = useApi();

  const obtenerSeries = async (): Promise<string[]> => {
    try {
      const response = await get<{ 
        success: boolean; 
        data: Array<{serie: string; tipo: string; descripcion: string; numero_inicial: number}>; 
        message: string 
      }>('/numeracion/series');
      
      // Extraer solo las series del array de objetos
      if (response.data?.data && Array.isArray(response.data.data)) {
        return response.data.data.map(item => item.serie);
      }
      
      return ['F001', 'B001']; // Fallback
    } catch (error) {
      console.error('Error obteniendo series:', error);
      return ['F001', 'B001']; // Fallback
    }
  };

  const obtenerContadores = async (): Promise<ContadorResponse[]> => {
    try {
      const response = await get<{ success: boolean; data: ContadorResponse[]; message: string }>('/numeracion/contadores');
      return response.data?.data || [];
    } catch (error) {
      console.error('Error obteniendo contadores:', error);
      return [];
    }
  };

  const obtenerContador = async (serie: string): Promise<ContadorResponse | null> => {
    try {
      const response = await get<{ success: boolean; data: ContadorResponse; message: string }>(`/numeracion/contador/${serie}`);
      return response.data?.data || null;
    } catch (error) {
      console.error(`Error obteniendo contador para serie ${serie}:`, error);
      return null;
    }
  };

  const configurarNumeracion = async (configuracion: ConfigurarNumeracionRequest): Promise<ContadorResponse | null> => {
    try {
      const response = await post<{ success: boolean; data: ContadorResponse; message: string }>('/numeracion/configurar', configuracion);
      return response.data?.data || null;
    } catch (error) {
      console.error('Error configurando numeración:', error);
      return null;
    }
  };

  const configurarNumeracionMasiva = async (configuraciones: ConfigurarNumeracionRequest[]): Promise<ContadorResponse[]> => {
    try {
      const response = await post<{ success: boolean; data: ContadorResponse[]; message: string }>('/numeracion/configurar-masiva', { configuraciones });
      return response.data?.data || [];
    } catch (error) {
      console.error('Error configurando numeración masiva:', error);
      return [];
    }
  };

  const obtenerEstadisticas = async (serie: string): Promise<EstadisticasSerieResponse | null> => {
    try {
      const response = await get<{ success: boolean; data: EstadisticasSerieResponse; message: string }>(`/numeracion/estadisticas/${serie}`);
      return response.data?.data || null;
    } catch (error) {
      console.error(`Error obteniendo estadísticas para serie ${serie}:`, error);
      return null;
    }
  };

  const validarNumeracion = async (serie: string): Promise<ValidacionNumeracionResponse | null> => {
    try {
      const response = await get<{ success: boolean; data: ValidacionNumeracionResponse; message: string }>(`/numeracion/validar/${serie}`);
      return response.data?.data || null;
    } catch (error) {
      console.error(`Error validando numeración para serie ${serie}:`, error);
      return null;
    }
  };

  const obtenerSiguienteNumero = async (serie: string): Promise<SiguienteNumeroResponse | null> => {
    try {
      const response = await get<{ success: boolean; data: SiguienteNumeroResponse; message: string }>(`/numeracion/siguiente/${serie}`);
      return response.data?.data || null;
    } catch (error) {
      console.error(`Error obteniendo siguiente número para serie ${serie}:`, error);
      return null;
    }
  };

  const resetearContador = async (serie: string): Promise<ContadorResponse | null> => {
    try {
      const response = await post<{ success: boolean; data: ContadorResponse; message: string }>(`/numeracion/resetear/${serie}`, {});
      return response.data?.data || null;
    } catch (error) {
      console.error(`Error reseteando contador para serie ${serie}:`, error);
      return null;
    }
  };

  const activarDesactivarSerie = async (serie: string, activo: boolean): Promise<ContadorResponse | null> => {
    try {
      const response = await put<{ success: boolean; data: ContadorResponse; message: string }>(`/numeracion/serie/${serie}/estado`, { activo });
      return response.data?.data || null;
    } catch (error) {
      console.error(`Error cambiando estado de serie ${serie}:`, error);
      return null;
    }
  };

  return {
    obtenerSeries,
    obtenerContadores,
    obtenerContador,
    configurarNumeracion,
    configurarNumeracionMasiva,
    obtenerEstadisticas,
    validarNumeracion,
    obtenerSiguienteNumero,
    resetearContador,
    activarDesactivarSerie,
  };
}
