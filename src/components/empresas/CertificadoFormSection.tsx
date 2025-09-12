/**
 * Componente para la gestión de certificados en formularios de empresa
 * Versión optimizada y compacta
 */
'use client';

import React, { useState } from 'react';
import { Shield, ShieldCheck, ShieldAlert, Upload, AlertTriangle, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useCertificadoBridge } from '@/hooks/useCertificadoBridge';
import { Empresa, CertificadoConfig } from '@/types/empresa';

interface CertificadoFormSectionProps {
  empresa?: Empresa;
  certificadoConfig: CertificadoConfig;
  onConfigChange: (config: CertificadoConfig) => void;
  readonly?: boolean;
}

export default function CertificadoFormSection({
  empresa,
  certificadoConfig,
  onConfigChange,
  readonly = false
}: CertificadoFormSectionProps) {
  
  const [showPassword, setShowPassword] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  // Hook bridge para gestión unificada de certificados
  const {
    getActiveUnifiedCertificado,
    hasLegacyData,
    hasNewSystemData
  } = useCertificadoBridge({
    empresa: empresa || {} as Empresa,
    certificadoConfig,
    onConfigChange,
    autoSync: true
  });

  // Obtener estado del certificado activo
  const getStatus = () => {
    const unified = getActiveUnifiedCertificado();
    
    if (!unified) {
      return { 
        status: 'none', 
        label: 'Sin certificado', 
        color: 'bg-gray-100 text-gray-800',
        icon: Shield 
      };
    }

    if (unified.source === 'new_system' && 'vigente' in unified.data) {
      const cert = unified.data;
      if (!cert.vigente) {
        return { 
          status: 'expired', 
          label: 'Vencido', 
          color: 'bg-red-100 text-red-800',
          icon: ShieldAlert 
        };
      }
      if (cert.requiere_renovacion) {
        return { 
          status: 'warning', 
          label: `${cert.dias_para_vencer} días`, 
          color: 'bg-orange-100 text-orange-800',
          icon: ShieldAlert 
        };
      }
      return { 
        status: 'active', 
        label: 'Activo', 
        color: 'bg-green-100 text-green-800',
        icon: ShieldCheck 
      };
    }

    if (unified.source === 'legacy_system') {
      return { 
        status: 'legacy', 
        label: unified.isActive ? 'Legacy activo' : 'Legacy inactivo', 
        color: 'bg-blue-100 text-blue-800',
        icon: AlertTriangle 
      };
    }

    return { 
      status: 'unknown', 
      label: 'Desconocido', 
      color: 'bg-gray-100 text-gray-800',
      icon: Shield 
    };
  };

  const status = getStatus();
  const StatusIcon = status.icon;

  // Manejar cambios en la configuración
  const handleFieldChange = (field: keyof CertificadoConfig, value: string | boolean) => {
    onConfigChange({
      ...certificadoConfig,
      [field]: value
    });
  };

  // Manejar selección de archivo
  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const extension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
      if (!['.p12', '.pfx'].includes(extension)) {
        alert('Solo se permiten archivos .p12 o .pfx');
        return;
      }
      setSelectedFile(file);
      handleFieldChange('certificado_digital_path', file.name);
    }
  };

  // Abrir gestor avanzado
  const openAdvancedManager = () => {
    const event = new CustomEvent('openCertificadosManager', {
      detail: {
        empresa_id: empresa?.id,
        empresa_ruc: empresa?.ruc,
        empresa_nombre: empresa?.razon_social
      }
    });
    window.dispatchEvent(event);
  };

  const hasCertificate = hasNewSystemData || hasLegacyData;

  return (
    <Card className="w-full">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center space-x-2 text-base">
            <StatusIcon className="h-4 w-4" />
            <span>Certificado Digital</span>
          </CardTitle>
          <div className="flex items-center space-x-2">
            <Badge className={status.color}>{status.label}</Badge>
            {!readonly && (
              <Button 
                type="button" 
                variant="outline" 
                size="sm"
                onClick={openAdvancedManager}
              >
                <Upload className="h-3 w-3 mr-1" />
                Gestor
              </Button>
            )}
          </div>
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Información del certificado activo */}
        {hasCertificate && (
          <div className="bg-gray-50 rounded-lg p-3">
            <div className="text-sm space-y-1">
              <div className="flex justify-between">
                <span className="font-medium">Archivo:</span>
                <span className="font-mono text-xs">
                  {certificadoConfig.certificado_digital_path || 'No especificado'}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Estado:</span>
                <span>{certificadoConfig.certificado_digital_activo ? 'Activo' : 'Inactivo'}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-medium">Contraseña:</span>
                <span>{certificadoConfig.certificado_digital_password ? '••••••••' : 'No configurada'}</span>
              </div>
            </div>
          </div>
        )}

        {/* Alerta si necesita migración */}
        {hasLegacyData && !hasNewSystemData && (
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              Certificado en sistema legacy. 
              <Button variant="link" className="p-0 h-auto text-sm" onClick={openAdvancedManager}>
                Migrar al nuevo sistema
              </Button>
            </AlertDescription>
          </Alert>
        )}

        {/* Formulario básico para configuración */}
        {!readonly && (
          <div className="space-y-3">
            {/* Archivo */}
            <div className="space-y-1">
              <Label htmlFor="cert_file" className="text-sm font-medium">
                Archivo (.p12/.pfx)
              </Label>
              <Input
                id="cert_file"
                type="file"
                accept=".p12,.pfx"
                onChange={handleFileSelect}
                className="text-sm"
              />
              {selectedFile && (
                <p className="text-xs text-gray-500">
                  {selectedFile.name} ({(selectedFile.size / 1024).toFixed(1)} KB)
                </p>
              )}
            </div>

            {/* Contraseña */}
            <div className="space-y-1">
              <Label htmlFor="cert_password" className="text-sm font-medium">
                Contraseña
              </Label>
              <div className="flex space-x-2">
                <Input
                  id="cert_password"
                  type={showPassword ? "text" : "password"}
                  value={certificadoConfig.certificado_digital_password || ''}
                  onChange={(e) => handleFieldChange('certificado_digital_password', e.target.value)}
                  placeholder="Contraseña del certificado"
                  className="flex-1 text-sm"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-3 w-3" /> : <Eye className="h-3 w-3" />}
                </Button>
              </div>
            </div>

            {/* Estado activo */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="cert_active"
                checked={certificadoConfig.certificado_digital_activo || false}
                onChange={(e) => handleFieldChange('certificado_digital_activo', e.target.checked)}
                className="rounded border-gray-300"
              />
              <Label htmlFor="cert_active" className="text-sm">
                Activar certificado para firmar documentos
              </Label>
            </div>
          </div>
        )}

        {/* Información básica */}
        <div className="text-xs text-gray-500 bg-blue-50 p-2 rounded">
          <p>
            <strong>Nota:</strong> Para gestión completa de certificados usa el 
            <Button variant="link" className="p-0 h-auto text-xs underline ml-1" onClick={openAdvancedManager}>
              Gestor Avanzado
            </Button>
          </p>
        </div>
      </CardContent>
    </Card>
  );
}