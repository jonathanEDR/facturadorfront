/**
 * Componente para mostrar lista de clientes con funcionalidades completas
 */

"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Users, 
  Plus, 
  Search, 
  Filter, 
  Edit, 
  Trash2, 
  Eye,
  FileText,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LoadingSpinner } from '@/components/ui/loading';

// import { useClientes } from '@/hooks/useClientes';
// Migrado a useClientesContext para estado compartido
import { useClientesContext } from '@/contexts/ClientesContext';
import { 
  Cliente, 
  TIPOS_DOCUMENTO_OPTIONS, 
  getTipoDocumentoLabel,
  formatearDocumento 
} from '@/types/cliente';

interface ClientListProps {
  onSelectCliente?: (cliente: Cliente) => void;
  onEditCliente?: (cliente: Cliente) => void;
  showActions?: boolean;
  onRefreshNeeded?: () => void; // Nueva prop para sincronización
}

export function ClientList({ 
  onSelectCliente, 
  onEditCliente,
  showActions = true, 
  onRefreshNeeded
}: ClientListProps) {
  const router = useRouter();
  const {
    clientes,
    pagination,
    loading,
    error,
    filtros,
    buscarClientes,
    eliminarCliente,
    setFiltros,
    cambiarPagina,
    limpiarError
  } = useClientesContext();

  // Estado local para filtros
  const [searchTerm, setSearchTerm] = useState(filtros.query || '');
  const [tipoDocumentoFilter, setTipoDocumentoFilter] = useState(filtros.tipo_documento || '');
  const [activoFilter, setActivoFilter] = useState<boolean | undefined>(filtros.activo);

  // ...

  // ===== HANDLERS =====

  const handleSearch = (value: string) => {
    setSearchTerm(value);
    setFiltros({ ...filtros, query: value, page: 1 });
    buscarClientes({ ...filtros, query: value, page: 1 });
  };

  const handleTipoDocumentoChange = (value: string) => {
    setTipoDocumentoFilter(value);
    const nuevoTipo = value === 'todos' ? undefined : value;
    setFiltros({ ...filtros, tipo_documento: nuevoTipo, page: 1 });
    buscarClientes({ ...filtros, tipo_documento: nuevoTipo, page: 1 });
  };

  const handleActivoChange = (value: string) => {
    const nuevoActivo = value === 'todos' ? undefined : value === 'activos';
    setActivoFilter(nuevoActivo);
    setFiltros({ ...filtros, activo: nuevoActivo, page: 1 });
    buscarClientes({ ...filtros, activo: nuevoActivo, page: 1 });
  };

  const handleEliminarCliente = async (cliente: Cliente) => {
    if (window.confirm(`¿Estás seguro de eliminar al cliente ${cliente.razon_social}?`)) {
      try {
        await eliminarCliente(cliente.id);
        // Notificar al padre si hay callback
        if (onRefreshNeeded) {
          setTimeout(() => {
            onRefreshNeeded();
          }, 100);
        } else {
          // Fallback: refrescar localmente
          setTimeout(() => {
            buscarClientes();
          }, 100);
        }
      } catch {
        // Manejo de error silencioso o mostrar notificación si se desea
      }
    }
  };

  const handleVerCliente = (cliente: Cliente) => {
    if (onSelectCliente) {
      onSelectCliente(cliente);
    } else {
      router.push(`/clients/${cliente.id}`);
    }
  };

  const handleEditarCliente = (cliente: Cliente) => {
    if (onEditCliente) {
      onEditCliente(cliente);
    } else {
      router.push(`/clients/${cliente.id}/edit`);
    }
  };

  const handleCrearFactura = (cliente: Cliente) => {
    router.push(`/invoices/new?cliente_id=${cliente.id}`);
  };

  // ===== RENDER =====

  if (error) {
    return (
      <Card className="p-6">
        <div className="text-center">
          <p className="text-red-600 mb-4">{error}</p>
          <Button onClick={limpiarError} variant="outline">
            Reintentar
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filtros */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {/* Búsqueda */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
              <Input
                placeholder="Buscar clientes..."
                value={searchTerm}
                onChange={(e) => handleSearch(e.target.value)}
                className="pl-10"
              />
            </div>

            {/* Tipo de documento */}
            <Select value={tipoDocumentoFilter || 'todos'} onValueChange={handleTipoDocumentoChange}>
              <SelectTrigger>
                <SelectValue placeholder="Tipo de documento" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los documentos</SelectItem>
                {TIPOS_DOCUMENTO_OPTIONS.map(option => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {/* Estado */}
            <Select
              value={activoFilter === undefined ? 'todos' : (activoFilter ? 'activos' : 'inactivos')}
              onValueChange={handleActivoChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="todos">Todos los estados</SelectItem>
                <SelectItem value="activos">Activos</SelectItem>
                <SelectItem value="inactivos">Inactivos</SelectItem>
              </SelectContent>
            </Select>

            {/* Limpiar filtros */}
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm('');
                setTipoDocumentoFilter('');
                setActivoFilter(undefined);
                setFiltros({ page: 1, limit: 20 });
                buscarClientes({ page: 1, limit: 20 });
              }}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Limpiar
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Lista de clientes */}
      <Card>
        <CardContent className="p-0">
          {loading ? (
            <div className="p-8">
              <LoadingSpinner />
            </div>
          ) : clientes.length === 0 ? (
            <div className="p-8 text-center">
              <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No hay clientes</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || tipoDocumentoFilter ? 
                  'No se encontraron clientes con los filtros aplicados.' :
                  'Comienza agregando tu primer cliente.'
                }
              </p>
              {showActions && (
                <Button onClick={() => router.push('/clients/new')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Crear Cliente
                </Button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-4 font-medium text-gray-900">Cliente</th>
                    <th className="text-left p-4 font-medium text-gray-900">Documento</th>
                    <th className="text-left p-4 font-medium text-gray-900">Email</th>
                    <th className="text-left p-4 font-medium text-gray-900">Teléfono</th>
                    <th className="text-left p-4 font-medium text-gray-900">Estado</th>
                    {showActions && <th className="text-right p-4 font-medium text-gray-900">Acciones</th>}
                  </tr>
                </thead>
                <tbody>
                  {clientes.map((cliente) => (
                    <tr key={cliente.id} className="border-b hover:bg-gray-50 transition-colors">
                      <td className="p-4">
                        <div>
                          <h4 className="font-medium text-gray-900">{cliente.razon_social}</h4>
                          {cliente.nombre_comercial && (
                            <p className="text-sm text-gray-600">{cliente.nombre_comercial}</p>
                          )}
                          {cliente.direccion && (
                            <p className="text-xs text-gray-500 mt-1 truncate max-w-xs">
                              {cliente.direccion}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <Badge variant="outline" className="text-xs">
                            {getTipoDocumentoLabel(cliente.tipo_documento)}
                          </Badge>
                          <p className="text-sm font-mono mt-1">
                            {formatearDocumento(cliente.numero_documento, cliente.tipo_documento)}
                          </p>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          {cliente.email ? (
                            <p className="text-gray-900">{cliente.email}</p>
                          ) : (
                            <p className="text-gray-400">-</p>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm">
                          {cliente.telefono ? (
                            <p className="text-gray-900">{cliente.telefono}</p>
                          ) : (
                            <p className="text-gray-400">-</p>
                          )}
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge variant={cliente.activo ? "default" : "secondary"}>
                          {cliente.activo ? 'Activo' : 'Inactivo'}
                        </Badge>
                      </td>
                      {showActions && (
                        <td className="p-4 text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleVerCliente(cliente)}>
                                <Eye className="h-4 w-4 mr-2" />
                                Ver detalles
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleEditarCliente(cliente)}>
                                <Edit className="h-4 w-4 mr-2" />
                                Editar
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleCrearFactura(cliente)}>
                                <FileText className="h-4 w-4 mr-2" />
                                Nueva factura
                              </DropdownMenuItem>
                              <hr className="my-1" />
                              <DropdownMenuItem 
                                onClick={() => handleEliminarCliente(cliente)}
                                className="text-red-600"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Eliminar
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Paginación */}
      {pagination && pagination.total_pages > 1 && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-600">
            Mostrando {((pagination.page - 1) * pagination.limit) + 1} a{' '}
            {Math.min(pagination.page * pagination.limit, pagination.total)} de{' '}
            {pagination.total} clientes
          </p>
          
          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => cambiarPagina(pagination.page - 1)}
              disabled={!pagination.has_previous}
            >
              <ChevronLeft className="h-4 w-4" />
              Anterior
            </Button>
            
            <span className="text-sm">
              Página {pagination.page} de {pagination.total_pages}
            </span>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => cambiarPagina(pagination.page + 1)}
              disabled={!pagination.has_next}
            >
              Siguiente
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
