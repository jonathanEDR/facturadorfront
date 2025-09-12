'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button, Badge, Alert } from '@/components/ui';
import { RefreshCw, CheckCircle, XCircle, Clock, AlertTriangle, Download } from 'lucide-react';

interface EstadoSunatInfo {
  success: boolean;
  factura_id: string;
  estado_sunat?: string;
  cdr_recibido?: boolean;
  mensaje?: string;
  error?: string;
}

interface AuditoriaSunatProps {
  facturaId: string;
  estadoActual?: string;
  onEstadoActualizado?: (nuevoEstado: string) => void;
}

const AuditoriaSunat: React.FC<AuditoriaSunatProps> = ({
  facturaId,
  estadoActual,
  onEstadoActualizado
}) => {
  const [consultando, setConsultando] = useState(false);
  const [ultimaConsulta, setUltimaConsulta] = useState<EstadoSunatInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  const consultarEstado = useCallback(async () => {
    setConsultando(true);
    setError(null);

    try {
      // Usar el servicio actualizado
      const { consultasApi } = await import('@/services/consultas');
      const resultado: EstadoSunatInfo = await consultasApi.consultarEstadoSunat(facturaId);
      
      setUltimaConsulta(resultado);

      // Notificar actualización de estado si cambió
      if (resultado.success && resultado.estado_sunat && resultado.estado_sunat !== estadoActual) {
        onEstadoActualizado?.(resultado.estado_sunat);
      }

    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMsg);
      console.error('Error consultando estado SUNAT:', err);
    } finally {
      setConsultando(false);
    }
  }, [facturaId, onEstadoActualizado]);

  // const descargarCdr = async () => {
  //   try {
  //     const { consultasApi } = await import('@/services/consultas');
  //     const blob = await consultasApi.descargarCdr(facturaId);
  //     
  //     // Crear URL de descarga
  //     const url = window.URL.createObjectURL(blob);
  //     const link = document.createElement('a');
  //     link.href = url;
  //     link.download = `CDR-${facturaId}.xml`;
  //     document.body.appendChild(link);
  //     link.click();
  //     document.body.removeChild(link);
  //     window.URL.revokeObjectURL(url);
  //     
  //   } catch (err) {
  //     const errorMsg = err instanceof Error ? err.message : 'Error descargando CDR';
  //     setError(errorMsg);
  //     console.error('Error descargando CDR:', err);
  //   }
  // };

  const getEstadoIcon = (estado?: string) => {
    switch (estado) {
      case '0': // ACEPTADO
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case '2': // RECHAZADO
        return <XCircle className="w-4 h-4 text-red-600" />;
      case '1': // ACEPTADO_CON_OBSERVACIONES
        return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
      default:
        return <Clock className="w-4 h-4 text-gray-600" />;
    }
  };

  const getBadgeColor = (estado?: string) => {
    switch (estado) {
      case '0': // ACEPTADO
        return 'bg-green-100 text-green-800 border-green-200';
      case '2': // RECHAZADO
        return 'bg-red-100 text-red-800 border-red-200';
      case '1': // ACEPTADO_CON_OBSERVACIONES
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const descargarCDR = async () => {
    try {
      // Usar nuestro servicio actualizado
      const { consultasApi } = await import('@/services/consultas');
      const blob = await consultasApi.descargarCdr(facturaId);
      
      // Crear URL de descarga
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `CDR-${facturaId}.xml`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
      
    } catch (err) {
      console.error('Error descargando CDR:', err);
      setError('Error descargando CDR');
    }
  };

  // Auto-consulta inicial si no hay estado
  useEffect(() => {
    if (!estadoActual || estadoActual === 'PENDIENTE') {
      consultarEstado();
    }
  }, [facturaId, estadoActual, consultarEstado]);

  return (
    <div className="space-y-4 p-4 bg-gray-50 rounded-lg border">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900">
          Auditoría SUNAT
        </h3>
        <Button
          onClick={consultarEstado}
          disabled={consultando}
          size="sm"
          variant="outline"
        >
          {consultando ? (
            <RefreshCw className="w-4 h-4 animate-spin mr-2" />
          ) : (
            <RefreshCw className="w-4 h-4 mr-2" />
          )}
          Verificar Estado
        </Button>
      </div>

      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <div>
            <p className="font-medium">Error de consulta</p>
            <p className="text-sm">{error}</p>
          </div>
        </Alert>
      )}

      {ultimaConsulta && (
        <div className="space-y-3">
          {ultimaConsulta.success ? (
            <div className="bg-white p-4 rounded-md border space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  {getEstadoIcon(ultimaConsulta.estado_sunat)}
                  <span className="font-medium text-gray-900">Estado SUNAT:</span>
                </div>
                <Badge className={getBadgeColor(ultimaConsulta.estado_sunat)}>
                  {ultimaConsulta.mensaje || ultimaConsulta.estado_sunat || 'Desconocido'}
                </Badge>
              </div>

              {ultimaConsulta.cdr_recibido && (
                <div className="flex items-center justify-between pt-2 border-t">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm text-gray-700">CDR recibido de SUNAT</span>
                  </div>
                  <Button
                    onClick={descargarCDR}
                    size="sm"
                    variant="outline"
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Descargar CDR
                  </Button>
                </div>
              )}

              <div className="text-xs text-gray-500 pt-2 border-t">
                <p>Última verificación: {new Date().toLocaleString()}</p>
                <p>ID Factura: {ultimaConsulta.factura_id}</p>
              </div>
            </div>
          ) : (
            <Alert variant="destructive">
              <XCircle className="h-4 w-4" />
              <div>
                <p className="font-medium">No se pudo verificar el estado</p>
                <p className="text-sm">{ultimaConsulta.error || 'Error desconocido'}</p>
              </div>
            </Alert>
          )}
        </div>
      )}

      <div className="text-xs text-gray-500 space-y-1">
        <p><strong>Estados SUNAT:</strong></p>
        <div className="grid grid-cols-2 gap-2 text-xs">
          <div className="flex items-center space-x-1">
            <CheckCircle className="w-3 h-3 text-green-600" />
            <span>Aceptado (0)</span>
          </div>
          <div className="flex items-center space-x-1">
            <AlertTriangle className="w-3 h-3 text-yellow-600" />
            <span>Con observaciones (1)</span>
          </div>
          <div className="flex items-center space-x-1">
            <XCircle className="w-3 h-3 text-red-600" />
            <span>Rechazado (2)</span>
          </div>
          <div className="flex items-center space-x-1">
            <Clock className="w-3 h-3 text-gray-600" />
            <span>En proceso</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuditoriaSunat;
