/**
 * Constantes de la empresa para construcción de URLs de descarga
 */

export const EMPRESA_CONFIG = {
  // RUC de la empresa principal
  RUC: '20612969125',
  
  // Códigos de tipo de documento SUNAT
  TIPOS_DOCUMENTO: {
    FACTURA: '01',
    BOLETA: '03',
    NOTA_CREDITO: '07',
    NOTA_DEBITO: '08'
  },
  
  // Configuración de descarga
  DOWNLOAD_CONFIG: {
    // Base URL para archivos estáticos (viene del backend)
    STATIC_BASE: '/static/storage/outputs',
    
    // Rutas por tipo de archivo
    PATHS: {
      XML: '/facturas',
      ZIP: '/zip',
      CDR: '/cdr',
      XML_SIGNED: '/firmas'
    }
  }
} as const;

/**
 * Construir el nombre del documento basado en el patrón SUNAT
 * Formato: {RUC_EMPRESA}-{TIPO_DOCUMENTO}-{SERIE}-{NUMERO}
 */
export function construirNumeroDocumento(
  rucEmpresa: string = EMPRESA_CONFIG.RUC,
  tipoDocumento: string = EMPRESA_CONFIG.TIPOS_DOCUMENTO.FACTURA,
  serie: string = 'F001',
  numero: string | number = '00000001'
): string {
  const numeroFormateado = String(numero).padStart(8, '0');
  return `${rucEmpresa}-${tipoDocumento}-${serie}-${numeroFormateado}`;
}
