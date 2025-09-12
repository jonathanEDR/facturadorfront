// Tipos TypeScript para el sistema de gestión de certificados digitales
// Basado en la API del backend implementada

export interface CertificadoInfo {
  id: string;
  empresa_id: string;
  filename: string;
  subject_dn: string;
  issuer_dn: string;
  serial_number: string;
  valid_from: string;
  valid_to: string;
  ruc_certificado: string;
  algoritmo: string;
  key_usage: string;
  tamaño_clave: number;
  activo: boolean;
  fecha_subida: string;
  fecha_activacion?: string;
  vigente: boolean;
  dias_para_vencer: number;
  requiere_renovacion: boolean;
  validado_sunat: boolean;
  errores_validacion: string[];
}

export interface CertificadoUploadRequest {
  file: File;
  password: string;
  validar_sunat?: boolean;
}

export interface CertificadoUploadResponse {
  success: boolean;
  message: string;
  certificado: CertificadoInfo;
}

export interface CertificadosListResponse {
  success: boolean;
  total: number;
  certificados: CertificadoInfo[];
  certificado_activo_id?: string;
}

export interface CertificadoActivateRequest {
  razon: string;
}

export interface CertificadoActivateResponse {
  success: boolean;
  message: string;
  certificado_id: string;
  certificado_anterior_id?: string;
}

export interface CertificadoValidationResponse {
  success: boolean;
  certificado_id: string;
  valido: boolean;
  errores: string[];
  warnings: string[];
  detalles: {
    validez_temporal: boolean;
    algoritmo_soportado: boolean;
    cadena_confianza: boolean;
    uso_clave_correcto: boolean;
    ruc_coincide: boolean;
  };
  cumplimiento_sunat: {
    algoritmo_aprobado: boolean;
    tamaño_clave_minimo: boolean;
    certificado_vigente: boolean;
    emisor_reconocido: boolean;
  };
}

export interface CertificadosExpiringResponse {
  success: boolean;
  total: number;
  dias_filtro: number;
  certificados: CertificadoInfo[];
}

export interface ErrorResponse {
  error: string;
  message: string;
  timestamp: string;
  path: string;
}

// Estados de los certificados
export enum CertificadoEstado {
  ACTIVO = 'activo',
  INACTIVO = 'inactivo',
  VENCIDO = 'vencido',
  PROXIMO_A_VENCER = 'proximo_a_vencer'
}

// Configuración de alerts
export interface CertificadoAlert {
  type: 'success' | 'warning' | 'error' | 'info';
  title: string;
  message: string;
  certificado?: CertificadoInfo;
}

// Filtros para la lista de certificados
export interface CertificadoFiltros {
  solo_activos?: boolean;
  solo_vigentes?: boolean;
  dias_vencimiento?: number;
  empresa_id?: string;
}

// Configuración de subida
export interface UploadConfig {
  max_file_size: number; // en bytes
  accepted_extensions: string[];
  require_password: boolean;
  validate_sunat_by_default: boolean;
}

// Hook para estado de certificados
export interface UseCertificadosState {
  certificados: CertificadoInfo[];
  certificado_activo?: CertificadoInfo;
  loading: boolean;
  error?: string;
  uploading: boolean;
  validating: boolean;
}

// Acciones para el hook
export interface UseCertificadosActions {
  loadCertificados: (empresa_id: string) => Promise<void>;
  uploadCertificado: (empresa_id: string, data: CertificadoUploadRequest) => Promise<CertificadoUploadResponse>;
  activateCertificado: (empresa_id: string, certificado_id: string, razon: string) => Promise<void>;
  deactivateCertificado: (empresa_id: string, certificado_id: string) => Promise<void>;
  deleteCertificado: (empresa_id: string, certificado_id: string) => Promise<void>;
  validateCertificado: (empresa_id: string, certificado_id: string) => Promise<CertificadoValidationResponse>;
  getCertificadosExpiring: (dias?: number) => Promise<CertificadoInfo[]>;
  refreshCertificados: () => Promise<void>;
}

// Componente props
export interface CertificadoCardProps {
  certificado: CertificadoInfo;
  isActive?: boolean;
  onActivate?: (certificado_id: string) => void;
  onDeactivate?: (certificado_id: string) => void;
  onDelete?: (certificado_id: string) => void;
  onValidate?: (certificado_id: string) => void;
  onDownload?: (certificado_id: string) => void;
}

export interface CertificadoUploadProps {
  empresa_id: string;
  onUploadSuccess?: (certificado: CertificadoInfo) => void;
  onUploadError?: (error: string) => void;
  config?: Partial<UploadConfig>;
}

export interface CertificadosListProps {
  empresa_id: string;
  filtros?: CertificadoFiltros;
  onCertificadoSelect?: (certificado: CertificadoInfo) => void;
  showActions?: boolean;
}

export interface CertificadoValidationModalProps {
  certificado?: CertificadoInfo;
  isOpen: boolean;
  onClose: () => void;
  onValidate?: (certificado_id: string) => void;
}

// Configuración del dashboard
export interface CertificadoDashboardState {
  empresa_id: string;
  certificados_total: number;
  certificados_activos: number;
  certificados_vencidos: number;
  certificados_por_vencer: number;
  ultimo_certificado_subido?: CertificadoInfo;
  alertas: CertificadoAlert[];
}

// Utilidades
export interface CertificadoUtils {
  formatFecha: (fecha: string) => string;
  formatDiasVencimiento: (dias: number) => string;
  getEstadoColor: (estado: CertificadoEstado) => string;
  getEstadoIcon: (estado: CertificadoEstado) => string;
  isVencido: (certificado: CertificadoInfo) => boolean;
  isProximoAVencer: (certificado: CertificadoInfo, dias?: number) => boolean;
  getRucFromSubject: (subject_dn: string) => string | null;
}
