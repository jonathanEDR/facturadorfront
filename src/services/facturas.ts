/**
 * Cliente API para facturas
 * Maneja todas las operaciones relacionadas con facturas
 */
// import { TimeAwareApiClient } from '@/utils/timeSync';
import { DateTimeManager } from '@/utils/datetime';
import { useApi } from '@/hooks/useApi';      // 1. Primero obtener el ID de la factura usando numeroDocumento
import { useMemo } from 'react';
export interface ClienteData {
  tipo_documento: string; // Requerido por el backend
  numero_documento: string;
  razon_social?: string;
  nombres?: string;
  apellidos?: string;
  direccion: string;
  email?: string;
  telefono?: string;
  ubigeo?: string;
  codigo_pais?: string;
}

export interface ItemFactura {
  codigo: string;
  descripcion: string;
  cantidad: number;
  unidad_medida?: string;
  precio_unitario: number;
  
  // Campos de afectación tributaria
  tipo_afectacion_igv?: string;
  incluye_igv?: boolean;
  porcentaje_igv?: number;
  
  // Campos opcionales para descuentos
  descuento?: number;
}

export interface CuotaFactura {
  numero: number;
  monto: number;
  fecha_vencimiento: string;
}

export interface CreateFacturaRequest {
  serie: string;
  numero?: number; // Opcional - se auto-asigna si no se proporciona
  tipo_documento?: string;
  tipo_operacion?: string;
  fecha_emision?: string;
  fecha_vencimiento?: string;
  cliente: ClienteData;
  items: ItemFactura[];
  moneda?: string;
  tipo_cambio?: number;
  observaciones?: string;
  orden_compra?: string;
  
  // Campos de forma y condición de pago
  forma_pago?: string;
  condicion_pago?: string;
  cuotas?: CuotaFactura[];
  
  descuento_global?: number;
}

export interface FacturaResponse {
  id: string;
  numero: string;
  estado: string;
  total: number;
  cliente: ClienteData;
  fecha_emision: string;
  sunat_status?: {
    cdr_recibido: boolean;
    estado_sunat: string;
    observaciones?: string[];
    fecha_envio?: string;
  };
}

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data?: T;
  timestamp: string;
  request_id?: string;
}

export interface ListApiResponse<T> extends ApiResponse<T> {
  pagination?: {
    total?: number;
    pages?: number;
    page?: number;
    total_pages?: number;
    limit?: number;
  };
}

class FacturasApiClient {
  private baseUrl: string;
  private getToken?: () => Promise<string | null>;

  constructor(getToken?: () => Promise<string | null>) {
    // Get the API URL from environment variable, remove trailing slash
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';
    // Remove any existing /api/v1 suffix to avoid duplication
    this.baseUrl = apiUrl.replace(/\/$/, '').replace(/\/api\/v1$/, '');
    this.getToken = getToken;
  }

  /**
   * Obtiene headers con autenticación para las requests
   * Usa JWT token de Clerk para autenticación con el backend
   */
  private async getAuthHeaders(): Promise<HeadersInit> {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };

    // Obtener JWT token de Clerk session
    if (this.getToken) {
      try {
        const token = await this.getToken();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      } catch (error) {
        console.error('Error obteniendo token de autenticación:', error);
        throw new Error('No se pudo obtener el token de autenticación');
      }
    } else {
      // Fallback temporal mientras se migra el código existente
      console.warn('No se proporcionó método getToken, usando excepción temporal del backend');
    }

