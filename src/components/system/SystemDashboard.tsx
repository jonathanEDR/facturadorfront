'use client';

import React, { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle,
  Button,
  Badge
} from '@/components/ui';
import { 
  Monitor, 
  Settings, 
  RefreshCw, 
  CheckCircle, 
  AlertTriangle,
  Activity,
  Database,
  Zap,
  BarChart3
} from 'lucide-react';

interface SystemStatus {
  backend: 'healthy' | 'warning' | 'error';
  frontend: 'healthy' | 'warning' | 'error';
  database: 'healthy' | 'warning' | 'error';
  monitoring: 'active' | 'inactive' | 'error';
  lastCheck: Date;
  stats: {
    totalInvoices: number;
    cacheSize: number;
    responseTime: number;
    uptime: string;
  };
}

const SystemDashboard: React.FC = () => {
  const [systemStatus, setSystemStatus] = useState<SystemStatus>({
    backend: 'healthy',
    frontend: 'healthy', 
    database: 'healthy',
    monitoring: 'active',
    lastCheck: new Date(),
    stats: {
      totalInvoices: 0,
      cacheSize: 0,
      responseTime: 0,
      uptime: '0h 0m'
    }
  });

  const [isChecking, setIsChecking] = useState(false);

  // Simular verificación del sistema
  const checkSystemStatus = async () => {
    setIsChecking(true);
    
    try {
      // Simular llamada a API de estado del sistema
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      // En una implementación real, aquí harías llamadas a tus APIs
      const mockStatus: SystemStatus = {
        backend: Math.random() > 0.2 ? 'healthy' : 'warning',
        frontend: 'healthy',
        database: Math.random() > 0.1 ? 'healthy' : 'warning',
        monitoring: Math.random() > 0.1 ? 'active' : 'inactive',
        lastCheck: new Date(),
        stats: {
          totalInvoices: Math.floor(Math.random() * 1000) + 100,
          cacheSize: Math.floor(Math.random() * 50) + 10,
          responseTime: Math.floor(Math.random() * 200) + 50,
          uptime: `${Math.floor(Math.random() * 24)}h ${Math.floor(Math.random() * 60)}m`
        }
      };
      
      setSystemStatus(mockStatus);
    } catch (error) {
      console.error('Error checking system status:', error);
    } finally {
      setIsChecking(false);
    }
  };

  // Verificar estado al montar el componente
  useEffect(() => {
    checkSystemStatus();
    
    // Verificar cada 30 segundos
    const interval = setInterval(checkSystemStatus, 30000);
    return () => clearInterval(interval);
  }, []);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'active':
        return 'bg-green-100 text-green-800';
      case 'warning':
        return 'bg-yellow-100 text-yellow-800';
      case 'error':
      case 'inactive':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'healthy':
      case 'active':
        return <CheckCircle className="h-4 w-4" />;
      case 'warning':
        return <AlertTriangle className="h-4 w-4" />;
      case 'error':
      case 'inactive':
        return <AlertTriangle className="h-4 w-4" />;
      default:
        return <Monitor className="h-4 w-4" />;
    }
  };

  const overallHealth = () => {
    const statuses = [systemStatus.backend, systemStatus.frontend, systemStatus.database];
    if (statuses.includes('error')) return 'error';
    if (statuses.includes('warning')) return 'warning';
    return 'healthy';
  };

  return (
    <div className="space-y-6">
      {/* Estado General */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center">
                <Activity className="h-5 w-5 mr-2" />
                Estado del Sistema
              </CardTitle>
              <CardDescription>
                Monitoreo en tiempo real del sistema Facturador
              </CardDescription>
            </div>
            <Button 
              onClick={checkSystemStatus}
              variant="outline"
              size="sm"
              disabled={isChecking}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${isChecking ? 'animate-spin' : ''}`} />
              {isChecking ? 'Verificando...' : 'Actualizar'}
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Backend */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Backend</span>
                <Badge className={getStatusColor(systemStatus.backend)}>
                  {getStatusIcon(systemStatus.backend)}
                  <span className="ml-1 capitalize">{systemStatus.backend}</span>
                </Badge>
              </div>
              <div className="text-xs text-gray-500">
                FastAPI + MongoDB
              </div>
            </div>

            {/* Frontend */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Frontend</span>
                <Badge className={getStatusColor(systemStatus.frontend)}>
                  {getStatusIcon(systemStatus.frontend)}
                  <span className="ml-1 capitalize">{systemStatus.frontend}</span>
                </Badge>
              </div>
              <div className="text-xs text-gray-500">
                Next.js + React
              </div>
            </div>

            {/* Database */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Base de Datos</span>
                <Badge className={getStatusColor(systemStatus.database)}>
                  {getStatusIcon(systemStatus.database)}
                  <span className="ml-1 capitalize">{systemStatus.database}</span>
                </Badge>
              </div>
              <div className="text-xs text-gray-500">
                MongoDB
              </div>
            </div>

            {/* Monitoring */}
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium">Monitoreo</span>
                <Badge className={getStatusColor(systemStatus.monitoring)}>
                  {getStatusIcon(systemStatus.monitoring)}
                  <span className="ml-1 capitalize">{systemStatus.monitoring}</span>
                </Badge>
              </div>
              <div className="text-xs text-gray-500">
                Sistema automático
              </div>
            </div>
          </div>

          {/* Estado General */}
          <div className="mt-6 p-4 bg-gray-50 rounded-lg">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className={`w-3 h-3 rounded-full mr-3 ${
                  overallHealth() === 'healthy' ? 'bg-green-500' :
                  overallHealth() === 'warning' ? 'bg-yellow-500' : 'bg-red-500'
                }`}></div>
                <span className="font-medium">
                  Estado General: {overallHealth() === 'healthy' ? 'Saludable' : 
                                  overallHealth() === 'warning' ? 'Con advertencias' : 'Con errores'}
                </span>
              </div>
              <span className="text-sm text-gray-500">
                Última verificación: {systemStatus.lastCheck.toLocaleTimeString()}
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Estadísticas del Sistema */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Estadísticas del Sistema
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <Database className="h-8 w-8 mx-auto mb-2 text-blue-600" />
              <div className="text-2xl font-bold text-blue-600">
                {systemStatus.stats.totalInvoices}
              </div>
              <div className="text-sm text-gray-600">Total Facturas</div>
            </div>

            <div className="text-center p-4 bg-green-50 rounded-lg">
              <Zap className="h-8 w-8 mx-auto mb-2 text-green-600" />
              <div className="text-2xl font-bold text-green-600">
                {systemStatus.stats.responseTime}ms
              </div>
              <div className="text-sm text-gray-600">Tiempo Respuesta</div>
            </div>

            <div className="text-center p-4 bg-purple-50 rounded-lg">
              <Monitor className="h-8 w-8 mx-auto mb-2 text-purple-600" />
              <div className="text-2xl font-bold text-purple-600">
                {systemStatus.stats.cacheSize}MB
              </div>
              <div className="text-sm text-gray-600">Cache Utilizado</div>
            </div>

            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <Activity className="h-8 w-8 mx-auto mb-2 text-orange-600" />
              <div className="text-2xl font-bold text-orange-600">
                {systemStatus.stats.uptime}
              </div>
              <div className="text-sm text-gray-600">Tiempo Activo</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Configuración y Mantenimiento */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Settings className="h-5 w-5 mr-2" />
            Herramientas de Mantenimiento
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Button variant="outline" className="h-auto p-4 flex flex-col items-center">
              <Monitor className="h-6 w-6 mb-2" />
              <span className="font-medium">Logs del Sistema</span>
              <span className="text-xs text-gray-500 mt-1">Ver registros detallados</span>
            </Button>

            <Button variant="outline" className="h-auto p-4 flex flex-col items-center">
              <Database className="h-6 w-6 mb-2" />
              <span className="font-medium">Limpieza Cache</span>
              <span className="text-xs text-gray-500 mt-1">Limpiar cache del sistema</span>
            </Button>

            <Button variant="outline" className="h-auto p-4 flex flex-col items-center">
              <RefreshCw className="h-6 w-6 mb-2" />
              <span className="font-medium">Reiniciar Servicios</span>
              <span className="text-xs text-gray-500 mt-1">Reiniciar componentes</span>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SystemDashboard;
