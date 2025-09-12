/**
 * Tipos TypeScript para el módulo de clientes
 */

// ===== TIPOS BASE =====

export interface Direccion {
  direccion_completa: string;
  ubigeo?: string;
  distrito?: string;
  provincia?: string;
  departamento?: string;
  referencia?: string;
}

export interface Cliente {
  id: string;
  tipo_documento: string;
  numero_documento: string;
  razon_social: string;
  nombre_comercial?: string;
  
  // Datos de contacto
  direccion?: string;
  telefono?: string;
  email?: string;
  
  // Ubicación completa
  direccion_completa?: Direccion;
  
  // Estado y fechas
  activo: boolean;
  fecha_creacion: string;
  fecha_actualizacion?: string;
  
  // Metadatos
  metadatos: Record<string, any>;
  
  // Campos calculados
  es_empresa?: boolean;
  es_persona_natural?: boolean;
  documento_formateado?: string;
  nombre_para_xml?: string;
}

// ===== REQUESTS =====

export interface CreateClienteRequest {
  tipo_documento: string;
  numero_documento: string;
  razon_social: string;
  nombre_comercial?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  direccion_completa?: Direccion;
  validar_con_sunat?: boolean;
  metadatos?: Record<string, any>;
}

export interface UpdateClienteRequest {
  razon_social?: string;
  nombre_comercial?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  direccion_completa?: Direccion;
  activo?: boolean;
  metadatos?: Record<string, any>;
}

export interface BuscarClientesRequest {
  query?: string;
  tipo_documento?: string;
  numero_documento?: string;
  activo?: boolean;
  page?: number;
  limit?: number;
  order_by?: string;
  order_direction?: string;
}

export interface ValidarDocumentoRequest {
  tipo_documento: string;
  numero_documento: string;
  consultar_sunat?: boolean;
}

// ===== RESPONSES =====

export interface ClienteResponse {
  id: string;
  tipo_documento: string;
  numero_documento: string;
  razon_social: string;
  nombre_comercial?: string;
  direccion?: string;
  telefono?: string;
  email?: string;
  direccion_completa?: Direccion;
  activo: boolean;
  fecha_creacion: string;
  fecha_actualizacion?: string;
  metadatos: Record<string, any>;
  es_empresa?: boolean;
  es_persona_natural?: boolean;
  documento_formateado?: string;
  nombre_para_xml?: string;
}

export interface PaginationInfo {
  page: number;
  limit: number;
  total: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface ListaClientesResponse {
  clientes: ClienteResponse[];
  pagination: PaginationInfo;
}

export interface ValidarDocumentoResponse {
  valido: boolean;
  tipo_documento: string;
  numero_documento: string;
  mensaje?: string;
  datos_sunat?: {
    razon_social?: string;
    nombre_comercial?: string;
    estado?: string;
    direccion?: string;
  };
  errores?: string[];
}

export interface EstadisticasClientesResponse {
  total_clientes: number;
  clientes_activos: number;
  clientes_inactivos: number;
  por_tipo_documento: Record<string, number>;
  clientes_recientes: number;
}

// ===== FILTROS Y UTILIDADES =====

export interface ClienteFilters {
  search?: string;
  tipoDocumento?: string;
  activo?: boolean;
  ordenarPor?: 'fecha_creacion' | 'razon_social' | 'numero_documento';
  direccion?: 'asc' | 'desc';
}

export interface ClienteFormData extends Omit<CreateClienteRequest, 'tipo_documento'> {
  tipo_documento: '1' | '4' | '6' | '7'; // DNI | CE | RUC | Pasaporte
}

// ===== CONSTANTES =====

export const TIPOS_DOCUMENTO = {
  '1': 'DNI',
  '4': 'Carnet de Extranjería',
  '6': 'RUC',
  '7': 'Pasaporte'
} as const;

export const TIPOS_DOCUMENTO_OPTIONS = [
  { value: '1', label: 'DNI' },
  { value: '4', label: 'Carnet de Extranjería' },
  { value: '6', label: 'RUC' },
  { value: '7', label: 'Pasaporte' }
] as const;

// ===== UTILIDADES =====

export function getTipoDocumentoLabel(tipo: string): string {
  return TIPOS_DOCUMENTO[tipo as keyof typeof TIPOS_DOCUMENTO] || 'Desconocido';
}

export function isEmpresa(tipo_documento: string): boolean {
  return tipo_documento === '6'; // RUC
}

export function isPersonaNatural(tipo_documento: string): boolean {
  return tipo_documento === '1'; // DNI
}

export function formatearDocumento(numero: string, tipo: string): string {
  switch (tipo) {
    case '6': // RUC
      if (numero.length === 11) {
        return `${numero.slice(0, 2)}-${numero.slice(2, 10)}-${numero.slice(10)}`;
      }
      break;
    case '1': // DNI
      if (numero.length === 8) {
        return `${numero.slice(0, 2)}.${numero.slice(2, 5)}.${numero.slice(5)}`;
      }
      break;
  }
  return numero;
}

export function validarLongitudDocumento(numero: string, tipo: string): boolean {
  switch (tipo) {
    case '1': return numero.length === 8; // DNI
    case '6': return numero.length === 11; // RUC
    case '4': return numero.length >= 8 && numero.length <= 12; // CE
    case '7': return numero.length >= 6 && numero.length <= 15; // Pasaporte
    default: return false;
  }
}
