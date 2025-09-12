/**
 * Página de prueba para verificar el sistema de sincronización de tiempo
 */
'use client';

import { useState, useEffect } from 'react';
import { useDateTime } from '@/hooks/useDateTime';
import { DateTimeManager } from '@/utils/datetime';

interface SyncData {
  success?: boolean;
  timestamp?: string;
  formatted?: string;
  timezone?: string;
  error?: string;
  details?: string;
  responseHeaders?: Record<string, string | null>;
}

export default function TimeSyncTestPage() {
  const { peruTime, formatForDisplay, formatForSunat } = useDateTime();
  const [syncData, setSyncData] = useState<SyncData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const testTimeSync = async () => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/time-sync', {
        method: 'GET',
        headers: {
          'X-Client-Time-UTC': new Date().toISOString(),
          'X-Client-Time-Peru': DateTimeManager.formatForSunat(),
        },
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      const data = await response.json();
      setSyncData(data);
      
      // Verificar headers de respuesta
      const headers = {
        'X-Server-Time-Peru': response.headers.get('X-Server-Time-Peru'),
        'X-Server-Time-UTC': response.headers.get('X-Server-Time-UTC'),
        'X-Timezone': response.headers.get('X-Timezone'),
        'X-Clock-Skew-Warning': response.headers.get('X-Clock-Skew-Warning'),
        'X-Clock-Skew-Ms': response.headers.get('X-Clock-Skew-Ms'),
      };
      
      setSyncData(prev => ({ ...prev, responseHeaders: headers }));
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Test automático al cargar
    testTimeSync();
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            🕐 Sistema de Sincronización de Tiempo
          </h1>
          
          {/* Información de tiempo local */}
          <div className="grid md:grid-cols-2 gap-6 mb-8">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h2 className="text-xl font-semibold text-blue-900 mb-3">
                ⏰ Tiempo Local (Cliente)
              </h2>
              <div className="space-y-2 text-sm">
                <p><strong>Hora Perú:</strong> {formatForDisplay(peruTime)}</p>
                <p><strong>Formato SUNAT:</strong> {formatForSunat(peruTime)}</p>
                <p><strong>UTC:</strong> {new Date().toISOString()}</p>
                <p><strong>Timestamp:</strong> {Date.now()}</p>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <h2 className="text-xl font-semibold text-green-900 mb-3">
                📡 Servidor
              </h2>
              {syncData?.success ? (
                <div className="space-y-2 text-sm">
                  <p><strong>Hora Perú:</strong> {syncData.formatted}</p>
                  <p><strong>UTC:</strong> {syncData.timestamp}</p>
                  <p><strong>Timezone:</strong> {syncData.timezone}</p>
                </div>
              ) : syncData?.error ? (
                <div className="text-red-600">
                  <p><strong>Error:</strong> {syncData.error}</p>
                  {syncData.details && <p><strong>Detalles:</strong> {syncData.details}</p>}
                </div>
              ) : (
                <p className="text-gray-500">Cargando datos del servidor...</p>
              )}
            </div>
          </div>

          {/* Botón de prueba */}
          <div className="mb-6">
            <button
              onClick={testTimeSync}
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-6 py-2 rounded-lg font-medium"
            >
              {loading ? 'Probando...' : '🔄 Probar Sincronización'}
            </button>
          </div>

          {/* Resultados */}
          {error && (
            <div className="bg-red-50 border border-red-200 p-4 rounded-lg mb-6">
              <h3 className="text-red-800 font-semibold mb-2">❌ Error</h3>
              <p className="text-red-700">{error}</p>
            </div>
          )}

          {syncData && (
            <div className="space-y-6">
              {/* Estado de sincronización */}
              <div className={`p-4 rounded-lg border ${
                syncData.success 
                  ? 'bg-green-50 border-green-200' 
                  : 'bg-red-50 border-red-200'
              }`}>
                <h3 className={`font-semibold mb-2 ${
                  syncData.success ? 'text-green-800' : 'text-red-800'
                }`}>
                  {syncData.success ? '✅ Sincronización Exitosa' : '❌ Error de Sincronización'}
                </h3>
                <div className="text-sm space-y-1">
                  <p><strong>Timestamp:</strong> {syncData.timestamp}</p>
                  <p><strong>Timezone:</strong> {syncData.timezone}</p>
                  {syncData.formatted && <p><strong>Formato legible:</strong> {syncData.formatted}</p>}
                </div>
              </div>

              {/* Headers de respuesta */}
              {syncData.responseHeaders && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  <h3 className="text-gray-800 font-semibold mb-2">📋 Headers de Respuesta</h3>
                  <div className="text-sm space-y-1 font-mono">
                    {Object.entries(syncData.responseHeaders).map(([key, value]) => (
                      <p key={key}>
                        <strong>{key}:</strong> {value || 'null'}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              {/* Datos completos */}
              <details className="bg-gray-50 p-4 rounded-lg">
                <summary className="cursor-pointer text-gray-800 font-semibold">
                  🔍 Ver Datos Completos (JSON)
                </summary>
                <pre className="mt-2 text-xs bg-gray-800 text-green-400 p-3 rounded overflow-auto">
                  {JSON.stringify(syncData, null, 2)}
                </pre>
              </details>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
