// Página principal para consultas de validez de comprobantes
'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Search, 
  FileText, 
  History, 
  Download,
  Settings
} from 'lucide-react';

import ConsultaIndividual from '@/components/consulta-validez/ConsultaIndividual';
import ConsultaBatch from '@/components/consulta-validez/ConsultaBatch';
import HistorialConsultas from '@/components/consulta-validez/HistorialConsultas';
import ConfiguracionConsulta from '@/components/consulta-validez/ConfiguracionConsulta';

export default function ConsultaValidezPage() {
  const [activeTab, setActiveTab] = useState('individual');

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Consulta de Validez de Comprobantes</h1>
          <p className="text-gray-600 mt-1">
            Consulte la validez de comprobantes de pago a través de la API oficial de SUNAT
          </p>
        </div>
        
        <Badge className="bg-blue-100 text-blue-800">
          API SUNAT Integrada
        </Badge>
      </div>

      {/* Información importante */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-4">
          <div className="flex items-start space-x-3">
            <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="text-blue-800">
              <h3 className="font-medium">Información importante</h3>
              <ul className="text-sm mt-2 space-y-1">
                <li>• Esta funcionalidad utiliza la API oficial de SUNAT para consultar comprobantes</li>
                <li>• Debe configurar sus credenciales de acceso en la sección Empresas</li>
                <li>• Los comprobantes consultados deben estar emitidos por contribuyentes habilitados</li>
                <li>• El servicio está disponible 24/7 con algunas ventanas de mantenimiento</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Contenido principal en tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="individual" className="flex items-center space-x-2">
            <Search className="w-4 h-4" />
            <span>Consulta Individual</span>
          </TabsTrigger>
          <TabsTrigger value="batch" className="flex items-center space-x-2">
            <FileText className="w-4 h-4" />
            <span>Consulta Masiva</span>
          </TabsTrigger>
          <TabsTrigger value="historial" className="flex items-center space-x-2">
            <History className="w-4 h-4" />
            <span>Historial</span>
          </TabsTrigger>
          <TabsTrigger value="configuracion" className="flex items-center space-x-2">
            <Settings className="w-4 h-4" />
            <span>Configuración</span>
          </TabsTrigger>
        </TabsList>

        <TabsContent value="individual" className="space-y-4">
          <ConsultaIndividual />
        </TabsContent>

        <TabsContent value="batch" className="space-y-4">
          <ConsultaBatch />
        </TabsContent>

        <TabsContent value="historial" className="space-y-4">
          <HistorialConsultas />
        </TabsContent>

        <TabsContent value="configuracion" className="space-y-4">
          <ConfiguracionConsulta />
        </TabsContent>
      </Tabs>
    </div>
  );
}