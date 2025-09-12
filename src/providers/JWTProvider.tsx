/**
 * Provider para manejo automático de refresh de JWT
 * Se debe usar a nivel de aplicación para monitoreo global
 */
'use client'

import { createContext, useContext, ReactNode, useEffect } from 'react'
import { useJWTRefresh } from '@/hooks/useJWTRefresh'
import { useAuth } from '@clerk/nextjs'
import { toast } from 'react-hot-toast'

interface JWTProviderContextType {
  needsRefresh: boolean
  isRefreshing: boolean
  lastRefresh: Date | null
  refreshToken: () => Promise<boolean>
  checkTokenStatus: () => Promise<any>
}

const JWTProviderContext = createContext<JWTProviderContextType | null>(null)

interface JWTProviderProps {
  children: ReactNode
  /**
   * Mostrar notificaciones de estado del token
   * Por defecto: false
   */
  showToasts?: boolean
  
  /**
   * Intervalo de verificación en milisegundos
   * Por defecto: 30 segundos
   */
  checkInterval?: number
}

export function JWTProvider({ 
  children, 
  showToasts = false, 
  checkInterval = 30000 
}: JWTProviderProps) {
  const { isSignedIn, signOut } = useAuth()
  
  const {
    tokenStatus,
    isRefreshing,
    lastRefresh,
    refreshToken,
    checkTokenStatus,
    needsRefresh
  } = useJWTRefresh({
    checkInterval,
    autoRefresh: true,
    onRefreshRequired: () => {
      if (showToasts) {
        toast('🔑 Renovando sesión...', {
          duration: 2000,
          style: {
            background: '#f59e0b',
            color: 'white'
          }
        })
      }
    },
    onRefreshComplete: () => {
      if (showToasts) {
        toast.success('✅ Sesión renovada', {
          duration: 2000
        })
      }
    },
    onAuthError: (error) => {
      if (showToasts) {
        toast.error(`🔐 Error de autenticación: ${error}`, {
          duration: 4000
        })
      }
      
      // En caso de error crítico, redirigir al login
      if (error.includes('expirado')) {
        setTimeout(() => {
          signOut()
        }, 2000)
      }
    }
  })

  // Monitorear cambios en el estado de autenticación
  useEffect(() => {
    if (isSignedIn && showToasts) {
      console.log('🔐 JWT Provider: Usuario autenticado, iniciando monitoreo')
    } else if (!isSignedIn && showToasts) {
      console.log('🔐 JWT Provider: Usuario no autenticado, deteniendo monitoreo')
    }
  }, [isSignedIn, showToasts])

  const contextValue: JWTProviderContextType = {
    needsRefresh,
    isRefreshing,
    lastRefresh,
    refreshToken,
    checkTokenStatus
  }

  return (
    <JWTProviderContext.Provider value={contextValue}>
      {children}
    </JWTProviderContext.Provider>
  )
}

/**
 * Hook para usar el contexto de JWT
 */
export function useJWTContext() {
  const context = useContext(JWTProviderContext)
  
  if (!context) {
    throw new Error('useJWTContext debe usarse dentro de JWTProvider')
  }
  
  return context
}
