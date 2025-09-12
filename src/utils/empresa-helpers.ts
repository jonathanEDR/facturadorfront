/**
 * Utilidades helper para manejo de empresas
 * Ayuda a prevenir problemas de datos incompletos entre EmpresaResponse y EmpresaDetailResponse
 */

import { EmpresaResponse, EmpresaDetailResponse } from '@/types/empresa'

/**
 * Verifica si una empresa tiene datos completos (EmpresaDetailResponse)
 * vs datos básicos (EmpresaResponse)
 */
export function hasFullEmpresaData(empresa: EmpresaResponse | EmpresaDetailResponse): empresa is EmpresaDetailResponse {
  // Verificar si tiene campos específicos de EmpresaDetailResponse
  return 'certificado_digital_path' in empresa && 
         'certificado_digital_password' in empresa &&
         'certificado_digital_activo' in empresa
}

/**
 * Verifica si una empresa tiene configuración de certificado
 */
export function hasCertificateConfig(empresa: EmpresaResponse | EmpresaDetailResponse): boolean {
  if (!hasFullEmpresaData(empresa)) {
    console.warn('⚠️ Verificando certificado en empresa sin datos completos. Considera cargar datos completos primero.')
    return false
  }
  
  return !!(empresa.certificado_digital_path && empresa.certificado_digital_password)
}

/**
 * Obtiene una descripción del estado de certificado de una empresa
 */
export function getCertificateStatus(empresa: EmpresaResponse | EmpresaDetailResponse): {
  status: 'configured' | 'partial' | 'none' | 'unknown'
  description: string
  needsFullData: boolean
} {
  if (!hasFullEmpresaData(empresa)) {
    return {
      status: 'unknown',
      description: 'Se requieren datos completos para verificar el certificado',
      needsFullData: true
    }
  }

  if (empresa.certificado_digital_path && empresa.certificado_digital_password && empresa.certificado_digital_activo) {
    return {
      status: 'configured',
      description: 'Certificado digital configurado y activo',
      needsFullData: false
    }
  }

  if (empresa.certificado_digital_path || empresa.certificado_digital_password) {
    return {
      status: 'partial',
      description: 'Certificado parcialmente configurado',
      needsFullData: false
    }
  }

  return {
    status: 'none',
    description: 'Sin certificado digital configurado',
    needsFullData: false
  }
}

/**
 * Helper que asegura que tenemos datos completos de empresa antes de operaciones críticas
 * @param empresa - Empresa con datos posiblemente incompletos  
 * @param loadFullData - Función para cargar datos completos
 * @returns Promesa que resuelve con datos completos o null si no se pueden obtener
 */
export async function ensureFullEmpresaData(
  empresa: EmpresaResponse | EmpresaDetailResponse,
  loadFullData: (id: string) => Promise<EmpresaDetailResponse | null>
): Promise<EmpresaDetailResponse | null> {
  
  // Si ya tenemos datos completos, retornar directamente
  if (hasFullEmpresaData(empresa)) {
    return empresa
  }

  // Si no, cargar datos completos
  console.log(`🔄 Cargando datos completos para empresa ${empresa.id}`)
  try {
    const fullData = await loadFullData(empresa.id)
    if (fullData && hasFullEmpresaData(fullData)) {
      return fullData
    } else {
      console.error('❌ No se pudieron cargar datos completos de empresa')
      return null
    }
  } catch (error) {
    console.error('❌ Error cargando datos completos:', error)
    return null
  }
}
