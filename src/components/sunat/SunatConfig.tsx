'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useApi } from '@/hooks/useApi';
import { SunatConfiguration } from '@/types/empresa';
import { Shield, Eye, EyeOff, RefreshCw, AlertTriangle } from 'lucide-react';
import SunatModeController from './SunatModeController';

interface SunatConfigProps {
  empresaId: string;
  empresaRuc: string;
  onConfigurationChange?: () => void;
}

export default function SunatConfig({ empresaId, empresaRuc, onConfigurationChange }: SunatConfigProps) {
  const { post, get, loading } = useApi();
  
  const [config, setConfig] = useState<SunatConfiguration>({
    usuario_sol: '',
    clave_sol: '',
    test_mode: true
  });
  
  const [status, setStatus] = useState<'loading' | 'not-configured' | 'configured' | 'error'>('loading');
  const [hasOriginalCredentials, setHasOriginalCredentials] = useState<boolean>(false);
  const [validationMessage, setValidationMessage] = useState<string>('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [testingAllServices, setTestingAllServices] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [allServicesResult, setAllServicesResult] = useState<any>(null);

  // Cargar configuración actual
  useEffect(() => {
    const loadCurrentConfig = async () => {
      try {
        // Cargar configuración general
        const configResult = await get(`/empresas/${empresaId}/sunat/configuracion`);
        
        // Cargar información de credenciales originales
        const credentialsResult = await get(`/empresas/${empresaId}/credenciales-sunat/info`);
        
        if (configResult.error) {
          setStatus('not-configured');
          setHasOriginalCredentials(false);
          return;
        }
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const responseData = configResult.data as any;
        if (responseData && responseData.success && responseData.data?.configured) {
          // Cargar los valores reales del backend
          const backendConfig = responseData.data;
          setConfig(prevConfig => ({
            ...prevConfig,
            usuario_sol: backendConfig.usuario_sol || prevConfig.usuario_sol,
            test_mode: backendConfig.test_mode
          }));
          setStatus('configured');
        } else {
          setStatus('not-configured');
        }
        
        // Verificar credenciales originales
        if (!credentialsResult.error && credentialsResult.data) {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const credentialsData = credentialsResult.data as any;
          if (credentialsData && credentialsData.success) {
            setHasOriginalCredentials(credentialsData.data?.tiene_credenciales_originales || false);
          }
        }
        
      } catch (error) {
        setStatus('not-configured');
        setHasOriginalCredentials(false);
      }
    };

    loadCurrentConfig();
  }, [empresaId, get]);

  // Función para recargar estado
  const reloadConfiguration = async () => {
    // Recargar información de credenciales
    const credentialsResult = await get(`/empresas/${empresaId}/credenciales-sunat/info`);
    
    if (!credentialsResult.error && credentialsResult.data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const credentialsData = credentialsResult.data as any;
      
      // El endpoint devuelve directamente el objeto, no envuelto en { success: true, data: {} }
      setHasOriginalCredentials(credentialsData.tiene_credenciales_originales || false);
    }
    
    // Recargar configuración general
    const configResult = await get(`/empresas/${empresaId}/sunat/configuracion`);
    if (!configResult.error && configResult.data) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const responseData = configResult.data as any;
      if (responseData && responseData.success && responseData.data?.configured) {
        const backendConfig = responseData.data;
        setConfig(prevConfig => ({
          ...prevConfig,
          usuario_sol: backendConfig.usuario_sol || prevConfig.usuario_sol,
          test_mode: backendConfig.test_mode
        }));
        setStatus('configured');
      }
    }
    
    // Notificar al componente padre
    onConfigurationChange?.();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationMessage('');

    // Validaciones básicas
    if (!config.usuario_sol.trim()) {
      setValidationMessage('El usuario SOL es requerido');
      return;
    }

    if (!config.clave_sol.trim()) {
      setValidationMessage('La clave SOL es requerida');
      return;
    }

    try {
      // CORREGIDO: Usar el endpoint correcto para guardar credenciales originales
      const credencialesRequest = {
        usuario_sol: config.usuario_sol,
        clave_sol: config.clave_sol
      };
      
      const result = await post(`/empresas/${empresaId}/configurar-credenciales-originales`, credencialesRequest);
      
      if (result.error) {
        setValidationMessage(result.error);
        return;
      }
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (result.data && (result.data as any).success) {
        // Si el usuario quiere modo beta después de guardar originales
        if (config.test_mode) {
          const modeRequest = { test_mode: true };
          const modeResult = await post(`/empresas/${empresaId}/cambiar-modo-sunat`, modeRequest);
          
          if (modeResult.error) {
            setValidationMessage(`✅ Credenciales guardadas, pero error al cambiar a BETA: ${modeResult.error}`);
          } else {
            setValidationMessage('✅ Credenciales originales guardadas y modo BETA activado');
          }
        } else {
          setValidationMessage('✅ Credenciales originales guardadas exitosamente');
        }
        
        setStatus('configured');
        setHasOriginalCredentials(true); // Ahora tiene credenciales originales
        
        // Pequeño delay para asegurar que el backend haya procesado completamente
        setTimeout(async () => {
          await reloadConfiguration();
        }, 500);
        
        onConfigurationChange?.();
      } else {
        setValidationMessage('Error al guardar las credenciales originales');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      setValidationMessage(`Error al configurar credenciales originales: ${errorMessage}`);
    }
  };

  const testConnection = async () => {
    if (!config.usuario_sol || !config.clave_sol) {
      setValidationMessage('Complete las credenciales antes de probar la conexión');
      return;
    }

    try {
      const result = await post(`/empresas/${empresaId}/sunat/test-connection`, config);
      
      if (result.error) {
        setValidationMessage(`❌ Error al probar la conexión: ${result.error}`);
        return;
      }
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (result.data && (result.data as any).success) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = (result.data as any).data;
        const responseTime = data?.response_time_ms || 0;
        const environment = data?.environment || 'desconocido';
        const endpoint = data?.endpoint || '';
        
        setValidationMessage(
          `✅ Conexión exitosa con SUNAT\n` +
          `🌐 Ambiente: ${environment}\n` +
          `⏱️ Tiempo de respuesta: ${responseTime}ms\n` +
          `📡 Endpoint: ${endpoint.includes('beta') ? 'Beta (Pruebas)' : 'Producción'}`
        );
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const errorCode = (result.data as any)?.data?.error_code;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const errorDetails = (result.data as any)?.data?.error_details;
        
        let errorMessage = '❌ Error en la conexión con SUNAT';
        if (errorCode) {
          errorMessage += `\n🚫 Código: ${errorCode}`;
        }
        if (errorDetails) {
          errorMessage += `\n📝 Detalle: ${errorDetails}`;
        }
        
        setValidationMessage(errorMessage);
      }
    } catch (error: unknown) {
      setValidationMessage('❌ Error al probar la conexión');
    }
  };

  const testAllServices = async () => {
    if (!config.usuario_sol || !config.clave_sol) {
      setValidationMessage('Complete las credenciales antes de probar todos los servicios');
      return;
    }

    setTestingAllServices(true);
    setAllServicesResult(null);

    try {
      const result = await post(`/empresas/${empresaId}/sunat/test-all-services`, config);
      
      if (result.error) {
        setValidationMessage(`❌ Error al probar servicios: ${result.error}`);
        return;
      }
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (result.data && (result.data as any).success) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = (result.data as any).data;
        setAllServicesResult(data);
        setValidationMessage('✅ Prueba completa de servicios realizada');
      } else {
        setValidationMessage('❌ Error en la prueba completa de servicios');
      }
    } catch (error: unknown) {
      setValidationMessage('❌ Error al probar todos los servicios');
    } finally {
      setTestingAllServices(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Estado de carga */}
      {status === 'loading' && (
        <Card className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
            <span className="text-sm text-gray-600">Cargando configuración SUNAT...</span>
          </div>
        </Card>
      )}

      {/* Control de Ambiente SUNAT - Nuevo componente */}
      {status !== 'loading' && (
        <SunatModeController 
          key={`sunat-controller-${hasOriginalCredentials}`} // Fuerza re-render cuando cambia el estado
          empresaId={empresaId}
          empresaRuc={empresaRuc}
          onModeChange={reloadConfiguration}
        />
      )}

      {/* Configuración de credenciales originales - Mostrar cuando no hay credenciales originales */}
      {status !== 'loading' && !hasOriginalCredentials && (
        <Card className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <Shield className="h-5 w-5 text-blue-600" />
            <h3 className="text-lg font-semibold">Configurar Credenciales Originales SUNAT</h3>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-start space-x-2">
              <Shield className="h-5 w-5 text-blue-600 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-blue-900">Credenciales de Producción</h4>
                <p className="text-sm text-blue-800 mt-1">
                  Estas son sus credenciales reales de SUNAT que se conservarán de forma permanente.
                  Podrá cambiar entre modo BETA y PRODUCCIÓN sin perder estas credenciales.
                </p>
              </div>
            </div>
          </div>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="usuario_sol" className="text-sm font-medium">
                  Usuario SOL *
                </Label>
                <Input
                  id="usuario_sol"
                  type="text"
                  value={config.usuario_sol}
                  onChange={(e) => setConfig({ ...config, usuario_sol: e.target.value })}
                  placeholder="Ej: MODDATOS"
                  className="mt-1"
                  required
                />
                <p className="text-xs text-gray-500 mt-1">
                  Usuario secundario con perfil "Envío de documentos electrónicos"
                </p>
              </div>

              <div>
                <Label htmlFor="clave_sol" className="text-sm font-medium">
                  Clave SOL *
                </Label>
                <div className="relative mt-1">
                  <Input
                    id="clave_sol"
                    type={showPasswords ? "text" : "password"}
                    value={config.clave_sol}
                    onChange={(e) => setConfig({ ...config, clave_sol: e.target.value })}
                    placeholder="Ingrese su clave SOL"
                    className="pr-10"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(!showPasswords)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center"
                  >
                    {showPasswords ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Clave SOL secundaria (no la principal)
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <Button 
                type="submit" 
                disabled={loading}
                className="flex-1 bg-blue-600 hover:bg-blue-700"
              >
                {loading ? (
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Shield className="h-4 w-4 mr-2" />
                )}
                Guardar Credenciales Originales
              </Button>
              
              <Button 
                type="button"
                onClick={testConnection}
                disabled={loading || !config.usuario_sol || !config.clave_sol}
                variant="outline"
                className="flex-1"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Probar Conexión
              </Button>
            </div>

            {validationMessage && (
              <div className={`p-3 rounded-lg border ${
                validationMessage.includes('✅') 
                  ? 'bg-green-50 border-green-200 text-green-800' 
                  : 'bg-red-50 border-red-200 text-red-800'
              }`}>
                <pre className="text-sm whitespace-pre-wrap">{validationMessage}</pre>
              </div>
            )}

            {allServicesResult && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h4 className="font-medium text-blue-900 mb-2">Resultado de Pruebas Completas</h4>
                <pre className="text-xs text-blue-800 overflow-auto">
                  {JSON.stringify(allServicesResult, null, 2)}
                </pre>
              </div>
            )}
          </form>

          <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex">
              <AlertTriangle className="w-5 h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
              <div className="ml-3">
                <h4 className="text-sm font-medium text-yellow-800">Importante</h4>
                <div className="mt-2 text-sm text-yellow-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li>Use el modo de pruebas (Beta) para realizar pruebas iniciales</li>
                    <li>Sus credenciales originales se conservan al cambiar a modo BETA</li>
                    <li>Cambie a modo producción solo cuando esté listo para emitir documentos reales</li>
                    <li>Mantenga sus credenciales SOL seguras y no las comparta</li>
                    <li>La conexión se probará automáticamente al guardar</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </Card>
      )}

      {/* Estado configurado - Mostrar resumen y opción para editar */}
      {status === 'configured' && (
        <Card className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-green-600" />
              <h3 className="text-lg font-semibold">Credenciales SUNAT Configuradas</h3>
            </div>
            <Badge className="bg-green-100 text-green-800">Configurado</Badge>
          </div>
          
          <div className="bg-green-50 border border-green-200 rounded-lg p-4">
            <p className="text-sm text-green-800">
              ✅ Las credenciales SUNAT están configuradas correctamente.
              <br />
              Usuario SOL: <span className="font-mono">{config.usuario_sol}</span>
              <br />
              Utilice el control de ambiente arriba para cambiar entre BETA y PRODUCCIÓN.
            </p>
          </div>

          <div className="mt-4 flex space-x-2">
            <Button 
              type="button"
              onClick={testConnection}
              disabled={loading}
              variant="outline"
              className="flex-1"
            >
              <RefreshCw className="h-4 w-4 mr-2" />
              Probar Conexión
            </Button>
            
            <Button 
              type="button"
              onClick={testAllServices}
              disabled={loading || testingAllServices}
              variant="outline"
              className="flex-1"
            >
              {testingAllServices ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Shield className="h-4 w-4 mr-2" />
              )}
              Probar Todos los Servicios
            </Button>
          </div>

          {validationMessage && (
            <div className={`mt-4 p-3 rounded-lg border ${
              validationMessage.includes('✅') 
                ? 'bg-green-50 border-green-200 text-green-800' 
                : 'bg-red-50 border-red-200 text-red-800'
            }`}>
              <pre className="text-sm whitespace-pre-wrap">{validationMessage}</pre>
            </div>
          )}

          {allServicesResult && (
            <div className="mt-4 bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">Resultado de Pruebas Completas</h4>
              <pre className="text-xs text-blue-800 overflow-auto">
                {JSON.stringify(allServicesResult, null, 2)}
              </pre>
            </div>
          )}
        </Card>
      )}
    </div>
  );
}