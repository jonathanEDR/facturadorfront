// Servicio para manejar consultas de validez de comprobantes
"use client";

import { useApi } from '@/hooks/useApi';
import { 
  ConsultaValidezConfiguration, 
  ConsultaValidezCredentials, 
  ConsultaValidezRequest, 
  ConsultaValidezResponse,
  TokenInfo
} from '@/types/consulta-validez';

export class ConsultaValidezService {
  private api;
  private configCache: Map<string, { data: ConsultaValidezConfiguration; timestamp: number }> = new Map();
  private readonly CACHE_DURATION = 30000; // 30 segundos

  constructor(api: ReturnType<typeof useApi>) {
    this.api = api;
  }

  // ===============================
  // GESTIÓN DE CREDENCIALES
  // ===============================

  /**
   * Obtener configuración actual de credenciales de consulta de validez
   */
  async getConfiguration(empresaId: string): Promise<ConsultaValidezConfiguration | null> {
    try {
      // Verificar caché primero
      const cached = this.configCache.get(empresaId);
      if (cached && (Date.now() - cached.timestamp) < this.CACHE_DURATION) {
        console.log('📦 Usando configuración desde caché');
        return cached.data;
      }

      const response = await this.api.get<any>(
        `/empresas/${empresaId}/consulta-validez/estado`
      );
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      const data = response.data;
      if (!data) {
        return null;
      }
      
      // Mapear la respuesta del backend al formato esperado por el frontend
      const config: ConsultaValidezConfiguration = {
        empresa_id: empresaId,
        empresa_ruc: data.ruc || '',
        status: data.status || (data.configurado ? 'configured' : 'not-configured'),
        habilitado: data.activo || data.habilitado || false,
        tiene_credenciales: data.configurado || data.tiene_credenciales || false,
        tiene_token: data.tiene_token || false,
        token_valido: data.token_valido || false,
        // Mapear las credenciales si existen
        credentials: data.credentials ? {
          client_id: data.credentials.client_id || '',
          client_secret: data.credentials.client_secret || ''
        } : undefined
      };
      
      // Guardar en caché
      this.configCache.set(empresaId, {
        data: config,
        timestamp: Date.now()
      });
      
      return config;
    } catch (error) {
      console.error('Error obteniendo configuración de consulta validez:', error);
      throw error;
    }
  }

  /**
   * Configurar credenciales de API para consulta de validez
   */
  async configureCredentials(
    empresaId: string, 
    credentials: ConsultaValidezCredentials
  ): Promise<{ success: boolean; message: string }> {
    try {
      const response = await this.api.post<{ success: boolean; message: string }>(
        `/empresas/${empresaId}/consulta-validez/configurar`, 
        credentials  // Enviar directamente el objeto
      );
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      // Limpiar caché después de configurar credenciales
      this.configCache.delete(empresaId);
      
      return response.data || { success: false, message: 'Error desconocido' };
    } catch (error) {
      console.error('Error configurando credenciales de consulta validez:', error);
      throw error;
    }
  }

  /**
   * Probar conexión y obtener token
   */
  async testConnection(empresaId: string): Promise<{ 
    success: boolean; 
    message: string; 
    token_info?: TokenInfo 
  }> {
    try {
      const response = await this.api.post<{ 
        success: boolean; 
        message: string; 
        token_info?: TokenInfo 
      }>(
        `/empresas/${empresaId}/consulta-validez/probar`,
        { validar_credenciales: true }  // Enviar el cuerpo esperado por el backend
      );
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      // Limpiar caché después de probar la conexión
      this.configCache.delete(empresaId);
      
      return response.data || { success: false, message: 'Error desconocido' };
    } catch (error) {
      console.error('Error probando conexión de consulta validez:', error);
      throw error;
    }
  }

  /**
   * Renovar token de acceso
   */
  async refreshToken(empresaId: string): Promise<{ 
    success: boolean; 
    message: string; 
    token_info?: TokenInfo 
  }> {
    try {
      const response = await this.api.post<{ 
        success: boolean; 
        message: string; 
        token_info?: TokenInfo 
      }>(
        `/empresas/${empresaId}/consulta-validez/probar`,
        { validar_credenciales: true }  // Enviar el cuerpo esperado por el backend
      );
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      return response.data || { success: false, message: 'Error desconocido' };
    } catch (error) {
      console.error('Error renovando token de consulta validez:', error);
      throw error;
    }
  }

  // ===============================
  // CONSULTAS DE COMPROBANTES
  // ===============================

