/**
 * Hook para manejo automático de refresh de tokens JWT
 * Monitorea el estado del token y realiza refresh automático cuando es necesario
 */
import { useAuth } from '@clerk/nextjs'
import { useEffect, useCallback, useRef, useState } from 'react'
import { useApi } from './useApi'

interface TokenStatus {
  authenticated: boolean
  user_id: string
  needs_refresh: boolean
  refresh_threshold_seconds: number
}

interface AuthConfig {
  jwt_expiration_time: number
  jwt_refresh_time: number
  jwt_max_refresh_time: number
  clerk_publishable_key: string
  environment: string
}

interface UseJWTRefreshOptions {
  /**
   * Intervalo en milisegundos para verificar el estado del token
   * Por defecto: 30 segundos
   */
  checkInterval?: number
  
  /**
   * Si debe realizar refresh automático
   * Por defecto: true
   */
  autoRefresh?: boolean
  
  /**
   * Callback cuando se detecta que el token necesita refresh
   */
  onRefreshRequired?: () => void
  
  /**
   * Callback cuando el refresh se completa exitosamente
   */
  onRefreshComplete?: () => void
  
  /**
   * Callback cuando hay un error de autenticación
   */
  onAuthError?: (error: string) => void
}

export function useJWTRefresh(options: UseJWTRefreshOptions = {}) {
  const {
    checkInterval = 30000, // 30 segundos
    autoRefresh = true,
    onRefreshRequired,
    onRefreshComplete,
    onAuthError
  } = options

  const { getToken, isSignedIn, signOut } = useAuth()
  const { get } = useApi()
  
  const [tokenStatus, setTokenStatus] = useState<TokenStatus | null>(null)
  const [authConfig, setAuthConfig] = useState<AuthConfig | null>(null)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [lastRefresh, setLastRefresh] = useState<Date | null>(null)
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const refreshInProgressRef = useRef(false)

  /**
   * Obtiene la configuración de autenticación del backend
   */
  const fetchAuthConfig = useCallback(async () => {
    try {
      const response = await get<AuthConfig>('/auth/config')
      if (response.data) {
        setAuthConfig(response.data)
        return response.data
      }
      return null
    } catch (error) {
      console.warn('⚠️ No se pudo obtener configuración de auth:', error)
      return null
    }
  }, [get])

  /**
   * Verifica el estado actual del token JWT
   */
  const checkTokenStatus = useCallback(async (): Promise<TokenStatus | null> => {
    if (!isSignedIn) {
      return null
    }

    try {
      const response = await get<TokenStatus>('/auth/token/status')
      
      if (response.data) {
        setTokenStatus(response.data)
        
        if (response.data.needs_refresh) {
    
          console.log('🟡 Token necesita refresh')
          onRefreshRequired?.()
        }
        
        return response.data
      }
      
      return null
    } catch (error: unknown) {
      const errorAny = error as { status?: number };
      if (errorAny?.status === 401) {
        console.error('🔴 Token inválido o expirado')
        onAuthError?.('Token expirado')
        // Redirigir al login automáticamente
        signOut()
      } else {
        console.warn('⚠️ Error verificando estado del token:', error)
      }
      return null
    }
  }, [isSignedIn, get, onRefreshRequired, onAuthError, signOut])

  /**
   * Realiza refresh del token usando Clerk
   */
  const refreshToken = useCallback(async (): Promise<boolean> => {
    if (refreshInProgressRef.current) {

      console.log('🔄 Refresh ya en progreso, esperando...')
      return false
    }

    try {
      setIsRefreshing(true)
      refreshInProgressRef.current = true
      

      console.log('🔄 Iniciando refresh de token...')
      
      // Clerk maneja el refresh automáticamente al llamar getToken()
      // con template y force=true
      const newToken = await getToken({ template: 'default' })
      
      if (newToken) {
        setLastRefresh(new Date())
        onRefreshComplete?.()
  
        console.log('✅ Token refrescado exitosamente')
        
        // Verificar el nuevo estado del token
        await checkTokenStatus()
        
        return true
      } else {
        throw new Error('No se pudo obtener nuevo token')
      }
      
    } catch (error) {
      console.error('❌ Error durante refresh de token:', error)
      onAuthError?.('Error refrescando token')
      return false
    } finally {
      setIsRefreshing(false)
      refreshInProgressRef.current = false
    }
  }, [getToken, onRefreshComplete, onAuthError, checkTokenStatus])

  /**
   * Inicia el monitoreo automático del token
   */
  const startMonitoring = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
    }

    // Verificar inmediatamente
    checkTokenStatus()

    // Configurar verificación periódica
    intervalRef.current = setInterval(async () => {
      const status = await checkTokenStatus()
      
      if (status?.needs_refresh && autoRefresh && !refreshInProgressRef.current) {
        await refreshToken()
      }
    }, checkInterval)


    console.log(`🔄 Monitoreo de JWT iniciado (cada ${checkInterval / 1000}s)`)
  }, [checkTokenStatus, refreshToken, autoRefresh, checkInterval])

  /**
   * Detiene el monitoreo automático
   */
  const stopMonitoring = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null

      console.log('⏹️ Monitoreo de JWT detenido')
    }
  }, [])

  /**
   * Verifica manualmente si el token es válido
   */
  const validateToken = useCallback(async (token?: string): Promise<boolean> => {
    try {
      const currentToken = token || await getToken()
      if (!currentToken) {
        return false
      }

      const response = await fetch('/auth/token/validate', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${currentToken}`,
          'Content-Type': 'application/json'
        }
      })

      const result = await response.json()
      return result.valid === true
      
    } catch (error) {
      console.error('Error validando token:', error)
      return false
    }
  }, [getToken])

  // Inicializar configuración y monitoreo
  useEffect(() => {
    fetchAuthConfig()
  }, [fetchAuthConfig])

  // Iniciar/detener monitoreo basado en estado de autenticación
  useEffect(() => {
    if (isSignedIn) {
      startMonitoring()
    } else {
      stopMonitoring()
      setTokenStatus(null)
    }

    return () => {
      stopMonitoring()
    }
  }, [isSignedIn, startMonitoring, stopMonitoring])

  return {
    // Estado
    tokenStatus,
    authConfig,
    isRefreshing,
    lastRefresh,
    
    // Acciones
    refreshToken,
    checkTokenStatus,
    validateToken,
    startMonitoring,
    stopMonitoring,
    
    // Estado calculado
    needsRefresh: tokenStatus?.needs_refresh || false,
    isAuthenticated: tokenStatus?.authenticated || false
  }
}
