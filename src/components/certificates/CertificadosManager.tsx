// Componente principal para gestión completa de certificados digitales
'use client';

import React, { useState } from 'react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert } from '@/components/ui/alert';
import { CertificadoUpload } from './CertificadoUpload';
import { CertificadosList } from './CertificadosList';
import { CertificadoInfo } from '@/types/certificates';
import { useCertificados } from '@/hooks/useCertificados';

interface CertificadosManagerProps {
  empresa_id: string;
  empresa_nombre?: string;
  empresa_ruc?: string;
}

export function CertificadosManager({ 
  empresa_id, 
  empresa_nombre = '',
  empresa_ruc = ''
}: CertificadosManagerProps) {
  const { certificados, certificado_activo } = useCertificados(empresa_id);
  const [activeTab, setActiveTab] = useState('lista');
  const [uploadSuccess, setUploadSuccess] = useState<string>('');
  const [uploadError, setUploadError] = useState<string>('');

  // Manejar éxito en subida
  const handleUploadSuccess = (certificado: CertificadoInfo) => {
    setUploadSuccess(`Certificado "${certificado.filename}" subido exitosamente`);
    setUploadError('');
    setActiveTab('lista'); // Cambiar a la pestaña de lista
    
    // Limpiar mensaje después de 5 segundos
    setTimeout(() => {
      setUploadSuccess('');
    }, 5000);
  };

  // Manejar error en subida
  const handleUploadError = (error: string) => {
    setUploadError(error);
    setUploadSuccess('');
  };

  // Estadísticas rápidas
  const stats = {
    total: certificados.length,
    activos: certificados.filter(c => c.activo).length,
    vencidos: certificados.filter(c => !c.vigente).length,
    por_vencer: certificados.filter(c => c.vigente && c.requiere_renovacion).length,
  };

  // Determinar estado general de la empresa
  const getEmpresaStatus = () => {
    if (!certificado_activo) {
      return {
        status: 'sin_certificado',
        message: 'Sin certificado activo',
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: '❌'
      };
    }

    if (!certificado_activo.vigente) {
      return {
        status: 'vencido',
        message: 'Certificado activo vencido',
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: '⚠️'
      };
    }

    if (certificado_activo.requiere_renovacion) {
      return {
        status: 'por_vencer',
        message: `Vence en ${certificado_activo.dias_para_vencer} días`,
        color: 'bg-orange-100 text-orange-800 border-orange-200',
        icon: '⏰'
      };
    }

    return {
      status: 'ok',
      message: 'Certificado activo y válido',
      color: 'bg-green-100 text-green-800 border-green-200',
      icon: '✅'
    };
  };

  const empresaStatus = getEmpresaStatus();

  return (
    <div className="space-y-6">
      {/* Header con información de la empresa */}
      <Card className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h1 className="text-xl font-semibold text-gray-900 mb-1">
              Gestión de Certificados Digitales
            </h1>
            {empresa_nombre && (
              <p className="text-sm text-gray-600 mb-1">
                {empresa_nombre}
              </p>
            )}
            {empresa_ruc && (
              <p className="text-xs text-gray-500">
                RUC: {empresa_ruc}
              </p>
            )}
          </div>
          
          <div className="text-right">
            <Badge className={empresaStatus.color}>
              <span className="mr-1">{empresaStatus.icon}</span>
              {empresaStatus.message}
            </Badge>
            
            {certificado_activo && (
              <div className="mt-2 text-xs text-gray-600">
                <p>Certificado activo:</p>
                <p className="font-mono text-xs">{certificado_activo.filename}</p>
              </div>
            )}
          </div>
        </div>

        {/* Estadísticas compactas */}
        {certificados.length > 0 && (
          <div className="grid grid-cols-4 gap-4 mt-4 pt-4 border-t">
            <div className="text-center">
              <p className="text-lg font-bold text-blue-600">{stats.total}</p>
              <p className="text-xs text-gray-500">Total certificados</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-green-600">{stats.activos}</p>
              <p className="text-xs text-gray-500">Activos</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-red-600">{stats.vencidos}</p>
              <p className="text-xs text-gray-500">Vencidos</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold text-orange-600">{stats.por_vencer}</p>
              <p className="text-xs text-gray-500">Por vencer</p>
            </div>
          </div>
        )}
      </Card>

      {/* Alertas de estado */}
      {uploadSuccess && (
        <Alert>
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>{uploadSuccess}</span>
          </div>
        </Alert>
      )}

      {uploadError && (
        <Alert variant="destructive">
          <div className="flex items-center space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{uploadError}</span>
          </div>
        </Alert>
      )}

      {/* Alertas de certificados */}
      {certificado_activo && !certificado_activo.vigente && (
        <Alert variant="destructive">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-medium">Certificado activo vencido</p>
                <p className="text-sm">Tu certificado digital ha vencido. Sube un nuevo certificado para continuar facturando.</p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('subir')}
              className="text-sm underline hover:no-underline"
            >
              Subir nuevo certificado
            </button>
          </div>
        </Alert>
      )}

      {certificado_activo && certificado_activo.vigente && certificado_activo.requiere_renovacion && (
        <Alert>
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <svg className="w-4 h-4 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div>
                <p className="font-medium">Certificado próximo a vencer</p>
                <p className="text-sm">
                  Tu certificado vence en {certificado_activo.dias_para_vencer} días. 
                  Considera renovarlo pronto para evitar interrupciones.
                </p>
              </div>
            </div>
            <button
              onClick={() => setActiveTab('subir')}
              className="text-sm underline hover:no-underline"
            >
              Renovar certificado
            </button>
          </div>
        </Alert>
      )}

      {/* Interfaz principal con pestañas */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="lista" className="flex items-center space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Certificados ({stats.total})</span>
          </TabsTrigger>
          <TabsTrigger value="subir" className="flex items-center space-x-2">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            <span>Subir Certificado</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="lista" className="mt-6">
          <CertificadosList
            empresa_id={empresa_id}
            showActions={true}
          />
        </TabsContent>

        <TabsContent value="subir" className="mt-6">
          <Card className="p-6">
            <div className="mb-6">
              <h2 className="text-xl font-semibold mb-2">Subir Nuevo Certificado</h2>
              <p className="text-gray-600">
                Sube un certificado digital en formato PKCS#12 (.p12 o .pfx) para habilitar 
                la facturación electrónica según los estándares SUNAT.
              </p>
            </div>
            
            <CertificadoUpload
              empresa_id={empresa_id}
              onUploadSuccess={handleUploadSuccess}
              onUploadError={handleUploadError}
            />
          </Card>
        </TabsContent>
      </Tabs>

      {/* Información adicional */}
      <Card className="p-4 bg-blue-50 border-blue-200">
        <div className="flex items-start space-x-3">
          <svg className="w-5 h-5 text-blue-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div className="text-sm text-blue-800">
            <p className="font-medium mb-1">Información importante:</p>
            <ul className="space-y-1 text-blue-700">
              <li>• Solo puede haber un certificado activo por empresa</li>
              <li>• Los certificados son validados automáticamente contra SUNAT</li>
              <li>• Las contraseñas se almacenan de forma encriptada</li>
              <li>• Recibirás notificaciones antes de que expire tu certificado</li>
            </ul>
          </div>
        </div>
      </Card>
    </div>
  );
}
