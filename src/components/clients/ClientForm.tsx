/**
 * Formulario para crear/editar clientes con validaciones y consulta SUNAT
 */

"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { 
  User, 
  Building2, 
  Phone, 
  Search,
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
// import { Badge } from '@/components/ui/badge';
// import { LoadingSpinner } from '@/components/ui/loading';

// import { useClientes } from '@/hooks/useClientes';
// Migrado a useClientesContext para estado compartido
import { useClientesContext } from '@/contexts/ClientesContext';
import { useConsultas } from '@/hooks/useConsultas';
import { 
  Cliente,
  CreateClienteRequest,
  UpdateClienteRequest,
  TIPOS_DOCUMENTO_OPTIONS,
  validarLongitudDocumento,
  isEmpresa
} from '@/types/cliente';

// Tipo para los datos de SUNAT
interface SunatData {
  valido: boolean;
  tipo_documento: string;
  numero_documento: string;
  datos_sunat?: {
    razon_social?: string;
    nombre_comercial?: string;
    direccion?: string;
    estado?: string;
  };
  mensaje?: string;
}

interface ClientFormProps {
  cliente?: Cliente;
  onSuccess?: () => void;
  onCancel?: () => void;
  onFormChange?: (hasChanges: boolean) => void;
}

export function ClientForm({ cliente, onSuccess, onCancel, onFormChange }: ClientFormProps) {
  const router = useRouter();
  const { crearCliente, actualizarCliente, loading } = useClientesContext();
  const { consultarRuc } = useConsultas();

  // Estado del formulario
  const [formData, setFormData] = useState({
    tipo_documento: cliente?.tipo_documento || '6',
    numero_documento: cliente?.numero_documento || '',
    razon_social: cliente?.razon_social || '',
    nombre_comercial: cliente?.nombre_comercial || '',
    direccion: cliente?.direccion || '',
    telefono: cliente?.telefono || '',
    email: cliente?.email || '',
    validar_con_sunat: true,
  });

  // Estado de validación
  const [validation, setValidation] = useState({
    numero_documento: { valid: false, message: '' },
    email: { valid: true, message: '' },
    telefono: { valid: true, message: '' },
  });

  // Estado SUNAT
  const [sunatData, setSunatData] = useState<SunatData | null>(null);
  const [validandoSunat, setValidandoSunat] = useState(false);

  // Estado general
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  // ===== EFECTOS =====

  // Sincronizar estado del formulario con prop cliente
  useEffect(() => {
    if (cliente) {
      const newFormData = {
        tipo_documento: cliente.tipo_documento || '6',
        numero_documento: cliente.numero_documento || '',
        razon_social: cliente.razon_social || '',
        nombre_comercial: cliente.nombre_comercial || '',
        direccion: cliente.direccion || '',
        telefono: cliente.telefono || '',
        email: cliente.email || '',
        validar_con_sunat: true,
      };
      setFormData(newFormData);
      
      // También inicializar las validaciones como válidas para clientes existentes
      setValidation({
        numero_documento: { valid: true, message: '' },
        email: { valid: true, message: '' },
        telefono: { valid: true, message: '' },
      });
    }
  }, [cliente]); // Dependemos del objeto cliente completo

  // ===== VALIDACIONES =====

  const validateNumeroDocumento = (numero: string, tipo: string) => {
    if (!numero) {
      return { valid: false, message: 'El número de documento es requerido' };
    }

    if (!validarLongitudDocumento(numero, tipo)) {
      const longitudes = {
        '1': '8 dígitos',
        '6': '11 dígitos',
        '4': '8-12 caracteres',
        '7': '6-15 caracteres'
      };
      return { 
        valid: false, 
        message: `El documento debe tener ${longitudes[tipo as keyof typeof longitudes] || 'la longitud correcta'}` 
      };
    }

    if (!/^[0-9A-Za-z]+$/.test(numero)) {
      return { valid: false, message: 'El documento solo puede contener números y letras' };
    }

    return { valid: true, message: '' };
  };

  const validateEmail = (email: string) => {
    if (!email) return { valid: true, message: '' };
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email) 
      ? { valid: true, message: '' }
      : { valid: false, message: 'Email inválido' };
  };

  const validateTelefono = (telefono: string) => {
    if (!telefono) return { valid: true, message: '' };
    
    const telefonoRegex = /^[\+]?[0-9\-\s\(\)]{7,20}$/;
    return telefonoRegex.test(telefono)
      ? { valid: true, message: '' }
      : { valid: false, message: 'Teléfono inválido' };
  };

  // ===== HANDLERS =====

  const handleFieldChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    
    // Notificar cambios al padre
    if (onFormChange) {
      onFormChange(true);
    }
    
    // Limpiar errores
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }

    // Validaciones en tiempo real
    if (field === 'numero_documento' || field === 'tipo_documento') {
      const numero = field === 'numero_documento' ? value : formData.numero_documento;
      const tipo = field === 'tipo_documento' ? value : formData.tipo_documento;
      
      const validationResult = validateNumeroDocumento(numero, tipo);
      setValidation(prev => ({ 
        ...prev, 
        numero_documento: validationResult 
      }));
    }

    if (field === 'email') {
      const validationResult = validateEmail(value);
      setValidation(prev => ({ 
        ...prev, 
        email: validationResult 
      }));
    }

    if (field === 'telefono') {
      const validationResult = validateTelefono(value);
      setValidation(prev => ({ 
        ...prev, 
        telefono: validationResult 
      }));
    }
  };

  const handleValidarSunat = async () => {
    if (!validation.numero_documento.valid || !formData.numero_documento) {
      return;
    }

    // Solo funciona para RUC (tipo_documento = "6")
    if (formData.tipo_documento !== '6') {
      return;
    }

    setValidandoSunat(true);
    setSunatData(null);

    try {
      const resultado = await consultarRuc(formData.numero_documento);

      if (resultado?.success && resultado.ruc_data) {
        const { ruc_data } = resultado;

        setSunatData({
          valido: true,
          tipo_documento: formData.tipo_documento,
          numero_documento: formData.numero_documento,
          datos_sunat: {
            razon_social: ruc_data.razon_social,
            nombre_comercial: ruc_data.nombre_comercial,
            direccion: ruc_data.direccion,
            estado: ruc_data.estado
          }
        });

        // Auto-completar datos
        const updates: Partial<typeof formData> = {};
        if (ruc_data.razon_social?.trim()) {
          updates.razon_social = ruc_data.razon_social.trim();
        }
        if (ruc_data.direccion?.trim()) {
          updates.direccion = ruc_data.direccion.trim();
        }
        if (Object.keys(updates).length > 0) {
          setFormData(prev => ({
            ...prev,
            ...updates
          }));
        }
      } else {
        setSunatData({
          valido: false,
          tipo_documento: formData.tipo_documento,
          numero_documento: formData.numero_documento,
          mensaje: 'RUC no encontrado en SUNAT'
        });
      }
    } catch {
      setSunatData({
        valido: false,
        tipo_documento: formData.tipo_documento,
        numero_documento: formData.numero_documento,
        mensaje: 'Error al consultar SUNAT'
      });
    } finally {
      setValidandoSunat(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar formulario
    const newErrors: Record<string, string> = {};
    
    if (!formData.numero_documento) newErrors.numero_documento = 'Requerido';
    if (!formData.razon_social) newErrors.razon_social = 'Requerido';
    if (!validation.numero_documento.valid) newErrors.numero_documento = validation.numero_documento.message;
    if (!validation.email.valid) newErrors.email = validation.email.message;
    if (!validation.telefono.valid) newErrors.telefono = validation.telefono.message;

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setSubmitting(true);

    try {
      if (cliente) {
        // Actualizar cliente existente
        const updateData: UpdateClienteRequest = {
          razon_social: formData.razon_social,
          nombre_comercial: formData.nombre_comercial || undefined,
          direccion: formData.direccion || undefined,
          telefono: formData.telefono || undefined,
          email: formData.email || undefined,
        };
        
        await actualizarCliente(cliente.id, updateData);
      } else {
        // Crear nuevo cliente
        const createData: CreateClienteRequest = {
          tipo_documento: formData.tipo_documento,
          numero_documento: formData.numero_documento,
          razon_social: formData.razon_social,
          nombre_comercial: formData.nombre_comercial || undefined,
          direccion: formData.direccion || undefined,
          telefono: formData.telefono || undefined,
          email: formData.email || undefined,
          validar_con_sunat: formData.validar_con_sunat,
        };
        await crearCliente(createData);
      }
      
      if (onSuccess) {
        onSuccess();
      } else {
        router.push('/clients');
      }
    } catch (error) {
      setErrors({ general: error instanceof Error ? error.message : 'Error al guardar cliente' });
    } finally {
      setSubmitting(false);
    }
  };

  // ===== RENDER =====

  const esEmpresa = isEmpresa(formData.tipo_documento);

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {errors.general && (
        <div className="bg-red-50 border border-red-200 rounded-md p-3">
          <div className="flex">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error</h3>
              <p className="text-sm text-red-700 mt-1">{errors.general}</p>
            </div>
          </div>
        </div>
      )}

      {/* Información del documento */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <User className="h-4 w-4" />
            Información del Documento
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="tipo_documento">Tipo de Documento *</Label>
              <Select
                value={formData.tipo_documento}
                onValueChange={(value) => handleFieldChange('tipo_documento', value)}
                disabled={!!cliente} // No permitir cambiar tipo en edición
              >
                <SelectTrigger>
                  <SelectValue placeholder="Selecciona tipo de documento" />
                </SelectTrigger>
                <SelectContent>
                  {TIPOS_DOCUMENTO_OPTIONS.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label htmlFor="numero_documento">Número de Documento *</Label>
              <div className="flex gap-2">
                <Input
                  id="numero_documento"
                  value={formData.numero_documento}
                  onChange={(e) => handleFieldChange('numero_documento', e.target.value)}
                  placeholder={esEmpresa ? "20123456789" : "12345678"}
                  disabled={!!cliente} // No permitir cambiar número en edición
                  className={!validation.numero_documento.valid && formData.numero_documento ? 'border-red-500' : ''}
                />
                {!cliente && (
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleValidarSunat}
                    disabled={!validation.numero_documento.valid || validandoSunat}
                    className="flex items-center gap-2"
                  >
                    {validandoSunat ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <Search className="h-4 w-4" />
                    )}
                    SUNAT
                  </Button>
                )}
              </div>
              {!validation.numero_documento.valid && formData.numero_documento && (
                <p className="text-sm text-red-600 mt-1">{validation.numero_documento.message}</p>
              )}
              {validation.numero_documento.valid && formData.numero_documento && (
                <p className="text-sm text-green-600 mt-1 flex items-center gap-1">
                  <CheckCircle className="h-3 w-3" />
                  Documento válido
                </p>
              )}
            </div>
          </div>

          {/* Resultado SUNAT */}
          {sunatData && (
            <div className={`p-3 rounded-md ${sunatData.valido ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
              <div className="flex items-center gap-2">
                {sunatData.valido ? (
                  <CheckCircle className="h-4 w-4 text-green-600" />
                ) : (
                  <AlertCircle className="h-4 w-4 text-red-600" />
                )}
                <span className={`font-medium text-sm ${sunatData.valido ? 'text-green-800' : 'text-red-800'}`}>
                  {sunatData.valido ? 'Documento válido en SUNAT' : 'Documento no encontrado en SUNAT'}
                </span>
              </div>
              {sunatData.datos_sunat && (
                <div className="mt-2 text-xs text-gray-700">
                  <p><strong>Razón Social:</strong> {sunatData.datos_sunat.razon_social}</p>
                  {sunatData.datos_sunat.nombre_comercial && (
                    <p><strong>Nombre Comercial:</strong> {sunatData.datos_sunat.nombre_comercial}</p>
                  )}
                  {sunatData.datos_sunat.direccion && (
                    <p><strong>Dirección:</strong> {sunatData.datos_sunat.direccion}</p>
                  )}
                  {sunatData.datos_sunat.estado && (
                    <p><strong>Estado:</strong> {sunatData.datos_sunat.estado}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Información básica */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="h-4 w-4" />
            Información Básica
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div>
            <Label htmlFor="razon_social">
              {esEmpresa ? 'Razón Social' : 'Nombres Completos'} *
            </Label>
            <Input
              id="razon_social"
              value={formData.razon_social}
              onChange={(e) => handleFieldChange('razon_social', e.target.value)}
              placeholder={esEmpresa ? "EMPRESA SAC" : "Juan Pérez García"}
              className={errors.razon_social ? 'border-red-500' : ''}
            />
            {errors.razon_social && (
              <p className="text-sm text-red-600 mt-1">{errors.razon_social}</p>
            )}
          </div>

          <div>
            <Label htmlFor="nombre_comercial">Nombre Comercial</Label>
            <Input
              id="nombre_comercial"
              value={formData.nombre_comercial}
              onChange={(e) => handleFieldChange('nombre_comercial', e.target.value)}
              placeholder="Nombre con el que es conocido"
            />
          </div>
        </CardContent>
      </Card>

      {/* Información de contacto */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Phone className="h-4 w-4" />
            Información de Contacto
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={formData.email}
                onChange={(e) => handleFieldChange('email', e.target.value)}
                placeholder="cliente@email.com"
                className={!validation.email.valid ? 'border-red-500' : ''}
              />
              {!validation.email.valid && (
                <p className="text-sm text-red-600 mt-1">{validation.email.message}</p>
              )}
            </div>

            <div>
              <Label htmlFor="telefono">Teléfono</Label>
              <Input
                id="telefono"
                value={formData.telefono}
                onChange={(e) => handleFieldChange('telefono', e.target.value)}
                placeholder="+51 999 123 456"
                className={!validation.telefono.valid ? 'border-red-500' : ''}
              />
              {!validation.telefono.valid && (
                <p className="text-sm text-red-600 mt-1">{validation.telefono.message}</p>
              )}
            </div>
          </div>

          <div>
            <Label htmlFor="direccion">Dirección</Label>
            <Textarea
              id="direccion"
              value={formData.direccion}
              onChange={(e) => handleFieldChange('direccion', e.target.value)}
              placeholder="Dirección completa"
              rows={2}
            />
          </div>
        </CardContent>
      </Card>

      {/* Botones de acción */}
      <div className="flex justify-end space-x-3 pt-2">
        <Button 
          type="button" 
          variant="outline" 
          onClick={onCancel || (() => router.back())}
          disabled={submitting}
        >
          Cancelar
        </Button>
        <Button 
          type="submit" 
          disabled={submitting || loading}
          className="flex items-center gap-2"
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {cliente ? 'Actualizar' : 'Crear'} Cliente
        </Button>
      </div>
    </form>
  );
}
