// Exportaciones principales del módulo de certificados
export { CertificadoUpload } from './CertificadoUpload';
export { CertificadoCard } from './CertificadoCard';
export { CertificadosList } from './CertificadosList';
export { CertificadosManager } from './CertificadosManager';

// Re-exportar tipos principales
export type {
  CertificadoInfo,
  CertificadoUploadRequest,
  CertificadoUploadResponse,
  CertificadosListResponse,
  CertificadoActivateRequest,
  CertificadoActivateResponse,
  CertificadoValidationResponse,
  CertificadosExpiringResponse,
  ErrorResponse,
  CertificadoEstado,
  CertificadoAlert,
  CertificadoFiltros,
  UploadConfig,
  UseCertificadosState,
  UseCertificadosActions,
  CertificadoCardProps,
  CertificadoUploadProps,
  CertificadosListProps,
  CertificadoValidationModalProps,
  CertificadoDashboardState,
  CertificadoUtils,
} from '@/types/certificates';

// Re-exportar hooks
export { useCertificados, useCertificadoUtils } from '@/hooks/useCertificados';
