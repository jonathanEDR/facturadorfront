'use client';

import React, { useState } from 'react';
import { Button, Card, Badge, Alert } from '@/components/ui';
import { RefreshCw, XCircle, AlertTriangle, TrendingUp } from 'lucide-react';

interface ResumenAuditoria {
  total_consultadas: number;
  exitosas: number;
  errores: number;
  aceptadas: number;
  rechazadas: number;
  en_proceso: number;
  detalles: Array<{
    success: boolean;
    factura_id: string;
    estado_sunat?: string;
    mensaje?: string;
    error?: string;
  }>;
}

const AuditoriaMasiva: React.FC = () => {
  const [ejecutando, setEjecutando] = useState(false);
  const [ultimaAuditoria, setUltimaAuditoria] = useState<ResumenAuditoria | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [limite, setLimite] = useState(50);

  const ejecutarAuditoriaMasiva = async () => {
    setEjecutando(true);
    setError(null);

    try {
      const response = await fetch('/api/consultas/estado-sunat/masivo', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ limite }),
      });

      if (!response.ok) {
        throw new Error(`Error HTTP: ${response.status}`);
      }

      const resultado: ResumenAuditoria = await response.json();
      setUltimaAuditoria(resultado);

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMsg);
      console.error('Error en auditoría masiva:', err);
    } finally {
      setEjecutando(false);
    }
  };

  const getPortentajeExito = () => {
    if (!ultimaAuditoria || ultimaAuditoria.total_consultadas === 0) return 0;
    return Math.round((ultimaAuditoria.exitosas / ultimaAuditoria.total_consultadas) * 100);
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold text-gray-900">
            Auditoría Masiva SUNAT
          </h2>
          <div className="flex items-center space-x-2">
            <input
              type="number"
              value={limite}
              onChange={(e) => setLimite(Math.min(100, Math.max(1, parseInt(e.target.value) || 50)))}
              className="w-20 px-2 py-1 border rounded text-sm"
              min="1"
              max="100"
              disabled={ejecutando}
            />
            <Button
              onClick={ejecutarAuditoriaMasiva}
              disabled={ejecutando}
              size="sm"
            >
              {ejecutando ? (
                <RefreshCw className="w-4 h-4 animate-spin mr-2" />
              ) : (
                <TrendingUp className="w-4 h-4 mr-2" />
              )}
              {ejecutando ? 'Auditando...' : 'Iniciar Auditoría'}
            </Button>
          </div>
        </div>

        <p className="text-sm text-gray-600 mb-4">
          Consulta el estado real de las facturas en SUNAT para identificar documentos aceptados, rechazados o pendientes.
        </p>

        {error && (
          <Alert variant="destructive" className="mb-4">
            <XCircle className="h-4 w-4" />
            <div>
              <p className="font-medium">Error en auditoría</p>
              <p className="text-sm">{error}</p>
            </div>
          </Alert>
        )}

        {ultimaAuditoria && (
          <div className="space-y-4">
            {/* Resumen de métricas */}
            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-blue-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-blue-600">
                  {ultimaAuditoria.total_consultadas}
                </div>
                <div className="text-xs text-blue-600">Total</div>
              </div>
              
              <div className="bg-green-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-green-600">
                  {ultimaAuditoria.aceptadas}
                </div>
                <div className="text-xs text-green-600">Aceptadas</div>
              </div>
              
              <div className="bg-red-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-red-600">
                  {ultimaAuditoria.rechazadas}
                </div>
                <div className="text-xs text-red-600">Rechazadas</div>
              </div>
              
              <div className="bg-yellow-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-yellow-600">
                  {ultimaAuditoria.en_proceso}
                </div>
                <div className="text-xs text-yellow-600">En Proceso</div>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg text-center">
                <div className="text-2xl font-bold text-gray-600">
                  {getPortentajeExito()}%
                </div>
                <div className="text-xs text-gray-600">Éxito</div>
              </div>
            </div>

            {/* Detalles de facturas con problemas */}
            {ultimaAuditoria.detalles.some(d => !d.success || d.estado_sunat === '2') && (
              <div className="bg-white border rounded-lg">
                <div className="p-4 border-b">
                  <h3 className="font-medium text-gray-900">
                    Facturas que requieren atención
                  </h3>
                </div>
                <div className="max-h-60 overflow-y-auto">
                  {ultimaAuditoria.detalles
                    .filter(detalle => !detalle.success || detalle.estado_sunat === '2')
                    .map((detalle, index) => (
                      <div key={index} className="p-3 border-b last:border-b-0">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            {detalle.success ? (
                              detalle.estado_sunat === '2' ? (
                                <XCircle className="w-4 h-4 text-red-600" />
                              ) : (
                                <AlertTriangle className="w-4 h-4 text-yellow-600" />
                              )
                            ) : (
                              <XCircle className="w-4 h-4 text-red-600" />
                            )}
                            <span className="text-sm font-medium">
                              Factura: {detalle.factura_id}
                            </span>
                          </div>
                          <Badge 
                            className={
                              detalle.success && detalle.estado_sunat === '2'
                                ? 'bg-red-100 text-red-800'
                                : 'bg-yellow-100 text-yellow-800'
                            }
                          >
                            {detalle.success 
                              ? (detalle.estado_sunat === '2' ? 'Rechazada' : 'Con problemas')
                              : 'Error consulta'
                            }
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-600 mt-1">
                          {detalle.mensaje || detalle.error || 'Sin detalles disponibles'}
                        </p>
                      </div>
                    ))}
                </div>
              </div>
            )}

            <div className="text-xs text-gray-500">
              <p>Última auditoría: {new Date().toLocaleString()}</p>
              <p>Facturas consultadas: {ultimaAuditoria.total_consultadas} de {limite} solicitadas</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default AuditoriaMasiva;
