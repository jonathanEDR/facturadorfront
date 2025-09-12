/**
 * Estrategia de migración de certificados: Legacy → Nuevo Sistema
 * 
 * FASE 1: Consolidación de tipos y preparación
 * FASE 2: Implementación del bridge/adaptador
 * FASE 3: Migración gradual de datos
 * FASE 4: Deprecación del sistema legacy
 */

import { CertificadoInfo } from './certificates';

// ========================================
// TIPOS PARA LA MIGRACIÓN
// ========================================

/**
 * Estado de migración de certificados para una empresa
 */
export interface CertificadoMigrationStatus {
  empresa_id: string;
  legacy_system_active: boolean;
  new_system_active: boolean;
  migration_completed: boolean;
  migration_date?: string;
  certificados_migrados: number;
  errores_migracion: string[];
}

/**
 * Datos del sistema legacy que serán migrados
 */
export interface LegacyCertificadoData {
  certificado_digital_path?: string;
  certificado_digital_password?: string;
  certificado_digital_activo: boolean;
  certificado_vigencia_hasta?: string;
}

/**
 * Adaptador para manejar ambos sistemas durante la transición
 */
export interface CertificadoAdapter {
  // Estado actual del sistema
  hasLegacyData(): boolean;
  hasNewSystemData(): boolean;
  
  // Métodos de migración
  migrateLegacyToNew(): Promise<CertificadoInfo | null>;
  validateMigration(): Promise<boolean>;
  
  // Bridge methods
  getActiveCertificado(): CertificadoInfo | LegacyCertificadoData | null;
  canSignDocuments(): boolean;
}

/**
 * Configuración híbrida durante la migración
 */
export interface HybridCertificadoConfig {
  // Priorizar sistema nuevo si está disponible
  prefer_new_system: boolean;
  
  // Datos legacy (solo lectura durante migración)
  legacy_data?: LegacyCertificadoData;
  
  // Datos del nuevo sistema
  new_system_data?: {
    certificado_activo_filename?: string;
    certificados_disponibles?: CertificadoInfo[];
  };
  
  // Estado de migración
  migration_status: 'pending' | 'in_progress' | 'completed' | 'failed';
}

// ========================================
// ESTRATEGIA DE MIGRACIÓN
// ========================================

export const MIGRATION_STRATEGY = {
  // Mantener compatibilidad total durante transición
  MAINTAIN_BACKWARDS_COMPATIBILITY: true,
  
  // Priorizar el nuevo sistema cuando esté disponible
  PREFER_NEW_SYSTEM: true,
  
  // Migrar automáticamente cuando sea posible
  AUTO_MIGRATE_WHEN_SAFE: true,
  
  // Validar migración antes de completar
  VALIDATE_BEFORE_COMPLETING: true,
  
  // Backup de datos legacy antes de migrar
  BACKUP_LEGACY_DATA: true
} as const;

export type MigrationStrategy = typeof MIGRATION_STRATEGY;
