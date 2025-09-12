/**
 * Hook para gestión de estado de facturas
 * Maneja estado local, validaciones y comunicación con API
 */
import { useState, useCallback, useEffect, useMemo } from 'react';
import { useFacturasApi, CreateFacturaRequest, FacturaResponse, ClienteData, ItemFactura } from '@/services/facturas';
import { useNumeracionApi } from '@/services/numeracion_auth';
import { DateTimeManager } from '@/utils/datetime';

export interface CuotaFactura {
  numero: number;
  monto: number;
  fecha_vencimiento: string;
}

export interface FacturaFormData {
  // Datos básicos
  serie: string;
  numero: number;
  tipo_documento: string;
  fecha_emision: string;
  fecha_vencimiento: string;
  
  // Cliente
  cliente: ClienteData;
  
  // Items
  items: (ItemFactura & { id: number })[];
  
  // Configuración
  moneda: string;
  forma_pago: string;
  condicion_pago: string;
  cuotas: CuotaFactura[];
  cantidad_cuotas: number;
  observaciones: string;
  orden_compra: string;
  descuento_global: number;
  enviar_sunat: boolean;
}

export interface FacturaTotals {
  // Totales por tipo de afectación
  gravadas: number;
  exoneradas: number;
  inafectas: number;
  exportacion: number;
  
  // Totales de impuestos
  igv: number;
  
  // Descuentos
  descuento: number;
  
  // Total final
  total: number;
}

export interface FacturaFormState {
  data: FacturaFormData;
  totals: FacturaTotals;
  errors: Record<string, string>;
  isValid: boolean;
  isSubmitting: boolean;
  isCalculating: boolean;
}

const initialFormData: FacturaFormData = {
  serie: 'F001',
  numero: 1,
  tipo_documento: '01',
  fecha_emision: DateTimeManager.getDateString(), // Fecha actual en Perú
  fecha_vencimiento: DateTimeManager.getDateString(), // Para contado, iniciar con misma fecha
  cliente: {
    tipo_documento: '6',
    numero_documento: '',
    razon_social: '',
    direccion: '',
    email: '',
    telefono: '',
    codigo_pais: 'PE',
  },
  items: [
    {
      id: 1,
      codigo: 'ITEM001',
      descripcion: '',
      cantidad: 1,
      unidad_medida: 'NIU',
      precio_unitario: 0,
      tipo_afectacion_igv: '10',
      incluye_igv: false,
      porcentaje_igv: 18,
      descuento: 0,
    }
  ],
  moneda: 'PEN',
  forma_pago: 'Contado',
  condicion_pago: 'Contado',
  cuotas: [],
  cantidad_cuotas: 1,
  observaciones: '',
  orden_compra: '',
  descuento_global: 0,
  enviar_sunat: true,
};

const initialTotals: FacturaTotals = {
  gravadas: 0,
  exoneradas: 0,
  inafectas: 0,
  exportacion: 0,
  igv: 0,
  descuento: 0,
  total: 0,
};

