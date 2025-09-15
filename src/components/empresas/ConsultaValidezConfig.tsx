// Componente para configurar credenciales API de Consulta de Validez de Comprobantes
'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  Eye, 
  EyeOff, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle, 
  XCircle,
  Key,
  Server,
  Shield,
  Info
} from 'lucide-react';

import { useConsultaValidez } from '@/services/consulta-validez';
import { 
  ConsultaValidezConfiguration, 
  ConsultaValidezCredentials,
  TokenInfo
} from '@/types/consulta-validez';

interface ConsultaValidezConfigProps {
  empresaId: string;
  empresaRuc: string;
  empresaRazonSocial: string;
  onConfigurationChange?: (configured: boolean) => void;
}

type ConfigStatus = 'loading' | 'not-configured' | 'configured' | 'active' | 'error';

export default function ConsultaValidezConfig({ 
  empresaId, 
  empresaRuc, 
  empresaRazonSocial,
  onConfigurationChange 
}: ConsultaValidezConfigProps) {
  const {
    getConfiguration,
    configureCredentials,
    testConnection,
    refreshToken,
    validateCredentials,
    loading
  } = useConsultaValidez();

  // Estados del componente
  const [status, setStatus] = useState<ConfigStatus>('loading');
  const [config, setConfig] = useState<ConsultaValidezConfiguration | null>(null);
  const [tokenInfo, setTokenInfo] = useState<TokenInfo | null>(null);
  
  // Estados del formulario
  const [formData, setFormData] = useState<ConsultaValidezCredentials>({
    client_id: '',
    client_secret: ''
  });
  
  // Estados de UI
  const [showClientSecret, setShowClientSecret] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [validationMessage, setValidationMessage] = useState<string>('');
  const [validationType, setValidationType] = useState<'success' | 'error' | 'warning'>('success');
  const [testing, setTesting] = useState(false);

  // Cargar configuración actual
  useEffect(() => {
    loadCurrentConfiguration();
  }, [empresaId]);

  const loadCurrentConfiguration = async () => {
    try {
      setStatus('loading');
      const currentConfig = await getConfiguration(empresaId);
      
      if (currentConfig) {
        setConfig(currentConfig);
        // Asegurar que credentials esté definido con valores por defecto
        setFormData({
          client_id: currentConfig.credentials?.client_id || '',
          client_secret: currentConfig.credentials?.client_secret || ''
        });
        setStatus(currentConfig.status as ConfigStatus);
        
        // Notificar al componente padre
        onConfigurationChange?.(currentConfig.status === 'configured' || currentConfig.status === 'active');
      } else {
        setStatus('not-configured');
        onConfigurationChange?.(false);
      }
    } catch (error) {
      console.error('Error cargando configuración:', error);
      setStatus('error');
      setValidationMessage('Error cargando la configuración actual');
      setValidationType('error');
    }
  };

  const handleInputChange = (field: keyof ConsultaValidezCredentials, value: string) => {
    setFormData(prev => {
      // Asegurar que prev esté definido con valores por defecto
      const currentData = prev || {
        client_id: '',
        client_secret: ''
      };
      
      return {
        ...currentData,
        [field]: value
      };
    });
  };

  const handleSaveConfiguration = async () => {
    try {
      setValidationMessage('');
      
      // Asegurar que formData esté definido
      if (!formData) {
        setValidationMessage('Error: datos del formulario no disponibles');
        setValidationType('error');
        return;
      }
      
      // Validación usando el servicio
      const validation = validateCredentials(formData);
      if (!validation.valid) {
        setValidationMessage(validation.errors.join('. '));
        setValidationType('error');
        return;
      }

      const result = await configureCredentials(empresaId, formData);
      
      if (result.success) {
        setValidationMessage('Credenciales configuradas correctamente');
        setValidationType('success');
        setIsEditing(false);
        await loadCurrentConfiguration(); // Recargar configuración
      } else {
        setValidationMessage(result.message || 'Error al configurar credenciales');
        setValidationType('error');
      }
    } catch (error) {
      console.error('Error guardando configuración:', error);
      setValidationMessage('Error interno al guardar la configuración');
      setValidationType('error');
    }
  };

  const handleTestConnection = async () => {
    try {
      setTesting(true);
      setValidationMessage('');
      
      const result = await testConnection(empresaId);
      
      if (result.success) {
        setValidationMessage('Conexión exitosa - Token obtenido');
        setValidationType('success');
        setTokenInfo(result.token_info || null);
        await loadCurrentConfiguration(); // Actualizar estado
      } else {
        setValidationMessage(result.message || 'Error en la conexión');
        setValidationType('error');
      }
    } catch (error) {
      console.error('Error probando conexión:', error);
      setValidationMessage('Error interno al probar la conexión');
      setValidationType('error');
    } finally {
      setTesting(false);
    }
  };

  const handleRefreshToken = async () => {
    try {
      setTesting(true);
      setValidationMessage('');
      
      const result = await refreshToken(empresaId);
      
      if (result.success) {
        setValidationMessage('Token renovado exitosamente');
        setValidationType('success');
        setTokenInfo(result.token_info || null);
        await loadCurrentConfiguration();
      } else {
        setValidationMessage(result.message || 'Error renovando token');
        setValidationType('error');
      }
    } catch (error) {
      console.error('Error renovando token:', error);
      setValidationMessage('Error interno al renovar token');
      setValidationType('error');
    } finally {
      setTesting(false);
    }
  };

  const getStatusBadge = () => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Activo</Badge>;
      case 'configured':
        return <Badge className="bg-blue-100 text-blue-800"><Shield className="w-3 h-3 mr-1" />Configurado</Badge>;
      case 'not-configured':
        return <Badge className="bg-gray-100 text-gray-800"><AlertTriangle className="w-3 h-3 mr-1" />Sin configurar</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800"><XCircle className="w-3 h-3 mr-1" />Error</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Cargando...</Badge>;
    }
  };

  if (status === 'loading') {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <RefreshCw className="w-6 h-6 animate-spin mr-2" />
            Cargando configuración...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header con estado */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center">
                <Key className="w-5 h-5 mr-2" />
                API Consulta de Validez de Comprobantes
              </CardTitle>
              <p className="text-sm text-gray-500 mt-1">
                Configurar credenciales para consultas integradas SUNAT
              </p>
            </div>
            {getStatusBadge()}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Información de la empresa */}
          <div className="bg-gray-50 p-3 rounded-lg">
            <p className="font-medium">{empresaRazonSocial}</p>
            <p className="text-sm text-gray-600">RUC: {empresaRuc}</p>
          </div>

          {/* Información importante sobre credenciales */}
          <div className="bg-blue-50 border border-blue-200 p-4 rounded-lg">
            <div className="flex items-start space-x-3">
              <Info className="w-5 h-5 text-blue-600 mt-0.5" />
              <div className="text-blue-800">
                <h4 className="font-medium">¿Cómo obtener las credenciales?</h4>
                <ol className="text-sm mt-2 space-y-1 list-decimal pl-4">
                  <li>Ingresar a <strong>SUNAT Operaciones en Línea</strong></li>
                  <li>Ir a <strong>Empresas {`>`} Comprobantes de pago {`>`} Consulta de Validez de Comprobantes</strong></li>
                  <li>Acceder a <strong>"Credenciales de Acceso"</strong></li>
                  <li>Generar o copiar el <strong>Client ID</strong> y <strong>Client Secret</strong></li>
                  <li>Pegar las credenciales en este formulario</li>
                </ol>
              </div>
            </div>
          </div>

          {/* Mensajes de validación */}
          {validationMessage && (
            <Alert className={
              validationType === 'success' ? 'border-green-200 bg-green-50' :
              validationType === 'error' ? 'border-red-200 bg-red-50' :
              'border-orange-200 bg-orange-50'
            }>
              <AlertDescription className={
                validationType === 'success' ? 'text-green-800' :
                validationType === 'error' ? 'text-red-800' :
                'text-orange-800'
              }>
                {validationMessage}
              </AlertDescription>
            </Alert>
          )}

          {/* Formulario de configuración */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Client ID */}
            <div className="space-y-2">
              <Label htmlFor="client_id">Client ID *</Label>
              <Input
                id="client_id"
                value={formData?.client_id || ''}
                onChange={(e) => handleInputChange('client_id', e.target.value)}
                placeholder="Client ID de la API SUNAT"
                disabled={!isEditing && status !== 'not-configured'}
              />
              <p className="text-xs text-gray-500">
                Client ID proporcionado por SUNAT para acceso a la API
              </p>
            </div>

            {/* Client Secret */}
            <div className="space-y-2">
              <Label htmlFor="client_secret">Client Secret *</Label>
              <div className="relative">
                <Input
                  id="client_secret"
                  type={showClientSecret ? 'text' : 'password'}
                  value={formData?.client_secret || ''}
                  onChange={(e) => handleInputChange('client_secret', e.target.value)}
                  placeholder="Client Secret de la API SUNAT"
                  disabled={!isEditing && status !== 'not-configured'}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3"
                  onClick={() => setShowClientSecret(!showClientSecret)}
                >
                  {showClientSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </Button>
              </div>
              <p className="text-xs text-gray-500">
                Client Secret proporcionado por SUNAT (se mantendrá seguro)
              </p>
            </div>
          </div>

          {/* Botones de acción */}
          <div className="flex flex-wrap gap-2 pt-4">
            {status === 'not-configured' || isEditing ? (
              <>
                <Button 
                  onClick={handleSaveConfiguration}
                  disabled={loading}
                  className="flex items-center"
                >
                  <Shield className="w-4 h-4 mr-2" />
                  {loading ? 'Guardando...' : 'Guardar Configuración'}
                </Button>
                {isEditing && (
                  <Button 
                    variant="outline" 
                    onClick={() => {
                      setIsEditing(false);
                      if (config && config.credentials) {
                        setFormData({
                          client_id: config.credentials.client_id || '',
                          client_secret: config.credentials.client_secret || ''
                        });
                      }
                    }}
                  >
                    Cancelar
                  </Button>
                )}
              </>
            ) : (
              <Button 
                variant="outline" 
                onClick={() => setIsEditing(true)}
              >
                Editar Credenciales
              </Button>
            )}

            {(status === 'configured' || status === 'active') && (
              <>
                <Button 
                  variant="outline" 
                  onClick={handleTestConnection}
                  disabled={testing || loading}
                  className="flex items-center"
                >
                  <Server className="w-4 h-4 mr-2" />
                  {testing ? 'Probando...' : 'Probar Conexión'}
                </Button>
                
                <Button 
                  variant="outline" 
                  onClick={handleRefreshToken}
                  disabled={testing || loading}
                  className="flex items-center"
                >
                  <RefreshCw className="w-4 h-4 mr-2" />
                  {testing ? 'Renovando...' : 'Renovar Token'}
                </Button>
              </>
            )}
          </div>

          {/* Información del token */}
          {tokenInfo && (
            <Card className="bg-green-50 border-green-200">
              <CardContent className="pt-4">
                <h4 className="font-medium text-green-800 mb-2">Token Information</h4>
                <div className="text-sm text-green-700 space-y-1">
                  <p><strong>Tipo:</strong> {tokenInfo.token_type}</p>
                  <p><strong>Expira en:</strong> {tokenInfo.expires_in} segundos</p>
                  <p><strong>Emitido:</strong> {new Date(tokenInfo.issued_at).toLocaleString()}</p>
                  <p><strong>Expira:</strong> {new Date(tokenInfo.expires_at).toLocaleString()}</p>
                  {tokenInfo.scope && <p><strong>Scope:</strong> {tokenInfo.scope}</p>}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>
    </div>
  );
}