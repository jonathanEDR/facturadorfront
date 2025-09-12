/**
 * Hook personalizado para gestión de clientes
 */

import { useState, useEffect, useCallback } from 'react';
import { useClientesService } from '@/services/clientes';
import {
  Cliente,
  CreateClienteRequest,
  UpdateClienteRequest,
  BuscarClientesRequest,
  ValidarDocumentoRequest,
  ValidarDocumentoResponse,
  PaginationInfo
} from '@/types/cliente';

interface UseClientesState {
  clientes: Cliente[];
  clienteActual: Cliente | null;
  pagination: PaginationInfo | null;
  loading: boolean;
  error: string | null;
  validacionDocumento: ValidarDocumentoResponse | null;
}

interface UseClientesActions {
  // CRUD operations
  crearCliente: (data: CreateClienteRequest) => Promise<Cliente>;
  buscarClientes: (filtros?: BuscarClientesRequest) => Promise<void>;
  obtenerCliente: (id: string) => Promise<Cliente>;
  actualizarCliente: (id: string, data: UpdateClienteRequest) => Promise<Cliente>;
  eliminarCliente: (id: string, forzar?: boolean) => Promise<void>;
  
  // Validaciones
  validarDocumento: (data: ValidarDocumentoRequest) => Promise<ValidarDocumentoResponse>;
  
  // Utilidades
  refrescarLista: () => Promise<void>;
  limpiarError: () => void;
  limpiarClienteActual: () => void;
  cambiarPagina: (page: number) => Promise<void>;
  
  // Estado local
  setFiltros: (filtros: BuscarClientesRequest) => void;
  filtros: BuscarClientesRequest;
}

