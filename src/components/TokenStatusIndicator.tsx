/**
 * Componente para mostrar el estado del token JWT
 * Útil para desarrollo y monitoreo
 */
'use client'

import { useJWTRefresh } from '@/hooks/useJWTRefresh'
import { useAuth } from '@clerk/nextjs'
import { useState, useEffect } from 'react'

interface TokenStatusIndicatorProps {
  /**
   * Mostrar información detallada
   * Por defecto: false
   */
  detailed?: boolean
  
  /**
   * Posición del indicador
   * Por defecto: 'bottom-right'
   */
  position?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right'
  
  /**
   * Solo mostrar en modo desarrollo
   * Por defecto: true
   */
  developmentOnly?: boolean
}

export function TokenStatusIndicator({ 
  detailed = false, 
  position = 'bottom-right',
  developmentOnly = true 
}: TokenStatusIndicatorProps) {
  const { isSignedIn } = useAuth()
  const [showDetails, setShowDetails] = useState(false)
  
  const {
    tokenStatus,
    isRefreshing,
    lastRefresh,
    needsRefresh,
    refreshToken,
    checkTokenStatus
  } = useJWTRefresh()

  // Solo mostrar en desarrollo si developmentOnly es true
  useEffect(() => {
    if (developmentOnly && process.env.NODE_ENV === 'production') {
      return
    }
  }, [developmentOnly])

  if (developmentOnly && process.env.NODE_ENV === 'production') {
    return null
  }

  if (!isSignedIn) {
    return null
  }

  const getPositionClasses = () => {
    const baseClasses = 'fixed z-50 p-2 rounded-lg shadow-lg text-xs font-mono'
    
    switch (position) {
      case 'top-left':
        return `${baseClasses} top-4 left-4`
      case 'top-right':
        return `${baseClasses} top-4 right-4`
      case 'bottom-left':
        return `${baseClasses} bottom-4 left-4`
      case 'bottom-right':
      default:
        return `${baseClasses} bottom-4 right-4`
    }
  }

  const getStatusColor = () => {
    if (isRefreshing) return 'bg-yellow-100 border-yellow-400 text-yellow-800'
    if (needsRefresh) return 'bg-orange-100 border-orange-400 text-orange-800'
    if (tokenStatus?.authenticated) return 'bg-green-100 border-green-400 text-green-800'
    return 'bg-red-100 border-red-400 text-red-800'
  }

  const getStatusIcon = () => {
    if (isRefreshing) return '🔄'
    if (needsRefresh) return '🟡'
    if (tokenStatus?.authenticated) return '🟢'
    return '🔴'
  }

  const getStatusText = () => {
    if (isRefreshing) return 'Refrescando...'
    if (needsRefresh) return 'Necesita refresh'
    if (tokenStatus?.authenticated) return 'Autenticado'
    return 'No autenticado'
  }

  return (
    <div className={`${getPositionClasses()} ${getStatusColor()} border-2 cursor-pointer`}
         onClick={() => setShowDetails(!showDetails)}>
      
      {/* Indicador básico */}
      <div className="flex items-center space-x-1">
        <span>{getStatusIcon()}</span>
        <span>{getStatusText()}</span>
        {detailed && (
          <button
            onClick={(e) => {
              e.stopPropagation()
              setShowDetails(!showDetails)
            }}
            className="ml-1 hover:opacity-70"
          >
            {showDetails ? '▼' : '▶'}
          </button>
        )}
      </div>

      {/* Detalles expandidos */}
      {detailed && showDetails && (
        <div className="mt-2 pt-2 border-t border-gray-300 space-y-1">
          <div>
            <strong>Usuario:</strong> {tokenStatus?.user_id || 'N/A'}
          </div>
          {tokenStatus?.refresh_threshold_seconds && (
            <div>
              <strong>Refresh en:</strong> {tokenStatus.refresh_threshold_seconds}s
            </div>
          )}
          {lastRefresh && (
            <div>
              <strong>Último refresh:</strong> {lastRefresh.toLocaleTimeString()}
            </div>
          )}
          
          {/* Botones de acción */}
          <div className="flex space-x-1 mt-2">
            <button
              onClick={(e) => {
                e.stopPropagation()
                checkTokenStatus()
              }}
              className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
            >
              Verificar
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation()
                refreshToken()
              }}
              className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
              disabled={isRefreshing}
            >
              {isRefreshing ? 'Refrescando...' : 'Refresh'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

/**
 * Hook para obtener información del estado del token
 * Útil para mostrar estado en otros componentes
 */
export function useTokenStatusInfo() {
  const { tokenStatus, needsRefresh, isRefreshing } = useJWTRefresh()
  
  return {
    isAuthenticated: tokenStatus?.authenticated || false,
    needsRefresh,
    isRefreshing,
    userId: tokenStatus?.user_id,
    refreshThreshold: tokenStatus?.refresh_threshold_seconds,
    statusText: isRefreshing ? 'Refrescando...' : 
                needsRefresh ? 'Necesita refresh' :
                tokenStatus?.authenticated ? 'Autenticado' : 'No autenticado',
    statusColor: isRefreshing ? 'yellow' :
                 needsRefresh ? 'orange' :
                 tokenStatus?.authenticated ? 'green' : 'red'
  }
}
