// Componente para configuración general de consultas de validez
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { 
  Settings, 
  Building, 
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Info
} from 'lucide-react';

import { useEmpresa } from '@/hooks/useEmpresa';
import { useConsultaValidez } from '@/services/consulta-validez';
import ConsultaValidezConfig from '@/components/empresas/ConsultaValidezConfig';

export default function ConfiguracionConsulta() {
  const { empresas, empresaActual, obtenerEmpresa } = useEmpresa();
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState<any>(empresaActual);
  const { getConfiguration, loading } = useConsultaValidez();
  
  const [configuraciones, setConfiguraciones] = useState<Map<string, any>>(new Map());
  const [loadingConfigs, setLoadingConfigs] = useState(false);

  useEffect(() => {
    if (empresas.length > 0) {
      loadAllConfigurations();
    }
  }, [empresas]);

  const loadAllConfigurations = async () => {
    setLoadingConfigs(true);
    const configs = new Map();
    
    try {
      for (const empresa of empresas) {
        try {
          const config = await getConfiguration(empresa.id);
          configs.set(empresa.id, config);
        } catch (error) {
          console.error(`Error cargando configuración para empresa ${empresa.id}:`, error);
          configs.set(empresa.id, null);
        }
      }
      setConfiguraciones(configs);
    } catch (error) {
      console.error('Error cargando configuraciones:', error);
    } finally {
      setLoadingConfigs(false);
    }
  };

  const handleConfigurationChange = (empresaId: string, configured: boolean) => {
    // Recargar configuración específica
    getConfiguration(empresaId).then(config => {
      setConfiguraciones(prev => new Map(prev.set(empresaId, config)));
    });
  };

  const getConfigStatus = (empresaId: string) => {
    const config = configuraciones.get(empresaId);
    if (!config) return 'not-configured';
    return config.status || 'not-configured';
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800"><CheckCircle className="w-3 h-3 mr-1" />Activo</Badge>;
      case 'configured':
        return <Badge className="bg-blue-100 text-blue-800">Configurado</Badge>;
      case 'not-configured':
        return <Badge className="bg-gray-100 text-gray-800">Sin configurar</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Error</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Desconocido</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Información general */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-4">
          <div className="flex items-start space-x-3">
            <Info className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-blue-800">
              <h3 className="font-medium">Configuración de API de Consulta de Validez</h3>
              <p className="text-sm mt-1">
                Configure las credenciales de acceso a la API de SUNAT para cada empresa. 
                Estas credenciales son necesarias para realizar consultas de validez de comprobantes.
              </p>
              <ul className="text-sm mt-2 space-y-1">
                <li>• Cada empresa debe tener sus propias credenciales (Client ID y Client Secret)</li>
                <li>• Las credenciales se obtienen desde el portal de SUNAT</li>
                <li>• Puede usar modo de prueba para testing antes de pasar a producción</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Resumen de configuraciones por empresa */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Building className="w-5 h-5 mr-2" />
              Estado de Configuraciones por Empresa
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={loadAllConfigurations}
              disabled={loadingConfigs}
              className="flex items-center"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${loadingConfigs ? 'animate-spin' : ''}`} />
              Actualizar
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {loadingConfigs ? (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="w-6 h-6 animate-spin mr-2" />
              Cargando configuraciones...
            </div>
          ) : empresas.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Building className="w-12 h-12 mx-auto mb-4 text-gray-300" />
              <p>No hay empresas registradas</p>
              <p className="text-sm">Registre una empresa primero para configurar las credenciales de API</p>
            </div>
          ) : (
            <div className="space-y-3">
              {empresas.map((empresa) => {
                const status = getConfigStatus(empresa.id);
                const isSelected = empresaSeleccionada?.id === empresa.id;
                
                return (
                  <div
                    key={empresa.id}
                    className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                      isSelected 
                        ? 'border-blue-200 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => setEmpresaSeleccionada(empresa)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <div>
                            <p className="font-medium">{empresa.razon_social}</p>
                            <p className="text-sm text-gray-600">RUC: {empresa.ruc}</p>
                          </div>
                          {isSelected && (
                            <Badge variant="outline" className="text-blue-600 border-blue-600">
                              Seleccionada
                            </Badge>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        {getStatusBadge(status)}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Configuración de la empresa seleccionada */}
      {empresaSeleccionada ? (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Settings className="w-5 h-5 mr-2" />
              Configuración para {empresaSeleccionada.razon_social}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ConsultaValidezConfig
              empresaId={empresaSeleccionada.id}
              empresaRuc={empresaSeleccionada.ruc}
              empresaRazonSocial={empresaSeleccionada.razon_social}
              onConfigurationChange={(configured) => 
                handleConfigurationChange(empresaSeleccionada.id, configured)
              }
            />
          </CardContent>
        </Card>
      ) : (
        <Alert>
          <AlertTriangle className="w-4 h-4" />
          <AlertDescription>
            Seleccione una empresa de la lista anterior para configurar sus credenciales de API
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}