/**
 * Servicio para gestión de numeración de facturas
 */

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
  numero_completo: string; // e.g., "F001-00001234"
}

// Función helper para realizar llamadas a la API sin depender de hooks
async function makeApiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  // Obtener URL base y verificar si ya incluye /api/v1
  const envApiUrl = typeof window !== 'undefined' 
    ? (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000")
    : "http://localhost:8000";

  // Si la URL de entorno ya incluye /api/v1, usarla directamente
  // Si no, agregarle /api/v1
  const API_BASE_URL = envApiUrl.includes('/api/v1') 
    ? envApiUrl 
    : `${envApiUrl}/api/v1`;

  // Construcción correcta: solo agregar el endpoint
  const url = `${API_BASE_URL}${endpoint}`;
  
  // Obtener token de Clerk
  let token = null;
  if (typeof window !== 'undefined') {
    try {
      const clerk = (window as any).Clerk;
      if (clerk?.session) {
        token = await clerk.session.getToken();
      }
    } catch (error) {
          }
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> || {}),
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`API Error (${response.status}): ${errorText}`);
  }

  return await response.json();
}

// API functions - estas son funciones directas sin hooks
export const obtenerSeries = async (): Promise<string[]> => {
  const response = await makeApiCall<{success: boolean, data: string[], message: string}>('/numeracion/series');
  return response.data || [];
};

export const obtenerContadores = async (): Promise<ContadorResponse[]> => {
  const response = await makeApiCall<{success: boolean, data: ContadorResponse[], message: string}>('/numeracion/contadores');
  return response.data || [];
};

export const obtenerContador = async (serie: string): Promise<ContadorResponse> => {
  return await makeApiCall<ContadorResponse>(`/numeracion/contador/${serie}`);
};

export const configurarNumeracion = async (configuracion: ConfigurarNumeracionRequest): Promise<ContadorResponse> => {
  return await makeApiCall<ContadorResponse>('/numeracion/configurar', {
    method: 'POST',
    body: JSON.stringify(configuracion)
  });
};

export const configurarNumeracionMasiva = async (configuraciones: ConfigurarNumeracionRequest[]): Promise<ContadorResponse[]> => {
  return await makeApiCall<ContadorResponse[]>('/numeracion/configurar-masiva', {
    method: 'POST',
    body: JSON.stringify({ configuraciones })
  });
};

export const obtenerEstadisticas = async (serie: string): Promise<EstadisticasSerieResponse> => {
  return await makeApiCall<EstadisticasSerieResponse>(`/numeracion/estadisticas/${serie}`);
};

export const validarNumeracion = async (serie: string): Promise<ValidacionNumeracionResponse> => {
  return await makeApiCall<ValidacionNumeracionResponse>(`/numeracion/validar/${serie}`);
};

export const obtenerSiguienteNumero = async (serie: string): Promise<SiguienteNumeroResponse> => {
  return await makeApiCall<SiguienteNumeroResponse>(`/numeracion/siguiente/${serie}`);
};

export const resetearContador = async (serie: string, nuevoNumero: number): Promise<ContadorResponse> => {
  return await makeApiCall<ContadorResponse>(`/numeracion/resetear/${serie}`, {
    method: 'POST',
    body: JSON.stringify({ nuevo_numero: nuevoNumero })
  });
};

export const activarDesactivarSerie = async (serie: string, activo: boolean): Promise<ContadorResponse> => {
  return await makeApiCall<ContadorResponse>(`/numeracion/contador/${serie}/estado`, {
    method: 'PATCH',
    body: JSON.stringify({ activo })
  });
};

// Hook para usar las funciones de la API (mantenemos compatibilidad)
export function useNumeracionApi() {
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