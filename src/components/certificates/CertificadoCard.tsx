// Componente para mostrar información de un certificado digital
'use client';

import React, { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CertificadoCardProps } from '@/types/certificates';
import { useCertificadoUtils } from '@/hooks/useCertificados';

export function CertificadoCard({
  certificado,
  isActive = false,
  onActivate,
  onDeactivate,
  onDelete,
  onValidate,
  onDownload,
}: CertificadoCardProps) {
  const { formatFecha, formatDiasVencimiento } = useCertificadoUtils();
  const [showDetails, setShowDetails] = useState(false);

  // Determinar el estado visual del certificado
  const getStatusInfo = () => {
    if (!certificado.vigente) {
      return {
        label: 'Vencido',
        color: 'bg-red-100 text-red-800 border-red-200',
        icon: '⚠️'
      };
    }
    if (certificado.requiere_renovacion) {
      return {
        label: 'Por vencer',
        color: 'bg-orange-100 text-orange-800 border-orange-200',
        icon: '⏰'
      };
    }
    if (isActive) {
      return {
        label: 'Activo',
        color: 'bg-green-100 text-green-800 border-green-200',
        icon: '✅'
      };
    }
    return {
      label: 'Inactivo',
      color: 'bg-gray-100 text-gray-800 border-gray-200',
      icon: '⭕'
    };
  };

  const statusInfo = getStatusInfo();

  // Extraer nombre común del subject
  const getCommonName = (subjectDn: string): string => {
    const cnMatch = subjectDn.match(/CN=([^,]+)/);
    return cnMatch ? cnMatch[1] : 'N/A';
  };

  // Extraer organización del subject (comentada por ahora)
  // const getOrganization = (subjectDn: string): string => {
  //   const oMatch = subjectDn.match(/O=([^,]+)/);
  //   return oMatch ? oMatch[1] : 'N/A';
  // };

  return (
    <Card className={`p-4 transition-all duration-200 hover:shadow-md ${isActive ? 'ring-2 ring-blue-500' : ''}`}>
      <div className="space-y-4">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center space-x-2 mb-2">
              <h3 className="text-lg font-semibold truncate">
                {certificado.filename}
              </h3>
              {isActive && (
                <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                  Certificado Activo
                </Badge>
              )}
            </div>
            
            <div className="flex items-center space-x-2 mb-2">
              <Badge className={statusInfo.color}>
                <span className="mr-1">{statusInfo.icon}</span>
                {statusInfo.label}
              </Badge>
              
              {certificado.validado_sunat && (
                <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                  ✓ SUNAT
                </Badge>
              )}
            </div>

            <p className="text-sm text-gray-600">
              RUC: {certificado.ruc_certificado}
            </p>
          </div>

          {/* Menu de acciones */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z" />
                </svg>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              {!isActive && certificado.vigente && onActivate && (
                <DropdownMenuItem onClick={() => onActivate(certificado.id)}>
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Activar
                  </span>
                </DropdownMenuItem>
              )}
              
              {isActive && onDeactivate && (
                <DropdownMenuItem onClick={() => onDeactivate(certificado.id)}>
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Desactivar
                  </span>
                </DropdownMenuItem>
              )}
              
              {onValidate && (
                <DropdownMenuItem onClick={() => onValidate(certificado.id)}>
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    Validar
                  </span>
                </DropdownMenuItem>
              )}
              
              {onDownload && (
                <DropdownMenuItem onClick={() => onDownload(certificado.id)}>
                  <span className="flex items-center">
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    Descargar
                  </span>
                </DropdownMenuItem>
              )}
              
              <div className="border-t my-1"></div>
              
              <DropdownMenuItem 
                onClick={() => setShowDetails(!showDetails)}
                className="text-blue-600"
              >
                <span className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {showDetails ? 'Ocultar detalles' : 'Ver detalles'}
                </span>
              </DropdownMenuItem>
              
              {!isActive && onDelete && (
                <>
                  <div className="border-t my-1"></div>
                  <DropdownMenuItem 
                    onClick={() => onDelete(certificado.id)}
                    className="text-red-600"
                  >
                    <span className="flex items-center">
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Eliminar
                    </span>
                  </DropdownMenuItem>
                </>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Información principal */}
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-gray-500">Válido desde</p>
            <p className="font-medium">{formatFecha(certificado.valid_from)}</p>
          </div>
          <div>
            <p className="text-gray-500">Válido hasta</p>
            <p className="font-medium">{formatFecha(certificado.valid_to)}</p>
          </div>
        </div>

        {/* Indicador de vencimiento */}
        <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
          <div>
            <p className="text-sm font-medium text-gray-700">
              {formatDiasVencimiento(certificado.dias_para_vencer)}
            </p>
            {certificado.errores_validacion.length > 0 && (
              <p className="text-xs text-red-600">
                {certificado.errores_validacion.length} error(es) de validación
              </p>
            )}
          </div>
          <div className="text-right">
            <p className="text-xs text-gray-500">Algoritmo</p>
            <p className="text-sm font-medium">{certificado.algoritmo}</p>
          </div>
        </div>

        {/* Detalles expandibles */}
        {showDetails && (
          <div className="border-t pt-4 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p className="text-gray-500">Subject (CN)</p>
                <p className="font-mono text-xs break-all">
                  {getCommonName(certificado.subject_dn)}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Emisor</p>
                <p className="font-mono text-xs break-all">
                  {getCommonName(certificado.issuer_dn)}
                </p>
              </div>
              <div>
                <p className="text-gray-500">Número de serie</p>
                <p className="font-mono text-xs">{certificado.serial_number}</p>
              </div>
              <div>
                <p className="text-gray-500">Tamaño de clave</p>
                <p className="font-medium">{certificado.tamaño_clave} bits</p>
              </div>
              <div>
                <p className="text-gray-500">Uso de clave</p>
                <p className="text-xs">{certificado.key_usage}</p>
              </div>
              <div>
                <p className="text-gray-500">Subido el</p>
                <p className="text-xs">{formatFecha(certificado.fecha_subida)}</p>
              </div>
            </div>

            {certificado.fecha_activacion && (
              <div>
                <p className="text-gray-500 text-sm">Activado el</p>
                <p className="text-sm font-medium">{formatFecha(certificado.fecha_activacion)}</p>
              </div>
            )}

            {certificado.errores_validacion.length > 0 && (
              <div>
                <p className="text-red-600 text-sm font-medium mb-2">Errores de validación:</p>
                <ul className="text-xs text-red-600 space-y-1">
                  {certificado.errores_validacion.map((error, index) => (
                    <li key={index} className="flex items-start space-x-1">
                      <span>•</span>
                      <span>{error}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </Card>
  );
}
