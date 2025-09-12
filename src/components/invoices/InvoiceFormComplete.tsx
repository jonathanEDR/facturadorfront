'use client';

import React, { useCallback, useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SimpleSelect, SimpleSelectOption } from '@/components/ui/simple-select';
import { Plus, Trash2, Calculator, User, FileText, Send, Save, Search, Loader2, Calendar } from 'lucide-react';
import { useFacturaForm } from '@/hooks/useFacturaForm';
import { useNumeracion } from '@/hooks/useNumeracion';
import { useConsultas } from '@/hooks/useConsultas';
import { toast } from 'react-hot-toast';
import { FORMAS_PAGO, CONDICIONES_PAGO, TIPO_AFECTACION_IGV } from '@/constants/sunat';

interface InvoiceFormCompleteProps {
  onFacturaCreated?: () => void;
}

export function InvoiceFormComplete({ onFacturaCreated }: InvoiceFormCompleteProps) {
  const [isSuccess, setIsSuccess] = useState(false);
  const [seriesDisponibles, setSeriesDisponibles] = useState<string[]>([]);
  const [loadingNumeracion, setLoadingNumeracion] = useState(false);
  
  // Hook para numeración
  const { series, loading: loadingSeries, cargarContadores } = useNumeracion();
  
  const {
    formData,
    totals,
    errors,
    isValid,
    isSubmitting,
    updateFormData,
    updateItem,
    addItem,
    removeItem,
    submitFactura,
    resetForm,
    autocompletarNumeracion,
    verificarSerieConfigurada,
    obtenerSeriesDisponibles,
    actualizarCondicionPago,
    actualizarCantidadCuotas,
    actualizarFechaEmision,
  } = useFacturaForm();

  // Hook para consultas de documentos
  const { consultarDocumento, rucLoading, rucState, dniState } = useConsultas();

  // Ref para acceder al formData actual sin crear dependencias
  const formDataRef = useRef(formData);
  formDataRef.current = formData;

  // Efectos para cargar datos y gestionar series
  useEffect(() => {
    cargarContadores();
  }, [cargarContadores]);

  // Efecto para procesar las series cuando cambien desde useNumeracion
  useEffect(() => {
    if (Array.isArray(series) && series.length > 0) {
      // Actualizar series disponibles
      setSeriesDisponibles(series);
      
      // Verificar si la serie actual está disponible
      const serieActual = formDataRef.current.serie;
      if (!series.includes(serieActual)) {
        const primeraSerie = series[0];
        updateFormData({ serie: primeraSerie });
      }
    }
  }, [series, updateFormData]);

  // Debug temporal - vamos a remover esto después
  // Solo log mínimo para verificar totals
  //

  // Función simple para actualizar campos del cliente - sin useCallback para evitar bucles infinitos
  const handleClienteFieldChange = (field: keyof typeof formData.cliente, value: string) => {
    updateFormData({
      cliente: {
        ...formData.cliente,
        [field]: value
      }
    });
  };

  // Función para consultar y autocompletar datos del cliente - sin useCallback para evitar bucles
  const handleConsultarDocumento = async () => {
    const { tipo_documento, numero_documento } = formData.cliente;
    
    if (!numero_documento || numero_documento.trim().length === 0) {
      toast.error('Ingrese el número de documento para consultar');
      return;
    }

    try {
      const resultado = await consultarDocumento(numero_documento);
      
      if (resultado && resultado.success) {
        if (tipo_documento === '6' && resultado.ruc_data) {
          // Autocompletar con datos del RUC
          updateFormData({
            cliente: {
              ...formData.cliente,
              razon_social: resultado.ruc_data.razon_social || '',
              direccion: resultado.ruc_data.direccion || formData.cliente.direccion
            }
          });
          toast.success('Datos de empresa obtenidos correctamente');
        } else if (tipo_documento === '1' && resultado.dni_data) {
          // Autocompletar con datos del DNI
          const nombreCompleto = `${resultado.dni_data.nombres || ''} ${resultado.dni_data.apellido_paterno || ''} ${resultado.dni_data.apellido_materno || ''}`.trim();
          updateFormData({
            cliente: {
              ...formData.cliente,
              razon_social: nombreCompleto
            }
          });
          toast.success('Datos de persona obtenidos correctamente');
        }
      } else {
        toast.error(resultado?.message || 'No se encontraron datos para este documento');
      }
    } catch (error) {
      console.error('Error en consulta:', error);
      toast.error('Error al consultar el documento');
    }
  };

  const handleSubmit = useCallback(async (enviarSunat: boolean = true) => {
    try {
      updateFormData({ enviar_sunat: enviarSunat });
      const result = await submitFactura();
      
      if (result) {
        toast.success(
          enviarSunat 
            ? 'Factura creada y enviada a SUNAT exitosamente' 
            : 'Factura creada exitosamente'
        );
        setIsSuccess(true);
        
        // Notificar al componente padre que se creó una factura
        if (onFacturaCreated) {
          onFacturaCreated();
        }
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Error al crear factura');
    }
  }, [updateFormData, submitFactura, onFacturaCreated]);

  // Manejar cambio de serie y autocompletar número
  const handleSerieChange = useCallback(async (serie: string) => {
    setLoadingNumeracion(true);
    
    try {
      // Verificar si la serie está configurada
      const estaConfigurada = await verificarSerieConfigurada(serie);
      
      if (estaConfigurada) {
        // Autocompletar numeración
        await autocompletarNumeracion(serie);
        toast.success(`Serie ${serie} configurada automáticamente`);
      } else {
        // Solo actualizar la serie, mantener número actual
        updateFormData({ serie });
        toast.error(`Serie ${serie} no está configurada. Configure la numeración en Empresa > Configuración > Numeración`);
      }
    } catch (error) {
      console.error('Error al cambiar serie:', error);
      // Fallback: solo actualizar la serie
      updateFormData({ serie });
      toast.error('Error al autocompletar numeración. Ingrese el número manualmente.');
    } finally {
      setLoadingNumeracion(false);
    }
  }, [verificarSerieConfigurada, autocompletarNumeracion, updateFormData]);

  const handleNewInvoice = useCallback(() => {
    resetForm();
    setIsSuccess(false);
  }, [resetForm]);

  if (isSuccess) {
    return (
      <Card className="max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="mx-auto w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <FileText className="h-6 w-6 text-green-600" />
          </div>
          <CardTitle className="text-green-800">¡Factura Creada!</CardTitle>
          <CardDescription>
            La factura se ha procesado correctamente
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center space-y-4">
          <Button onClick={handleNewInvoice} className="w-full">
            <Plus className="h-4 w-4 mr-2" />
            Nueva Factura
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4 max-h-[80vh] overflow-y-auto pr-2">
      {/* Cliente */}
      <div className="space-y-2">
        <h3 className="flex items-center gap-2 text-sm font-medium text-gray-900 border-b border-gray-200 pb-1">
          <User className="h-4 w-4" />
          Datos del Cliente
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-2">
          <div className="space-y-1">
            <Label htmlFor="cliente_tipo_documento" className="text-xs">Tipo de Documento *</Label>
            <SimpleSelect 
              value={formData.cliente.tipo_documento} 
              onValueChange={(value) => handleClienteFieldChange('tipo_documento', value)}
              className="h-8"
            >
              <SimpleSelectOption value="6">RUC</SimpleSelectOption>
              <SimpleSelectOption value="1">DNI</SimpleSelectOption>
            </SimpleSelect>
            {errors.cliente_documento && (
              <p className="text-xs text-red-600">{errors.cliente_documento}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="cliente_numero_documento" className="text-xs">Número de Documento *</Label>
            <div className="flex gap-1">
              <Input
                id="cliente_numero_documento"
                value={formData.cliente.numero_documento}
                onChange={(e) => handleClienteFieldChange('numero_documento', e.target.value)}
                placeholder={formData.cliente.tipo_documento === '6' ? '20123456789' : '12345678'}
                maxLength={formData.cliente.tipo_documento === '6' ? 11 : 8}
                className="h-8 flex-1 text-xs"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleConsultarDocumento}
                disabled={rucLoading || !formData.cliente.numero_documento}
                className="h-8 px-2"
                title="Consultar datos del documento"
              >
                {rucLoading ? (
                  <Loader2 className="h-3 w-3 animate-spin" />
                ) : (
                  <Search className="h-3 w-3" />
                )}
              </Button>
            </div>
            {errors.cliente_documento && (
              <p className="text-xs text-red-600">{errors.cliente_documento}</p>
            )}
            {/* Mostrar estado de consulta */}
            {formData.cliente.tipo_documento === '6' && rucState.success && rucState.data?.ruc_data && (
              <p className="text-xs text-green-600">
                ✓ RUC válido: {rucState.data.ruc_data.estado} - {rucState.data.ruc_data.condicion}
              </p>
            )}
            {formData.cliente.tipo_documento === '1' && dniState.success && dniState.data?.dni_data && (
              <p className="text-xs text-green-600">
                ✓ DNI encontrado en RENIEC
              </p>
            )}
          </div>

          <div className="space-y-1 md:col-span-2">
            <Label htmlFor="cliente_razon_social" className="text-xs">Razón Social / Nombres *</Label>
            <Input
              id="cliente_razon_social"
              value={formData.cliente.razon_social}
              onChange={(e) => handleClienteFieldChange('razon_social', e.target.value)}
              placeholder="Nombre o razón social del cliente"
              className="h-8 text-xs"
            />
            {errors.cliente_razon_social && (
              <p className="text-xs text-red-600">{errors.cliente_razon_social}</p>
            )}
          </div>

          <div className="md:col-span-2 lg:col-span-3 flex items-center gap-3">
            <Label htmlFor="cliente_direccion" className="text-xs whitespace-nowrap min-w-fit">Dirección</Label>
            <Input
              id="cliente_direccion"
              value={formData.cliente.direccion || ''}
              onChange={(e) => handleClienteFieldChange('direccion', e.target.value)}
              placeholder="Dirección del cliente (opcional)"
              className="h-8 text-xs flex-1"
            />
          </div>
        </div>
      </div>

      {/* Factura */}
      <div className="space-y-3">
        <h3 className="flex items-center gap-2 text-sm font-medium text-gray-900 border-b border-gray-200 pb-2">
          <FileText className="h-4 w-4" />
          Datos de la Factura
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-2">
          <div className="space-y-1">
            <Label htmlFor="serie" className="text-xs">Serie *</Label>
            <div className="flex gap-1">
              <SimpleSelect 
                value={formData.serie} 
                onValueChange={handleSerieChange}
                className="h-8 flex-1"
              >
                {loadingSeries ? (
                  <SimpleSelectOption value="">
                    Cargando...
                  </SimpleSelectOption>
                ) : seriesDisponibles.length > 0 ? (
                  seriesDisponibles.map((serie) => (
                    <SimpleSelectOption key={serie} value={serie}>
                      {serie}
                    </SimpleSelectOption>
                  ))
                ) : (
                  <SimpleSelectOption value="">
                    Sin series
                  </SimpleSelectOption>
                )}
              </SimpleSelect>
              {(loadingNumeracion || loadingSeries) && (
                <div className="flex items-center justify-center px-1">
                  <Loader2 className="h-3 w-3 animate-spin" />
                </div>
              )}
            </div>
            {errors.serie && (
              <p className="text-xs text-red-600">{errors.serie}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="numero" className="text-xs">Número *</Label>
            <Input
              id="numero"
              type="number"
              value={formData.numero}
              onChange={(e) => {
                const value = parseInt(e.target.value);
                updateFormData({ numero: isNaN(value) ? 1 : value });
              }}
              placeholder="1"
              min="1"
              className="h-8 text-xs"
              disabled={loadingNumeracion}
            />
            {errors.numero && (
              <p className="text-xs text-red-600">{errors.numero}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="fecha_emision" className="text-xs">Fecha Emisión *</Label>
            <Input
              id="fecha_emision"
              type="date"
              value={formData.fecha_emision}
              onChange={(e) => actualizarFechaEmision(e.target.value)}
              className="h-8 text-xs"
            />
            {errors.fecha_emision && (
              <p className="text-xs text-red-600">{errors.fecha_emision}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="fecha_vencimiento" className="text-xs">Fecha Venc. *</Label>
            <Input
              id="fecha_vencimiento"
              type="date"
              value={formData.fecha_vencimiento}
              onChange={(e) => updateFormData({ fecha_vencimiento: e.target.value })}
              className="h-8 text-xs"
            />
            {errors.fecha_vencimiento && (
              <p className="text-xs text-red-600">{errors.fecha_vencimiento}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="forma_pago" className="text-xs">Forma de Pago *</Label>
            <SimpleSelect 
              value={formData.forma_pago} 
              onValueChange={(value) => updateFormData({ forma_pago: value })}
              className="h-8"
            >
              {Object.entries(FORMAS_PAGO).map(([codigo, descripcion]) => (
                <SimpleSelectOption key={codigo} value={codigo}>
                  {codigo} - {String(descripcion)}
                </SimpleSelectOption>
              ))}
            </SimpleSelect>
            {errors.forma_pago && (
              <p className="text-xs text-red-600">{errors.forma_pago}</p>
            )}
          </div>

          <div className="space-y-1">
            <Label htmlFor="condicion_pago" className="text-xs">Condición Pago *</Label>
            <SimpleSelect 
              value={formData.condicion_pago} 
              onValueChange={actualizarCondicionPago}
              className="h-8"
            >
              {Object.entries(CONDICIONES_PAGO).map(([codigo, descripcion]) => (
                <SimpleSelectOption key={codigo} value={codigo}>
                  {codigo} - {String(descripcion)}
                </SimpleSelectOption>
              ))}
            </SimpleSelect>
            {errors.condicion_pago && (
              <p className="text-xs text-red-600">{errors.condicion_pago}</p>
            )}
          </div>

          {/* Cantidad de Cuotas - Solo para crédito */}
          {formData.condicion_pago !== 'Contado' && (
            <div className="space-y-1">
              <Label htmlFor="cantidad_cuotas" className="text-xs">Cuotas *</Label>
              <Input
                id="cantidad_cuotas"
                type="number"
                min="1"
                max="12"
                value={formData.cantidad_cuotas}
                onChange={(e) => {
                  const cantidad = parseInt(e.target.value) || 1;
                  actualizarCantidadCuotas(cantidad);
                }}
                className="h-8 text-xs"
              />
            </div>
          )}

          <div className="md:col-span-3 lg:col-span-6 flex items-center gap-3">
            <Label htmlFor="observaciones" className="text-xs whitespace-nowrap min-w-fit">Observaciones</Label>
            <Input
              id="observaciones"
              value={formData.observaciones || ''}
              onChange={(e) => updateFormData({ observaciones: e.target.value })}
              placeholder="Observaciones adicionales (opcional)"
              className="h-8 text-xs flex-1"
            />
          </div>
        </div>
      </div>

      {/* Detalle de Cuotas - Solo para crédito */}
      {formData.condicion_pago !== 'Contado' && formData.cuotas.length > 0 && (
        <div className="space-y-1 border-l-2 border-blue-200 pl-3">
          <h4 className="flex items-center gap-2 text-xs font-medium text-blue-700">
            <Calendar className="h-3 w-3" />
            Cuotas ({formData.cuotas.length}) - Total: {formData.moneda} {formData.cuotas.reduce((sum, cuota) => sum + cuota.monto, 0).toFixed(2)}
          </h4>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-1">
            {formData.cuotas.map((cuota, index) => (
              <div key={index} className="flex flex-col py-1 px-2 bg-blue-50 rounded text-xs border">
                <span className="font-medium">#{cuota.numero}</span>
                <span className="text-gray-600">{cuota.fecha_vencimiento}</span>
                <span className="font-medium text-blue-700">{formData.moneda} {cuota.monto.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Items */}
      <div className="space-y-2 border border-gray-200 rounded-lg p-3">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-sm font-medium text-gray-900">
            <Calculator className="h-4 w-4" />
            Items ({formData.items.length}) - Total: S/. {totals.total.toFixed(2)}
          </h3>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={addItem}
            className="flex items-center gap-1 h-7 text-xs px-2"
          >
            <Plus className="h-3 w-3" />
            Agregar
          </Button>
        </div>
        <div className="space-y-1">
          {formData.items.map((item) => (
            <div key={item.id} className="grid grid-cols-1 md:grid-cols-12 gap-2 p-2 border rounded">
              <div className="md:col-span-5 space-y-1">
                <Label htmlFor={`item-descripcion-${item.id}`} className="text-xs">Descripción *</Label>
                <Input
                  id={`item-descripcion-${item.id}`}
                  value={item.descripcion}
                  onChange={(e) => updateItem(item.id, { descripcion: e.target.value })}
                  placeholder="Descripción del producto/servicio"
                  className="h-7 text-xs"
                />
                {errors[`item_${item.id}_descripcion`] && (
                  <p className="text-xs text-red-600">{errors[`item_${item.id}_descripcion`]}</p>
                )}
              </div>

              <div className="md:col-span-1 space-y-1">
                <Label htmlFor={`item-cantidad-${item.id}`} className="text-xs">Cant. *</Label>
                <Input
                  id={`item-cantidad-${item.id}`}
                  type="number"
                  value={item.cantidad}
                  onChange={(e) => updateItem(item.id, { cantidad: parseFloat(e.target.value) || 0 })}
                  placeholder="1.00"
                  step="0.01"
                  min="0"
                  className="h-7 text-xs"
                />
                {errors[`item_${item.id}_cantidad`] && (
                  <p className="text-xs text-red-600">{errors[`item_${item.id}_cantidad`]}</p>
                )}
              </div>

              <div className="md:col-span-2 space-y-1">
                <Label htmlFor={`item-precio-${item.id}`} className="text-xs">Precio Unit. *</Label>
                <Input
                  id={`item-precio-${item.id}`}
                  type="number"
                  value={item.precio_unitario || 0}
                  onChange={(e) => {
                    const newPrice = parseFloat(e.target.value) || 0;
                    console.log(`💳 Precio Input Item ${item.id}: raw="${e.target.value}" parsed=${newPrice} (${typeof newPrice})`);
                    updateItem(item.id, { precio_unitario: newPrice });
                  }}
                  placeholder="0.00"
                  step="0.01"
                  min="0"
                  className="h-7 text-xs"
                />
                {errors[`item_${item.id}_precio`] && (
                  <p className="text-xs text-red-600">{errors[`item_${item.id}_precio`]}</p>
                )}
              </div>

              <div className="md:col-span-2 space-y-1">
                <Label htmlFor={`item-tipo-afectacion-${item.id}`} className="text-xs">IGV *</Label>
                <SimpleSelect 
                  value={item.tipo_afectacion_igv || '10'} 
                  onValueChange={(value) => updateItem(item.id, { tipo_afectacion_igv: value })}
                  className="h-7 text-xs"
                >
                  {Object.entries(TIPO_AFECTACION_IGV).map(([codigo, descripcion]) => (
                    <SimpleSelectOption key={codigo} value={codigo}>
                      {codigo} - {String(descripcion)}
                    </SimpleSelectOption>
                  ))}
                </SimpleSelect>
                {errors[`item_${item.id}_tipo_afectacion`] && (
                  <p className="text-xs text-red-600">{errors[`item_${item.id}_tipo_afectacion`]}</p>
                )}
              </div>

              <div className="md:col-span-1 space-y-1">
                <Label className="text-xs">Total</Label>
                <Input
                  type="number"
                  value={(item.cantidad * item.precio_unitario).toFixed(2)}
                  readOnly
                  className="h-7 text-xs bg-gray-50"
                />
              </div>

              <div className="md:col-span-1 flex items-end">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeItem(item.id)}
                  disabled={formData.items.length === 1}
                  className="w-full h-7 px-1"
                >
                  <Trash2 className="h-3 w-3" />
                </Button>
              </div>
            </div>
          ))}

          {errors.items && (
            <p className="text-xs text-red-600">{errors.items}</p>
          )}
        </div>
      </div>

      {/* Resumen final y acciones */}
      <div className="border-t pt-3 mt-4">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Totales */}
          <div className="lg:col-span-2">
            <h3 className="text-sm font-medium text-gray-900 mb-2">Resumen de Totales</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-xs">
              <div className="bg-gray-50 p-2 rounded">
                <span className="block text-gray-600">Gravadas</span>
                <span className="font-semibold">S/. {totals.gravadas.toFixed(2)}</span>
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <span className="block text-gray-600">IGV (18%)</span>
                <span className="font-semibold">S/. {totals.igv.toFixed(2)}</span>
              </div>
              <div className="bg-gray-50 p-2 rounded">
                <span className="block text-gray-600">Exoneradas</span>
                <span className="font-semibold">S/. {totals.exoneradas.toFixed(2)}</span>
              </div>
              <div className="bg-blue-100 p-2 rounded border-l-4 border-blue-500">
                <span className="block text-blue-700 font-medium">TOTAL</span>
                <span className="font-bold text-blue-900">S/. {totals.total.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Acciones */}
          <div className="flex flex-col gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => handleSubmit(false)}
              disabled={!isValid || isSubmitting}
              className="flex items-center justify-center gap-2 h-10 text-sm"
            >
              <Save className="h-4 w-4" />
              {isSubmitting ? 'Guardando...' : 'Guardar Borrador'}
            </Button>
            <Button
              type="button"
              onClick={() => handleSubmit(true)}
              disabled={!isValid || isSubmitting}
              className="flex items-center justify-center gap-2 h-10 text-sm bg-blue-600 hover:bg-blue-700"
            >
              <Send className="h-4 w-4" />
              {isSubmitting ? 'Enviando...' : 'Crear y Enviar a SUNAT'}
            </Button>
            
            {!isValid && (
              <p className="text-xs text-red-600 text-center mt-1">
                Complete todos los campos requeridos
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
