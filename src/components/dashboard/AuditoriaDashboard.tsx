'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button, Badge, Alert, Card, CardHeader, CardTitle, CardContent } from '@/components/ui';
import { RefreshCw, CheckCircle, XCircle, Clock, AlertTriangle, TrendingUp, FileText, Database } from 'lucide-react';
import { useApi } from '@/hooks/useApi';

interface DetalleAuditoria {
  factura_id?: string;
  success: boolean;
  mensaje?: string;
  error?: string;
  estado_sunat?: string;
  cdr_status?: string;
  cdr_recibido?: boolean;
}

interface FacturaReal {
  cliente?: {
    numero_documento?: string;
    razon_social?: string;
  };
  serie?: string;
  numero?: number;
  moneda?: string;
  total?: string;
  fecha_emision?: string;
  estado_sunat?: {
    cdr_recibido?: boolean;
    enviado?: boolean;
  };
  rutas_archivos?: {
    cdr?: string;
  };
}

interface EstadisticasAuditoria {
  total_consultadas: number;
  exitosas: number;
  errores: number;
  aceptadas: number;
  rechazadas: number;
  en_proceso: number;
  detalles: DetalleAuditoria[];
}

const AuditoriaDashboard: React.FC = () => {
  const [consultando, setConsultando] = useState(false);
  const [estadisticas, setEstadisticas] = useState<EstadisticasAuditoria | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [limite, setLimite] = useState(50);
  const [facturasReales, setFacturasReales] = useState<FacturaReal[]>([]);
  const { apiCall } = useApi();

  const ejecutarAuditoriaMasiva = useCallback(async () => {
    setConsultando(true);
    setError(null);

    try {
      const response = await apiCall<EstadisticasAuditoria>(
        '/consultas/estado-sunat-masivo',
        {
          method: 'POST',
          body: JSON.stringify({ limite })
        }
      );
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      setEstadisticas(response.data);
      
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Error desconocido';
      setError(errorMsg);
      // Error manejado en la UI
    } finally {
      setConsultando(false);
    }
  }, [limite, apiCall]);

  const getEstadoColor = (tipo: string): string => {
    switch (tipo) {
      case 'aceptadas':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'rechazadas':
        return 'text-red-600 bg-red-50 border-red-200';
      case 'en_proceso':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'errores':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getIconForEstado = (tipo: string) => {
    switch (tipo) {
      case 'aceptadas':
        return <CheckCircle className="w-6 h-6" />;
      case 'rechazadas':
        return <XCircle className="w-6 h-6" />;
      case 'en_proceso':
        return <Clock className="w-6 h-6" />;
      case 'errores':
        return <AlertTriangle className="w-6 h-6" />;
      default:
        return <FileText className="w-6 h-6" />;
    }
  };

  // Cargar facturas reales desde MongoDB
  const cargarFacturasReales = useCallback(async () => {
    try {
      const response = await apiCall<{ facturas: FacturaReal[] }>(
        `/consultas/facturas-enviadas?limite=${limite}`
      );
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      setFacturasReales(response.data?.facturas || []);
    } catch (error) {
      // Error silencioso en producción - se maneja en la UI
    }
  }, [limite, apiCall]);

  // Ejecutar auditoría inicial automáticamente
  useEffect(() => {
    // Delay para asegurar que Clerk esté completamente cargado
    const timer = setTimeout(() => {
      ejecutarAuditoriaMasiva();
      cargarFacturasReales();
    }, 1000); // Esperar 1 segundo

    return () => clearTimeout(timer);
  }, [limite, ejecutarAuditoriaMasiva, cargarFacturasReales]);

  return (
    <div className="space-y-6 p-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard de Auditoría SUNAT</h1>
          <p className="text-gray-600">Monitoreo del estado de facturas enviadas a SUNAT</p>
        </div>
        
        <div className="flex items-center space-x-4">
          <div className="flex items-center space-x-2">
            <label htmlFor="limite" className="text-sm font-medium text-gray-700">
              Límite:
            </label>
            <select
              id="limite"
              value={limite}
              onChange={(e) => setLimite(Number(e.target.value))}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
          
          <Button
            onClick={cargarFacturasReales}
            variant="outline"
            className="mr-2"
          >
            <RefreshCw className="w-4 h-4 mr-2" />
            Actualizar Facturas
          </Button>
          
          <Button
            onClick={ejecutarAuditoriaMasiva}
            disabled={consultando}
            className="bg-blue-600 hover:bg-blue-700"
          >
            {consultando ? (
              <RefreshCw className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <TrendingUp className="w-4 h-4 mr-2" />
            )}
            Ejecutar Auditoría
          </Button>
        </div>
      </div>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <div>
            <p className="font-medium">Error en la auditoría</p>
            <p className="text-sm">{error}</p>
          </div>
        </Alert>
      )}

      {/* Estadísticas Cards */}
      {estadisticas && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className={`border-l-4 ${getEstadoColor('total')}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Consultadas</p>
                  <p className="text-2xl font-bold text-gray-900">{estadisticas.total_consultadas}</p>
                </div>
                <Database className="w-8 h-8 text-gray-600" />
              </div>
            </CardContent>
          </Card>

          <Card className={`border-l-4 border-green-500 ${getEstadoColor('aceptadas')}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-green-700">Aceptadas</p>
                  <p className="text-2xl font-bold text-green-800">{estadisticas.aceptadas}</p>
                </div>
                {getIconForEstado('aceptadas')}
              </div>
            </CardContent>
          </Card>

          <Card className={`border-l-4 border-red-500 ${getEstadoColor('rechazadas')}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-red-700">Rechazadas</p>
                  <p className="text-2xl font-bold text-red-800">{estadisticas.rechazadas}</p>
                </div>
                {getIconForEstado('rechazadas')}
              </div>
            </CardContent>
          </Card>

          <Card className={`border-l-4 border-yellow-500 ${getEstadoColor('en_proceso')}`}>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-yellow-700">En Proceso</p>
                  <p className="text-2xl font-bold text-yellow-800">{estadisticas.en_proceso}</p>
                </div>
                {getIconForEstado('en_proceso')}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Detalles de Facturas */}
      {estadisticas && estadisticas.detalles && estadisticas.detalles.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Detalles de Facturas Procesadas</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Factura ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Mensaje
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      CDR
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {estadisticas.detalles.map((detalle, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {detalle.factura_id || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={
                          detalle.success 
                            ? 'bg-green-100 text-green-800 border-green-200'
                            : 'bg-red-100 text-red-800 border-red-200'
                        }>
                          {detalle.success ? 'Éxito' : 'Error'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-900">
                        {detalle.mensaje || detalle.error || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {detalle.cdr_recibido ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-gray-400" />
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Sección de Facturas Reales */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            Facturas en el Sistema ({facturasReales.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {facturasReales.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Documento Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado SUNAT
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha Emisión
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      CDR
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {facturasReales.map((factura, index) => (
                    <tr key={index} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {factura.cliente?.numero_documento || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {factura.serie || 'N/A'}-{String(factura.numero || 0).padStart(8, '0')}
                        </div>
                        <div className="text-xs text-gray-400">
                          Total: {factura.moneda || 'PEN'} {factura.total || '0.00'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {factura.cliente?.razon_social || 'N/A'}  
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <Badge className={
                          factura.estado_sunat?.cdr_recibido 
                            ? 'bg-green-100 text-green-800 border-green-200'
                            : factura.estado_sunat?.enviado
                            ? 'bg-yellow-100 text-yellow-800 border-yellow-200'
                            : 'bg-red-100 text-red-800 border-red-200'
                        }>
                          {factura.estado_sunat?.cdr_recibido ? 'CDR RECIBIDO' : 
                           factura.estado_sunat?.enviado ? 'ENVIADO' : 'NO ENVIADO'}
                        </Badge>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {factura.fecha_emision || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {factura.rutas_archivos?.cdr ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <XCircle className="w-4 h-4 text-gray-400" />
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <Button 
                          size="sm" 
                          variant="ghost"
                          onClick={() => {
                            // TODO: Implementar vista de detalles de factura
                          }}
                          className="text-blue-600 hover:text-blue-900"
                        >
                          Ver detalles
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="text-center py-8">
              <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay facturas en el sistema</h3>
              <p className="text-gray-600">
                No se encontraron facturas en la base de datos.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Mensaje cuando no hay datos de auditoría */}
      {estadisticas && estadisticas.total_consultadas === 0 && (
        <Card>
          <CardContent className="p-8 text-center">
            <Database className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No hay facturas para auditar</h3>
            <p className="text-gray-600">
              No se encontraron facturas enviadas sin CDR. Todas las facturas están actualizadas.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AuditoriaDashboard;