    return headers;
  }

  /**
   * Crear nueva factura
   */
  async crearFactura(
    facturaData: CreateFacturaRequest, 
    enviarSunat: boolean = true
  ): Promise<ApiResponse<FacturaResponse>> {
    try {
      // Asegurar formato de fecha correcto (solo fecha, sin hora)
      const requestData = {
        ...facturaData,
        fecha_emision: facturaData.fecha_emision || DateTimeManager.getDateString(),
      };

      // Obtener headers con autenticación
      const authHeaders = await this.getAuthHeaders();
      const headers = {
        ...authHeaders,
        'Content-Type': 'application/json',
      };
      
      const response = await fetch(`${this.baseUrl}/api/v1/facturas/?enviar_sunat=${enviarSunat}`, {
        method: 'POST',
        headers,
        body: JSON.stringify(requestData),
      }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || `HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error creating factura:', error);
      throw error;
    }
  }

  /**
   * Listar facturas
   */
  async listarFacturas(params?: {
    page?: number;
    limit?: number;
    estado?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
  }): Promise<ApiResponse<FacturaResponse[]>> {
    try {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', params.page.toString());
      if (params?.limit) searchParams.set('limit', params.limit.toString());
      if (params?.estado) searchParams.set('estado', params.estado);
      if (params?.fecha_desde) searchParams.set('fecha_desde', params.fecha_desde);
      if (params?.fecha_hasta) searchParams.set('fecha_hasta', params.fecha_hasta);

      // Obtener headers con autenticación
      const headers = await this.getAuthHeaders();
      
      const url = `${this.baseUrl}/api/v1/facturas/?${searchParams.toString()}`;

      const response = await fetch(url, {
          method: 'GET',
          headers
        }
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error listing facturas:', error);
      throw error;
    }
  }

  /**
   * Obtener factura por ID
   */
  async obtenerFactura(id: string): Promise<ApiResponse<FacturaResponse>> {
    try {
      // Obtener headers con autenticación
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${this.baseUrl}/api/v1/facturas/${id}`, {
        method: 'GET',
        headers
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting factura:', error);
      throw error;
    }
  }

  /**
   * Descargar PDF de factura - VERSIÓN DINÁMICA CORREGIDA
   * Usa el endpoint dinámico con datos reales de empresa y cliente
   */
  async descargarPDF(numeroDocumentoOrId: string): Promise<void> {
    try {
      console.log('📄 Descargando PDF actualizado para:', numeroDocumentoOrId);
      
      let facturaId: string;
      
      // Si parece un ID directo (formato MongoDB ObjectId), usarlo directamente
      if (numeroDocumentoOrId.match(/^[0-9a-fA-F]{24}$/)) {
        facturaId = numeroDocumentoOrId;
        console.log('🎯 Usando ID directo de factura:', facturaId);
      } else {
        // Si es número de documento, buscar el ID
        console.log('🔍 Buscando ID por número de documento:', numeroDocumentoOrId);
        const facturas = await this.listarFacturas({ page: 1, limit: 100 });
        const factura = facturas.data?.find(f => numeroDocumentoOrId.includes(f.numero.toString()));
        
        if (!factura) {
          throw new Error(`Factura ${numeroDocumentoOrId} no encontrada en ${facturas.data?.length || 0} facturas`);
        }
        
        facturaId = factura.id || (factura as any)._id;
      }
      
      // 2. Usar el endpoint de descarga EN TIEMPO REAL
      const url = `${this.baseUrl}/api/v1/facturas/${facturaId}/download/pdf`;
      console.log('🌐 URL de descarga:', url);
      
      // Obtener headers con autenticación
      const headers = await this.getAuthHeaders();
      
      console.log('🔐 Headers enviados:', {
        'Content-Type': (headers as Record<string, string>)['Content-Type'],
        'Authorization': (headers as Record<string, string>)['Authorization'] ? 'Bearer [TOKEN]' : 'No token'
      });
      
      const response = await fetch(url, {
        method: 'GET',
        headers,
        mode: 'cors',
        credentials: 'include'
      });
      
      console.log('📡 Response status:', response.status, response.statusText);
      console.log('📋 Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Error desconocido');
        console.error('❌ Error response body:', errorText);
        throw new Error(`Error descargando PDF: ${response.status} - ${response.statusText}: ${errorText}`);
      }
      
      // Obtener el blob del PDF
      const blob = await response.blob();
      console.log('📦 Blob recibido:', blob.size, 'bytes, tipo:', blob.type);
      
      if (blob.size === 0) {
        throw new Error('El archivo PDF está vacío');
      }
      
      // Crear URL temporal y descargar
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      
      // Obtener nombre del archivo desde headers o usar default
      const contentDisposition = response.headers.get('content-disposition');
      let filename = 'factura.pdf';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      console.log('✅ PDF descargado exitosamente:', filename);
      
    } catch (error) {
      console.error('❌ Error downloading PDF:', error);
      throw error;
    }
  }

  /**
   * Descargar PDF por ID de factura directamente - MÉTODO OPTIMIZADO
   * Garantiza que siempre se genera un PDF actualizado
   */
  async descargarPDFPorId(facturaId: string): Promise<void> {
    try {
      console.log('🎯 Descargando PDF directamente por ID:', facturaId);
      
      const url = `${this.baseUrl}/api/v1/facturas/${facturaId}/download/pdf`;
      console.log('🌐 URL directa:', url);
      
      const headers = await this.getAuthHeaders();
      const response = await fetch(url, {
        method: 'GET',
        headers,
        mode: 'cors',
        credentials: 'include'
      });
      
      if (!response.ok) {
        const errorText = await response.text().catch(() => 'Error desconocido');
        throw new Error(`Error descargando PDF: ${response.status} - ${response.statusText}: ${errorText}`);
      }
      
      const blob = await response.blob();
      if (blob.size === 0) {
        throw new Error('El archivo PDF está vacío');
      }
      
      // Crear URL temporal y descargar
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      
      // Obtener nombre del archivo desde headers o usar default
      const contentDisposition = response.headers.get('content-disposition');
      let filename = 'factura.pdf';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      console.log('✅ PDF generado y descargado en tiempo real:', filename);
      
    } catch (error) {
      console.error('❌ Error downloading PDF por ID:', error);
      throw error;
    }
  }

  /**
   * Construir URLs de descarga estáticas usando numero_documento
   * Basado en la solución del backend con StaticFiles
   * IMPORTANTE: No usar this.baseUrl porque incluye /api/v1/ que no aplica para archivos estáticos
   */
  private buildStaticDownloadUrls(numeroDocumento: string) {
    // Obtener URL base del API y remover /api/v1 si existe
    const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000';
    const baseUrl = apiUrl.replace('/api/v1', '');
    
    // Usar /outputs directamente (montaje principal de archivos estáticos)
    const outputsBase = `${baseUrl}/outputs`;
    
    // El numeroDocumento ya viene con formato completo: {RUC}-{TIPO_DOC}-{SERIE}-{NUMERO}
    // Ejemplo: 20612969125-01-F001-00000008
    
    // El CDR tiene formato: CDR-{numeroDocumento}.zip 
    // Ejemplo: CDR-20612969125-01-F001-00000008.zip
    const cdrName = `CDR-${numeroDocumento}.zip`;
    
    return {
      xml: `${outputsBase}/facturas/${numeroDocumento}.xml`,
      zip: `${outputsBase}/zip/${numeroDocumento}.zip`,
      cdr: `${outputsBase}/cdr/${cdrName}`,
      // PDF usa solo SERIE-NUMERO para archivos temporales de descarga
      pdf: `${outputsBase}/pdf/${numeroDocumento}.pdf`,
      // XML firmado (si está disponible)
      xmlSigned: `${outputsBase}/firmas/${numeroDocumento}_signed.xml`
    };
  }

  /**
   * Descargar XML de factura - VERSIÓN CON URLs ESTÁTICAS
   */
  async descargarXML(numeroDocumento: string): Promise<void> {
    try {
      const urls = this.buildStaticDownloadUrls(numeroDocumento);
      
      console.log('📄 Descargando XML para:', numeroDocumento);
      console.log('🌐 URL XML:', urls.xml);
      
      // Intentar descargar XML original primero
      let response = await fetch(urls.xml);
      let filename = `${numeroDocumento}.xml`;
      
      // Si no existe el XML original, intentar XML firmado
      if (!response.ok) {
        console.log('📄 XML original no encontrado, intentando XML firmado...');
        response = await fetch(urls.xmlSigned);
        filename = `${numeroDocumento}_signed.xml`;
      }
      
      if (!response.ok) {
        throw new Error(`Archivo XML no encontrado para ${numeroDocumento}. Verifique que la factura haya sido procesada.`);
      }
      
      const blob = await response.blob();
      
      // Crear enlace de descarga
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      console.log('✅ XML descargado exitosamente:', filename);
      
    } catch (error) {
      console.error('❌ Error downloading XML:', error);
      throw error;
    }
  }

  /**
   * Descargar ZIP de factura - VERSIÓN CON URLs ESTÁTICAS
   */
  async descargarZIP(numeroDocumento: string): Promise<void> {
    try {
      const urls = this.buildStaticDownloadUrls(numeroDocumento);
      
      console.log('📦 Descargando ZIP para:', numeroDocumento);
      console.log('🌐 URL ZIP:', urls.zip);
      
      const response = await fetch(urls.zip);
      
      if (!response.ok) {
        throw new Error(`Archivo ZIP no encontrado para ${numeroDocumento}. Verifique que la factura haya sido procesada y enviada a SUNAT.`);
      }
      
      const blob = await response.blob();
      const filename = `${numeroDocumento}.zip`;
      
      // Crear enlace de descarga
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      console.log('✅ ZIP descargado exitosamente:', filename);
      
    } catch (error) {
      console.error('❌ Error downloading ZIP:', error);
      throw error;
    }
  }

  /**
   * Descargar CDR de SUNAT - VERSIÓN CON URLs ESTÁTICAS
   */
  async descargarCDR(numeroDocumento: string): Promise<void> {
    try {
      const urls = this.buildStaticDownloadUrls(numeroDocumento);
      
      console.log('📋 Descargando CDR para:', numeroDocumento);
      console.log('🌐 URL CDR:', urls.cdr);
      
      const response = await fetch(urls.cdr);
      
      if (!response.ok) {
        throw new Error(`Archivo CDR no encontrado para ${numeroDocumento}. Verifique que la factura haya sido enviada a SUNAT y el CDR haya sido recibido.`);
      }
      
      const blob = await response.blob();
      // Extraer el nombre del archivo CDR de la URL
      const cdrFilename = urls.cdr.split('/').pop() || `CDR-${numeroDocumento}.zip`;
      
      // Crear enlace de descarga
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = cdrFilename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      console.log('✅ CDR descargado exitosamente:', cdrFilename);
      
    } catch (error) {
      console.error('❌ Error downloading CDR:', error);
      throw error;
    }
  }

  /**
   * Reenviar factura a SUNAT
   */
  async reenviarSunat(id: string): Promise<ApiResponse<FacturaResponse>> {
    try {
      // Obtener headers con autenticación
      const headers = await this.getAuthHeaders();
      
      const response = await fetch(`${this.baseUrl}/api/v1/facturas/${id}/enviar-sunat`, {
        method: 'POST',
        headers
      });

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Error resending to SUNAT:', error);
      throw error;
    }
  }

  /**
   * Validar datos antes de crear factura
   */
  async validarDatos(facturaData: CreateFacturaRequest): Promise<{
    valido: boolean;
    errores: string[];
  }> {
    try {
      // Validaciones básicas del frontend
      const errores: string[] = [];

      // Validar serie - validación básica
      if (!facturaData.serie?.trim()) {
        errores.push('Serie es obligatoria');
      } else if (facturaData.serie.length !== 4) {
        errores.push('Serie debe tener exactamente 4 caracteres');
      } else if (!['F', 'B', 'T'].includes(facturaData.serie[0].toUpperCase())) {
        errores.push('Serie debe comenzar con F, B o T');
      }

      // Validar cliente
      if (!facturaData.cliente.numero_documento) {
        errores.push('Número de documento del cliente es obligatorio');
      }

      if (!facturaData.cliente.razon_social?.trim()) {
        errores.push('Razón social del cliente es obligatoria');
      }

      // Validar items
      if (!facturaData.items || facturaData.items.length === 0) {
        errores.push('Debe incluir al menos un item');
      }

      facturaData.items.forEach((item, index) => {
        if (!item.descripcion?.trim()) {
          errores.push(`Item ${index + 1}: Descripción es obligatoria`);
        }
        if (item.cantidad <= 0) {
          errores.push(`Item ${index + 1}: Cantidad debe ser mayor a 0`);
        }
        if (item.precio_unitario < 0) {
          errores.push(`Item ${index + 1}: Precio no puede ser negativo`);
        }
      });

      return {
        valido: errores.length === 0,
        errores,
      };
    } catch (error) {
      console.error('Error validating data:', error);
      return {
        valido: false,
        errores: ['Error interno de validación'],
      };
    }
  }
}

