'use client'

import React, { useState, useEffect, useCallback, useMemo } from 'react'
import { Building2, Plus, Search, Filter, MoreHorizontal, Settings, Edit, Trash2, Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { LoadingCard } from '@/components/ui/loading'
import { useEmpresa } from '@/hooks/useEmpresa'
import { EmpresaResponse } from '@/types/empresa'
import { formatearRuc } from '@/utils/validations/empresa'
import { toast } from 'react-hot-toast'

interface EmpresaListProps {
  onSelectEmpresa: (empresa: EmpresaResponse) => void
  onEditEmpresa: (empresa: EmpresaResponse) => void
  onConfigureEmpresa: (empresa: EmpresaResponse) => void
  onCreateNew: () => void
}

// Componente memoizado para las tarjetas de empresa
const EmpresaCard = React.memo(function EmpresaCard({ 
  empresa, 
  onSelect, 
  onEdit, 
  onConfigure, 
  onDelete 
}: {
  empresa: EmpresaResponse
  onSelect: (empresa: EmpresaResponse) => void
  onEdit: (empresa: EmpresaResponse) => void
  onConfigure: (empresa: EmpresaResponse) => void
  onDelete: (empresaId: string) => void
}) {
  const getStatusBadge = (activa: boolean) => {
    return (
      <Badge variant={activa ? 'default' : 'secondary'}>
        {activa ? 'Activa' : 'Inactiva'}
      </Badge>
    )
  }

  return (
    <Card key={empresa.id} className="hover:shadow-md transition-shadow">
      <CardContent className="p-4">
        <div className="flex items-center justify-between">
          {/* Información principal compacta */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <h3 className="text-base font-semibold text-gray-900 truncate">
                {empresa.razon_social}
              </h3>
              <div className="flex gap-1 flex-shrink-0">
                {getStatusBadge(empresa.activa)}
                {empresa.es_empresa_defecto && (
                  <Badge variant="outline" className="text-xs">Defecto</Badge>
                )}
              </div>
            </div>
            
            <div className="flex items-center gap-4 text-sm text-gray-600">
              <span className="font-mono">{formatearRuc(empresa.ruc)}</span>
              {empresa.nombre_comercial && (
                <span className="truncate">{empresa.nombre_comercial}</span>
              )}
              <span className="text-xs">
                {new Date(empresa.fecha_creacion).toLocaleDateString()}
              </span>
            </div>
          </div>

          {/* Acciones compactas */}
          <div className="flex items-center gap-1 ml-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onSelect(empresa)}
              className="h-8 px-2"
            >
              <Eye className="h-4 w-4" />
            </Button>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => onEdit(empresa)}>
                  <Edit className="h-4 w-4 mr-2" />
                  Editar
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => onConfigure(empresa)}>
                  <Settings className="h-4 w-4 mr-2" />
                  Configurar
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => onDelete(empresa.id)}
                  className="text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Eliminar
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardContent>
    </Card>
  )
})

export default function EmpresaList({ 
  onSelectEmpresa, 
  onEditEmpresa, 
  onConfigureEmpresa, 
  onCreateNew 
}: EmpresaListProps) {
  const { empresas, listarEmpresas, eliminarEmpresa, loading, error } = useEmpresa()
  const [searchTerm, setSearchTerm] = useState('')
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all')

  // Memoizar el filtrado para evitar recálculos innecesarios
  const filteredEmpresas = useMemo(() => {
    let filtered = empresas

    // Filtrar por estado
    if (filterStatus !== 'all') {
      filtered = filtered.filter(empresa => 
        filterStatus === 'active' ? empresa.activa : !empresa.activa
      )
    }

    // Filtrar por término de búsqueda
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(empresa =>
        empresa.razon_social.toLowerCase().includes(term) ||
        empresa.ruc.includes(term) ||
        empresa.nombre_comercial?.toLowerCase().includes(term)
      )
    }

    return filtered
  }, [empresas, searchTerm, filterStatus])

  const loadEmpresas = useCallback(async () => {
    try {
      await listarEmpresas()
    } catch (err) {
      console.error('Error al cargar empresas:', err)
      toast.error('Error al cargar las empresas. Por favor, intente nuevamente.')
    }
  }, [listarEmpresas])

  // Cargar empresas al montar el componente
  useEffect(() => {
    loadEmpresas()
  }, [loadEmpresas])

  const handleDeleteEmpresa = async (empresaId: string) => {
    if (window.confirm('¿Está seguro de que desea eliminar esta empresa?')) {
      try {
        const success = await eliminarEmpresa(empresaId)
        if (success) {
          toast.success('Empresa eliminada correctamente')
          await loadEmpresas() // Recargar la lista
        } else {
          toast.error('No se pudo eliminar la empresa')
        }
      } catch (err) {
        console.error('Error al eliminar empresa:', err)
        toast.error('Error al eliminar la empresa. Por favor, intente nuevamente.')
      }
    }
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="text-center text-red-600">
            <p>Error cargando empresas: {error}</p>
            <Button onClick={loadEmpresas} className="mt-2">
              Reintentar
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Empresas</h1>
          <p className="text-gray-600">Gestiona las empresas de tu sistema</p>
        </div>
        <Button onClick={onCreateNew} className="w-full sm:w-auto">
          <Plus className="h-4 w-4 mr-2" />
          Nueva Empresa
        </Button>
      </div>

      {/* Filtros y búsqueda */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Buscar por RUC, razón social o nombre comercial..."
                  value={searchTerm}
                  onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  Filtros
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setFilterStatus('all')}>
                  Todas las empresas
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus('active')}>
                  Solo activas
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setFilterStatus('inactive')}>
                  Solo inactivas
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardContent>
      </Card>

      {/* Lista de empresas */}
      <div className="grid gap-4">
        {loading ? (
          <LoadingCard 
            title="Cargando empresas..." 
            description="Obteniendo la lista de empresas registradas en el sistema" 
          />
        ) : filteredEmpresas.length === 0 ? (
          <Card>
            <CardContent className="pt-6">
              <div className="text-center">
                <Building2 className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  {searchTerm || filterStatus !== 'all' ? 'No se encontraron empresas' : 'No hay empresas registradas'}
                </h3>
                <p className="text-gray-600 mb-4">
                  {searchTerm || filterStatus !== 'all' 
                    ? 'Intenta ajustar los filtros de búsqueda'
                    : 'Comienza creando tu primera empresa'
                  }
                </p>
                {!searchTerm && filterStatus === 'all' && (
                  <Button onClick={onCreateNew}>
                    <Plus className="h-4 w-4 mr-2" />
                    Crear Primera Empresa
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>
        ) : (
          filteredEmpresas.map((empresa) => (
            <EmpresaCard
              key={empresa.id}
              empresa={empresa}
              onSelect={onSelectEmpresa}
              onEdit={onEditEmpresa}
              onConfigure={onConfigureEmpresa}
              onDelete={handleDeleteEmpresa}
            />
          ))
        )}
      </div>
    </div>
  )
}
