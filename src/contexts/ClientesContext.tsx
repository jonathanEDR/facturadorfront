/**
 * Contexto global para gestión de clientes
 * Proporciona estado compartido entre todos los componentes
 */

"use client";

import React, { createContext, useContext, useReducer, useCallback, useRef, useEffect, useState, ReactNode } from 'react';
import { useClientesService } from '@/services/clientes';
import {
  Cliente,
  CreateClienteRequest,
  UpdateClienteRequest,
  BuscarClientesRequest,
  PaginationInfo
} from '@/types/cliente';

// ===== TIPOS =====

interface ClientesState {
  clientes: Cliente[];
  pagination: PaginationInfo | null;
  loading: boolean;
  error: string | null;
  filtros: BuscarClientesRequest;
}

interface ClientesContextType extends ClientesState {
  // Acciones CRUD
  crearCliente: (data: CreateClienteRequest) => Promise<Cliente>;
  buscarClientes: (filtros?: BuscarClientesRequest) => Promise<void>;
  actualizarCliente: (id: string, data: UpdateClienteRequest) => Promise<Cliente>;
  eliminarCliente: (id: string) => Promise<void>;
  
  // Utilidades
  refrescarLista: () => Promise<void>;
  cambiarPagina: (page: number) => Promise<void>;
  setFiltros: (filtros: BuscarClientesRequest) => void;
  limpiarError: () => void;
}

// ===== REDUCER =====

type ClientesAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_CLIENTES'; payload: { clientes: Cliente[]; pagination: PaginationInfo | null } }
  | { type: 'SET_FILTROS'; payload: BuscarClientesRequest }
  | { type: 'ADD_CLIENTE'; payload: Cliente }
  | { type: 'UPDATE_CLIENTE'; payload: Cliente }
  | { type: 'REMOVE_CLIENTE'; payload: string };

function clientesReducer(state: ClientesState, action: ClientesAction): ClientesState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, loading: action.payload };
      
    case 'SET_ERROR':
      return { ...state, error: action.payload, loading: false };
      
    case 'SET_CLIENTES':
      return {
        ...state,
        clientes: action.payload.clientes,
        pagination: action.payload.pagination,
        loading: false,
        error: null
      };
      
    case 'SET_FILTROS':
      return { ...state, filtros: action.payload };
      
    case 'ADD_CLIENTE':
      return {
        ...state,
        clientes: [action.payload, ...state.clientes],
        pagination: state.pagination ? {
          ...state.pagination,
          total: state.pagination.total + 1
        } : null
      };
      
    case 'UPDATE_CLIENTE':
      return {
        ...state,
        clientes: state.clientes.map(cliente =>
          cliente.id === action.payload.id ? action.payload : cliente
        )
      };
      
    case 'REMOVE_CLIENTE':
      return {
        ...state,
        clientes: state.clientes.filter(cliente => cliente.id !== action.payload),
        pagination: state.pagination ? {
          ...state.pagination,
          total: state.pagination.total - 1
        } : null
      };
      
    default:
      return state;
  }
}

// ===== CONTEXTO =====

const ClientesContext = createContext<ClientesContextType | undefined>(undefined);

// ===== PROVIDER =====

interface ClientesProviderProps {
  children: ReactNode;
}

export function ClientesProvider({ children }: ClientesProviderProps) {
  const clientesService = useClientesService();
  
  const initialState: ClientesState = {
    clientes: [],
    pagination: null,
    loading: false,
    error: null,
    filtros: {
      page: 1,
      limit: 20,
      order_by: 'fecha_creacion',
      order_direction: 'desc',
    }
  };

  const [state, dispatch] = useReducer(clientesReducer, initialState);
  
  // Ref para acceder a los filtros actuales sin causar re-renders
  const filtrosRef = useRef(state.filtros);
  filtrosRef.current = state.filtros;

  // ===== ACCIONES =====

  const crearCliente = useCallback(async (data: CreateClienteRequest): Promise<Cliente> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      const nuevoCliente = await clientesService.crearCliente(data);
      dispatch({ type: 'ADD_CLIENTE', payload: nuevoCliente });
      dispatch({ type: 'SET_LOADING', payload: false });
      return nuevoCliente;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al crear cliente';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  }, [clientesService]);

  const buscarClientes = useCallback(async (nuevosFiltros?: BuscarClientesRequest): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      const filtrosToUse = nuevosFiltros || filtrosRef.current;
      const resultado = await clientesService.buscarClientes(filtrosToUse);
      dispatch({ 
        type: 'SET_CLIENTES', 
        payload: { 
          clientes: resultado.clientes, 
          pagination: resultado.pagination 
        } 
      });
      if (nuevosFiltros) {
        dispatch({ type: 'SET_FILTROS', payload: filtrosToUse });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al buscar clientes';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
    }
  }, [clientesService]);

  const actualizarCliente = useCallback(async (id: string, data: UpdateClienteRequest): Promise<Cliente> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      
      const clienteActualizado = await clientesService.actualizarCliente(id, data);
      
      dispatch({ type: 'UPDATE_CLIENTE', payload: clienteActualizado });
      dispatch({ type: 'SET_LOADING', payload: false });
      
      return clienteActualizado;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al actualizar cliente';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  }, [clientesService]);

  const eliminarCliente = useCallback(async (id: string): Promise<void> => {
    try {
      dispatch({ type: 'SET_LOADING', payload: true });
      dispatch({ type: 'SET_ERROR', payload: null });
      await clientesService.eliminarCliente(id);
      dispatch({ type: 'REMOVE_CLIENTE', payload: id });
      dispatch({ type: 'SET_LOADING', payload: false });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Error al eliminar cliente';
      dispatch({ type: 'SET_ERROR', payload: errorMessage });
      throw error;
    }
  }, [clientesService]);

  const refrescarLista = useCallback(async (): Promise<void> => {
    await buscarClientes();
  }, [buscarClientes]);

  const cambiarPagina = useCallback(async (page: number): Promise<void> => {
    const nuevosFiltros = { ...filtrosRef.current, page };
    await buscarClientes(nuevosFiltros);
  }, [buscarClientes]);

  const setFiltros = useCallback((filtros: BuscarClientesRequest) => {
    dispatch({ type: 'SET_FILTROS', payload: filtros });
  }, []);

  const limpiarError = useCallback(() => {
    dispatch({ type: 'SET_ERROR', payload: null });
  }, []);

  const contextValue: ClientesContextType = {
    // Estado
    ...state,
    
    // Acciones
    crearCliente,
    buscarClientes,
    actualizarCliente,
    eliminarCliente,
    refrescarLista,
    cambiarPagina,
    setFiltros,
    limpiarError,
  };

  // ===== EFECTOS =====

  // Cargar clientes iniciales cuando se monta el proveedor (solo una vez)
  const [initialLoadDone, setInitialLoadDone] = useState(false);
  
  useEffect(() => {
    let isMounted = true;
    const cargarDatosIniciales = async () => {
      if (isMounted && !initialLoadDone && !state.loading && state.clientes.length === 0) {
        setInitialLoadDone(true);
        await buscarClientes();
      }
    };
    cargarDatosIniciales();
    return () => {
      isMounted = false;
    };
  }, [initialLoadDone, state.loading, state.clientes.length, buscarClientes]);

  return (
    <ClientesContext.Provider value={contextValue}>
      {children}
    </ClientesContext.Provider>
  );
}

// ===== HOOK =====

export function useClientesContext(): ClientesContextType {
  const context = useContext(ClientesContext);
  if (context === undefined) {
    throw new Error('useClientesContext debe usarse dentro de un ClientesProvider');
  }
  return context;
}
