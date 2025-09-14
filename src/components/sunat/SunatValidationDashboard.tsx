/**
 * Dashboard de Validación SUNAT para Empresas
 * Muestra el estado de validación SUNAT y permite validación manual
 */
'use client';

import React, { useState, useEffect } from 'react';
import { useAuth } from '@clerk/nextjs';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  RefreshCw, 
  Clock, 
  Building2,
  Shield,
  MapPin,
  Calendar,
  Info
} from 'lucide-react';

interface EmpresaValidation {
  empresa_id: string;
  ruc: string;
  razon_social: string;
  estado_sunat?: string;
  condicion_domicilio?: string;
  tipo_empresa?: string;
  validacion_exitosa?: boolean;
  datos_actualizados?: boolean;
  fuente_datos?: string;
  fecha_validacion?: string;
  detalles?: {
    direccion_fiscal?: string;
    distrito?: string;
    provincia?: string;
    departamento?: string;
    actividad_economica?: string;
    sistema_emision?: string;
    sistema_contabilidad?: string;
  };
}

interface SunatValidationDashboardProps {
  empresaId: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  empresaData: any;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  onValidationComplete?: (result: any) => void;
}

export const SunatValidationDashboard: React.FC<SunatValidationDashboardProps> = ({
  empresaId,
  empresaData,
  onValidationComplete
}) => {
  const { getToken } = useAuth(); // ✅ Usar hook de Clerk
  const [validationData, setValidationData] = useState<EmpresaValidation | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const [lastValidation, setLastValidation] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Estado de validación basado en datos
  const getValidationStatus = () => {
    // Si nunca se ha intentado validar
    if (!validationData?.fecha_validacion) return 'pending';
    
    // Si se intentó validar pero falló la consulta a SUNAT (timeout, error de red, etc.)
    if (!validationData?.validacion_exitosa) return 'validation_failed';
    
    // Si la validación fue exitosa, evaluar estado empresarial
    if (validationData?.estado_sunat === 'ACTIVO' && validationData?.condicion_domicilio === 'HABIDO') return 'success';
    if (validationData?.estado_sunat === 'ACTIVO') return 'warning';
    return 'error';
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success': return <CheckCircle className="h-5 w-5 text-green-600" />;
      case 'warning': return <AlertTriangle className="h-5 w-5 text-yellow-600" />;
      case 'error': return <XCircle className="h-5 w-5 text-red-600" />;
      case 'validation_failed': return <AlertTriangle className="h-5 w-5 text-orange-600" />;
      default: return <Clock className="h-5 w-5 text-gray-400" />;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'success': return 'Validado SUNAT';
      case 'warning': return 'Verificar Estado';
      case 'error': return 'Inactivo SUNAT';
      case 'validation_failed': return 'Error en Consulta';
      default: return 'Pendiente';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'success': return 'bg-green-100 text-green-800';
      case 'warning': return 'bg-yellow-100 text-yellow-800';
      case 'error': return 'bg-red-100 text-red-800';
      case 'validation_failed': return 'bg-orange-100 text-orange-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  // Cargar datos de validación al montar el componente
  useEffect(() => {
    if (empresaData) {
      // Simular datos de validación (en el futuro vendrán del backend)
      setValidationData({
        empresa_id: empresaId,
        ruc: empresaData.ruc,
        razon_social: empresaData.razon_social,
        // Datos por defecto hasta que se implemente la integración completa
        validacion_exitosa: false
      });
    }
  }, [empresaId, empresaData]);

  // Función para validar manualmente
  const handleManualValidation = async () => {
    setIsValidating(true);
    setError(null);

    try {
      // Obtener token de Clerk
      const token = await getToken();
      
      if (!token) {
        throw new Error('No se pudo obtener el token de autenticación');
      }

      const url = `/api/empresas/${empresaId}/validar-sunat`;

      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || `Error ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      
      // Actualizar datos de validación con la respuesta real
      const newValidationData = {
        ...validationData!,
        validacion_exitosa: result.validacion_exitosa || false,
        datos_actualizados: result.datos_actualizados || false,
        fuente_datos: result.fuente_datos || 'api_backend',
        fecha_validacion: new Date().toISOString(),
        estado_sunat: result.detalles?.estado || 'DESCONOCIDO',
        condicion_domicilio: result.detalles?.condicion || 'DESCONOCIDO',
        tipo_empresa: result.detalles?.tipo || 'DESCONOCIDO',
        detalles: result.detalles || {}
      };

      setValidationData(newValidationData);
      setLastValidation(new Date().toLocaleString());
      
      if (onValidationComplete) {
        onValidationComplete(result);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error desconocido');
    } finally {
      setIsValidating(false);
    }
  };

  if (!validationData) {
    return <div className="animate-pulse">Cargando datos de validación...</div>;
  }

  const status = getValidationStatus();

  return (
    <div className="space-y-6">
      {/* Header del Dashboard */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <Shield className="h-6 w-6 text-blue-600" />
              <div>
                <CardTitle className="text-lg">Estado SUNAT</CardTitle>
                <p className="text-sm text-gray-600">
                  RUC: {validationData.ruc} • {validationData.razon_social}
                </p>
              </div>
            </div>
            <Badge className={getStatusColor(status)}>
              <div className="flex items-center space-x-1">
                {getStatusIcon(status)}
                <span>{getStatusLabel(status)}</span>
              </div>
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div className="text-sm text-gray-600">
              {lastValidation ? (
                <span>Última validación: {lastValidation}</span>
              ) : (
                <span>Sin validaciones recientes</span>
              )}
            </div>
            <Button 
              onClick={handleManualValidation}
              disabled={isValidating}
              variant="outline"
              size="sm"
            >
              {isValidating ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Validando...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Validar Ahora
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Error Alert */}
      {error && (
        <Alert variant="destructive">
          <XCircle className="h-4 w-4" />
          <AlertDescription>
            Error en validación SUNAT: {error}
          </AlertDescription>
        </Alert>
      )}

      {/* Detalles de Validación */}
      {validationData.validacion_exitosa && (
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center">
              <Info className="h-5 w-5 mr-2" />
              Información SUNAT
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Estado y Condición */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">Estado del Contribuyente</label>
                <div className="mt-1">
                  <Badge variant={validationData.estado_sunat === 'ACTIVO' ? 'default' : 'destructive'}>
                    {validationData.estado_sunat || 'No disponible'}
                  </Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">Condición de Domicilio</label>
                <div className="mt-1">
                  <Badge variant={validationData.condicion_domicilio === 'HABIDO' ? 'default' : 'secondary'}>
                    {validationData.condicion_domicilio || 'No disponible'}
                  </Badge>
                </div>
              </div>
            </div>

            <Separator />

            {/* Información Empresarial */}
            {validationData.detalles && (
              <div className="space-y-3">
                <h4 className="font-medium text-gray-900 flex items-center">
                  <Building2 className="h-4 w-4 mr-2" />
                  Datos Empresariales
                </h4>
                
                {validationData.detalles.direccion_fiscal && (
                  <div className="flex items-start space-x-2">
                    <MapPin className="h-4 w-4 mt-0.5 text-gray-500" />
                    <div>
                      <p className="text-sm text-gray-900">{validationData.detalles.direccion_fiscal}</p>
                      <p className="text-xs text-gray-600">
                        {[
                          validationData.detalles.distrito,
                          validationData.detalles.provincia,
                          validationData.detalles.departamento
                        ].filter(Boolean).join(', ')}
                      </p>
                    </div>
                  </div>
                )}

                {validationData.detalles.actividad_economica && (
                  <div>
                    <label className="text-xs font-medium text-gray-700">Actividad Económica</label>
                    <p className="text-sm text-gray-900">{validationData.detalles.actividad_economica}</p>
                  </div>
                )}
              </div>
            )}

            <Separator />

            {/* Metadata */}
            <div className="flex items-center justify-between text-xs text-gray-500">
              <div className="flex items-center space-x-1">
                <Calendar className="h-3 w-3" />
                <span>
                  Fuente: {validationData.fuente_datos || 'Sistema local'}
                </span>
              </div>
              {validationData.datos_actualizados && (
                <Badge variant="outline" className="text-xs">
                  Datos actualizados
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Card de Información para casos sin validación */}
      {!validationData.validacion_exitosa && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center space-y-2">
              <Clock className="h-8 w-8 text-gray-400 mx-auto" />
              <h3 className="font-medium text-gray-900">Pendiente de Validación</h3>
              <p className="text-sm text-gray-600">
                Esta empresa aún no ha sido validada contra los registros de SUNAT.
                Haz clic en &ldquo;Validar Ahora&rdquo; para obtener información actualizada.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default SunatValidationDashboard;
