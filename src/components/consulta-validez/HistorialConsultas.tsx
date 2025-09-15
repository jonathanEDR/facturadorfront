// Componente para mostrar historial de consultas realizadas
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  History, 
  Search, 
  Filter, 
  Download, 
  Calendar,
  FileText,
  CheckCircle,
  XCircle,
  Eye
} from 'lucide-react';

interface HistorialItem {
  id: string;
  fecha_consulta: string;
  empresa_id: string;
  empresa_ruc: string;
  empresa_razon_social: string;
  comprobante: {
    ruc_emisor: string;
    tipo_comprobante: string;
    serie: string;
    numero: number;
    fecha_emision: string;
    monto: number;
  };
  resultado: {
    success: boolean;
    message: string;
    estado_comprobante?: string;
  };
  tiempo_respuesta_ms: number;
}

export default function HistorialConsultas() {
  const [historial, setHistorial] = useState<HistorialItem[]>([]);
  const [filteredHistorial, setFilteredHistorial] = useState<HistorialItem[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Filtros
  const [filtros, setFiltros] = useState({
    fechaDesde: '',
    fechaHasta: '',
    rucEmisor: '',
    tipoComprobante: '',
    resultado: '' // 'success' | 'error' | ''
  });

  // Paginación
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 20;

  useEffect(() => {
    loadHistorial();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [historial, filtros]);

  const loadHistorial = async () => {
    try {
      setLoading(true);
      // TODO: Implementar llamada al API para obtener historial
      // const response = await api.get('/consulta-validez/historial');
      
      // Datos de ejemplo mientras implementamos el backend
      const mockData: HistorialItem[] = [
        {
          id: '1',
          fecha_consulta: '2024-12-15T10:30:00Z',
          empresa_id: 'emp1',
          empresa_ruc: '20123456789',
          empresa_razon_social: 'EMPRESA EJEMPLO SAC',
          comprobante: {
            ruc_emisor: '20987654321',
            tipo_comprobante: '01',
            serie: 'F001',
            numero: 123,
            fecha_emision: '01/12/2024',
            monto: 118.00
          },
          resultado: {
            success: true,
            message: 'Comprobante válido',
            estado_comprobante: 'ACEPTADO'
          },
          tiempo_respuesta_ms: 1250
        },
        {
          id: '2',
          fecha_consulta: '2024-12-15T09:15:00Z',
          empresa_id: 'emp1',
          empresa_ruc: '20123456789',
          empresa_razon_social: 'EMPRESA EJEMPLO SAC',
          comprobante: {
            ruc_emisor: '20555666777',
            tipo_comprobante: '03',
            serie: 'B001',
            numero: 456,
            fecha_emision: '02/12/2024',
            monto: 59.00
          },
          resultado: {
            success: false,
            message: 'Comprobante no encontrado'
          },
          tiempo_respuesta_ms: 890
        }
      ];
      
      setHistorial(mockData);
    } catch (error) {
      console.error('Error cargando historial:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...historial];

    // Filtro por fecha desde
    if (filtros.fechaDesde) {
      const fechaDesde = new Date(filtros.fechaDesde);
      filtered = filtered.filter(item => 
        new Date(item.fecha_consulta) >= fechaDesde
      );
    }

    // Filtro por fecha hasta
    if (filtros.fechaHasta) {
      const fechaHasta = new Date(filtros.fechaHasta);
      fechaHasta.setHours(23, 59, 59, 999); // Incluir todo el día
      filtered = filtered.filter(item => 
        new Date(item.fecha_consulta) <= fechaHasta
      );
    }

    // Filtro por RUC emisor
    if (filtros.rucEmisor) {
      filtered = filtered.filter(item => 
        item.comprobante.ruc_emisor.includes(filtros.rucEmisor)
      );
    }

    // Filtro por tipo de comprobante
    if (filtros.tipoComprobante) {
      filtered = filtered.filter(item => 
        item.comprobante.tipo_comprobante === filtros.tipoComprobante
      );
    }

    // Filtro por resultado
    if (filtros.resultado) {
      const isSuccess = filtros.resultado === 'success';
      filtered = filtered.filter(item => 
        item.resultado.success === isSuccess
      );
    }

    setFilteredHistorial(filtered);
    setCurrentPage(1); // Reset a primera página al filtrar
  };

  const handleFilterChange = (field: keyof typeof filtros, value: string) => {
    setFiltros(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const clearFilters = () => {
    setFiltros({
      fechaDesde: '',
      fechaHasta: '',
      rucEmisor: '',
      tipoComprobante: '',
      resultado: ''
    });
  };

  const exportToCSV = () => {
    const csvData = filteredHistorial.map(item => ({
      fecha_consulta: new Date(item.fecha_consulta).toLocaleString(),
      empresa_ruc: item.empresa_ruc,
      empresa_razon_social: item.empresa_razon_social,
      ruc_emisor: item.comprobante.ruc_emisor,
      tipo_comprobante: item.comprobante.tipo_comprobante,
      serie: item.comprobante.serie,
      numero: item.comprobante.numero,
      fecha_emision: item.comprobante.fecha_emision,
      monto: item.comprobante.monto,
      resultado: item.resultado.success ? 'Exitoso' : 'Error',
      mensaje: item.resultado.message,
      estado_comprobante: item.resultado.estado_comprobante || '',
      tiempo_respuesta_ms: item.tiempo_respuesta_ms
    }));

    const headers = Object.keys(csvData[0]).join(',');
    const rows = csvData.map(row => Object.values(row).join(','));
    const csv = [headers, ...rows].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `historial_consultas_${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  };

  // Paginación
  const totalPages = Math.ceil(filteredHistorial.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentItems = filteredHistorial.slice(startIndex, startIndex + itemsPerPage);

  const getStatusBadge = (success: boolean) => {
    return success ? (
      <Badge className="bg-green-100 text-green-800">
        <CheckCircle className="w-3 h-3 mr-1" />
        Exitoso
      </Badge>
    ) : (
      <Badge className="bg-red-100 text-red-800">
        <XCircle className="w-3 h-3 mr-1" />
        Error
      </Badge>
    );
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <div className="w-6 h-6 border-2 border-blue-500 border-t-transparent rounded-full animate-spin mr-2" />
            Cargando historial...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            Filtros de Búsqueda
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {/* Fecha desde */}
            <div className="space-y-2">
              <Label htmlFor="fechaDesde">Fecha Desde</Label>
              <Input
                id="fechaDesde"
                type="date"
                value={filtros.fechaDesde}
                onChange={(e) => handleFilterChange('fechaDesde', e.target.value)}
              />
            </div>

            {/* Fecha hasta */}
            <div className="space-y-2">
              <Label htmlFor="fechaHasta">Fecha Hasta</Label>
              <Input
                id="fechaHasta"
                type="date"
                value={filtros.fechaHasta}
                onChange={(e) => handleFilterChange('fechaHasta', e.target.value)}
              />
            </div>

            {/* RUC Emisor */}
            <div className="space-y-2">
              <Label htmlFor="rucEmisor">RUC Emisor</Label>
              <Input
                id="rucEmisor"
                value={filtros.rucEmisor}
                onChange={(e) => handleFilterChange('rucEmisor', e.target.value)}
                placeholder="20123456789"
              />
            </div>

            {/* Tipo de Comprobante */}
            <div className="space-y-2">
              <Label htmlFor="tipoComprobante">Tipo</Label>
              <select
                id="tipoComprobante"
                value={filtros.tipoComprobante}
                onChange={(e) => handleFilterChange('tipoComprobante', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">Todos</option>
                <option value="01">01 - Factura</option>
                <option value="03">03 - Boleta</option>
                <option value="07">07 - Nota Crédito</option>
                <option value="08">08 - Nota Débito</option>
                <option value="R1">R1 - Recibo Honorarios</option>
                <option value="R7">R7 - Nota Crédito Recibo</option>
              </select>
            </div>

            {/* Resultado */}
            <div className="space-y-2">
              <Label htmlFor="resultado">Resultado</Label>
              <select
                id="resultado"
                value={filtros.resultado}
                onChange={(e) => handleFilterChange('resultado', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
              >
                <option value="">Todos</option>
                <option value="success">Exitosos</option>
                <option value="error">Errores</option>
              </select>
            </div>
          </div>

          <div className="flex gap-2">
            <Button onClick={clearFilters} variant="outline">
              Limpiar Filtros
            </Button>
            <Button onClick={exportToCSV} variant="outline" disabled={filteredHistorial.length === 0}>
              <Download className="w-4 h-4 mr-2" />
              Exportar CSV ({filteredHistorial.length} registros)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Resultados */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <History className="w-5 h-5 mr-2" />
              Historial de Consultas
            </CardTitle>
            <Badge variant="outline">
              {filteredHistorial.length} registros encontrados
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          {currentItems.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Search className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No se encontraron consultas con los filtros aplicados</p>
            </div>
          ) : (
            <>
              {/* Tabla de resultados */}
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b bg-gray-50">
                      <th className="text-left p-3">Fecha</th>
                      <th className="text-left p-3">Empresa</th>
                      <th className="text-left p-3">Comprobante</th>
                      <th className="text-left p-3">RUC Emisor</th>
                      <th className="text-left p-3">Monto</th>
                      <th className="text-left p-3">Resultado</th>
                      <th className="text-left p-3">Tiempo</th>
                      <th className="text-left p-3">Acciones</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentItems.map((item) => (
                      <tr key={item.id} className="border-b hover:bg-gray-50">
                        <td className="p-3">
                          <div className="flex items-center text-xs">
                            <Calendar className="w-3 h-3 mr-1 text-gray-400" />
                            {new Date(item.fecha_consulta).toLocaleString()}
                          </div>
                        </td>
                        <td className="p-3">
                          <div>
                            <p className="font-medium text-xs">{item.empresa_razon_social}</p>
                            <p className="text-gray-500 text-xs">RUC: {item.empresa_ruc}</p>
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex items-center">
                            <FileText className="w-3 h-3 mr-1 text-gray-400" />
                            <span className="font-mono text-xs">
                              {item.comprobante.tipo_comprobante}-{item.comprobante.serie}-{item.comprobante.numero}
                            </span>
                          </div>
                          <p className="text-gray-500 text-xs">
                            {item.comprobante.fecha_emision}
                          </p>
                        </td>
                        <td className="p-3">
                          <span className="font-mono text-xs">{item.comprobante.ruc_emisor}</span>
                        </td>
                        <td className="p-3">
                          <span className="font-mono text-xs">S/ {item.comprobante.monto.toFixed(2)}</span>
                        </td>
                        <td className="p-3">
                          <div className="space-y-1">
                            {getStatusBadge(item.resultado.success)}
                            {item.resultado.estado_comprobante && (
                              <p className="text-xs text-gray-600">{item.resultado.estado_comprobante}</p>
                            )}
                          </div>
                        </td>
                        <td className="p-3">
                          <span className="text-xs text-gray-600">{item.tiempo_respuesta_ms}ms</span>
                        </td>
                        <td className="p-3">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-8 w-8 p-0"
                            title="Ver detalles"
                          >
                            <Eye className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Paginación */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between mt-4">
                  <p className="text-sm text-gray-600">
                    Mostrando {startIndex + 1} a {Math.min(startIndex + itemsPerPage, filteredHistorial.length)} de {filteredHistorial.length} registros
                  </p>
                  
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                      disabled={currentPage === 1}
                    >
                      Anterior
                    </Button>
                    
                    <span className="flex items-center text-sm">
                      Página {currentPage} de {totalPages}
                    </span>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                      disabled={currentPage === totalPages}
                    >
                      Siguiente
                    </Button>
                  </div>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}