export function useClientes(): UseClientesState & UseClientesActions {
  const clientesService = useClientesService();
  
  // Estado principal
  const [state, setState] = useState<UseClientesState>({
    clientes: [],
    clienteActual: null,
    pagination: null,
    loading: false,
    error: null,
    validacionDocumento: null,
  });

  // Filtros actuales
  const [filtros, setFiltrosState] = useState<BuscarClientesRequest>({
    page: 1,
    limit: 20,
    order_by: 'fecha_creacion',
    order_direction: 'desc',
  });

  // ===== UTILIDADES =====

  const updateState = useCallback((updates: Partial<UseClientesState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  const limpiarError = useCallback(() => {
    updateState({ error: null });
  }, [updateState]);

  const limpiarClienteActual = useCallback(() => {
    updateState({ clienteActual: null });
  }, [updateState]);

  // ===== OPERACIONES CRUD =====

  const crearCliente = useCallback(async (data: CreateClienteRequest): Promise<Cliente> => {
    try {
      updateState({ loading: true, error: null });
      
      console.log('🏗️ [useClientes] Creando cliente:', data);
      const nuevoCliente = await clientesService.crearCliente(data);
      
      console.log('✅ [useClientes] Cliente creado exitosamente:', nuevoCliente);
      console.log('📝 [useClientes] Añadiendo cliente a la lista local...');
      
      // Añadir al inicio de la lista actual
      setState(prev => {
        const nuevaLista = [nuevoCliente, ...prev.clientes];
        console.log('📊 [useClientes] Lista actualizada, total clientes:', nuevaLista.length);
        return {
          ...prev,
          clientes: nuevaLista,
          loading: false,
        };
      });
      
      return nuevoCliente;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al crear cliente';
      console.error('❌ [useClientes] Error al crear cliente:', error);
      updateState({ error: errorMessage, loading: false });
      throw error;
    }
  }, [clientesService, updateState]);

  const buscarClientes = useCallback(async (nuevosFiltros?: BuscarClientesRequest): Promise<void> => {
    try {
      updateState({ loading: true, error: null });
      
      const filtrosToUse = nuevosFiltros || filtros;
      console.log('🔍 [useClientes] Buscando clientes con filtros:', filtrosToUse);
      
      const resultado = await clientesService.buscarClientes(filtrosToUse);
      
      console.log('✅ [useClientes] Clientes encontrados:', resultado.clientes.length);
      updateState({
        clientes: resultado.clientes,
        pagination: resultado.pagination,
        loading: false,
      });
      
      if (nuevosFiltros) {
        setFiltrosState(filtrosToUse);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al buscar clientes';
      console.error('❌ [useClientes] Error al buscar clientes:', error);
      updateState({ error: errorMessage, loading: false });
    }
  }, [clientesService, filtros, updateState]);

  const obtenerCliente = useCallback(async (id: string): Promise<Cliente> => {
    try {
      updateState({ loading: true, error: null });
      
      const cliente = await clientesService.obtenerCliente(id);
      
      updateState({
        clienteActual: cliente,
        loading: false,
      });
      
      return cliente;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al obtener cliente';
      updateState({ error: errorMessage, loading: false });
      throw error;
    }
  }, [clientesService, updateState]);

  const actualizarCliente = useCallback(async (
    id: string, 
    data: UpdateClienteRequest
  ): Promise<Cliente> => {
    try {
      updateState({ loading: true, error: null });
      
      const clienteActualizado = await clientesService.actualizarCliente(id, data);
      
      // Actualizar en la lista y en el cliente actual
      setState(prev => ({
        ...prev,
        clientes: prev.clientes.map(c => 
          c.id === id ? clienteActualizado : c
        ),
        clienteActual: prev.clienteActual?.id === id ? clienteActualizado : prev.clienteActual,
        loading: false,
      }));
      
      return clienteActualizado;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al actualizar cliente';
      updateState({ error: errorMessage, loading: false });
      throw error;
    }
  }, [clientesService, updateState]);

  const eliminarCliente = useCallback(async (id: string, forzar: boolean = false): Promise<void> => {
    try {
      updateState({ loading: true, error: null });
      
      await clientesService.eliminarCliente(id, forzar);
      
      if (forzar) {
        // Eliminación física: remover de la lista
        setState(prev => ({
          ...prev,
          clientes: prev.clientes.filter(c => c.id !== id),
          clienteActual: prev.clienteActual?.id === id ? null : prev.clienteActual,
          loading: false,
        }));
      } else {
        // Eliminación lógica: marcar como inactivo
        setState(prev => ({
          ...prev,
          clientes: prev.clientes.map(c => 
            c.id === id ? { ...c, activo: false } : c
          ),
          clienteActual: prev.clienteActual?.id === id 
            ? { ...prev.clienteActual, activo: false } 
            : prev.clienteActual,
          loading: false,
        }));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al eliminar cliente';
      updateState({ error: errorMessage, loading: false });
      throw error;
    }
  }, [clientesService, updateState]);

  // ===== VALIDACIONES =====

  const validarDocumento = useCallback(async (
    data: ValidarDocumentoRequest
  ): Promise<ValidarDocumentoResponse> => {
    try {
      updateState({ loading: true, error: null });
      
      const resultado = await clientesService.validarDocumento(data);
      
      updateState({
        validacionDocumento: resultado,
        loading: false,
      });
      
      return resultado;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al validar documento';
      updateState({ error: errorMessage, loading: false });
      throw error;
    }
  }, [clientesService, updateState]);

  // ===== UTILIDADES ADICIONALES =====

  const refrescarLista = useCallback(async (): Promise<void> => {
    console.log('🔄 [useClientes] Refrescando lista de clientes...');
    await buscarClientes();
  }, [buscarClientes]);

  const cambiarPagina = useCallback(async (page: number): Promise<void> => {
    const nuevosFiltros = { ...filtros, page };
    await buscarClientes(nuevosFiltros);
  }, [filtros, buscarClientes]);

  const setFiltros = useCallback((nuevosFiltros: BuscarClientesRequest) => {
    setFiltrosState(prev => ({ ...prev, ...nuevosFiltros }));
  }, []);

  // ===== EFECTOS =====

  // Cargar clientes iniciales solo si no hay contexto disponible
  useEffect(() => {
    let isMounted = true;
    
    const cargarInicial = async () => {
      if (isMounted && state.clientes.length === 0 && !state.loading) {
        console.log('🔄 [useClientes] Cargando datos iniciales (fallback)...');
        await buscarClientes();
      }
    };
    
    cargarInicial();
    
    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo al montar el componente

  return {
    // Estado
    ...state,
    
    // Acciones CRUD
    crearCliente,
    buscarClientes,
    obtenerCliente,
    actualizarCliente,
    eliminarCliente,
    
    // Validaciones
    validarDocumento,
    
    // Utilidades
    refrescarLista,
    limpiarError,
    limpiarClienteActual,
    cambiarPagina,
    
    // Filtros
    setFiltros,
    filtros,
  };
}
