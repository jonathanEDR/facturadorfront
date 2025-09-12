/**
 * Cliente API para consultas de DNI y RUC
 * Integración con servicios RENIEC y SUNAT
 */
import { TimeAwareApiClient } from '@/utils/timeSync';

export interface RucData {
  ruc: string;
  razon_social?: string;
  estado?: string;
  condicion?: string;
  direccion?: string;
}

export interface DniData {
  dni: string;
  nombres?: string;
  apellido_paterno?: string;
  apellido_materno?: string;
}

export interface RucConsultaResponse {
  success: boolean;
  ruc_data?: RucData;
  message: string;
}

export interface DniConsultaResponse {
  success: boolean;
  dni_data?: DniData;
  message: string;
}

export interface EstadoServiciosResponse {
  reniec: {
    disponible: boolean;
    error?: string;
  };
  sunat: {
    disponible: boolean;
    error?: string;
  };
  servicios_disponibles: boolean;
}

class ConsultasApiClient {
  private baseUrl: string;

  constructor() {
    this.baseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000/api/v1';
  }

  /**
   * Consulta información de RUC en SUNAT
   */
  async consultarRuc(ruc: string, token?: string): Promise<RucConsultaResponse> {
    try {
      console.log('🏢 Consultando RUC:', ruc);
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (token) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
      }

      const response = await TimeAwareApiClient.fetch(`${this.baseUrl}/consultas/ruc/${ruc}`, {
        method: 'GET',
        headers,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
      }

      const data: RucConsultaResponse = await response.json();
      console.log('✅ Consulta RUC exitosa:', data);
      
      return data;
    } catch (error) {
      console.error('❌ Error consultando RUC:', error);
      throw new Error(
        error instanceof Error 
          ? error.message 
          : 'Error desconocido al consultar RUC'
      );
    }
  }

  /**
   * Consulta información de DNI en RENIEC
   */
  async consultarDni(dni: string, token?: string): Promise<DniConsultaResponse> {
    try {
      console.log('👤 Consultando DNI:', dni);
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (token) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
      }

      const response = await TimeAwareApiClient.fetch(`${this.baseUrl}/consultas/dni/${dni}`, {
        method: 'GET',
        headers,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
      }

      const data: DniConsultaResponse = await response.json();
      console.log('✅ Consulta DNI exitosa:', data);
      
      return data;
    } catch (error) {
      console.error('❌ Error consultando DNI:', error);
      throw new Error(
        error instanceof Error 
          ? error.message 
          : 'Error desconocido al consultar DNI'
      );
    }
  }

  /**
   * Verifica el estado de los servicios RENIEC y SUNAT
   */
  async verificarEstadoServicios(token?: string): Promise<EstadoServiciosResponse> {
    try {
      console.log('📊 Verificando estado de servicios...');
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (token) {
        (headers as Record<string, string>)['Authorization'] = `Bearer ${token}`;
      }

      const response = await TimeAwareApiClient.fetch(`${this.baseUrl}/consultas/estado`, {
        method: 'GET',
        headers,
      });
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
      }

      const data: EstadoServiciosResponse = await response.json();
      console.log('📊 Estado servicios:', data);
      
      return data;
    } catch (error) {
      console.error('❌ Error verificando estado servicios:', error);
      throw new Error(
        error instanceof Error 
          ? error.message 
          : 'Error desconocido al verificar servicios'
      );
    }
  }

  /**
   * Valida formato de RUC (sin consulta remota)
   */
  validarFormatoRuc(ruc: string): { valido: boolean; mensaje?: string } {
    if (!ruc || !ruc.trim()) {
      return { valido: false, mensaje: 'RUC es obligatorio' };
    }

    const rucLimpio = ruc.trim();

    if (rucLimpio.length !== 11) {
      return { valido: false, mensaje: 'RUC debe tener 11 dígitos' };
    }

    if (!/^\d{11}$/.test(rucLimpio)) {
      return { valido: false, mensaje: 'RUC debe contener solo números' };
    }

    // Validar tipos de contribuyente válidos
    const tipoContrib = rucLimpio.substring(0, 2);
    const tiposValidos = ['10', '15', '17', '20'];
    
    if (!tiposValidos.includes(tipoContrib)) {
      return { valido: false, mensaje: 'Tipo de contribuyente inválido' };
    }

    return { valido: true };
  }

  /**
   * Valida formato de DNI (sin consulta remota)
   */
  validarFormatoDni(dni: string): { valido: boolean; mensaje?: string } {
    if (!dni || !dni.trim()) {
      return { valido: false, mensaje: 'DNI es obligatorio' };
    }

    const dniLimpio = dni.trim();

    if (dniLimpio.length !== 8) {
      return { valido: false, mensaje: 'DNI debe tener 8 dígitos' };
    }

    if (!/^\d{8}$/.test(dniLimpio)) {
      return { valido: false, mensaje: 'DNI debe contener solo números' };
    }

    return { valido: true };
  }

  /**
   * Consulta el estado de una factura específica en SUNAT
   */
  async consultarEstadoSunat(facturaId: string, token?: string): Promise<any> {
    try {
      console.log('🔍 Consultando estado SUNAT:', facturaId);
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}/consultas/estado-sunat/${facturaId}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Consulta estado SUNAT exitosa:', data);
      
      return data;
    } catch (error) {
      console.error('❌ Error consultando estado SUNAT:', error);
      throw new Error(
        error instanceof Error 
          ? error.message 
          : 'Error desconocido al consultar estado SUNAT'
      );
    }
  }

  /**
   * Consulta masiva de estados SUNAT
   */
  async consultarEstadoSunatMasivo(limite: number = 50, token?: string): Promise<any> {
    try {
      console.log('🔄 Consultando estado SUNAT masivo, límite:', limite);
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}/consultas/sunat-masivo/${limite}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Consulta masiva exitosa:', data);
      
      return data;
    } catch (error) {
      console.error('❌ Error en consulta masiva:', error);
      throw new Error(
        error instanceof Error 
          ? error.message 
          : 'Error desconocido en consulta masiva'
      );
    }
  }

  /**
   * Descarga el archivo CDR de una factura
   */
  async descargarCdr(facturaId: string, token?: string): Promise<Blob> {
    try {
      console.log('📥 Descargando CDR:', facturaId);
      
      const headers: HeadersInit = {};

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      const response = await fetch(`${this.baseUrl}/consultas/descargar-cdr/${facturaId}`, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
      }

      const blob = await response.blob();
      console.log('✅ Descarga CDR exitosa');
      
      return blob;
    } catch (error) {
      console.error('❌ Error descargando CDR:', error);
      throw new Error(
        error instanceof Error 
          ? error.message 
          : 'Error desconocido al descargar CDR'
      );
    }
  }

  /**
   * Lista facturas enviadas a SUNAT
   */
  async listarFacturasEnviadas(limite: number = 50, estado?: string, token?: string): Promise<any> {
    try {
      console.log('📋 Listando facturas enviadas, límite:', limite, 'estado:', estado);
      
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
      };

      if (token) {
        headers['Authorization'] = `Bearer ${token}`;
      }

      let url = `${this.baseUrl}/consultas/facturas-enviadas?limite=${limite}`;
      if (estado) {
        url += `&estado=${encodeURIComponent(estado)}`;
      }

      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log('✅ Listado de facturas exitoso:', data);
      
      return data;
    } catch (error) {
      console.error('❌ Error listando facturas:', error);
      throw new Error(
        error instanceof Error 
          ? error.message 
          : 'Error desconocido al listar facturas'
      );
    }
  }
}

// Instancia singleton
export const consultasApi = new ConsultasApiClient();
