'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useApi } from '@/hooks/useApi';
import { 
  SunatCredentialsInfo, 
  SunatModeChangeRequest,
  SunatBetaConfigRequest 
} from '@/types/empresa';
import { 
  Shield, 
  Zap, 
  Settings, 
  RefreshCw, 
  AlertTriangle,
  CheckCircle,
  ArrowLeftRight,
  Eye,
  EyeOff
} from 'lucide-react';

interface SunatModeControllerProps {
  empresaId: string;
  empresaRuc: string;
  onModeChange?: () => void;
}

export default function SunatModeController({ 
  empresaId, 
  empresaRuc, 
  onModeChange 
}: SunatModeControllerProps) {
  const { post, get, loading } = useApi();
  
  const [credentialsInfo, setCredentialsInfo] = useState<SunatCredentialsInfo | null>(null);
  const [loadingInfo, setLoadingInfo] = useState(true);
  const [changingMode, setChangingMode] = useState(false);
  const [message, setMessage] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);

  // Cargar información de credenciales
  const loadCredentialsInfo = async () => {
    try {
      setLoadingInfo(true);
      
      const result = await get(`/empresas/${empresaId}/credenciales-sunat/info`);
      
      if (result.error) {
        setMessage(`Error: ${result.error}`);
        return;
      }
      
      if (result.data) {
        setCredentialsInfo(result.data as SunatCredentialsInfo);
      } else {
        setMessage('No se pudo cargar la información de credenciales');
      }
      
    } catch (error) {
      setMessage('Error al cargar información de credenciales');
    } finally {
      setLoadingInfo(false);
    }
  };

  // Cambiar modo SUNAT
  const handleModeChange = async (newTestMode: boolean) => {
    setChangingMode(true);
    setMessage('');
    
    try {
      const modeText = newTestMode ? 'BETA (Pruebas)' : 'PRODUCCIÓN';
      
      const request: SunatModeChangeRequest = {
        test_mode: newTestMode
      };
      
      const result = await post(`/empresas/${empresaId}/cambiar-modo-sunat`, request);
      
      if (result.error) {
        setMessage(`❌ Error al cambiar modo: ${result.error}`);
        return;
      }
      
      setMessage(`✅ Modo cambiado a ${modeText} exitosamente`);
      
      // Recargar información
      await loadCredentialsInfo();
      onModeChange?.();
      
    } catch (error) {
      setMessage('❌ Error al cambiar modo');
    } finally {
      setChangingMode(false);
    }
  };

  // Configurar BETA automático
  const handleAutoBetaSetup = async () => {
    setChangingMode(true);
    setMessage('');
    
    try {
      const request: SunatBetaConfigRequest = {};
      const result = await post(`/empresas/${empresaId}/configurar-sunat-beta`, request);
      
      if (result.error) {
        setMessage(`❌ Error: ${result.error}`);
        return;
      }
      
      setMessage('✅ Modo BETA configurado automáticamente');
      
      // Recargar información
      await loadCredentialsInfo();
      onModeChange?.();
      
    } catch (error) {
      setMessage('❌ Error en configuración automática');
    } finally {
      setChangingMode(false);
    }
  };

  useEffect(() => {
    loadCredentialsInfo();
  }, [empresaId]);

  if (loadingInfo) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-center space-x-2">
            <RefreshCw className="h-5 w-5 animate-spin text-blue-600" />
            <span className="text-sm text-gray-600">Cargando información SUNAT...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!credentialsInfo) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <ArrowLeftRight className="h-5 w-5 text-blue-600" />
            <span>Control de Ambiente SUNAT</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <p className="text-sm text-gray-600">
              Para probar la funcionalidad, configure primero el modo BETA con credenciales automáticas.
            </p>
            <Button
              onClick={handleAutoBetaSetup}
              disabled={changingMode || loading}
              className="w-full bg-orange-500 hover:bg-orange-600 text-white"
            >
              {changingMode ? (
                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Settings className="h-4 w-4 mr-2" />
              )}
              Configurar Modo BETA (Pruebas)
            </Button>
            
            {message && (
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">{message}</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  }

  const isInBetaMode = credentialsInfo.credenciales_activas.test_mode;

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2">
            <ArrowLeftRight className="h-5 w-5 text-blue-600" />
            <span className="text-blue-900">Control de Ambiente SUNAT</span>
          </CardTitle>
          <Badge className={`${isInBetaMode ? 'bg-orange-100 text-orange-800' : 'bg-green-100 text-green-800'}`}>
            {isInBetaMode ? '🧪 BETA (Pruebas)' : '🔴 PRODUCCIÓN'}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="space-y-6">
        {/* Información actual */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Estado Actual</h4>
            <div className="bg-white rounded-lg p-4 border space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Modo:</span>
                <span className="text-sm font-medium">{credentialsInfo.modo_actual}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Usuario activo:</span>
                <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                  {credentialsInfo.credenciales_activas.usuario_sol}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Clave:</span>
                <div className="flex items-center space-x-2">
                  <span className="text-sm font-mono bg-gray-100 px-2 py-1 rounded">
                    {showPassword ? credentialsInfo.credenciales_activas.clave_sol : '••••••••'}
                  </span>
                  <button
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Credenciales originales:</span>
                <span className={`text-sm font-medium ${credentialsInfo.tiene_credenciales_originales ? 'text-green-600' : 'text-red-600'}`}>
                  {credentialsInfo.tiene_credenciales_originales ? '✅ Sí' : '❌ No'}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-gray-700">Tipo de credenciales:</span>
                <span className="text-sm text-gray-600">
                  {credentialsInfo.credenciales_activas.tipo}
                </span>
              </div>
            </div>
          </div>

          {/* Controles de cambio */}
          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Cambiar Ambiente</h4>
            <div className="space-y-3">
              {/* Botón para cambiar a BETA */}
              {!isInBetaMode && (
                <Button
                  onClick={() => handleModeChange(true)}
                  disabled={changingMode || loading}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white"
                  size="sm"
                >
                  {changingMode ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Zap className="h-4 w-4 mr-2" />
                  )}
                  Cambiar a Modo BETA (Pruebas)
                </Button>
              )}

              {/* Botón para cambiar a PRODUCCIÓN - solo si hay credenciales originales */}
              {isInBetaMode && credentialsInfo.tiene_credenciales_originales && (
                <Button
                  onClick={() => handleModeChange(false)}
                  disabled={changingMode || loading}
                  className="w-full bg-green-600 hover:bg-green-700 text-white"
                  size="sm"
                >
                  {changingMode ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Shield className="h-4 w-4 mr-2" />
                  )}
                  Cambiar a Modo PRODUCCIÓN
                </Button>
              )}

              {/* Mensaje cuando no hay credenciales originales */}
              {isInBetaMode && !credentialsInfo.tiene_credenciales_originales && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex">
                    <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                    <div className="ml-3">
                      <h4 className="text-sm font-medium text-yellow-800">Credenciales Originales Requeridas</h4>
                      <p className="mt-1 text-sm text-yellow-700">
                        Para cambiar a modo PRODUCCIÓN, necesita configurar primero sus credenciales originales SOL.
                        Use el formulario de abajo para configurarlas.
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Configuración automática BETA */}
              {!credentialsInfo.configuracion_completa && (
                <Button
                  onClick={handleAutoBetaSetup}
                  disabled={changingMode || loading}
                  variant="outline"
                  className="w-full border-orange-300 text-orange-700 hover:bg-orange-50"
                  size="sm"
                >
                  {changingMode ? (
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  ) : (
                    <Settings className="h-4 w-4 mr-2" />
                  )}
                  Configurar BETA Automático
                </Button>
              )}
            </div>

            {/* Información adicional */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <h5 className="text-sm font-medium text-blue-800 mb-1">Información</h5>
              <div className="space-y-1 text-xs text-blue-700">
                <p><strong>RUC:</strong> {credentialsInfo.ruc}</p>
                <p><strong>Empresa:</strong> {credentialsInfo.razon_social}</p>
                {isInBetaMode && (
                  <p className="italic">Las credenciales BETA se generan automáticamente para pruebas</p>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Mensaje de estado */}
        {message && (
          <div className="p-3 bg-white border rounded-lg">
            <p className="text-sm">{message}</p>
          </div>
        )}

        {/* Advertencias */}
        {isInBetaMode && (
          <div className="bg-orange-100 border border-orange-300 rounded-lg p-3">
            <div className="flex">
              <AlertTriangle className="h-5 w-5 text-orange-600 mt-0.5" />
              <div className="ml-2">
                <h5 className="text-sm font-medium text-orange-800">Modo de Pruebas Activo</h5>
                <p className="text-sm text-orange-700 mt-1">
                  Está en modo BETA. Los documentos enviados no son válidos para efectos tributarios.
                  Cambie a modo PRODUCCIÓN cuando esté listo para facturar.
                </p>
              </div>
            </div>
          </div>
        )}

        {!isInBetaMode && (
          <div className="bg-green-100 border border-green-300 rounded-lg p-3">
            <div className="flex">
              <CheckCircle className="h-5 w-5 text-green-600 mt-0.5" />
              <div className="ml-2">
                <h5 className="text-sm font-medium text-green-800">Modo Producción Activo</h5>
                <p className="text-sm text-green-700 mt-1">
                  Los documentos enviados son válidos para efectos tributarios.
                  Asegúrese de que toda la información sea correcta.
                </p>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}