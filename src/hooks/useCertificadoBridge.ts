/**
 * Hook para crear un bridge entre el sistema legacy y el nuevo sistema de certificados
 * Maneja la sincronización bidireccional y la migración automática
 */
import { useState, useEffect, useCallback } from 'react';
import { CertificadoConfig, Empresa } from '@/types/empresa';
import { CertificadoInfo } from '@/types/certificates';
import { useCertificados } from '@/hooks/useCertificados';

interface UseCertificadoBridgeProps {
  empresa?: Empresa;
  certificadoConfig: CertificadoConfig;
  onConfigChange: (config: CertificadoConfig) => void;
  autoSync?: boolean;
}

export function useCertificadoBridge({
  empresa,
  certificadoConfig,
  onConfigChange,
  autoSync = true
}: UseCertificadoBridgeProps) {
  
  const [syncStatus, setSyncStatus] = useState<'idle' | 'syncing' | 'synced' | 'error'>('idle');
  const [lastSyncTime, setLastSyncTime] = useState<Date | null>(null);
  const [syncError, setSyncError] = useState<string | null>(null);

  // Hook del sistema nuevo de certificados
  const { 
    certificados, 
    certificado_activo, 
    loading: certificadosLoading,
    actions: certificadosActions 
  } = useCertificados(empresa?.id || '');

  // Detectar cambios en el sistema nuevo y sincronizar al legacy
  const syncNewToLegacy = useCallback(() => {
    if (!certificado_activo || !autoSync) return;

    const legacyConfig: CertificadoConfig = {
      ...certificadoConfig,
      certificado_digital_path: certificado_activo.filename,
      certificado_digital_activo: certificado_activo.activo && certificado_activo.vigente,
      certificado_activo_filename: certificado_activo.filename,
      certificados_disponibles: certificados
    };

    // Solo actualizar si hay cambios reales
    const hasChanges = 
      legacyConfig.certificado_digital_path !== certificadoConfig.certificado_digital_path ||
      legacyConfig.certificado_digital_activo !== certificadoConfig.certificado_digital_activo ||
      legacyConfig.certificado_activo_filename !== certificadoConfig.certificado_activo_filename;

    if (hasChanges) {
      onConfigChange(legacyConfig);
      setLastSyncTime(new Date());
      setSyncStatus('synced');
    }
  }, [certificado_activo, certificados, certificadoConfig, onConfigChange, autoSync]);

  // Detectar cambios en el sistema legacy y preparar migración
  const prepareLegacyMigration = useCallback(async () => {
    if (!empresa?.id || !certificadoConfig.certificado_digital_path) return null;

    // Si hay certificado legacy pero no en el nuevo sistema
    const hasLegacyData = certificadoConfig.certificado_digital_path && 
                         certificadoConfig.certificado_digital_password;
    const hasNewSystemData = certificados.length > 0;

    if (hasLegacyData && !hasNewSystemData) {
      return {
        needsMigration: true,
        legacyData: {
          path: certificadoConfig.certificado_digital_path,
          password: certificadoConfig.certificado_digital_password,
          active: certificadoConfig.certificado_digital_activo
        },
        migrationReady: true
      };
    }

    return {
      needsMigration: false,
      migrationReady: false
    };
  }, [empresa?.id, certificadoConfig, certificados]);

  // Ejecutar migración del sistema legacy al nuevo
  const executeMigration = useCallback(async (migrationData: {
    path: string;
    password: string;
    active: boolean;
  }) => {
    if (!empresa?.id) {
      throw new Error('ID de empresa requerido para migración');
    }

    setSyncStatus('syncing');
    setSyncError(null);

    try {
      // TODO: Implementar la llamada real a la API de migración
      console.log('Migrando certificado legacy:', migrationData);
      
      // Simular proceso de migración
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Simular resultado de migración exitosa
      const migratedCertificado: CertificadoInfo = {
        id: `cert_${Date.now()}`,
        empresa_id: empresa.id,
        filename: migrationData.path,
        subject_dn: `CN=${empresa.ruc}, O=${empresa.razon_social}`,
        issuer_dn: 'CN=SUNAT CA',
        serial_number: '123456789',
        valid_from: new Date().toISOString(),
        valid_to: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        ruc_certificado: empresa.ruc,
        algoritmo: 'RSA',
        key_usage: 'Digital Signature',
        tamaño_clave: 2048,
        activo: migrationData.active,
        fecha_subida: new Date().toISOString(),
        vigente: true,
        dias_para_vencer: 365,
        requiere_renovacion: false,
        validado_sunat: true,
        errores_validacion: []
      };

      // Actualizar configuración después de migración exitosa
      const newConfig: CertificadoConfig = {
        ...certificadoConfig,
        certificado_digital_activo: false, // Desactivar legacy
        certificado_activo_filename: migratedCertificado.filename,
        certificados_disponibles: [migratedCertificado]
      };

      onConfigChange(newConfig);
      setLastSyncTime(new Date());
      setSyncStatus('synced');

      return migratedCertificado;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error en migración';
      setSyncError(errorMessage);
      setSyncStatus('error');
      throw error;
    }
  }, [empresa, certificadoConfig, onConfigChange]);

  // Forzar sincronización manual
  const forceSync = useCallback(async () => {
    setSyncStatus('syncing');
    setSyncError(null);
    
    try {
      // Refrescar datos del nuevo sistema
      if (empresa?.id) {
        await certificadosActions.refreshCertificados();
      }
      
      // Ejecutar sincronización
      syncNewToLegacy();
      
      setLastSyncTime(new Date());
      setSyncStatus('synced');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error en sincronización';
      setSyncError(errorMessage);
      setSyncStatus('error');
    }
  }, [empresa?.id, certificadosActions, syncNewToLegacy]);

  // Obtener información consolidada del certificado activo
  const getActiveUnifiedCertificado = useCallback(() => {
    // Priorizar el nuevo sistema si está disponible
    if (certificado_activo && certificado_activo.vigente) {
      return {
        source: 'new_system' as const,
        data: certificado_activo,
        isActive: certificado_activo.activo,
        isValid: certificado_activo.vigente
      };
    }

    // Fallback al sistema legacy
    if (certificadoConfig.certificado_digital_activo && certificadoConfig.certificado_digital_path) {
      return {
        source: 'legacy_system' as const,
        data: {
          filename: certificadoConfig.certificado_digital_path,
          path: certificadoConfig.certificado_digital_path,
          password_set: !!certificadoConfig.certificado_digital_password
        },
        isActive: certificadoConfig.certificado_digital_activo,
        isValid: true // Asumimos que es válido si está activo
      };
    }

    return null;
  }, [certificado_activo, certificadoConfig]);

  // Auto-sincronización cuando cambia el sistema nuevo
  useEffect(() => {
    if (autoSync && !certificadosLoading) {
      syncNewToLegacy();
    }
  }, [autoSync, certificadosLoading, syncNewToLegacy]);

  // Detectar estado de migración al inicializar
  useEffect(() => {
    const checkMigrationStatus = async () => {
      const migrationStatus = await prepareLegacyMigration();
      if (migrationStatus?.needsMigration) {
        console.log('Migración disponible:', migrationStatus);
      }
    };

    checkMigrationStatus();
  }, [prepareLegacyMigration]);

  return {
    // Estado del bridge
    syncStatus,
    lastSyncTime,
    syncError,
    isLoading: certificadosLoading || syncStatus === 'syncing',

    // Funciones de migración
    prepareLegacyMigration,
    executeMigration,

    // Funciones de sincronización
    forceSync,
    syncNewToLegacy,

    // Datos consolidados
    getActiveUnifiedCertificado,
    hasLegacyData: !!(certificadoConfig.certificado_digital_path || certificadoConfig.certificado_digital_password),
    hasNewSystemData: certificados.length > 0,

    // Acceso a datos del sistema nuevo
    newSystemCertificados: certificados,
    newSystemActiveCertificado: certificado_activo,
    newSystemActions: certificadosActions
  };
}
