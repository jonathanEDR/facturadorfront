'use client'

import React, { useState, useEffect } from 'react'
import { Building2, Save, X, AlertCircle, Search, CheckCircle, Loader2, Shield } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Label } from '@/components/ui/label'
import { Alert, AlertDescription } from '@/components/ui/alert'

import { useEmpresa } from '@/hooks/useEmpresa'
import { useConsultas } from '@/hooks/useConsultas'
import { EmpresaCreate, EmpresaUpdate, EmpresaDetailResponse, CertificadoConfig } from '@/types/empresa'
import { validarEmpresa } from '@/utils/validations/empresa'
import { useFormValidation } from '@/hooks/useFormValidation'
import { toast } from 'react-hot-toast'
import CertificadoFormSection from './CertificadoFormSection'

interface EmpresaFormProps {
  empresa?: EmpresaDetailResponse | null
  isEditing?: boolean
  onSave: (empresa: EmpresaDetailResponse) => void
  onCancel: () => void
}

export default function EmpresaForm({ 
  empresa, 
  isEditing = false, 
  onSave, 
  onCancel 
}: EmpresaFormProps) {
  const { crearEmpresa, actualizarEmpresa, loading } = useEmpresa()
  const { 
    consultarRuc, 
    rucLoading, 
    rucError, 
    rucSuccess, 
    limpiarEstadoRuc 
  } = useConsultas()
  
  // Estado del formulario
  const [formData, setFormData] = useState({
    ruc: '',
    razon_social: '',
    nombre_comercial: '',
    direccion: '',
    distrito: '',
    provincia: '',
    departamento: '',
    ubigeo: '',
    telefono: '',
    email: '',
    es_empresa_defecto: false
  })

  // Estado para la configuración de certificados
  const [certificadoConfig, setCertificadoConfig] = useState<CertificadoConfig>({
    certificado_digital_path: '',
    certificado_digital_password: '',
    certificado_digital_activo: false,
    certificado_activo_filename: undefined,
    certificados_disponibles: []
  })

  // Hook de validación en tiempo real
  const { errors: formErrors, clearError } = useFormValidation(formData, {
    validateOnChange: true,
    debounceMs: 500
  })

  // Estados adicionales para errores específicos (como RUC, general, etc.)
  const [specificErrors, setSpecificErrors] = useState<Record<string, string>>({})
  
  // Combinar errores del formulario y errores específicos
  const errors = { ...formErrors, ...specificErrors }

  // Estados de UX
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [rucConsultado, setRucConsultado] = useState(false)
  const [mostrarSugerencia, setMostrarSugerencia] = useState(false)

  // Cargar datos de la empresa si se está editando
  useEffect(() => {
    if (isEditing && empresa) {      
      setFormData({
        ruc: empresa.ruc,
        razon_social: empresa.razon_social,
        nombre_comercial: empresa.nombre_comercial || '',
        direccion: empresa.direccion || '',
        distrito: empresa.distrito || '',
        provincia: empresa.provincia || '',
        departamento: empresa.departamento || '',
        ubigeo: empresa.ubigeo || '',
        telefono: empresa.telefono || '',
        email: empresa.email || '',
        es_empresa_defecto: empresa.es_empresa_defecto
      })

      // Cargar configuración de certificados
      const certificadoConfigData = {
        certificado_digital_path: empresa.certificado_digital_path || '',
        certificado_digital_password: empresa.certificado_digital_password || '',
        certificado_digital_activo: empresa.certificado_digital_activo || false,
        certificado_activo_filename: empresa.certificado_activo_filename,
        certificados_disponibles: empresa.certificados_disponibles || []
      }
      
      setCertificadoConfig(certificadoConfigData)
    }
  }, [isEditing, empresa])

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }))
    
    // Limpiar error del campo al cambiar
    if (errors[field]) {
      setSpecificErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors[field]
        return newErrors
      })
      clearError(field)
    }

    // Si cambia el RUC, resetear estados de consulta
    if (field === 'ruc') {
      setRucConsultado(false)
      setMostrarSugerencia(false)
      limpiarEstadoRuc()
      
      // Mostrar sugerencia si tiene 11 dígitos y no está editando
      if (!isEditing && typeof value === 'string' && value.length === 11 && /^\d{11}$/.test(value)) {
        setMostrarSugerencia(true)
      }
    }
  }

  /**
   * Maneja la consulta de RUC en SUNAT
   */
  const handleConsultarRuc = async () => {
    const ruc = formData.ruc.trim()
    
    if (!ruc) {
      setSpecificErrors(prev => ({ ...prev, ruc: 'Ingrese un RUC para consultar' }))
      return
    }

    const resultado = await consultarRuc(ruc)
    
    if (resultado?.success && resultado.ruc_data) {
      const { ruc_data } = resultado
      
      // Preparar los datos para autocompletar solo si tienen valor
      const updates: Partial<typeof formData> = {}
      
      if (ruc_data.razon_social && ruc_data.razon_social.trim()) {
        updates.razon_social = ruc_data.razon_social.trim()
      }
      
      if (ruc_data.direccion && ruc_data.direccion.trim()) {
        updates.direccion = ruc_data.direccion.trim()
      }
      
      // Solo actualizar si hay datos para actualizar
      if (Object.keys(updates).length > 0) {
        const newFormData = {
          ...formData,
          ...updates
        }
        
        setFormData(newFormData)
      }
      
      setRucConsultado(true)
      setMostrarSugerencia(false)
      
      // Limpiar posibles errores previos
      setSpecificErrors(prev => {
        const newErrors = { ...prev }
        delete newErrors.ruc
        delete newErrors.razon_social
        return newErrors
      })
    } else {
      if (resultado && !resultado.success) {
        setSpecificErrors(prev => ({
          ...prev,
          ruc: resultado.message || 'Error al consultar RUC'
        }))
      }
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)

    // Validar formulario
    const validation = validarEmpresa(formData)
    if (!validation.valido) {
      setSpecificErrors(validation.errores)
      setIsSubmitting(false)
      return
    }

    try {
      let result: EmpresaDetailResponse | null = null

      if (isEditing && empresa) {
        // Actualizar empresa existente
        const updateData: EmpresaUpdate = {
          razon_social: formData.razon_social,
          nombre_comercial: formData.nombre_comercial || undefined,
          direccion: formData.direccion || undefined,
          distrito: formData.distrito || undefined,
          provincia: formData.provincia || undefined,
          departamento: formData.departamento || undefined,
          ubigeo: formData.ubigeo || undefined,
          telefono: formData.telefono || undefined,
          email: formData.email || undefined,
          // Incluir configuración de certificados si hay cambios
          certificado_config: certificadoConfig
        }
        result = await actualizarEmpresa(empresa.id, updateData)
      } else {
        // Crear nueva empresa
        const createData: EmpresaCreate = {
          ruc: formData.ruc,
          razon_social: formData.razon_social,
          nombre_comercial: formData.nombre_comercial || undefined,
          tipo_empresa: "persona_juridica", // Valor por defecto
          regimen_tributario: "general", // Valor por defecto
          direccion: formData.direccion || "Sin dirección", // Requerido
          distrito: formData.distrito || undefined,
          provincia: formData.provincia || undefined,
          departamento: formData.departamento || undefined,
          ubigeo: formData.ubigeo || undefined,
          telefono: formData.telefono || undefined,
          email: formData.email || undefined,
          es_defecto: formData.es_empresa_defecto,
          // Incluir configuración de certificados si hay datos
          certificado_config: Object.values(certificadoConfig).some(v => v) ? certificadoConfig : undefined
        }
        result = await crearEmpresa(createData)
      }

      if (result) {
        toast.success(isEditing ? 'Empresa actualizada correctamente' : 'Empresa creada correctamente')
        onSave(result)
      } else {
        toast.error('No se pudo guardar la empresa')
      }
    } catch (error) {
      console.error('Error guardando empresa:', error)
      toast.error('Error al guardar la empresa. Por favor, intente nuevamente.')
      setSpecificErrors({ general: 'Error al guardar la empresa. Intente nuevamente.' })
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Building2 className="h-6 w-6" />
            <div>
              <CardTitle>
                {isEditing ? 'Editar Empresa' : 'Nueva Empresa'}
              </CardTitle>
              <CardDescription>
                {isEditing ? 'Actualiza la información de la empresa' : 'Registra una nueva empresa en el sistema'}
              </CardDescription>
            </div>
          </div>
          <Button variant="outline" onClick={onCancel}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>

      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Error general */}
          {errors.general && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{errors.general}</AlertDescription>
            </Alert>
          )}

          {/* Información básica */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="ruc">RUC *</Label>
              <div className="flex gap-2">
                <Input
                  id="ruc"
                  placeholder="20123456789"
                  value={formData.ruc}
                  onChange={(e) => handleInputChange('ruc', e.target.value)}
                  disabled={isEditing || rucLoading}
                  maxLength={11}
                  className={`${rucSuccess ? 'border-green-500' : ''} ${rucError ? 'border-red-500' : ''}`}
                />
                {!isEditing && (
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    onClick={handleConsultarRuc}
                    disabled={!formData.ruc || formData.ruc.length !== 11 || rucLoading}
                    title="Consultar RUC en SUNAT"
                  >
                    {rucLoading ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : rucSuccess ? (
                      <CheckCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                  </Button>
                )}
              </div>

              {/* Mensajes de estado de consulta RUC */}
              {rucError && (
                <p className="text-sm text-red-600 flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" />
                  {rucError}
                </p>
              )}
              {rucSuccess && rucConsultado && (
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  RUC consultado en SUNAT - Datos autocompletados
                </p>
              )}
              {rucSuccess && !rucConsultado && (
                <p className="text-sm text-amber-600 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  RUC encontrado en SUNAT pero sin datos adicionales
                </p>
              )}
              {mostrarSugerencia && !rucLoading && !rucError && !rucSuccess && (
                <p className="text-sm text-blue-600 flex items-center gap-1">
                  <Search className="h-3 w-3" />
                  Haz clic en el botón para consultar en SUNAT
                </p>
              )}
              
              {/* Error de validación */}
              {errors.ruc && (
                <p className="text-sm text-red-600">{errors.ruc}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor="razon_social">Razón Social *</Label>
              <Input
                id="razon_social"
                placeholder="EMPRESA EJEMPLO S.A.C."
                value={formData.razon_social}
                onChange={(e) => handleInputChange('razon_social', e.target.value)}
                maxLength={200}
              />
              {errors.razon_social && (
                <p className="text-sm text-red-600">{errors.razon_social}</p>
              )}
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="nombre_comercial">Nombre Comercial</Label>
            <Input
              id="nombre_comercial"
              placeholder="Nombre por el que se conoce a la empresa"
              value={formData.nombre_comercial}
              onChange={(e) => handleInputChange('nombre_comercial', e.target.value)}
              maxLength={200}
            />
            {errors.nombre_comercial && (
              <p className="text-sm text-red-600">{errors.nombre_comercial}</p>
            )}
          </div>

          {/* Ubicación */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Ubicación</h3>
            
            <div className="space-y-2">
              <Label htmlFor="direccion">Dirección</Label>
              <Input
                id="direccion"
                placeholder="Av. Ejemplo 123"
                value={formData.direccion}
                onChange={(e) => handleInputChange('direccion', e.target.value)}
                maxLength={300}
              />
              {errors.direccion && (
                <p className="text-sm text-red-600">{errors.direccion}</p>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="distrito">Distrito</Label>
                <Input
                  id="distrito"
                  placeholder="Lima"
                  value={formData.distrito}
                  onChange={(e) => handleInputChange('distrito', e.target.value)}
                  maxLength={100}
                />
                {errors.distrito && (
                  <p className="text-sm text-red-600">{errors.distrito}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="provincia">Provincia</Label>
                <Input
                  id="provincia"
                  placeholder="Lima"
                  value={formData.provincia}
                  onChange={(e) => handleInputChange('provincia', e.target.value)}
                  maxLength={100}
                />
                {errors.provincia && (
                  <p className="text-sm text-red-600">{errors.provincia}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="departamento">Departamento</Label>
                <Input
                  id="departamento"
                  placeholder="Lima"
                  value={formData.departamento}
                  onChange={(e) => handleInputChange('departamento', e.target.value)}
                  maxLength={100}
                />
                {errors.departamento && (
                  <p className="text-sm text-red-600">{errors.departamento}</p>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ubigeo">Ubigeo</Label>
              <Input
                id="ubigeo"
                placeholder="150101"
                value={formData.ubigeo}
                onChange={(e) => handleInputChange('ubigeo', e.target.value)}
                maxLength={6}
              />
              {errors.ubigeo && (
                <p className="text-sm text-red-600">{errors.ubigeo}</p>
              )}
            </div>
          </div>

          {/* Contacto */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Contacto</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="telefono">Teléfono</Label>
                <Input
                  id="telefono"
                  placeholder="01-1234567 o 987654321"
                  value={formData.telefono}
                  onChange={(e) => handleInputChange('telefono', e.target.value)}
                  maxLength={15}
                />
                {errors.telefono && (
                  <p className="text-sm text-red-600">{errors.telefono}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="empresa@ejemplo.com"
                  value={formData.email}
                  onChange={(e) => handleInputChange('email', e.target.value)}
                  maxLength={200}
                />
                {errors.email && (
                  <p className="text-sm text-red-600">{errors.email}</p>
                )}
              </div>
            </div>
          </div>

          {/* Configuración (solo para nueva empresa) */}
          {!isEditing && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Configuración</h3>
              
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="es_empresa_defecto"
                  checked={formData.es_empresa_defecto}
                  onChange={(e) => handleInputChange('es_empresa_defecto', e.target.checked)}
                  className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <Label htmlFor="es_empresa_defecto">Establecer como empresa por defecto</Label>
              </div>
            </div>
          )}

          {/* Sección de Certificados Digitales */}
          <div className="space-y-4 border-t pt-6">
            <h3 className="text-lg font-semibold flex items-center space-x-2">
              <Shield className="h-5 w-5" />
              <span>Certificado Digital</span>
            </h3>
            
            <CertificadoFormSection
              empresa={empresa || undefined}
              certificadoConfig={certificadoConfig}
              onConfigChange={setCertificadoConfig}
              readonly={false}
            />
          </div>

          {/* Botones */}
          <div className="flex gap-4 pt-6">
            <Button
              type="submit"
              disabled={isSubmitting || loading}
              className="flex-1"
            >
              <Save className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Guardando...' : (isEditing ? 'Actualizar' : 'Crear Empresa')}
            </Button>
            
            <Button
              type="button"
              variant="outline"
              onClick={onCancel}
              disabled={isSubmitting}
              className="flex-1"
            >
              Cancelar
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
