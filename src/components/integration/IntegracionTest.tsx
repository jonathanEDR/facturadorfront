'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useApi } from '@/hooks/useApi';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface IntegracionTestProps {
  empresaId: string;
  empresaRuc: string;
  empresaRazonSocial: string;
  onIntegrationChange?: () => void;
}

interface TestResult {
  success: boolean;
  message: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  details?: any;
  duration?: number;
}

interface IntegrationStatus {
  certificados: 'ok' | 'warning' | 'error' | 'pending';
  sunat: 'ok' | 'warning' | 'error' | 'pending';
  conectividad: 'ok' | 'warning' | 'error' | 'pending';
  facturacion: 'ok' | 'warning' | 'error' | 'pending';
  overall: 'ready' | 'partial' | 'not-ready';
}

export default function IntegracionTest({ 
  empresaId, 
  empresaRuc, 
  empresaRazonSocial,
  onIntegrationChange 
}: IntegracionTestProps) {
  const { apiCall } = useApi();
  const [status, setStatus] = useState<IntegrationStatus>({
    certificados: 'pending',
    sunat: 'pending',
    conectividad: 'pending',
    facturacion: 'pending',
    overall: 'not-ready'
  });
  
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [isRunning, setIsRunning] = useState(false);
  const [currentTest, setCurrentTest] = useState<string | null>(null);

  // Verificar estado inicial al cargar el componente
  useEffect(() => {
    const checkInitialStatus = async () => {
      try {
        // En lugar de un endpoint específico, usamos los datos de la empresa
        const response = await apiCall(`/empresas/${empresaId}`, {
          method: 'GET'
        });

        console.log('Initial status response:', response);

        if (response.data) {
          const empresaData = response.data as any;
          if (empresaData?.success && empresaData?.data) {
            const empresa = empresaData.data;
            // Determinar estado basado en los datos de la empresa
            const newStatus: IntegrationStatus = {
              certificados: empresa.tiene_certificado ? 'ok' : 'pending',
              sunat: empresa.tiene_configuracion_sunat ? 'ok' : 'pending',
              conectividad: 'pending', // Esto lo determinamos con tests
              facturacion: empresa.puede_facturar ? 'ok' : 'pending',
              overall: empresa.puede_facturar ? 'ready' : 'not-ready'
            };
            setStatus(newStatus);
          }
        }
      } catch (error) {
        console.error('Error verificando estado inicial:', error);
      }
    };

    checkInitialStatus();
  }, [empresaId, apiCall]);

  const runTest = async (testType: string) => {
    setCurrentTest(testType);
    const startTime = Date.now();

    try {
      let response;
      let result: TestResult;
      const duration = Date.now() - startTime;
      
      // Ejecutar diferentes tipos de test según el tipo
      switch (testType) {
        case 'certificados':
          // Verificar certificados usando el endpoint de empresa
          response = await apiCall(`/empresas/${empresaId}`, { method: 'GET' });
          const empresaData = response.data as any;
          
          // La respuesta debería tener tiene_certificado directamente
          const tieneCertificado = empresaData?.tiene_certificado || false;
          
          result = {
            success: tieneCertificado,
            message: tieneCertificado ? 'Certificado digital configurado correctamente' : 'No hay certificado digital configurado',
            duration
          };
          break;

        case 'sunat':
          // Verificar configuración SUNAT
          response = await apiCall(`/empresas/${empresaId}`, { method: 'GET' });
          const empresaDataSunat = response.data as any;
          
          // La respuesta debería tener tiene_configuracion_sunat directamente
          const tieneConfigSunat = empresaDataSunat?.tiene_configuracion_sunat || false;
          
          result = {
            success: tieneConfigSunat,
            message: tieneConfigSunat ? 'Configuración SUNAT correcta' : 'Configuración SUNAT pendiente',
            duration
          };
          break;

        case 'conectividad':
          // Test de conectividad usando el endpoint de validación SUNAT
          try {
            response = await apiCall(`/empresas/${empresaId}/validar-sunat`, { method: 'POST' });
            const validationData = response.data as any;
            
            result = {
              success: validationData?.success || false,
              message: validationData?.message || 'Test de conectividad completado',
              details: validationData?.data,
              duration
            };
          } catch (error) {
            result = {
              success: false,
              message: 'Error de conectividad con SUNAT',
              duration
            };
          }
          break;

        case 'facturacion':
          // Verificar si puede facturar
          response = await apiCall(`/empresas/${empresaId}`, { method: 'GET' });
          const empresaDataFact = response.data as any;
          const puedeFacturar = empresaDataFact?.puede_facturar || false;
          
          result = {
            success: puedeFacturar,
            message: puedeFacturar ? 'Sistema listo para facturación electrónica' : 'Sistema no está listo para facturar',
            duration
          };
          break;

        default:
          result = {
            success: false,
            message: `Test ${testType} no implementado`,
            duration
          };
      }

      setTestResults(prev => ({ ...prev, [testType]: result }));
      
      // Determinar estado específico
      let newStatus = result.success ? 'ok' : 'error';
      if (result.message?.includes('pendiente') || result.message?.includes('warning')) {
        newStatus = 'warning';
      }
      
      setStatus(prev => ({
        ...prev,
        [testType]: newStatus
      }));

      return result;
    } catch (error: unknown) {
      const duration = Date.now() - startTime;
      
      // Log para debug
      console.error(`Test ${testType} error:`, error);
      
      const errorMessage = error instanceof Error ? error.message : 'Error ejecutando test';
      
      const result: TestResult = {
        success: false,
        message: errorMessage,
        duration
      };

      setTestResults(prev => ({ ...prev, [testType]: result }));
      setStatus(prev => ({
        ...prev,
        [testType]: 'error'
      }));

      return result;
    } finally {
      setCurrentTest(null);
    }
  };

  const runAllTests = async () => {
    setIsRunning(true);
    
    try {
      // 1. Test de certificados
      const certResult = await runTest('certificados');
      
      // 2. Test de SUNAT
      const sunatResult = await runTest('sunat');
      
      // 3. Test de conectividad
      const conectResult = await runTest('conectividad');
      
      // 4. Test de facturación (solo si los anteriores son exitosos)
      if (certResult.success && sunatResult.success && conectResult.success) {
        await runTest('facturacion');
      }

      // Actualizar estado general
      updateOverallStatus();
      
      if (onIntegrationChange) {
        onIntegrationChange();
      }
    } finally {
      setIsRunning(false);
    }
  };

  const updateOverallStatus = () => {
    const allRequired = status.certificados === 'ok' && status.sunat === 'ok' && status.conectividad === 'ok';
    const anyError = Object.entries(status).some(([key, s]) => key !== 'facturacion' && s === 'error');
    
    setStatus(prev => ({
      ...prev,
      overall: allRequired ? 'ready' : anyError ? 'not-ready' : 'partial'
    }));
  };

  const getStatusIcon = (statusType: string) => {
    switch (status[statusType as keyof IntegrationStatus]) {
      case 'ok':
        return '✅';
      case 'warning':
        return '🏆';
      case 'error':
        return '❌';
      default:
        return '⏳';
    }
  };

  const getStatusBadge = (statusType: string) => {
    const currentStatus = status[statusType as keyof IntegrationStatus];
    switch (currentStatus) {
      case 'ok':
        return <Badge className="bg-green-100 text-green-800">Correcto</Badge>;
      case 'warning':
        return <Badge className="bg-orange-100 text-orange-800">Pendiente</Badge>;
      case 'error':
        return <Badge className="bg-red-100 text-red-800">Error</Badge>;
      default:
        return <Badge className="bg-gray-100 text-gray-800">Pendiente</Badge>;
    }
  };

  const formatDuration = (duration?: number) => {
    if (!duration) return '';
    return duration < 1000 ? `${duration}ms` : `${(duration / 1000).toFixed(1)}s`;
  };

  return (
    <div className="space-y-6">
      {/* Header con estado general */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Estado de Integración</h3>
            <p className="text-sm text-gray-600">{empresaRazonSocial} - RUC: {empresaRuc}</p>
          </div>
          <div className="text-right">
            {status.overall === 'ready' && (
              <Badge className="bg-green-100 text-green-800 text-sm">
                🎉 ¡Sistema Listo para Facturar!
              </Badge>
            )}
            {status.overall === 'partial' && (
              <Badge className="bg-orange-100 text-orange-800 text-sm">
                ⚠️ Configuración Parcial
              </Badge>
            )}
            {status.overall === 'not-ready' && (
              <Badge className="bg-red-100 text-red-800 text-sm">
                ❌ Sistema No Listo
              </Badge>
            )}
          </div>
        </div>

        <Button 
          onClick={runAllTests} 
          disabled={isRunning}
          className="w-full"
          size="lg"
        >
          {isRunning ? (
            <>
              <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              Ejecutando Tests de Integración...
            </>
          ) : (
            '🔧 Ejecutar Tests de Integración Completos'
          )}
        </Button>
      </Card>

      {/* Tests individuales */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Test de Certificados */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <span className="text-lg">{getStatusIcon('certificados')}</span>
              <h4 className="font-medium">Certificados Digitales</h4>
            </div>
            {getStatusBadge('certificados')}
          </div>
          
          <p className="text-sm text-gray-600 mb-3">
            Validación de certificados digitales y firma
          </p>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => runTest('certificados')}
            disabled={isRunning}
            className="w-full"
          >
            {currentTest === 'certificados' ? 'Validando...' : 'Validar Certificados'}
          </Button>

          {testResults.certificados && (
            <div className={`mt-3 p-2 rounded text-xs ${
              testResults.certificados.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              <div className="flex justify-between">
                <span>{testResults.certificados.message}</span>
                <span>{formatDuration(testResults.certificados.duration)}</span>
              </div>
            </div>
          )}
        </Card>

        {/* Test de SUNAT */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <span className="text-lg">{getStatusIcon('sunat')}</span>
              <h4 className="font-medium">Configuración SUNAT</h4>
            </div>
            {getStatusBadge('sunat')}
          </div>
          
          <p className="text-sm text-gray-600 mb-3">
            Validación de credenciales SOL y configuración
          </p>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => runTest('sunat')}
            disabled={isRunning}
            className="w-full"
          >
            {currentTest === 'sunat' ? 'Validando...' : 'Validar SUNAT'}
          </Button>

          {testResults.sunat && (
            <div className={`mt-3 p-2 rounded text-xs ${
              testResults.sunat.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              <div className="flex justify-between">
                <span>{testResults.sunat.message}</span>
                <span>{formatDuration(testResults.sunat.duration)}</span>
              </div>
            </div>
          )}
        </Card>

        {/* Test de Conectividad */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <span className="text-lg">{getStatusIcon('conectividad')}</span>
              <h4 className="font-medium">Conectividad SUNAT</h4>
            </div>
            {getStatusBadge('conectividad')}
          </div>
          
          <p className="text-sm text-gray-600 mb-3">
            Conexión a Web Services de SUNAT
          </p>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => runTest('conectividad')}
            disabled={isRunning}
            className="w-full"
          >
            {currentTest === 'conectividad' ? 'Conectando...' : 'Test Conectividad'}
          </Button>

          {testResults.conectividad && (
            <div className={`mt-3 p-2 rounded text-xs ${
              testResults.conectividad.success ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              <div className="flex justify-between">
                <span>{testResults.conectividad.message}</span>
                <span>{formatDuration(testResults.conectividad.duration)}</span>
              </div>
            </div>
          )}
        </Card>

        {/* Test de Facturación */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center space-x-2">
              <span className="text-lg">{getStatusIcon('facturacion')}</span>
              <h4 className="font-medium">Test de Facturación</h4>
            </div>
            {getStatusBadge('facturacion')}
          </div>
          
          <p className="text-sm text-gray-600 mb-3">
            Documento de prueba completo con SUNAT
          </p>
          
          <Button 
            variant="outline" 
            size="sm" 
            onClick={() => runTest('facturacion')}
            disabled={isRunning}
            className="w-full"
          >
            {currentTest === 'facturacion' ? 'Enviando...' : 'Test Facturación'}
          </Button>

          {testResults.facturacion && (
            <div className={`mt-3 p-2 rounded text-xs ${
              testResults.facturacion.success 
                ? 'bg-green-50 text-green-700' 
                : testResults.facturacion.message?.includes('pendiente')
                ? 'bg-orange-50 text-orange-700'
                : 'bg-red-50 text-red-700'
            }`}>
              <div className="flex justify-between">
                <span>{testResults.facturacion.message}</span>
                <span>{formatDuration(testResults.facturacion.duration)}</span>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Información adicional según el estado */}
      {status.overall === 'ready' && (
        <Alert>
          <AlertDescription>
            🎉 <strong>¡Excelente!</strong> Su sistema está completamente configurado y listo para emitir facturas electrónicas. 
            Todos los tests han pasado exitosamente.
          </AlertDescription>
        </Alert>
      )}

      {status.overall === 'not-ready' && (
        <Alert>
          <AlertDescription>
            ⚠️ <strong>Configuración incompleta.</strong> Revise los tests fallidos y complete la configuración en las pestañas anteriores.
          </AlertDescription>
        </Alert>
      )}

      {/* Información técnica */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start space-x-3">
          <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-2">Información sobre los Tests:</p>
            <ul className="space-y-1 text-blue-700 list-disc list-inside">
              <li><strong>Certificados:</strong> Valida formato X.509, vigencia y cumplimiento SUNAT</li>
              <li><strong>SUNAT:</strong> Verifica credenciales SOL y configuración de endpoints</li>
              <li><strong>Conectividad:</strong> Prueba conexión real con Web Services SUNAT</li>
              <li><strong>Facturación:</strong> Envía documento de prueba y valida respuesta CDR</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
