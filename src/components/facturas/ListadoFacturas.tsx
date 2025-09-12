'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Button, Badge, Card, CardHeader, CardTitle, CardContent, Input } from '@/components/ui';
import { RefreshCw, Search, Download, Eye, Filter, CheckCircle, XCircle } from 'lucide-react';
import { useApi } from '@/hooks/useApi';

interface Factura {
  id: string;
  serie: string;
  numero: number;
  fecha_emision: string;
  cliente: {
    razon_social: string;
    numero_documento: string;
  };
  moneda: string;
  total: number;
  estado_sunat: {
    enviado: boolean;
    cdr_recibido: boolean;
    estado_xml: string;
    estado_procesamiento: string;
  };
  rutas_archivos: {
    xml: string;
    pdf?: string;
    zip: string;
    cdr?: string;
  };
}

interface FacturasResponse {
  total: number;
  limite: number;
  estado_filtro?: string;
  facturas: Factura[];
}

interface ListadoFacturasProps {
  limite?: number;
}

const ListadoFacturas: React.FC<ListadoFacturasProps> = ({ limite = 50 }) => {
  const [facturas, setFacturas] = useState<Factura[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { get } = useApi();
  const [filtros, setFiltros] = useState({
    busqueda: '',
    estadoSunat: '',
    fechaDesde: '',
    fechaHasta: ''
  });
  const [paginacion, setPaginacion] = useState({
    pagina: 1,
    total: 0,
    limite: limite
  });

  const cargarFacturas = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      console.log('📋 Listando facturas enviadas, límite:', paginacion.limite, 'estado:', filtros.estadoSunat);
      
      // Debug de autenticación
      console.log('🔍 Debug - useApi hook available:', !!get);
      
      // Construir URL con parámetros
      let url = `/consultas/facturas-enviadas?limite=${paginacion.limite}`;
      if (filtros.estadoSunat) {
        url += `&estado=${encodeURIComponent(filtros.estadoSunat)}`;
      }
      if (filtros.fechaDesde) {
        url += `&fecha_desde=${encodeURIComponent(filtros.fechaDesde)}`;
      }
      if (filtros.fechaHasta) {
        url += `&fecha_hasta=${encodeURIComponent(filtros.fechaHasta)}`;
      }
      if (filtros.busqueda) {
        url += `&busqueda=${encodeURIComponent(filtros.busqueda)}`;
      }
      
      console.log('🌐 Making API call to:', url);
      console.log('🔍 BEFORE API CALL - About to call get() method');
      console.log('🔍 useApi state check - get function available:', typeof get);
      
      const response = await get<FacturasResponse>(url);
      console.log('📊 API Response:', response);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      console.log('✅ Facturas cargadas:', response.data);
      
      if (response.data) {
        setFacturas(response.data.facturas || []);
        setPaginacion(prev => ({ ...prev, total: response.data!.total || 0 }));
      }
    } catch (error) {
      console.error('❌ Error cargando facturas:', error);
      setError('Error al cargar las facturas');
    } finally {
      setLoading(false);
    }
  }, [get, paginacion.limite, paginacion.pagina, filtros.busqueda, filtros.estadoSunat, filtros.fechaDesde, filtros.fechaHasta]);

  const descargarCDR = async (serie: string, numero: number) => {
    try {
      console.log('📥 Descargando CDR para:', serie, numero);
      const url = `/consultas/descargar-cdr/${serie}/${numero}`;
      const response = await get(url);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      console.log('✅ CDR descargado exitosamente');
      // Recargar facturas para actualizar estado
      cargarFacturas();
    } catch (error) {
      console.error('❌ Error descargando CDR:', error);
      setError('Error al descargar CDR');
    }
  };

  const consultarEstadoSunat = async (serie: string, numero: number) => {
    try {
      console.log('🔍 Consultando estado SUNAT para:', serie, numero);
      const url = `/consultas/estado-sunat/${serie}/${numero}`;
      const response = await get(url);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      console.log('✅ Estado SUNAT consultado exitosamente');
      // Recargar facturas para ver estado actualizado
      cargarFacturas();
    } catch (error) {
      console.error('❌ Error consultando estado SUNAT:', error);
      setError('Error al consultar estado en SUNAT');
    }
  };

  const limpiarFiltros = () => {
    setFiltros({
      busqueda: '',
      estadoSunat: '',
      fechaDesde: '',
      fechaHasta: ''
    });
    setPaginacion(prev => ({ ...prev, pagina: 1 }));
  };

  const aplicarFiltros = () => {
    setPaginacion(prev => ({ ...prev, pagina: 1 }));
    cargarFacturas();
  };

  const formatearNumeroFactura = (serie: string, numero: number) => {
    return `${serie}-${String(numero).padStart(8, '0')}`;
  };

  const getEstadoBadge = (factura: Factura) => {
    if (factura.estado_sunat?.cdr_recibido) {
      return <Badge className="bg-green-100 text-green-800 border-green-200">CDR RECIBIDO</Badge>;
    } else if (factura.estado_sunat?.enviado) {
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">ENVIADO</Badge>;
    } else {
      return <Badge className="bg-red-100 text-red-800 border-red-200">NO ENVIADO</Badge>;
    }
  };

  useEffect(() => {
    cargarFacturas();
  }, [cargarFacturas]);

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="w-5 h-5" />
            Filtros de Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Buscar
              </label>
              <div className="relative">
                <Search className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <Input
                  placeholder="RUC, razón social, serie..."
                  value={filtros.busqueda}
                  onChange={(e) => setFiltros(prev => ({ ...prev, busqueda: e.target.value }))}
                  className="pl-10"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado SUNAT
              </label>
              <select
                value={filtros.estadoSunat}
                onChange={(e) => setFiltros(prev => ({ ...prev, estadoSunat: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Todos</option>
                <option value="cdr_recibido">CDR Recibido</option>
                <option value="enviado">Enviado</option>
                <option value="no_enviado">No Enviado</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Desde
              </label>
              <Input
                type="date"
                value={filtros.fechaDesde}
                onChange={(e) => setFiltros(prev => ({ ...prev, fechaDesde: e.target.value }))}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha Hasta
              </label>
              <Input
                type="date"
                value={filtros.fechaHasta}
                onChange={(e) => setFiltros(prev => ({ ...prev, fechaHasta: e.target.value }))}
              />
            </div>
          </div>
          
          <div className="flex items-center gap-2 mt-4">
            <Button onClick={aplicarFiltros} disabled={loading}>
              <Search className="w-4 h-4 mr-2" />
              Buscar
            </Button>
            <Button variant="outline" onClick={limpiarFiltros}>
              Limpiar
            </Button>
            <Button variant="outline" onClick={cargarFacturas} disabled={loading}>
              {loading ? (
                <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <RefreshCw className="w-4 h-4 mr-2" />
              )}
              Actualizar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <div className="flex">
            <XCircle className="h-5 w-5 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="mt-1 text-sm text-red-700">{error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Lista de Facturas */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Facturas ({paginacion.total})</span>
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                Mostrando {Math.min(paginacion.limite, facturas.length)} de {paginacion.total}
              </span>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin mr-2" />
              <span>Cargando facturas...</span>
            </div>
          ) : facturas.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 mb-2">📄</div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay facturas</h3>
              <p className="text-gray-600">No se encontraron facturas con los filtros aplicados.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Factura
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Cliente
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Fecha
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Total
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Estado SUNAT
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
                  {facturas.map((factura) => (
                    <tr key={factura.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatearNumeroFactura(factura.serie, factura.numero)}
                        </div>
                        <div className="text-sm text-gray-500">
                          ID: {factura.id.slice(-8)}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="text-sm font-medium text-gray-900">
                          {factura.cliente?.razon_social || 'N/A'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {factura.cliente?.numero_documento || 'N/A'}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {factura.fecha_emision}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {factura.moneda} {factura.total?.toFixed(2)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getEstadoBadge(factura)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {factura.rutas_archivos?.cdr ? (
                          <CheckCircle className="w-5 h-5 text-green-600" />
                        ) : (
                          <XCircle className="w-5 h-5 text-gray-400" />
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => consultarEstadoSunat(factura.serie, factura.numero)}
                            className="text-blue-600 hover:text-blue-900"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Consultar
                          </Button>
                          {!factura.rutas_archivos?.cdr && (
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => descargarCDR(factura.serie, factura.numero)}
                              className="text-green-600 hover:text-green-900"
                            >
                              <Download className="w-4 h-4 mr-1" />
                              CDR
                            </Button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Paginación */}
      {paginacion.total > paginacion.limite && (
        <div className="flex items-center justify-between">
          <div className="text-sm text-gray-700">
            Mostrando {((paginacion.pagina - 1) * paginacion.limite) + 1} a{' '}
            {Math.min(paginacion.pagina * paginacion.limite, paginacion.total)} de{' '}
            {paginacion.total} facturas
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              disabled={paginacion.pagina === 1}
              onClick={() => setPaginacion(prev => ({ ...prev, pagina: prev.pagina - 1 }))}
            >
              Anterior
            </Button>
            <span className="text-sm text-gray-700">
              Página {paginacion.pagina} de {Math.ceil(paginacion.total / paginacion.limite)}
            </span>
            <Button
              variant="outline"
              disabled={paginacion.pagina >= Math.ceil(paginacion.total / paginacion.limite)}
              onClick={() => setPaginacion(prev => ({ ...prev, pagina: prev.pagina + 1 }))}
            >
              Siguiente
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ListadoFacturas;
