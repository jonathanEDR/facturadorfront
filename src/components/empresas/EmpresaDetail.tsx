'use client'

import React from 'react'
import { Building2, Edit, Settings, ArrowLeft, Phone, Mail, Power, PowerOff } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { EmpresaDetailResponse } from '@/types/empresa'
import { formatearRuc, formatearTelefono } from '@/utils/validations/empresa'
import SunatValidationDashboard from '@/components/sunat/SunatValidationDashboard'
import { useEmpresa } from '@/hooks/useEmpresa'

interface EmpresaDetailProps {
  empresa: EmpresaDetailResponse
  onEdit: () => void
  onConfigure: () => void
  onBack: () => void
}

export default function EmpresaDetail({ 
  empresa, 
  onEdit, 
  onConfigure, 
  onBack 
}: EmpresaDetailProps) {
  const { activarEmpresa, desactivarEmpresa } = useEmpresa()

  const handleToggleEstado = async () => {
    try {
      if (empresa.activa) {
        await desactivarEmpresa(empresa.id)
        // toast.success('Empresa desactivada correctamente')
      } else {
        await activarEmpresa(empresa.id)
        // toast.success('Empresa activada correctamente')
      }
    } catch (error) {
      // toast.error('Error al cambiar el estado de la empresa')
      console.error('Error al cambiar estado:', error)
    }
  }

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      {/* Header compacto */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Empresas
          </Button>
          <div>
            <h1 className="text-xl font-semibold">{empresa.razon_social}</h1>
            <p className="text-sm text-gray-500 font-mono">{formatearRuc(empresa.ruc)}</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {/* Estados como badges compactos */}
          <Badge variant={empresa.activa ? 'default' : 'secondary'}>
            {empresa.activa ? 'Activa' : 'Inactiva'}
          </Badge>
          {empresa.puede_facturar_electronicamente && (
            <Badge className="bg-green-100 text-green-800">Facturación OK</Badge>
          )}
          {empresa.es_empresa_defecto && (
            <Badge variant="outline">Defecto</Badge>
          )}
          
          {/* Acciones */}
          <Button variant="outline" size="sm" onClick={onEdit}>
            <Edit className="h-4 w-4 mr-1" />
            Editar
          </Button>
          <Button size="sm" onClick={onConfigure}>
            <Settings className="h-4 w-4 mr-1" />
            Configurar
          </Button>
        </div>
      </div>

      {/* Información principal en grid compacto */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Información básica */}
        <Card className="lg:col-span-2">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Building2 className="h-4 w-4" />
              Información Empresarial
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Razón Social</label>
                <p className="text-sm font-medium">{empresa.razon_social}</p>
              </div>
              
              {empresa.nombre_comercial && (
                <div>
                  <label className="text-xs font-medium text-gray-500 uppercase">Nombre Comercial</label>
                  <p className="text-sm">{empresa.nombre_comercial}</p>
                </div>
              )}

              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">Moneda</label>
                <p className="text-sm">{empresa.moneda_defecto}</p>
              </div>
              
              <div>
                <label className="text-xs font-medium text-gray-500 uppercase">IGV</label>
                <p className="text-sm">{empresa.igv_defecto}%</p>
              </div>
            </div>

            {/* Ubicación compacta */}
            {(empresa.direccion || empresa.distrito) && (
              <div className="pt-2 border-t">
                <label className="text-xs font-medium text-gray-500 uppercase">Ubicación</label>
                <p className="text-sm">
                  {[empresa.direccion, empresa.distrito, empresa.provincia, empresa.departamento]
                    .filter(Boolean).join(', ')}
                </p>
                {empresa.ubigeo && (
                  <p className="text-xs font-mono text-gray-500">Ubigeo: {empresa.ubigeo}</p>
                )}
              </div>
            )}

            {/* Contacto compacto */}
            {(empresa.telefono || empresa.email) && (
              <div className="pt-2 border-t">
                <label className="text-xs font-medium text-gray-500 uppercase">Contacto</label>
                <div className="flex flex-wrap gap-4 text-sm">
                  {empresa.telefono && (
                    <span className="flex items-center gap-1">
                      <Phone className="h-3 w-3" />
                      {formatearTelefono(empresa.telefono)}
                    </span>
                  )}
                  {empresa.email && (
                    <span className="flex items-center gap-1">
                      <Mail className="h-3 w-3" />
                      {empresa.email}
                    </span>
                  )}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Configuración y estado */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Settings className="h-4 w-4" />
              Estado del Sistema
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Certificados:</span>
                <Badge variant={empresa.tiene_certificado ? 'default' : 'secondary'} className="text-xs">
                  {empresa.tiene_certificado ? 'OK' : 'Pendiente'}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">SUNAT:</span>
                <Badge variant={empresa.tiene_configuracion_sunat ? 'default' : 'secondary'} className="text-xs">
                  {empresa.tiene_configuracion_sunat ? 'OK' : 'Pendiente'}
                </Badge>
              </div>
              
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Facturación:</span>
                <Badge variant={empresa.puede_facturar ? 'default' : 'destructive'} className="text-xs">
                  {empresa.puede_facturar ? 'Habilitada' : 'Deshabilitada'}
                </Badge>
              </div>
            </div>

            <div className="pt-2 border-t space-y-2">
              <Button onClick={onConfigure} size="sm" className="w-full">
                Ir a Configuración
              </Button>
              
              <Button 
                variant={empresa.activa ? "destructive" : "default"}
                size="sm" 
                className="w-full"
                onClick={handleToggleEstado}
              >
                {empresa.activa ? (
                  <>
                    <PowerOff className="h-3 w-3 mr-1" />
                    Desactivar
                  </>
                ) : (
                  <>
                    <Power className="h-3 w-3 mr-1" />
                    Activar
                  </>
                )}
              </Button>
            </div>

            {/* Fechas compactas */}
            <div className="pt-2 border-t text-xs text-gray-500">
              <div>Creada: {new Date(empresa.fecha_creacion).toLocaleDateString()}</div>
              {empresa.fecha_actualizacion && (
                <div>Actualizada: {new Date(empresa.fecha_actualizacion).toLocaleDateString()}</div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Dashboard de Validación SUNAT compacto */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Validación SUNAT</CardTitle>
        </CardHeader>
        <CardContent>
          <SunatValidationDashboard 
            empresaId={empresa.id}
            empresaData={empresa}
            onValidationComplete={(result) => {
              console.log('Validación SUNAT completada:', result);
            }}
          />
        </CardContent>
      </Card>
    </div>
  )
}
