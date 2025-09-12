/**
 * Servicio API para gestión de clientes
 */

import { useApi } from '@/hooks/useApi';
import {
  Cliente,
  CreateClienteRequest,
  UpdateClienteRequest,
  BuscarClientesRequest,
  ValidarDocumentoRequest,
  ListaClientesResponse,
  ValidarDocumentoResponse,
  EstadisticasClientesResponse
} from '@/types/cliente';

export interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T;
  timestamp: string;
  request_id?: string;
}

export class ClientesApiService {
  private baseUrl: string;
  private apiCall: ReturnType<typeof useApi>['apiCall'];

  constructor(apiCall: ReturnType<typeof useApi>['apiCall']) {
    this.baseUrl = '/clientes';
    this.apiCall = apiCall;
  }

  /**
   * Crear un nuevo cliente
   */
  async crearCliente(data: CreateClienteRequest): Promise<Cliente> {
    const response = await this.apiCall<ApiResponse<Cliente>>(
      this.baseUrl,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );

    if (response.error) {
      throw new Error(response.error);
    }

    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Error al crear cliente');
    }

    return response.data.data;
  }

  /**
   * Buscar clientes con filtros y paginación
   */
  async buscarClientes(filtros: BuscarClientesRequest = {}): Promise<ListaClientesResponse> {
    // Construir query parameters
    const params = new URLSearchParams();
    
    if (filtros.query) params.append('query', filtros.query);
    if (filtros.tipo_documento) params.append('tipo_documento', filtros.tipo_documento);
    if (filtros.numero_documento) params.append('numero_documento', filtros.numero_documento);
    if (filtros.activo !== undefined) params.append('activo', filtros.activo.toString());
    if (filtros.page) params.append('page', filtros.page.toString());
    if (filtros.limit) params.append('limit', filtros.limit.toString());
    if (filtros.order_by) params.append('order_by', filtros.order_by);
    if (filtros.order_direction) params.append('order_direction', filtros.order_direction);

    const url = params.toString() ? `${this.baseUrl}?${params.toString()}` : this.baseUrl;

    const response = await this.apiCall<ApiResponse<ListaClientesResponse>>(url);

    if (response.error) {
      throw new Error(response.error);
    }

    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Error al buscar clientes');
    }

    return response.data.data;
  }

  /**
   * Obtener cliente por ID
   */
  async obtenerCliente(id: string): Promise<Cliente> {
    const response = await this.apiCall<ApiResponse<Cliente>>(`${this.baseUrl}/${id}`);

    if (response.error) {
      throw new Error(response.error);
    }

    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Error al obtener cliente');
    }

    return response.data.data;
  }

  /**
   * Actualizar cliente
   */
  async actualizarCliente(id: string, data: UpdateClienteRequest): Promise<Cliente> {
    const response = await this.apiCall<ApiResponse<Cliente>>(
      `${this.baseUrl}/${id}`,
      {
        method: 'PUT',
        body: JSON.stringify(data),
      }
    );

    if (response.error) {
      throw new Error(response.error);
    }

    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Error al actualizar cliente');
    }

    return response.data.data;
  }

  /**
   * Eliminar cliente (desactivar por defecto)
   */
  async eliminarCliente(id: string, forzarEliminacion: boolean = false): Promise<void> {
    const params = forzarEliminacion ? '?forzar_eliminacion=true' : '';
    
    const response = await this.apiCall<ApiResponse<any>>(
      `${this.baseUrl}/${id}${params}`,
      {
        method: 'DELETE',
      }
    );

    if (response.error) {
      throw new Error(response.error);
    }

    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Error al eliminar cliente');
    }
  }

  /**
   * Validar documento con SUNAT/RENIEC
   */
  async validarDocumento(data: ValidarDocumentoRequest): Promise<ValidarDocumentoResponse> {
    const response = await this.apiCall<ApiResponse<ValidarDocumentoResponse>>(
      `${this.baseUrl}/validar-documento`,
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );

    if (response.error) {
      throw new Error(response.error);
    }

    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Error al validar documento');
    }

    return response.data.data;
  }

  /**
   * Obtener estadísticas de clientes
   */
  async obtenerEstadisticas(): Promise<EstadisticasClientesResponse> {
    const response = await this.apiCall<ApiResponse<EstadisticasClientesResponse>>(
      `${this.baseUrl}/estadisticas/general`
    );

    if (response.error) {
      throw new Error(response.error);
    }

    if (!response.data?.success) {
      throw new Error(response.data?.message || 'Error al obtener estadísticas');
    }

    return response.data.data;
  }
}

/**
 * Hook personalizado para usar el servicio de clientes
 */
export function useClientesService() {
  const { apiCall } = useApi();
  
  return new ClientesApiService(apiCall);
}
