/**
 * Tipos para consultas de DNI y RUC
 */

// Datos de RUC desde SUNAT
export interface RucData {
  ruc: string;
  razon_social?: string | null;
  estado?: string | null;
  condicion?: string | null;
  direccion?: string | null;
}

// Response de consulta RUC
export interface RucConsultaResponse {
  success: boolean;
  ruc_data?: RucData | null;
  message: string;
}

// Datos de DNI desde RENIEC
export interface DniData {
  dni: string;
  nombres?: string;
  apellido_paterno?: string;
  apellido_materno?: string;
  nombre_completo?: string;
}

// Response de consulta DNI
export interface DniConsultaResponse {
  success: boolean;
  dni_data?: DniData;
  message: string;
}

// Estados de consulta
export interface ConsultaState {
  loading: boolean;
  error: string | null;
  success: boolean;
}

// Request options para consultas
export interface ConsultaOptions {
  timeout?: number;
  retries?: number;
}
