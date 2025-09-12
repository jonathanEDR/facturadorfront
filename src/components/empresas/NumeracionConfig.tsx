/**
 * Componente para configuración de numeración de facturas
 */
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardContent, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogFooter 
} from '@/components/ui/dialog';
import { Plus, Settings, BarChart3, RefreshCw, AlertTriangle } from 'lucide-react';
import { useNumeracion } from '@/hooks/useNumeracion';
import { ContadorResponse, EstadisticasSerieResponse } from '@/services/numeracion';
import { toast } from 'react-hot-toast';

interface NumeracionConfigProps {
  empresa_ruc: string;
  onConfigurationChange?: () => void;
}

export default function NumeracionConfig({ 
  empresa_ruc, 
  onConfigurationChange 
}: NumeracionConfigProps) {
  const {
    contadores,
    loading,
    error,
    cargarContadores,
    configurarSerie,
    configurarMultiplesSeries,
    cambiarEstadoSerie,
    obtenerEstadisticas,
    validarSerie
  } = useNumeracion();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showStatsModal, setShowStatsModal] = useState(false);
  const [selectedSerie, setSelectedSerie] = useState<string | null>(null);
  const [estadisticas, setEstadisticas] = useState<EstadisticasSerieResponse | null>(null);
  const [operationLoading, setOperationLoading] = useState(false);
  const [nuevaSerie, setNuevaSerie] = useState({
    serie: '',
    numero_inicial: 1,
    activo: true
  });

  // Series comunes predefinidas
  const seriesComunes = [
    { codigo: 'F001', descripcion: 'Facturas - Serie Principal' },
    { codigo: 'F002', descripcion: 'Facturas - Serie Secundaria' },
    { codigo: 'B001', descripcion: 'Boletas - Serie Principal' },
    { codigo: 'B002', descripcion: 'Boletas - Serie Secundaria' },
    { codigo: 'FC01', descripcion: 'Notas de Crédito - Facturas' },
    { codigo: 'FD01', descripcion: 'Notas de Débito - Facturas' },
    { codigo: 'BC01', descripcion: 'Notas de Crédito - Boletas' },
    { codigo: 'BD01', descripcion: 'Notas de Débito - Boletas' }
  ];

  // Efecto para cargar contadores al inicializar el componente
  useEffect(() => {
    cargarContadores();
  }, [cargarContadores]);

  const handleAddSerie = async () => {
    if (!nuevaSerie.serie.trim()) {
      toast.error('Ingrese una serie válida');
      return;
    }

    // Validación que coincida con el backend
    const serie = nuevaSerie.serie.toUpperCase().trim();
    
    if (serie.length !== 4) {
      toast.error('Serie debe tener exactamente 4 caracteres');
      return;
    }
    
    if (!['F', 'B', 'T'].includes(serie[0])) {
      toast.error('Serie debe comenzar con F (facturas), B (boletas) o T (testing)');
      return;
    }
    
    const restoSerie = serie.slice(1);
    if (!/^[A-Z0-9]+$/.test(restoSerie)) {
      toast.error('Caracteres 2-4 deben ser alfanuméricos (letras y/o números)');
      return;
    }
    
    if (!/\d/.test(restoSerie)) {
      toast.error('La serie debe contener al menos un dígito');
      return;
    }

    setOperationLoading(true);
    try {
      await configurarSerie({
        serie: nuevaSerie.serie.toUpperCase(),
        numero_inicial: nuevaSerie.numero_inicial,
        activo: nuevaSerie.activo
      });

      setNuevaSerie({ serie: '', numero_inicial: 1, activo: true });
      setShowAddModal(false);
      
      // Recargar contadores para asegurar que se muestren correctamente
      await cargarContadores();
      onConfigurationChange?.();
    } catch {
      // Error ya manejado en el hook
    } finally {
      setOperationLoading(false);
    }
  };

  const handleShowStats = async (serie: string) => {
    try {
      const stats = await obtenerEstadisticas(serie);
      setEstadisticas(stats);
      setSelectedSerie(serie);
      setShowStatsModal(true);
    } catch {
      toast.error('Error cargando estadísticas');
    }
  };

  const handleValidarSerie = async (serie: string) => {
    try {
      const validacion = await validarSerie(serie);
      
      if (validacion.es_valida) {
        toast.success(`Serie ${serie} está correcta`);
      } else {
        toast.error(`Serie ${serie} tiene errores: ${validacion.errores.join(', ')}`);
      }
    } catch {
      // Error ya manejado en el hook
    }
  };

  const handleToggleEstado = async (serie: string, activo: boolean) => {
    try {
      await cambiarEstadoSerie(serie, activo);
      // Recargar contadores para asegurar que se actualicen correctamente
      await cargarContadores();
      onConfigurationChange?.();
    } catch {
      // Error ya manejado en el hook
    }
  };

  const getStatusBadge = (contador: ContadorResponse) => {
    if (!contador.activo) {
      return <Badge variant="secondary">Inactiva</Badge>;
    }
    
    if (contador.numero_actual === contador.numero_inicial) {
      return <Badge className="bg-blue-100 text-blue-800">Nueva</Badge>;
    }
    
    return <Badge className="bg-green-100 text-green-800">Activa</Badge>;
  };

  const configuracionesRapidas = [
    {
      nombre: 'Empresa Nueva',
      descripcion: 'Configuración para empresa sin facturas previas',
      series: [
        { serie: 'F001', numero_inicial: 1 },
        { serie: 'B001', numero_inicial: 1 }
      ]
    },
    {
      nombre: 'Migración Completa',
      descripcion: 'Todas las series para migración desde sistema manual',
      series: [
        { serie: 'F001', numero_inicial: 1 },
        { serie: 'F002', numero_inicial: 1 },
        { serie: 'B001', numero_inicial: 1 },
        { serie: 'B002', numero_inicial: 1 },
        { serie: 'FC01', numero_inicial: 1 },
        { serie: 'FD01', numero_inicial: 1 },
        { serie: 'BC01', numero_inicial: 1 },
        { serie: 'BD01', numero_inicial: 1 }
      ]
    }
  ];

  if (loading) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8">
          <RefreshCw className="h-6 w-6 animate-spin mr-2" />
          Cargando configuración de numeración...
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center p-8 text-red-600">
          <AlertTriangle className="h-6 w-6 mr-2" />
          Error: {error}
          <Button variant="outline" size="sm" onClick={cargarContadores} className="ml-4">
            Reintentar
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Configuración de Numeración</h3>
          <p className="text-sm text-gray-600">
            Gestiona la numeración de comprobantes electrónicos para {empresa_ruc}
          </p>
        </div>
        <Button onClick={() => setShowAddModal(true)} className="flex items-center gap-2">
          <Plus className="h-4 w-4" />
          Nueva Serie
        </Button>
      </div>

      {/* Configuraciones rápidas */}
      {contadores.length === 0 && (
        <Card className="border-blue-200 bg-blue-50">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Configuraciones Rápidas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-blue-700">
              Para empezar rápidamente, elige una configuración predefinida:
            </p>
            {configuracionesRapidas.map((config, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-blue-200 rounded-lg bg-white">
                <div>
                  <p className="font-medium text-sm">{config.nombre}</p>
                  <p className="text-xs text-gray-600">{config.descripcion}</p>
                  <p className="text-xs text-blue-600 mt-1">
                    Series: {config.series.map(s => s.serie).join(', ')}
                  </p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={operationLoading}
                  onClick={async () => {
                    setOperationLoading(true);
                    try {
                      // Usar configuración masiva si está disponible, sino configurar una por una
                      if (configurarMultiplesSeries) {
                        await configurarMultiplesSeries(config.series);
                      } else {
                        for (const serie of config.series) {
                          await configurarSerie(serie);
                        }
                      }
                      // Recargar contadores después de configurar múltiples series
                      await cargarContadores();
                      onConfigurationChange?.();
                    } catch {
                      // Error ya manejado
                    } finally {
                      setOperationLoading(false);
                    }
                  }}
                >
                  {operationLoading ? (
                    <>
                      <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                      Aplicando...
                    </>
                  ) : (
                    'Aplicar'
                  )}
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Lista de series configuradas */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Series Configuradas</CardTitle>
        </CardHeader>
        <CardContent>
          {!Array.isArray(contadores) || contadores.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Settings className="h-12 w-12 mx-auto mb-3 opacity-50" />
              <p>No hay series configuradas</p>
              <p className="text-sm">Agrega una serie para comenzar</p>
            </div>
          ) : (
            <div className="space-y-3">
              {contadores.map((contador) => (
                <div key={`contador-${contador.serie}-${contador.id || contador.numero_actual}`} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h4 className="font-medium">{contador.serie}</h4>
                      {getStatusBadge(contador)}
                    </div>
                    <div className="text-sm text-gray-600 mt-1">
                      <span>Número actual: <strong>{contador.numero_actual}</strong></span>
                      <span className="mx-2">•</span>
                      <span>Inicial: {contador.numero_inicial}</span>
                      <span className="mx-2">•</span>
                      <span>Total emitidos: {contador.numero_actual - contador.numero_inicial}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={contador.activo}
                      onChange={(e) => handleToggleEstado(contador.serie, e.target.checked)}
                      className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleShowStats(contador.serie)}
                    >
                      <BarChart3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleValidarSerie(contador.serie)}
                    >
                      <AlertTriangle className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Modal para agregar serie */}
      <Dialog open={showAddModal} onOpenChange={setShowAddModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Configurar Nueva Serie</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="serie">Serie</Label>
              <Input
                id="serie"
                value={nuevaSerie.serie}
                onChange={(e) => setNuevaSerie({ ...nuevaSerie, serie: e.target.value.toUpperCase() })}
                placeholder="F001, B001, FZ01..."
                maxLength={4}
              />
              <p className="text-xs text-gray-600">
                Formato: F001 (facturas), B001 (boletas), FZ01, etc.
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="numero_inicial">Número Inicial</Label>
              <Input
                id="numero_inicial"
                type="number"
                min="1"
                max="99999999"
                value={nuevaSerie.numero_inicial}
                onChange={(e) => setNuevaSerie({ ...nuevaSerie, numero_inicial: parseInt(e.target.value) || 1 })}
              />
              <p className="text-xs text-gray-600">
                Para empresas nuevas usar 1. Para migración, usar el siguiente número después del último manual.
              </p>
            </div>

            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="activo"
                checked={nuevaSerie.activo}
                onChange={(e) => setNuevaSerie({ ...nuevaSerie, activo: e.target.checked })}
                className="h-4 w-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <Label htmlFor="activo">Serie activa</Label>
            </div>

            <div className="border-t pt-4"></div>

            <div className="space-y-2">
              <Label className="text-sm font-medium">Series Comunes</Label>
              <div className="grid grid-cols-2 gap-2">
                {seriesComunes.map((serie) => (
                  <Button
                    key={serie.codigo}
                    variant="outline"
                    size="sm"
                    onClick={() => setNuevaSerie({ ...nuevaSerie, serie: serie.codigo })}
                    className="justify-start h-auto p-2"
                  >
                    <div className="text-left">
                      <div className="font-medium text-xs">{serie.codigo}</div>
                      <div className="text-xs text-gray-600">{serie.descripcion}</div>
                    </div>
                  </Button>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddModal(false)}>
              Cancelar
            </Button>
            <Button onClick={handleAddSerie} disabled={operationLoading}>
              {operationLoading ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Configurando...
                </>
              ) : (
                'Configurar Serie'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Modal de estadísticas */}
      <Dialog open={showStatsModal} onOpenChange={setShowStatsModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Estadísticas - Serie {selectedSerie}</DialogTitle>
          </DialogHeader>
          {estadisticas && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{estadisticas.total_emitidos}</div>
                  <div className="text-sm text-gray-600">Total Emitidos</div>
                </div>
                <div className="text-center p-3 border rounded-lg">
                  <div className="text-2xl font-bold text-green-600">{estadisticas.ultimo_numero}</div>
                  <div className="text-sm text-gray-600">Último Número</div>
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Numeración Consecutiva:</span>
                  <Badge className={estadisticas.numeracion_consecutiva ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}>
                    {estadisticas.numeracion_consecutiva ? "✓ Correcta" : "✗ Con errores"}
                  </Badge>
                </div>
                
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Documentos Pendientes:</span>
                  <span className="text-sm font-medium">{estadisticas.documentos_pendientes}</span>
                </div>
                
                {estadisticas.fecha_ultimo_documento && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Último Documento:</span>
                    <span className="text-sm font-medium">
                      {new Date(estadisticas.fecha_ultimo_documento).toLocaleDateString('es-PE')}
                    </span>
                  </div>
                )}
              </div>
            </div>
          )}
          <DialogFooter>
            <Button onClick={() => setShowStatsModal(false)}>
              Cerrar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
