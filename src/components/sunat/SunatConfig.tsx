'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { useApi } from '@/hooks/useApi';
import { SunatConfiguration } from '@/types/empresa';

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
  const [validationMessage, setValidationMessage] = useState<string>('');
  const [showPasswords, setShowPasswords] = useState(false);
  const [testingAllServices, setTestingAllServices] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [allServicesResult, setAllServicesResult] = useState<any>(null);

  // Cargar configuración actual
  useEffect(() => {
    const loadCurrentConfig = async () => {
      try {
        console.log('📥 Cargando configuración actual SUNAT...');
        const result = await get(`/empresas/${empresaId}/sunat/configuracion`);
        
        console.log('📥 Resultado carga config:', result);
        
        if (result.error) {
          console.error('❌ Error cargando config:', result.error);
          setStatus('not-configured');
          return;
        }
        
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const responseData = result.data as any;
        if (responseData && responseData.success && responseData.data?.configured) {
          // CORRECCIÓN: Cargar los valores reales del backend
          const backendConfig = responseData.data;
          setConfig(prevConfig => ({
            ...prevConfig,
            usuario_sol: backendConfig.usuario_sol || prevConfig.usuario_sol,
            test_mode: backendConfig.test_mode
          }));
          setStatus('configured');
          console.log('✅ Configuración cargada - usuario_sol:', backendConfig.usuario_sol, 'test_mode:', backendConfig.test_mode);
        } else {
          setStatus('not-configured');
        }
      } catch (error) {
        console.error('❌ Error al cargar configuración SUNAT:', error);
        setStatus('not-configured');
      }
    };

    loadCurrentConfig();
  }, [empresaId, get]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setValidationMessage('');

    console.log('🔧 Iniciando guardado de configuración SUNAT...');
    console.log('📋 Datos a enviar:', config);
    console.log('🏢 Empresa ID:', empresaId);

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
      console.log('📡 Llamando al endpoint POST /empresas/${empresaId}/configurar-sunat');
      console.log('🌐 URL completa que se construye:', `${process.env.NEXT_PUBLIC_API_URL || "http://127.0.0.1:8000/api/v1"}/empresas/${empresaId}/configurar-sunat`);
      
      const result = await post(`/empresas/${empresaId}/configurar-sunat`, config);
      
      console.log('📦 Result completo del useApi:', result);
      console.log('✅ Data:', result.data);
      console.log('❌ Error:', result.error);
      console.log('⏳ Loading:', result.loading);
      
      if (result.error) {
        console.error('❌ Error en la llamada API:', result.error);
        setValidationMessage(result.error);
        return;
      }
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (result.data && (result.data as any).success) {
        setStatus('configured');
        setValidationMessage('Configuración SUNAT guardada exitosamente');
        onConfigurationChange?.();
      } else {
        setValidationMessage('Error al guardar la configuración');
      }
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : 'Error desconocido';
      console.error('❌ Error catch al configurar SUNAT:', error);
      console.error('❌ Error completo:', error);
      setValidationMessage(`Error al configurar SUNAT: ${errorMessage}`);
    }
  };

  const testConnection = async () => {
    if (!config.usuario_sol || !config.clave_sol) {
      setValidationMessage('Complete las credenciales antes de probar la conexión');
      return;
    }

    try {
      console.log('🧪 Probando conexión SUNAT...');
      const result = await post(`/empresas/${empresaId}/sunat/test-connection`, config);
      
      console.log('🧪 Resultado test conexión:', result);
      
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
      console.error('❌ Error al probar conexión:', error);
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
      console.log('🧪 Probando todos los servicios SUNAT...');
      const result = await post(`/empresas/${empresaId}/sunat/test-all-services`, config);
      
      console.log('🧪 Resultado test completo:', result);
      
      if (result.error) {
        setValidationMessage(`❌ Error al probar servicios: ${result.error}`);
        return;
      }
      
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      if (result.data && (result.data as any).success) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const data = (result.data as any).data;
        setAllServicesResult(data);
        
        const summary = data.summary;
        const successRate = summary?.success_rate || 0;
        
        setValidationMessage(
          `📊 Test completo finalizado\n` +
          `✅ Servicios exitosos: ${summary?.successful_services || 0}/${summary?.total_services || 0}\n` +
          `📈 Tasa de éxito: ${successRate.toFixed(1)}%\n` +
          `${summary?.all_services_ok ? '🎉 Todos los servicios funcionan correctamente' : '⚠️ Algunos servicios presentan problemas'}`
        );
      } else {
        setValidationMessage('❌ Error en el test completo de servicios');
      }
    } catch (error: unknown) {
      console.error('❌ Error al probar todos los servicios:', error);
      setValidationMessage('❌ Error al probar todos los servicios');
    } finally {
      setTestingAllServices(false);
    }
  };

  if (status === 'loading') {
    return (
      <Card className="p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">Cargando configuración...</p>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Estado actual */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold">Estado de Configuración SUNAT</h3>
            <p className="text-gray-600">RUC: {empresaRuc}</p>
          </div>
          <div>
            {status === 'configured' ? (
              <Badge className="bg-green-100 text-green-800">✅ Configurado</Badge>
            ) : (
              <Badge className="bg-orange-100 text-orange-800">⚠️ Pendiente</Badge>
            )}
          </div>
        </div>
      </Card>

      {/* Formulario de configuración - solo mostrar si NO está configurado */}
      {status === 'not-configured' && (
        <Card className="p-6">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h4 className="text-md font-semibold mb-4">Credenciales SOL</h4>
                
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="usuario_sol">Usuario SOL</Label>
                    <Input
                      id="usuario_sol"
                      type="text"
                      value={config.usuario_sol}
                      onChange={(e) => setConfig({ ...config, usuario_sol: e.target.value })}
                      placeholder="Ej: MODDATOS"
                      className="mt-1"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Usuario secundario con perfil &ldquo;Envío de documentos electrónicos&rdquo;
                    </p>
                  </div>

                  <div>
                    <Label htmlFor="clave_sol">Clave SOL</Label>
                    <div className="relative">
                      <Input
                        id="clave_sol"
                        type={showPasswords ? "text" : "password"}
                        value={config.clave_sol}
                        onChange={(e) => setConfig({ ...config, clave_sol: e.target.value })}
                        placeholder="Ingrese su clave SOL"
                        className="mt-1 pr-10"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPasswords(!showPasswords)}
                      className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                    >
                      {showPasswords ? (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878L21 21" />
                        </svg>
                      ) : (
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    Clave SOL secundaria (no la principal)
                  </p>
                </div>

                <div>
                  <div className="flex items-center space-x-2">
                    <input
                      id="test_mode"
                      type="checkbox"
                      checked={config.test_mode}
                      onChange={(e) => setConfig({ ...config, test_mode: e.target.checked })}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor="test_mode" className="text-sm">
                      Modo de pruebas (Beta)
                    </Label>
                  </div>
                  <p className="text-xs text-gray-500 mt-1">
                    {config.test_mode 
                      ? '🧪 Conectará a los servicios de prueba de SUNAT' 
                      : '🔴 Conectará a los servicios de PRODUCCIÓN de SUNAT'
                    }
                  </p>
                </div>
              </div>
            </div>

            <div>
              <h4 className="text-md font-semibold mb-4">Información del Usuario SOL</h4>
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                <div className="text-sm">
                  <p className="font-medium text-blue-800">Usuario completo para WS-Security:</p>
                  <code className="text-blue-700 bg-blue-100 px-2 py-1 rounded">
                    {empresaRuc}{config.usuario_sol || 'USUARIO'}
                  </code>
                </div>
                
                <div className="text-xs text-blue-700 space-y-1">
                  <p><strong>Requisitos del Usuario SOL:</strong></p>
                  <ul className="list-disc list-inside space-y-1 ml-2">
                    <li>Debe ser un usuario <strong>secundario</strong></li>
                    <li>Tener el perfil &ldquo;Envío de documentos electrónicos&rdquo;</li>
                    <li>Estar habilitado para web services</li>
                  </ul>
                </div>

                <div className="text-xs text-blue-700">
                  <p><strong>Modo actual:</strong> {config.test_mode ? 'BETA (Pruebas)' : 'PRODUCCIÓN'}</p>
                  <p><strong>Endpoint:</strong> {config.test_mode 
                    ? 'e-beta.sunat.gob.pe' 
                    : 'e-factura.sunat.gob.pe'
                  }</p>
                </div>
              </div>
            </div>
          </div>

          {/* Mensaje de validación */}
          {validationMessage && (
            <div className={`p-3 rounded-lg text-sm ${
              validationMessage.includes('exitosa') || validationMessage.includes('✅')
                ? 'bg-green-50 border border-green-200 text-green-800'
                : 'bg-red-50 border border-red-200 text-red-800'
            }`}>
              {validationMessage}
            </div>
          )}

          {/* Botones */}
          <div className="flex space-x-3">
            <Button 
              type="submit" 
              disabled={loading}
              className="flex-1"
            >
              {loading ? 'Guardando...' : 'Guardar Configuración'}
            </Button>
            
            <Button 
              type="button" 
              variant="outline"
              onClick={testConnection}
              disabled={loading || !config.usuario_sol || !config.clave_sol}
            >
              Probar Conexión
            </Button>
            
            <Button 
              type="button" 
              variant="outline"
              onClick={testAllServices}
              disabled={loading || testingAllServices || !config.usuario_sol || !config.clave_sol}
              className="border-blue-300 text-blue-700 hover:bg-blue-100"
            >
              {testingAllServices ? 'Probando...' : 'Test Completo'}
            </Button>
          </div>
        </form>
      </Card>
      )}

      {/* Vista cuando está configurado */}
      {status === 'configured' && (
        <Card className="p-6 bg-green-50 border-green-200">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h4 className="text-lg font-semibold text-green-800">Configuración SUNAT Completa</h4>
              <p className="text-green-600">Las credenciales SOL están configuradas y funcionando correctamente</p>
            </div>
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setStatus('not-configured')}
                className="border-green-300 text-green-700 hover:bg-green-100"
              >
                Editar Configuración
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={testConnection}
                disabled={loading}
                className="border-green-300 text-green-700 hover:bg-green-100"
              >
                Probar Conexión
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={testAllServices}
                disabled={loading || testingAllServices}
                className="border-blue-300 text-blue-700 hover:bg-blue-100"
              >
                {testingAllServices ? 'Probando...' : 'Test Completo'}
              </Button>
            </div>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-700">Usuario SOL:</span>
                <span className="text-sm text-gray-900">{config.usuario_sol || 'No disponible'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-700">Modo:</span>
                <span className="text-sm text-gray-900">
                  {config.test_mode ? '🧪 Pruebas (Beta)' : '🔴 Producción'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm font-medium text-gray-700">Estado:</span>
                <span className="text-sm text-green-600 font-medium">✅ Activo</span>
              </div>
            </div>
            <div className="bg-white rounded-lg p-3 border border-green-200">
              <p className="text-sm text-green-700">
                <strong>✅ Listo para facturar:</strong> Su empresa puede emitir documentos electrónicos a SUNAT
              </p>
            </div>
          </div>

          {/* Controles para cambiar entre Beta y Producción */}
          <div className="border-t border-green-200 pt-4">
            <div className="flex items-center justify-between">
              <div>
                <h5 className="text-sm font-medium text-gray-900">Control de Ambiente</h5>
                <p className="text-xs text-gray-600">Cambia entre modo de pruebas y producción</p>
              </div>
              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
                  <input
                    id="test_mode_config"
                    type="checkbox"
                    checked={config.test_mode}
                    onChange={async (e) => {
                      const newTestMode = e.target.checked;
                      setConfig(prev => ({ ...prev, test_mode: newTestMode }));
                      
                      // Guardar inmediatamente el cambio
                      try {
                        const result = await post(`/empresas/${empresaId}/configurar-sunat`, {
                          ...config,
                          test_mode: newTestMode
                        });
                        
                        if (result.error) {
                          setValidationMessage(`❌ Error al cambiar modo: ${result.error}`);
                          // Revertir el cambio
                          setConfig(prev => ({ ...prev, test_mode: !newTestMode }));
                        } else {
                          setValidationMessage(
                            `✅ Modo cambiado a ${newTestMode ? 'Beta (Pruebas)' : 'Producción'} exitosamente`
                          );
                          onConfigurationChange?.();
                        }
                      } catch (error) {
                        console.error('Error al cambiar modo:', error);
                        setValidationMessage('❌ Error al cambiar modo');
                        // Revertir el cambio
                        setConfig(prev => ({ ...prev, test_mode: !newTestMode }));
                      }
                    }}
                    className="rounded border-gray-300"
                  />
                  <Label htmlFor="test_mode_config" className="text-sm">
                    Modo Beta (Pruebas)
                  </Label>
                </div>
                <div className={`px-3 py-1 rounded-full text-xs font-medium ${
                  config.test_mode 
                    ? 'bg-orange-100 text-orange-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {config.test_mode ? '🧪 BETA' : '🔴 PRODUCCIÓN'}
                </div>
              </div>
            </div>
            
            <div className="mt-3 text-xs text-gray-600">
              <p>
                <strong>Importante:</strong> {config.test_mode 
                  ? 'En modo Beta, los documentos son de prueba y no tienen validez legal.' 
                  : 'En modo Producción, los documentos tienen validez legal y son reportados a SUNAT.'
                }
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Panel de resultados del test completo */}
      {allServicesResult && (
        <Card className="p-6">
          <h4 className="text-lg font-semibold mb-4">📊 Resultados del Test Completo</h4>
          
          {/* Resumen general */}
          <div className="mb-4 p-4 bg-gray-50 rounded-lg">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div>
                <div className="text-2xl font-bold text-blue-600">
                  {allServicesResult.summary?.total_services || 0}
                </div>
                <div className="text-sm text-gray-600">Servicios Probados</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-green-600">
                  {allServicesResult.summary?.successful_services || 0}
                </div>
                <div className="text-sm text-gray-600">Exitosos</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-orange-600">
                  {(allServicesResult.summary?.total_services || 0) - (allServicesResult.summary?.successful_services || 0)}
                </div>
                <div className="text-sm text-gray-600">Con Errores</div>
              </div>
              <div>
                <div className="text-2xl font-bold text-purple-600">
                  {allServicesResult.summary?.success_rate?.toFixed(1) || '0.0'}%
                </div>
                <div className="text-sm text-gray-600">Tasa de Éxito</div>
              </div>
            </div>
          </div>

          {/* Detalles por servicio */}
          <div className="space-y-3">
            <h5 className="font-medium text-gray-900">Detalles por Servicio:</h5>
            {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
            {allServicesResult.services && Object.entries(allServicesResult.services).map(([serviceName, serviceResult]: [string, any]) => (
              <div 
                key={serviceName}
                className={`p-3 rounded-lg border-l-4 ${
                  serviceResult.success 
                    ? 'bg-green-50 border-green-400' 
                    : 'bg-red-50 border-red-400'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className="text-lg">
                      {serviceResult.success ? '✅' : '❌'}
                    </span>
                    <div>
                      <h6 className="font-medium capitalize">
                        {serviceName.replace('_', ' ')}
                      </h6>
                      <p className={`text-sm ${
                        serviceResult.success ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {serviceResult.message}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium">
                      {serviceResult.response_time_ms}ms
                    </div>
                    {serviceResult.error_code && (
                      <div className="text-xs text-red-500">
                        {serviceResult.error_code}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Botón para limpiar resultados */}
          <div className="mt-4 text-center">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setAllServicesResult(null)}
            >
              Cerrar Resultados
            </Button>
          </div>
        </Card>
      )}

      {/* Información adicional */}
      <Card className="p-6 bg-yellow-50 border-yellow-200">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h4 className="text-sm font-medium text-yellow-800">Importante</h4>
            <div className="mt-2 text-sm text-yellow-700">
              <ul className="list-disc list-inside space-y-1">
                <li>Use el modo de pruebas (Beta) para realizar pruebas iniciales</li>
                <li>Cambie a modo producción solo cuando esté listo para emitir documentos reales</li>
                <li>Mantenga sus credenciales SOL seguras y no las comparta</li>
                <li>La conexión se probará automáticamente al guardar</li>
              </ul>
            </div>
          </div>
        </div>
      </Card>
    </div>
  );
}
