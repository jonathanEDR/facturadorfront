/**
 * Constantes SUNAT para el frontend
 * Corresponden con las constantes del backend
 */

// Diccionarios simples para los selectores
export const TIPO_AFECTACION_IGV = {
  '10': 'Gravado - Operación Onerosa',
  '20': 'Exonerado - Operación Onerosa', 
  '30': 'Inafecto - Operación Onerosa',
  '40': 'Exportación'
} as const;

export const FORMAS_PAGO = {
  'Contado': 'Contado',
  'Credito': 'Crédito'
} as const;

export const CONDICIONES_PAGO = {
  'Contado': 'Contado',
  'Credito a 30 dias': 'Crédito a 30 días',
  'Credito a 60 dias': 'Crédito a 60 días',
  'Credito a 90 dias': 'Crédito a 90 días',
  'Credito a 120 dias': 'Crédito a 120 días',
  'Credito': 'Crédito personalizado'
} as const;

export const UNIDADES_MEDIDA = {
  'NIU': 'Unidad',
  'ZZ': 'Servicios',
  'KGM': 'Kilogramo',
  'MTR': 'Metro',
  'LTR': 'Litro',
  'DAY': 'Día',
  'HUR': 'Hora',
  'MON': 'Mes',
  'ANN': 'Año'
} as const;

// Tipos para TypeScript
export type TipoAfectacionIGVCode = '10' | '20' | '30' | '40';
export type FormaPagoCode = 'Contado' | 'Credito';
export type CondicionPagoCode = 'Contado' | 'Credito a 30 dias' | 'Credito a 60 dias' | 'Credito a 90 dias' | 'Credito a 120 dias' | 'Credito';
export type UnidadMedidaCode = 'NIU' | 'ZZ' | 'KGM' | 'MTR' | 'LTR' | 'DAY' | 'HUR' | 'MON' | 'ANN';

// Funciones auxiliares
export function aplicaIGV(tipoAfectacion: TipoAfectacionIGVCode): boolean {
  return tipoAfectacion === '10'; // Solo gravado aplica IGV
}

export function requiereVencimiento(formaPago: FormaPagoCode): boolean {
  return formaPago === 'Credito';
}

export function calcularFechaVencimiento(fechaEmision: string, condicionPago: CondicionPagoCode): string | null {
  const diasMap: Record<string, number> = {
    'Credito a 30 dias': 30,
    'Credito a 60 dias': 60,
    'Credito a 90 dias': 90,
    'Credito a 120 dias': 120
  };
  
  const dias = diasMap[condicionPago];
  if (!dias) return null;
  
  const fecha = new Date(fechaEmision);
  fecha.setDate(fecha.getDate() + dias);
  
  return fecha.toISOString().split('T')[0];
}
