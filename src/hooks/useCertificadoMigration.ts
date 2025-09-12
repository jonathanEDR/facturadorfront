/**
 * Hook para manejar la migración de certificados Legacy → Nuevo Sistema
 */
import { useState, useEffect, useCallback } from 'react';
import { 
  HybridCertificadoConfig, 
  LegacyCertificadoData,
  MIGRATION_STRATEGY 
} from '@/types/certificado-migration';
import { CertificadoInfo } from '@/types/certificates';
import { Empresa } from '@/types/empresa';

interface UseCertificadoMigrationProps {
  empresa: Empresa;
  onMigrationComplete?: (certificados: CertificadoInfo[]) => void;
  onMigrationError?: (error: string) => void;
}

export function useCertificadoMigration({
  empresa,
  onMigrationComplete,
  onMigrationError
}: UseCertificadoMigrationProps) {
  
  const [migrationStatus, setMigrationStatus] = useState<'idle' | 'checking' | 'migrating' | 'completed' | 'error'>('idle');
  const [hybridConfig, setHybridConfig] = useState<HybridCertificadoConfig | null>(null);
  const [migrationProgress, setMigrationProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  // Verificar si hay datos legacy
  const hasLegacyData = useCallback((): boolean => {
    return !!(
      empresa.certificado_digital_path || 
      empresa.certificado_digital_password ||
      empresa.certificado_digital_activo
    );
  }, [empresa]);

  // Verificar si hay datos del nuevo sistema
  const hasNewSystemData = useCallback((): boolean => {
    return !!(
      empresa.certificados_disponibles?.length ||
      empresa.certificado_activo_filename
    );
  }, [empresa]);

  // Determinar estrategia de migración
  const determineMigrationStrategy = useCallback(() => {
    const legacy = hasLegacyData();
    const newSystem = hasNewSystemData();

    if (!legacy && !newSystem) {
      return 'no_certificates';
    }
    
    if (legacy && !newSystem) {
      return 'migrate_legacy';
    }
    
    if (!legacy && newSystem) {
      return 'new_system_only';
    }
    
    // Ambos sistemas tienen datos
    if (MIGRATION_STRATEGY.PREFER_NEW_SYSTEM) {
      return 'prefer_new_validate_legacy';
    }
    
    return 'hybrid_mode';
  }, [hasLegacyData, hasNewSystemData]);

  // Crear configuración híbrida
  const createHybridConfig = useCallback((): HybridCertificadoConfig => {
    const strategy = determineMigrationStrategy();
    
    const legacyData: LegacyCertificadoData = {
      certificado_digital_path: empresa.certificado_digital_path,
      certificado_digital_password: empresa.certificado_digital_password,
      certificado_digital_activo: empresa.certificado_digital_activo,
      certificado_vigencia_hasta: empresa.certificado_vigencia_hasta
    };

    const newSystemData = {
      certificado_activo_filename: empresa.certificado_activo_filename,
      certificados_disponibles: empresa.certificados_disponibles || []
    };

    return {
      prefer_new_system: MIGRATION_STRATEGY.PREFER_NEW_SYSTEM,
      legacy_data: hasLegacyData() ? legacyData : undefined,
      new_system_data: hasNewSystemData() ? newSystemData : undefined,
      migration_status: strategy === 'migrate_legacy' ? 'pending' : 
                       strategy === 'new_system_only' ? 'completed' : 'pending'
    };
  }, [empresa, determineMigrationStrategy, hasLegacyData, hasNewSystemData]);

  // Simular migración de datos legacy (aquí conectarías con tu API)
  const migrateLegacyData = useCallback(async (): Promise<boolean> => {
    if (!hasLegacyData()) {
      return false;
    }

    try {
      setMigrationStatus('migrating');
      setMigrationProgress(0);

      // Simular proceso de migración
      setMigrationProgress(25);
      
      // TODO: Llamar a API para migrar certificado legacy
      // const result = await api.migrateLegacyCertificado(empresa.id, {
      //   certificado_path: empresa.certificado_digital_path,
      //   certificado_password: empresa.certificado_digital_password
      // });
      
      setMigrationProgress(50);
      
      // Simular validación
      await new Promise(resolve => setTimeout(resolve, 1000));
      setMigrationProgress(75);
      
      // Simular finalización
      await new Promise(resolve => setTimeout(resolve, 500));
      setMigrationProgress(100);
      
      setMigrationStatus('completed');
      onMigrationComplete?.([]);
      
      return true;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Error desconocido en migración';
      setError(errorMessage);
      setMigrationStatus('error');
      onMigrationError?.(errorMessage);
      return false;
    }
  }, [hasLegacyData, onMigrationComplete, onMigrationError]);

  // Obtener certificado activo (híbrido)
  const getActiveCertificado = useCallback((): CertificadoInfo | LegacyCertificadoData | null => {
    if (!hybridConfig) return null;

    // Priorizar nuevo sistema si está disponible y configurado
    if (hybridConfig.prefer_new_system && hybridConfig.new_system_data?.certificados_disponibles) {
      const activeCert = hybridConfig.new_system_data.certificados_disponibles.find(
        cert => cert.activo && cert.vigente
      );
      if (activeCert) return activeCert;
    }

    // Fallback al sistema legacy
    if (hybridConfig.legacy_data?.certificado_digital_activo) {
      return hybridConfig.legacy_data;
    }

    return null;
  }, [hybridConfig]);

  // Verificar si puede firmar documentos
  const canSignDocuments = useCallback((): boolean => {
    const activeCert = getActiveCertificado();
    
    if (!activeCert) return false;
    
    // Si es del nuevo sistema, verificar vigencia
    if ('vigente' in activeCert) {
      return activeCert.vigente && activeCert.activo;
    }
    
    // Si es legacy, verificar activo
    return activeCert.certificado_digital_activo;
  }, [getActiveCertificado]);

  // Inicializar configuración híbrida
  useEffect(() => {
    setMigrationStatus('checking');
    const config = createHybridConfig();
    setHybridConfig(config);
    setMigrationStatus('idle');
  }, [createHybridConfig]);

  return {
    // Estados
    migrationStatus,
    hybridConfig,
    migrationProgress,
    error,
    
    // Funciones de verificación
    hasLegacyData,
    hasNewSystemData,
    determineMigrationStrategy,
    
    // Funciones de migración
    migrateLegacyData,
    
    // Funciones híbridas
    getActiveCertificado,
    canSignDocuments,
    
    // Utils
    isReady: migrationStatus === 'idle' || migrationStatus === 'completed',
    needsMigration: determineMigrationStrategy() === 'migrate_legacy',
    isHybridMode: determineMigrationStrategy() === 'hybrid_mode'
  };
}
