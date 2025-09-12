// Componente optimizado de configuración empresarial
'use client';

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Shield, Building, Hash, Zap } from 'lucide-react';
import { CertificadosManager } from '@/components/certificates/CertificadosManager';
import SunatConfig from '@/components/sunat/SunatConfig';
import IntegracionTest from '@/components/integration/IntegracionTest';
import NumeracionConfig from '@/components/empresas/NumeracionConfig';
import { EmpresaResponse, EmpresaDetailResponse } from '@/types/empresa';

interface EmpresaConfigurationProps {
  empresa: EmpresaResponse | EmpresaDetailResponse;
  onBack: () => void;
}

type ConfigSection = 'certificados' | 'sunat' | 'numeracion' | 'integracion';

export default function EmpresaConfiguration({ empresa, onBack }: EmpresaConfigurationProps) {
  const [activeSection, setActiveSection] = useState<ConfigSection>('certificados');

  // Estado simplificado de configuración
  const isDetailResponse = 'tiene_certificado' in empresa;
  const configStatus = {
    certificados: isDetailResponse && empresa.tiene_certificado,
    sunat: isDetailResponse && empresa.tiene_configuracion_sunat,
    numeracion: false, // Por implementar
    facturacion: isDetailResponse && empresa.puede_facturar
  };

  // Configuraciones disponibles
  const sections = [
    {
      id: 'certificados' as ConfigSection,
      title: 'Certificados',
      icon: Shield,
      status: configStatus.certificados,
      description: 'Firma digital'
    },
    {
      id: 'sunat' as ConfigSection,
      title: 'SUNAT',
      icon: Building,
      status: configStatus.sunat,
      description: 'Credenciales SOL'
    },
    {
      id: 'numeracion' as ConfigSection,
      title: 'Numeración',
      icon: Hash,
      status: configStatus.numeracion,
      description: 'Series de comprobantes'
    },
    {
      id: 'integracion' as ConfigSection,
      title: 'Test',
      icon: Zap,
      status: configStatus.facturacion,
      description: 'Pruebas de conectividad'
    }
  ];

  const renderActiveSection = () => {
    switch (activeSection) {
      case 'certificados':
        return (
          <CertificadosManager
            empresa_id={empresa.id}
            empresa_nombre={empresa.razon_social}
            empresa_ruc={empresa.ruc}
          />
        );
      case 'sunat':
        return (
          <SunatConfig 
            empresaId={empresa.id}
            empresaRuc={empresa.ruc}
            onConfigurationChange={() => {}}
          />
        );
      case 'numeracion':
        return (
          <NumeracionConfig 
            empresa_ruc={empresa.ruc}
            onConfigurationChange={() => {}}
          />
        );
      case 'integracion':
        return (
          <IntegracionTest
            empresaId={empresa.id}
            empresaRuc={empresa.ruc}
            empresaRazonSocial={empresa.razon_social}
            onIntegrationChange={() => {}}
          />
        );
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      {/* Header compacto */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Empresas
          </Button>
          <div>
            <h1 className="text-xl font-semibold">{empresa.razon_social}</h1>
            <p className="text-sm text-gray-500">RUC: {empresa.ruc}</p>
          </div>
        </div>
        
        {/* Estado general compacto */}
        <div className="flex items-center space-x-2">
          {configStatus.facturacion ? (
            <Badge className="bg-green-100 text-green-800">
              ✅ Listo para facturar
            </Badge>
          ) : (
            <Badge className="bg-orange-100 text-orange-800">
              ⚙️ Configuración pendiente
            </Badge>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
        {/* Sidebar de navegación */}
        <Card className="lg:col-span-1">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Configuración</CardTitle>
          </CardHeader>
          <CardContent className="pt-0 space-y-1">
            {sections.map((section) => {
              const Icon = section.icon;
              const isActive = activeSection === section.id;
              
              return (
                <button
                  key={section.id}
                  onClick={() => setActiveSection(section.id)}
                  className={`w-full p-3 rounded-lg text-left transition-colors ${
                    isActive 
                      ? 'bg-blue-50 border border-blue-200 text-blue-900' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Icon className="h-4 w-4" />
                      <div>
                        <p className="font-medium text-sm">{section.title}</p>
                        <p className="text-xs text-gray-500">{section.description}</p>
                      </div>
                    </div>
                    <div className="flex-shrink-0">
                      {section.status ? (
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      ) : (
                        <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                      )}
                    </div>
                  </div>
                </button>
              );
            })}
          </CardContent>
        </Card>

        {/* Contenido principal */}
        <div className="lg:col-span-3">
          {renderActiveSection()}
        </div>
      </div>
    </div>
  );
}
