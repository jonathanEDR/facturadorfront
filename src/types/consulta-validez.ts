// Tipos para la configuración de API de Consulta de Validez de Comprobantes
export interface ConsultaValidezCredentials {
  client_id: string;
  client_secret: string;
}

export interface ConsultaValidezConfiguration {
  id?: string;
  empresa_id: string;
  empresa_ruc: string;
  credentials?: ConsultaValidezCredentials; // Hacer opcional para manejar casos donde no exista
  status: 'not-configured' | 'configured' | 'active' | 'expired' | 'error';
  last_token_refresh?: string;
  expires_at?: string;
  created_at?: string;
  updated_at?: string;
  // Nuevos campos del backend fix
  habilitado?: boolean;
  tiene_credenciales?: boolean;
  tiene_token?: boolean;
  token_valido?: boolean;
}

export interface ConsultaValidezRequest {
  ruc_emisor: string;
  tipo_comprobante: string; // 01, 03, 07, 08, R1, R7
  serie: string;
  numero: number;
  fecha_emision: string; // dd/mm/yyyy
  monto: number;
}

export interface ConsultaValidezResponse {
  success: boolean;
  message: string;
  comprobante?: {
    ruc_emisor: string;
    tipo_comprobante: string;
    serie: string;
    numero: number;
    fecha_emision: string;
    monto: number;
    estado_comprobante?: string;
    estado_ruc?: string;
    condicion_domicilio?: string;
  };
  consulta?: {
    fecha_consulta: string;
    api_used: string;
    response_time_ms: number;
  };
  resultado_sunat?: {
    [key: string]: any;
  };
  error?: {
    code: string;
    message: string;
    details?: string;
  };
}

export interface TokenInfo {
  access_token: string;
  token_type: string;
  expires_in: number;
  scope?: string;
  issued_at: string;
  expires_at: string;
}