// Exportar la clase para uso directo
export { FacturasApiClient };

// Instancia singleton (sin autenticación, para compatibilidad)
export const facturasApi = new FacturasApiClient();

/**
 * Crea un cliente de facturas con autenticación JWT de Clerk
 * @param getToken Función para obtener el JWT token de Clerk
 * @returns Instancia del cliente de facturas autenticado
 */
export function createAuthenticatedFacturasClient(getToken: () => Promise<string | null>): FacturasApiClient {
  return new FacturasApiClient(getToken);
}

// Hook para usar en componentes React
export function useFacturasApi() {
  const { apiCall } = useApi();
  
  const crearFactura = async (
    facturaData: CreateFacturaRequest, 
    enviarSunat: boolean = true
  ): Promise<ApiResponse<FacturaResponse>> => {
    try {
      // Asegurar formato de fecha correcto (solo fecha, sin hora)
      const requestData = {
        ...facturaData,
        fecha_emision: facturaData.fecha_emision || DateTimeManager.getDateString(),
      };

      const response = await apiCall<FacturaResponse>(
        `/facturas/?enviar_sunat=${enviarSunat}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(requestData),
        }
      );

      return {
        success: !!response.data,
        data: response.data || undefined,
        message: response.error || 'Factura creada exitosamente',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error creating factura:', error);
      return {
        success: false,
        data: undefined,
        message: error instanceof Error ? error.message : 'Error desconocido',
        timestamp: new Date().toISOString()
      };
    }
  };

  const listarFacturas = async (params?: {
    page?: number;
    limit?: number;
    estado?: string;
    fecha_desde?: string;
    fecha_hasta?: string;
  }): Promise<ListApiResponse<FacturaResponse[]>> => {
    try {
      const searchParams = new URLSearchParams();
      if (params?.page) searchParams.set('page', params.page.toString());
      if (params?.limit) searchParams.set('limit', params.limit.toString());
      if (params?.estado) searchParams.set('estado', params.estado);
      if (params?.fecha_desde) searchParams.set('fecha_desde', params.fecha_desde);
      if (params?.fecha_hasta) searchParams.set('fecha_hasta', params.fecha_hasta);

      const response = await apiCall<any>(
        `/facturas/?${searchParams.toString()}`
      );

      return {
        success: !!response.data,
        data: response.data?.data || [],
        pagination: response.data?.pagination,
        message: response.error || 'Facturas obtenidas exitosamente',
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error listing facturas:', error);
      return {
        success: false,
        data: [],
        message: error instanceof Error ? error.message : 'Error desconocido',
        timestamp: new Date().toISOString()
      };
    }
  };

  // Función específica para descarga PDF sin autenticación
  const descargarPDF = async (numeroDocumentoOrId: string): Promise<void> => {
    try {
      console.log('📄 [useFacturasApi] Descargando PDF para:', numeroDocumentoOrId);
      
      // Crear una instancia temporal sin token para la descarga
      const tempClient = new FacturasApiClient();
      await tempClient.descargarPDF(numeroDocumentoOrId);
      
    } catch (error) {
      console.error('❌ [useFacturasApi] Error downloading PDF:', error);
      throw error;
    }
  };

  // Funciones de descarga sin autenticación para el hook
  const descargarXML = async (numeroDocumento: string): Promise<void> => {
    const tempClient = new FacturasApiClient(); // Sin token
    return await tempClient.descargarXML(numeroDocumento);
  };

  const descargarZIP = async (numeroDocumento: string): Promise<void> => {
    const tempClient = new FacturasApiClient(); // Sin token
    return await tempClient.descargarZIP(numeroDocumento);
  };

  const descargarCDR = async (numeroDocumento: string): Promise<void> => {
    const tempClient = new FacturasApiClient(); // Sin token
    return await tempClient.descargarCDR(numeroDocumento);
  };

  const reenviarSunat = async (facturaId: string): Promise<ApiResponse<FacturaResponse>> => {
    const tempClient = new FacturasApiClient(); // Sin token
    return await tempClient.reenviarSunat(facturaId);
  };

  return useMemo(() => ({
    crearFactura,
    listarFacturas,
    obtenerFactura: facturasApi.obtenerFactura.bind(facturasApi),
    descargarPDF,
    descargarPDFPorId: facturasApi.descargarPDFPorId.bind(facturasApi),
    descargarXML,
    descargarZIP,
    descargarCDR,
    reenviarSunat,
    validarDatos: facturasApi.validarDatos.bind(facturasApi),
  }), [crearFactura, listarFacturas, facturasApi, descargarPDF, descargarXML, descargarZIP, descargarCDR, reenviarSunat]);
}