export function useFacturaForm() {
  const facturasApi = useFacturasApi();
  const numeracionApi = useNumeracionApi();
  
  const [state, setState] = useState<FacturaFormState>({
    data: {
      ...initialFormData,
      fecha_emision: DateTimeManager.getDateString(), // Usar formato correcto para input date
      fecha_vencimiento: DateTimeManager.getDateString(), // Para contado, usar misma fecha
    },
    totals: initialTotals,
    errors: {},
    isValid: false,
    isSubmitting: false,
    isCalculating: false,
  });

  // Calcular totales automáticamente
  const calculateTotals = useCallback((data: FacturaFormData): FacturaTotals => {
    // Filtrar items válidos - solo requerimos precio > 0 y cantidad > 0
    const validItems = data.items.filter(item => 
      item.cantidad > 0 && item.precio_unitario > 0
    );

    let gravadas = 0;
    let exoneradas = 0;
    let inafectas = 0;
    let exportacion = 0;
    let totalIgv = 0;

    validItems.forEach(item => {
      const valorItem = item.cantidad * item.precio_unitario;
      let valorBase = valorItem;
      
      // Si incluye IGV y es gravado, calcular base sin IGV
      if (item.incluye_igv && item.tipo_afectacion_igv === '10') {
        const factor = 1 + ((item.porcentaje_igv || 18) / 100);
        valorBase = valorItem / factor;
      }

      // Aplicar descuento del item si existe
      if (item.descuento && item.descuento > 0) {
        valorBase = valorBase - item.descuento;
      }

      // Clasificar por tipo de afectación
      switch (item.tipo_afectacion_igv) {
        case '10': // Gravado
          gravadas += valorBase;
          const igvItem = valorBase * ((item.porcentaje_igv || 18) / 100);
          totalIgv += igvItem;
          break;
        case '20': // Exonerado
          exoneradas += valorBase;
          break;
        case '30': // Inafecto
          inafectas += valorBase;
          break;
        case '40': // Exportación
          exportacion += valorBase;
          break;
      }
    });

    // Aplicar descuento global
    const subtotalSinDescuento = gravadas + exoneradas + inafectas + exportacion;
    const descuentoGlobal = data.descuento_global ? (subtotalSinDescuento * data.descuento_global) / 100 : 0;
    
    // Recalcular después del descuento global (proporcionalmente)
    if (descuentoGlobal > 0) {
      const factor = (subtotalSinDescuento - descuentoGlobal) / subtotalSinDescuento;
      gravadas *= factor;
      exoneradas *= factor;
      inafectas *= factor;
      exportacion *= factor;
      totalIgv *= factor;
    }

    const total = gravadas + exoneradas + inafectas + exportacion + totalIgv;

    const result = {
      gravadas: Math.round(gravadas * 100) / 100,
      exoneradas: Math.round(exoneradas * 100) / 100,
      inafectas: Math.round(inafectas * 100) / 100,
      exportacion: Math.round(exportacion * 100) / 100,
      igv: Math.round(totalIgv * 100) / 100,
      descuento: Math.round(descuentoGlobal * 100) / 100,
      total: Math.round(total * 100) / 100,
    };
    return result;
  }, []);

  // Validar formulario
  const validateForm = useCallback((data: FacturaFormData): Record<string, string> => {
    const errors: Record<string, string> = {};

    // Validar serie - validación básica y flexible
    if (!data.serie?.trim()) {
      errors.serie = 'Serie es obligatoria';
    } else if (data.serie.length !== 4) {
      errors.serie = 'Serie debe tener exactamente 4 caracteres';
    } else if (!['F', 'B', 'T'].includes(data.serie[0].toUpperCase())) {
      errors.serie = 'Serie debe comenzar con F, B o T';
    }
    // Nota: Validación de configuración de serie se hace al seleccionar la serie

    // Validar cliente
    if (!data.cliente.numero_documento.trim()) {
      errors['cliente.numero_documento'] = 'Número de documento es obligatorio';
    }

    if (!data.cliente.razon_social?.trim()) {
      errors['cliente.razon_social'] = 'Razón social es obligatoria';
    }

    if (!data.cliente.direccion?.trim()) {
      errors['cliente.direccion'] = 'Dirección es obligatoria';
    }

    // Validar RUC si es tipo 6
    if (data.cliente.tipo_documento === '6' && !/^\d{11}$/.test(data.cliente.numero_documento)) {
      errors['cliente.numero_documento'] = 'RUC debe tener 11 dígitos';
    }

    // Validar DNI si es tipo 1
    if (data.cliente.tipo_documento === '1' && !/^\d{8}$/.test(data.cliente.numero_documento)) {
      errors['cliente.numero_documento'] = 'DNI debe tener 8 dígitos';
    }

    // Validar items
    if (data.items.length === 0) {
      errors.items = 'Debe incluir al menos un item';
    }

    data.items.forEach((item, index) => {
      if (!item.descripcion.trim()) {
        errors[`items.${index}.descripcion`] = 'Descripción es obligatoria';
      }
      if (item.cantidad <= 0) {
        errors[`items.${index}.cantidad`] = 'Cantidad debe ser mayor a 0';
      }
      if (item.precio_unitario < 0) {
        errors[`items.${index}.precio_unitario`] = 'Precio no puede ser negativo';
      }
    });

    // Validar fechas
    if (!data.fecha_emision) {
      errors.fecha_emision = 'Fecha de emisión es obligatoria';
    }

    return errors;
  }, []);

  // Actualizar datos del formulario
  const updateFormData = useCallback((updates: Partial<FacturaFormData>) => {
    setState(prev => {
      const newData = { ...prev.data, ...updates };
      const newTotals = calculateTotals(newData);
      const newErrors = validateForm(newData);
      
      return {
        ...prev,
        data: newData,
        totals: newTotals,
        errors: newErrors,
        isValid: Object.keys(newErrors).length === 0,
      };
    });
  }, [calculateTotals, validateForm]);

  // Actualizar item específico
  const updateItem = useCallback((id: number, updates: Partial<ItemFactura>) => {
    
    setState(prev => {
      const newItems = prev.data.items.map(item => 
        item.id === id ? { ...item, ...updates } : item
      );
      
      const newData = { ...prev.data, items: newItems };
      
      const newTotals = calculateTotals(newData);
      const newErrors = validateForm(newData);
      
      return {
        ...prev,
        data: newData,
        totals: newTotals,
        errors: newErrors,
        isValid: Object.keys(newErrors).length === 0,
      };
    });
  }, [calculateTotals, validateForm]);

  // Agregar nuevo item
  const addItem = useCallback(() => {
    const maxId = Math.max(...state.data.items.map(item => item.id), 0);
    const newItem: ItemFactura & { id: number } = {
      id: maxId + 1,
      codigo: `ITEM${String(state.data.items.length + 1).padStart(3, '0')}`,
      descripcion: '',
      cantidad: 1,
      unidad_medida: 'NIU',
      precio_unitario: 0,
      tipo_afectacion_igv: '10',
      incluye_igv: false,
      porcentaje_igv: 18,
    };

    updateFormData({
      items: [...state.data.items, newItem]
    });
  }, [state.data.items, updateFormData]);

  // Eliminar item por ID
  const removeItem = useCallback((id: number) => {
    if (state.data.items.length > 1) {
      const newItems = state.data.items.filter(item => item.id !== id);
      updateFormData({ items: newItems });
    }
  }, [state.data.items, updateFormData]);

  // Enviar factura
  const submitFactura = useCallback(async (): Promise<FacturaResponse | null> => {
    if (!state.isValid) {
      throw new Error('Formulario contiene errores');
    }

    setState(prev => ({ ...prev, isSubmitting: true }));

    try {
      const requestData: CreateFacturaRequest = {
        serie: state.data.serie,
        numero: Number(state.data.numero) || 1, // Asegurar que sea número
        tipo_documento: state.data.tipo_documento,
        fecha_emision: state.data.fecha_emision,
        fecha_vencimiento: state.data.fecha_vencimiento || undefined,
        cliente: state.data.cliente,
        items: state.data.items.map(({ id: _id, ...item }) => item), // Remover el ID local
        moneda: state.data.moneda,
        forma_pago: state.data.forma_pago,
        condicion_pago: state.data.condicion_pago,
        cuotas: state.data.cuotas.length > 0 ? state.data.cuotas : undefined,
        observaciones: state.data.observaciones || undefined,
        orden_compra: state.data.orden_compra || undefined,
        descuento_global: state.data.descuento_global,
      };

      const response = await facturasApi.crearFactura(requestData, state.data.enviar_sunat);
      
      if (response.success && response.data) {
        return response.data;
      } else {
        throw new Error(response.message || 'Error al crear factura');
      }
    } catch (error) {
      console.error('Error submitting factura:', error);
      throw error;
    } finally {
      setState(prev => ({ ...prev, isSubmitting: false }));
    }
  }, [state.isValid, state.data, facturasApi]);

  // Resetear formulario
  const resetForm = useCallback(() => {
    const fechaActual = DateTimeManager.getDateString();
    setState({
      data: {
        ...initialFormData,
        fecha_emision: fechaActual,
        fecha_vencimiento: fechaActual, // Para contado, usar misma fecha
      },
      totals: initialTotals,
      errors: {},
      isValid: false,
      isSubmitting: false,
      isCalculating: false,
    });
  }, []);

  // Cargar datos de cliente por RUC/DNI
  const loadClientData = useCallback(async (documento: string) => {
    // TODO: Implementar consulta a APIs de RENIEC/SUNAT
    console.log('Loading client data for:', documento);
  }, []);

  // Autocompletar numeración para una serie
  const autocompletarNumeracion = useCallback(async (serie: string) => {
    try {
      const siguienteNumero = await numeracionApi.obtenerSiguienteNumero(serie);
      
      updateFormData({
        serie: serie,
        numero: siguienteNumero?.siguiente_numero || 1
      });

      return siguienteNumero;
    } catch (error) {
      console.error('Error autocomplete numeracion:', error);
      // Si hay error, mantener valores actuales
      throw error;
    }
  }, [numeracionApi, updateFormData]);

  // Verificar si una serie está configurada
  const verificarSerieConfigurada = useCallback(async (serie: string): Promise<boolean> => {
    try {
      await numeracionApi.obtenerContador(serie);
      return true;
    } catch {
      return false;
    }
  }, [numeracionApi]);

  // Obtener series disponibles
  const obtenerSeriesDisponibles = useCallback(async (): Promise<string[]> => {
    try {
      return await numeracionApi.obtenerSeries();
    } catch (error) {
      console.error('Error obteniendo series:', error);
      return ['F001', 'B001']; // Fallback a series por defecto
    }
  }, [numeracionApi]);

  // Calcular fecha de vencimiento automática
  const calcularFechaVencimiento = useCallback((fechaEmision: string, condicionPago: string): string => {
    if (!fechaEmision) return '';
    
    const fecha = new Date(fechaEmision);
    
    if (condicionPago === 'Contado') {
      // Para contado, usar la misma fecha de emisión
      return fechaEmision;
    } else {
      // Para crédito, extraer días de la condición de pago (ej: "Credito a 30 dias" -> 30)
      const match = condicionPago.match(/(\d+)\s*dias?/i);
      const dias = match ? parseInt(match[1]) : 30;
      
      fecha.setDate(fecha.getDate() + dias);
      return fecha.toISOString().split('T')[0];
    }
  }, []);

  // Generar cuotas automáticamente
  const generarCuotas = useCallback((cantidadCuotas: number, total: number, fechaVencimiento: string): CuotaFactura[] => {
    if (cantidadCuotas <= 0 || total <= 0 || !fechaVencimiento) return [];
    
    const cuotas: CuotaFactura[] = [];
    const montoPorCuota = Math.round((total / cantidadCuotas) * 100) / 100;
    const fechaBase = new Date(fechaVencimiento);
    
    for (let i = 1; i <= cantidadCuotas; i++) {
      const fechaCuota = new Date(fechaBase);
      fechaCuota.setMonth(fechaBase.getMonth() + (i - 1));
      
      // Ajustar el monto de la última cuota para compensar redondeos
      const monto = i === cantidadCuotas 
        ? total - (montoPorCuota * (cantidadCuotas - 1))
        : montoPorCuota;
      
      cuotas.push({
        numero: i,
        monto: Math.round(monto * 100) / 100,
        fecha_vencimiento: fechaCuota.toISOString().split('T')[0]
      });
    }
    
    return cuotas;
  }, []);

  // Actualizar condición de pago y manejar lógica automática
  const actualizarCondicionPago = useCallback((condicionPago: string) => {
    const esCredito = condicionPago !== 'Contado';
    const fechaVencimiento = calcularFechaVencimiento(state.data.fecha_emision, condicionPago);
    
    let cuotas: CuotaFactura[] = [];
    if (esCredito && state.totals.total > 0 && fechaVencimiento) {
      cuotas = generarCuotas(state.data.cantidad_cuotas, state.totals.total, fechaVencimiento);
    }
    
    updateFormData({
      condicion_pago: condicionPago,
      fecha_vencimiento: fechaVencimiento,
      cuotas: cuotas
    });
  }, [state.data.fecha_emision, state.data.cantidad_cuotas, state.totals.total, calcularFechaVencimiento, generarCuotas, updateFormData]);

  // Actualizar cantidad de cuotas
  const actualizarCantidadCuotas = useCallback((cantidad: number) => {
    const esCredito = state.data.condicion_pago !== 'Contado';
    let cuotas: CuotaFactura[] = [];
    
    if (esCredito && state.totals.total > 0 && state.data.fecha_vencimiento) {
      cuotas = generarCuotas(cantidad, state.totals.total, state.data.fecha_vencimiento);
    }
    
    updateFormData({
      cantidad_cuotas: cantidad,
      cuotas: cuotas
    });
  }, [state.data.condicion_pago, state.data.fecha_vencimiento, state.totals.total, generarCuotas, updateFormData]);

  // Actualizar fecha de emisión y recalcular fecha de vencimiento
  const actualizarFechaEmision = useCallback((fechaEmision: string) => {
    const fechaVencimiento = calcularFechaVencimiento(fechaEmision, state.data.condicion_pago);
    
    let cuotas: CuotaFactura[] = [];
    const esCredito = state.data.condicion_pago !== 'Contado';
    if (esCredito && state.totals.total > 0 && fechaVencimiento) {
      cuotas = generarCuotas(state.data.cantidad_cuotas, state.totals.total, fechaVencimiento);
    }
    
    updateFormData({
      fecha_emision: fechaEmision,
      fecha_vencimiento: fechaVencimiento,
      cuotas: cuotas
    });
  }, [state.data.condicion_pago, state.data.cantidad_cuotas, state.totals.total, calcularFechaVencimiento, generarCuotas, updateFormData]);

  // COMENTADO: useEffect problemático que causa bucles infinitos
  // El cálculo de totales se hace directamente en updateFormData y updateItem
  /*
  useEffect(() => {
    // Recalcular totales cuando cambien los items
    const newTotals = calculateTotals(state.data);
    
    // Solo actualizar si los totales realmente cambiaron
    if (JSON.stringify(newTotals) !== JSON.stringify(state.totals)) {
      const newErrors = validateForm(state.data);
      
      // Recalcular cuotas si es a crédito y hay un total
      let newCuotas = state.data.cuotas;
      if (state.data.condicion_pago !== 'Contado' && newTotals.total > 0 && state.data.fecha_vencimiento) {
        newCuotas = generarCuotas(state.data.cantidad_cuotas, newTotals.total, state.data.fecha_vencimiento);
      }
      
      setState(prev => ({
        ...prev,
        data: {
          ...prev.data,
          cuotas: newCuotas
        },
        totals: newTotals,
        errors: newErrors,
        isValid: Object.keys(newErrors).length === 0,
      }));
    }
  }, [
    // Dependencias serializadas para evitar cambios de referencia
    state.data.items.map(item => `${item.id}-${item.cantidad}-${item.precio_unitario}-${item.tipo_afectacion_igv}-${item.incluye_igv}-${item.descuento}`).join('|'),
    state.data.descuento_global,
    state.data.condicion_pago,
    state.data.cantidad_cuotas,
    state.data.fecha_vencimiento
  ]);
  */

  // useEffect para limpieza y casos edge
  useEffect(() => {
    // Reserved para casos especiales de sincronización
  }, [state.totals, state.data.items]);

  // Calcular totales con useMemo para optimización
  const currentTotals = useMemo(() => {
    return calculateTotals(state.data);
  }, [state.data.items, state.data.descuento_global, calculateTotals]);

  return {
    // Estado
    formData: state.data,
    totals: currentTotals, // Usar los totales calculados directamente
    errors: state.errors,
    isValid: state.isValid,
    isSubmitting: state.isSubmitting,
    
    // Acciones
    updateFormData,
    updateItem,
    addItem,
    removeItem,
    submitFactura,
    resetForm,
    loadClientData,
    
    // Control de condiciones de pago y cuotas
    actualizarCondicionPago,
    actualizarCantidadCuotas,
    actualizarFechaEmision,
    
    // Numeración automática
    autocompletarNumeracion,
    verificarSerieConfigurada,
    obtenerSeriesDisponibles,
    
    // Utilidades
    calculateTotals: () => calculateTotals(state.data),
    validateForm: () => validateForm(state.data),
  };
}
