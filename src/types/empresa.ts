import { CertificadoInfo } from './certificates';

export interface Empresa {
  id: string;
  user_id: string;
  ruc: string;
  razon_social: string;
  nombre_comercial?: string;
  
  // Ubicación
  direccion: string;
  distrito: string;
  provincia: string;
  departamento: string;
  ubigeo: string;
  
  // Contacto
  telefono?: string;
  email?: string;
  logo_url?: string;
  
  // Configuración
  moneda_defecto: string;
  igv_defecto: number;
  
  // Estados
  activa: boolean;
  es_empresa_defecto: boolean;
  
  // SUNAT
  sunat_usuario_sol?: string;
  sunat_clave_sol?: string;
  sunat_test_mode?: boolean;
  
  // Certificado (Sistema Legacy - En proceso de migración)
  certificado_digital_path?: string;
  certificado_digital_password?: string;
  certificado_digital_activo: boolean;
  certificado_vigencia_hasta?: string;
  
  // Nuevo sistema de certificados
  certificados_disponibles?: CertificadoInfo[];
  certificado_activo_filename?: string;
  
  // Auditoría
  fecha_creacion: string;
  fecha_actualizacion?: string;
}

export interface EmpresaCreate {
  ruc: string;
  razon_social: string;
  nombre_comercial?: string;
  tipo_empresa?: string;
  regimen_tributario?: string;
  direccion: string; // Requerido en el backend
  distrito?: string;
  provincia?: string;
  departamento?: string;
  ubigeo?: string;
  telefono?: string;
  email?: string;
  es_defecto?: boolean;
  
  // Configuración de certificados (opcional)
  certificado_config?: CertificadoConfig;
}

export interface EmpresaUpdate {
  razon_social?: string;
  nombre_comercial?: string;
  direccion?: string;
  distrito?: string;
  provincia?: string;
  departamento?: string;
  ubigeo?: string;
  telefono?: string;
  email?: string;
  logo_url?: string;
  moneda_defecto?: string;
  igv_defecto?: number;
  
  // Configuración de certificados (opcional)
  certificado_config?: CertificadoConfig;
}

export interface ConfiguracionSunat {
  usuario_sol: string;
  clave_sol: string;
  test_mode: boolean;
}

export interface ConfiguracionCertificado {
  certificado_path: string;
  password: string;
}

// Nuevo sistema de certificados
export interface CertificadoConfig {
  // Sistema Legacy (para compatibilidad temporal)
  certificado_digital_path?: string;
  certificado_digital_password?: string;
  certificado_digital_activo?: boolean;
  
  // Sistema Nuevo (preferido)
  certificado_activo_filename?: string;
  certificados_disponibles?: CertificadoInfo[];
}

export interface EmpresaResponse {
  id: string;
  ruc: string;
  razon_social: string;
  nombre_comercial?: string;
  direccion: string;
  telefono?: string;
  email?: string;
  es_empresa_defecto: boolean;
  activa: boolean;  // Estandarizado: siempre usar 'activa'
  fecha_creacion: string;
  fecha_actualizacion: string;
}

export interface EmpresaDetailResponse extends Empresa {
  tiene_configuracion_sunat: boolean;
  tiene_certificado: boolean;
  puede_facturar: boolean;
  puede_facturar_electronicamente: boolean;
  configuracion_completa: boolean;
}

export interface EmpresasListResponse {
  empresas: EmpresaResponse[];
  total: number;
  empresa_defecto_id?: string;
}

export interface ApiError {
  detail: string;
  code?: string;
}

// Tipos para configuración SUNAT
export interface SunatConfiguration {
  usuario_sol: string;
  clave_sol: string;
  test_mode: boolean;
}

export interface SunatConfigResponse {
  success: boolean;
  message: string;
  data?: {
    configured: boolean;
    test_mode: boolean;
    last_validation?: string;
  };
}

// Nuevos tipos para el manejo de modo BETA/PRODUCCIÓN
export interface SunatModeChangeRequest {
  test_mode: boolean;
}

export interface SunatCredentialsInfo {
  empresa_id: string;
  ruc: string;
  razon_social: string;
  credenciales_activas: {
    usuario_sol: string;
    clave_sol: string;
    test_mode: boolean;
    modo: string;
    tipo: string;
  };
  tiene_credenciales_originales: boolean;
  configuracion_completa: boolean;
  puede_cambiar_a_produccion: boolean;
  modo_actual: string;
}

export interface SunatBetaConfigRequest {
  // Request vacío - las credenciales se generan automáticamente
  [key: string]: never;
}

export interface SunatIntelligentConfigRequest {
  test_mode: boolean;
  usuario_sol?: string;
  clave_sol?: string;
}