  /**
   * Realizar consulta de validez de comprobante
   */
  async consultarComprobante(
    empresaId: string, 
    request: ConsultaValidezRequest
  ): Promise<ConsultaValidezResponse> {
    try {
      const response = await this.api.post<ConsultaValidezResponse>(
        `/empresas/${empresaId}/comprobantes/consultar`, {
          body: JSON.stringify(request),
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      return response.data || { 
        success: false, 
        message: 'Error desconocido en la consulta' 
      };
    } catch (error) {
      console.error('Error consultando comprobante:', error);
      throw error;
    }
  }

  /**
   * Consultar múltiples comprobantes en lote
   */
  async consultarComprobantesBatch(
    empresaId: string, 
    requests: ConsultaValidezRequest[]
  ): Promise<ConsultaValidezResponse[]> {
    try {
      const response = await this.api.post<ConsultaValidezResponse[]>(
        `/consultas/comprobantes/validar-lote?empresa_id=${empresaId}`, {
          body: JSON.stringify({ comprobantes: requests }),
          headers: {
            'Content-Type': 'application/json'
          }
        }
      );
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      return response.data || [];
    } catch (error) {
      console.error('Error consultando comprobantes en lote:', error);
      throw error;
    }
  }

  // ===============================
  // UTILIDADES
  // ===============================

  /**
   * Validar formato de datos del comprobante
   */
  static validateComprobanteRequest(request: ConsultaValidezRequest): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Validar RUC emisor
    if (!request.ruc_emisor || !/^\d{11}$/.test(request.ruc_emisor)) {
      errors.push('RUC emisor debe tener 11 dígitos');
    }

    // Validar tipo de comprobante
    const tiposValidos = ['01', '03', '07', '08', 'R1', 'R7'];
    if (!tiposValidos.includes(request.tipo_comprobante)) {
      errors.push(`Tipo de comprobante debe ser uno de: ${tiposValidos.join(', ')}`);
    }

    // Validar serie
    if (!request.serie || request.serie.length > 4) {
      errors.push('Serie debe tener máximo 4 caracteres');
    }

    // Validar número
    if (!request.numero || request.numero <= 0 || request.numero > 99999999) {
      errors.push('Número debe estar entre 1 y 99999999');
    }

    // Validar fecha
    if (!request.fecha_emision || !/^\d{2}\/\d{2}\/\d{4}$/.test(request.fecha_emision)) {
      errors.push('Fecha de emisión debe estar en formato dd/mm/yyyy');
    }

    // Validar monto
    if (request.monto < 0) {
      errors.push('Monto debe ser mayor o igual a 0');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Validar credenciales básicas
   */
  static validateCredentials(credentials: ConsultaValidezCredentials): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Validar Client ID
    if (!credentials.client_id || !credentials.client_id.trim()) {
      errors.push('Client ID es obligatorio');
    } else if (credentials.client_id.length > 100) {
      errors.push('Client ID no puede exceder 100 caracteres');
    }

    // Validar Client Secret
    if (!credentials.client_secret || !credentials.client_secret.trim()) {
      errors.push('Client Secret es obligatorio');
    } else if (credentials.client_secret.length < 10) {
      errors.push('Client Secret debe tener al menos 10 caracteres');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }

  /**
   * Formatear respuesta de consulta para mostrar
   */
  static formatConsultaResponse(response: ConsultaValidezResponse): {
    status: 'success' | 'error' | 'warning';
    title: string;
    description: string;
    details?: any;
  } {
    if (!response.success) {
      return {
        status: 'error',
        title: 'Error en la consulta',
        description: response.message || 'Error desconocido',
        details: response.error
      };
    }

    if (response.comprobante) {
      return {
        status: 'success',
        title: 'Comprobante encontrado',
        description: `${response.comprobante.tipo_comprobante}-${response.comprobante.serie}-${response.comprobante.numero}`,
        details: response.comprobante
      };
    }

    return {
      status: 'warning',
      title: 'Consulta realizada',
      description: response.message,
      details: response.resultado_sunat
    };
  }
}

// Hook personalizado para usar el servicio
export function useConsultaValidez() {
  const api = useApi();
  const service = new ConsultaValidezService(api);

  return {
    getConfiguration: service.getConfiguration.bind(service),
    configureCredentials: service.configureCredentials.bind(service),
    testConnection: service.testConnection.bind(service),
    refreshToken: service.refreshToken.bind(service),
    consultarComprobante: service.consultarComprobante.bind(service),
    consultarComprobantesBatch: service.consultarComprobantesBatch.bind(service),
    validateRequest: ConsultaValidezService.validateComprobanteRequest,
    validateCredentials: ConsultaValidezService.validateCredentials,
    formatResponse: ConsultaValidezService.formatConsultaResponse,
    loading: api.loading
  };
}