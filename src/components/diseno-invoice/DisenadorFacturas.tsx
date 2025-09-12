'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Separator } from "@/components/ui/separator";
import { 
  Eye, 
  Save, 
  Palette, 
  Type, 
  Layout,
  FileText,
  Settings,
  Sparkles,
  Download
} from 'lucide-react';

import { usePdfTemplates } from '@/hooks/usePdfTemplates';
import { useEmpresa } from '@/hooks/useEmpresa';
import { ColorPicker } from './ColorPicker';
import { TemplatePreview } from './TemplatePreview';
import { TemplateManager } from './TemplateManager';
import { PredefinedTemplates } from './PredefinedTemplates';
import { ImportExport } from './ImportExport';
import { LogoManager } from './LogoManager';
import type { TemplateConfig, TemplateListItem, PreviewData } from '@/types/pdf-templates';

const DEFAULT_TEMPLATE: TemplateConfig = {
  name: "Plantilla Estándar",
  description: "Plantilla por defecto para facturas",
  page_format: "A4",
  orientation: "portrait",
  margins: {
    top: 72,
    bottom: 72,
    left: 72,
    right: 72
  },
  fonts: {
    primary: "Helvetica",
    secondary: "Helvetica-Bold",
    sizes: {
      title: 18,
      subtitle: 14,
      body: 10,
      small: 8
    }
  },
  colors: {
    primary: "#2563eb",
    secondary: "#64748b",
    accent: "#f59e0b",
    text: "#1f2937",
    background: "#ffffff",
    border: "#e5e7eb"
  },
  layout: {
    show_logo: true,
    logo_position: "top-left",
    logo_size: "medium",
    logo_width: 80,
    logo_height: 40,
    header_height: 120,
    footer_height: 60,
    table_style: "modern"
  },
  branding: {
    company_name_size: 16,
    show_tagline: true,
    custom_footer: ""
  }
};

export default function DisenadorFacturas() {
  const [currentTemplate, setCurrentTemplate] = useState<TemplateConfig>(DEFAULT_TEMPLATE);
  const [templates, setTemplates] = useState<TemplateListItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("design");
  const [empresaSeleccionada, setEmpresaSeleccionada] = useState<string>("");

  const {
    getTemplates,
    createTemplate,
    updateTemplate,
    generatePreview
  } = usePdfTemplates();

  const {
    empresas,
    listarEmpresas
  } = useEmpresa();

  const loadTemplates = useCallback(async () => {
    try {
      setIsLoading(true);
      const response = await getTemplates();
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      setTemplates(response.data || []);
    } catch (error) {
      console.error('Error loading templates:', error);
      // Por ahora, usar datos mock para desarrollo
      setTemplates([
        {
          id: '1',
          name: 'Plantilla Estándar',
          description: 'Plantilla por defecto del sistema',
          page_format: 'A4',
          orientation: 'portrait',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Plantilla Moderna',
          description: 'Plantilla con diseño moderno y colorido',
          page_format: 'A4',
          orientation: 'portrait',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ]);
    } finally {
      setIsLoading(false);
    }
  }, [getTemplates]);

  useEffect(() => {
    loadTemplates();
    listarEmpresas();
  }, [loadTemplates, listarEmpresas]);

  // Seleccionar primera empresa por defecto
  useEffect(() => {
    if (empresas.length > 0 && !empresaSeleccionada) {
      setEmpresaSeleccionada(empresas[0].id || "");
    }
  }, [empresas, empresaSeleccionada]);

  const handleSaveTemplate = async () => {
    try {
      setIsLoading(true);
      let response;
      
      if (currentTemplate.id) {
        response = await updateTemplate(currentTemplate.id, currentTemplate);
      } else {
        response = await createTemplate(currentTemplate);
      }
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      if (response.data) {
        setCurrentTemplate(response.data);
      }
      
      await loadTemplates();
      
      // Mostrar notificación de éxito aquí
      console.log('Template saved successfully');
    } catch (error) {
      console.error('Error saving template:', error);
      // Por ahora, simular éxito para desarrollo
      console.log('Template save simulated (mock)');
    } finally {
      setIsLoading(false);
    }
  };

  const handlePreviewTemplate = async () => {
    try {
      setIsLoading(true);
      
      // 🎯 Datos compatibles con el sistema PDF migrado
      const sampleData = {
        // Datos básicos
        serie: 'F001',
        numero: 123,
        fecha_emision: '2025-01-15',
        fecha_vencimiento: null,
        
        // Pago
        forma_pago: 'Contado',
        condicion_pago: 'Contado',
        cuotas: [],
        
        // Moneda
        moneda_codigo: 'PEN',
        moneda_texto: 'SOLES',
        
        // Empresa
        empresa: {
          nombre: 'MI EMPRESA S.A.C.',
          ruc: '20123456789',
          direccion: 'Av. Principal 123',
          distrito: 'San Isidro',
          provincia: 'Lima',
          departamento: 'Lima',
          telefono: '01-2345678',
          email: 'contacto@miempresa.com'
        },
        
        // Cliente
        cliente: {
          nombre: 'CLIENTE DE EJEMPLO',
          numero_documento: '12345678',
          documento: '12345678',  // Compatibilidad
          tipo_documento: '1',    // DNI
          direccion: 'Calle Ejemplo 456',
          telefono: '987654321',
          email: 'cliente@email.com'
        },
        
        // Items - estructura exacta del sistema migrado
        items: [
          {
            codigo: 'PROD001',
            descripcion: 'Producto de Ejemplo 1',
            unidad_medida: 'NIU',
            cantidad: 2.0,
            precio_unitario: 100.0,
            descuento: 0.0,
            igv: 36.0,
            precio_venta: 236.0
          },
          {
            codigo: 'SERV001', 
            descripcion: 'Servicio de Ejemplo 2',
            unidad_medida: 'ZZ',
            cantidad: 1.0,
            precio_unitario: 200.0,
            descuento: 20.0,
            igv: 32.4,
            precio_venta: 212.4
          }
        ],
        
        // Totales - nombres exactos del sistema migrado
        operaciones_gravadas: 280.0,
        operaciones_exoneradas: 0.0,
        operaciones_inafectas: 0.0,
        total_descuentos: 20.0,
        subtotal: 280.0,
        igv: 68.4,       // NO igv_total
        total: 448.4,    // NO total_factura
        
        // SUNAT
        observaciones: 'Factura de ejemplo para vista previa',
        codigo_hash: 'ABC123DEF456',
        qr_data: '20123456789|01|F001|123|68.4|448.4|15/01/2025|1|12345678'
      };

      // Convertir sampleData a formato PreviewData
      const previewData: PreviewData = {
        invoice_number: `${sampleData.serie}-${sampleData.numero}`,
        issue_date: sampleData.fecha_emision,
        due_date: sampleData.fecha_vencimiento || sampleData.fecha_emision,
        customer: {
          name: sampleData.cliente.nombre,
          document: sampleData.cliente.numero_documento,
          address: sampleData.cliente.direccion,
        },
        items: sampleData.items.map(item => ({
          description: item.descripcion,
          quantity: item.cantidad,
          unit_price: item.precio_unitario,
          total: item.precio_venta,
        })),
        subtotal: sampleData.subtotal,
        tax: sampleData.igv,
        total: sampleData.total,
      };

      console.log('🔍 Iniciando generatePreview...');
      const previewBlob = await generatePreview(currentTemplate, previewData);
      console.log('✅ Preview blob recibido:', previewBlob);
      console.log('🔍 Blob size:', previewBlob.size, 'Type:', previewBlob.type);
      
      const url = URL.createObjectURL(previewBlob);
      console.log('✅ URL creada:', url);
      
      setPreviewUrl(url);
      console.log('✅ PreviewUrl establecida');
    } catch (error) {
      console.error('❌ Error generating preview:', error);
      console.error('❌ Error stack:', error instanceof Error ? error.stack : 'No stack available');
      // Mock: Por ahora no mostrar preview hasta que el backend esté listo
      setPreviewUrl(null);
    } finally {
      setIsLoading(false);
    }
  };

  const updateTemplateField = (path: string, value: string | number | boolean) => {
    setCurrentTemplate(prev => {
      const newTemplate = { ...prev };
      const keys = path.split('.');
      let current: Record<string, unknown> = newTemplate as Record<string, unknown>;
      
      for (let i = 0; i < keys.length - 1; i++) {
        if (!(keys[i] in current)) {
          current[keys[i]] = {};
        }
        current = current[keys[i]] as Record<string, unknown>;
      }
      
      current[keys[keys.length - 1]] = value;
      return newTemplate;
    });
  };

  const handleColorChange = (path: string) => (color: string) => {
    updateTemplateField(path, color);
  };

  const handleSliderChange = (path: string) => ([value]: number[]) => {
    updateTemplateField(path, value);
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Panel de Configuración */}
      <div className="lg:col-span-2">
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5" />
                Configuración de Plantilla
              </CardTitle>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handlePreviewTemplate}
                  disabled={isLoading}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  Vista Previa
                </Button>
                <Button 
                  size="sm" 
                  onClick={handleSaveTemplate}
                  disabled={isLoading}
                >
                  <Save className="h-4 w-4 mr-2" />
                  {isLoading ? 'Guardando...' : 'Guardar'}
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab}>
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="design" className="flex items-center gap-2">
                  <Palette className="h-4 w-4" />
                  Diseño
                </TabsTrigger>
                <TabsTrigger value="layout" className="flex items-center gap-2">
                  <Layout className="h-4 w-4" />
                  Layout
                </TabsTrigger>
                <TabsTrigger value="typography" className="flex items-center gap-2">
                  <Type className="h-4 w-4" />
                  Tipografía
                </TabsTrigger>
                <TabsTrigger value="templates" className="flex items-center gap-2">
                  <FileText className="h-4 w-4" />
                  Plantillas
                </TabsTrigger>
                <TabsTrigger value="predefined" className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Predefinidos
                </TabsTrigger>
                <TabsTrigger value="import-export" className="flex items-center gap-2">
                  <Download className="h-4 w-4" />
                  Importar/Exportar
                </TabsTrigger>
              </TabsList>

              <TabsContent value="design" className="space-y-6 mt-6">
                {/* Configuración General */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Información General</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="template-name">Nombre de la Plantilla</Label>
                      <Input
                        id="template-name"
                        value={currentTemplate.name}
                        onChange={(e) => updateTemplateField('name', e.target.value)}
                      />
                    </div>
                    <div>
                      <Label htmlFor="template-description">Descripción</Label>
                      <Input
                        id="template-description"
                        value={currentTemplate.description}
                        onChange={(e) => updateTemplateField('description', e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Configuración de Colores */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Paleta de Colores</h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <ColorPicker
                      label="Color Primario"
                      value={currentTemplate.colors.primary}
                      onChange={handleColorChange('colors.primary')}
                    />
                    <ColorPicker
                      label="Color Secundario"
                      value={currentTemplate.colors.secondary}
                      onChange={handleColorChange('colors.secondary')}
                    />
                    <ColorPicker
                      label="Color de Acento"
                      value={currentTemplate.colors.accent}
                      onChange={handleColorChange('colors.accent')}
                    />
                    <ColorPicker
                      label="Color de Texto"
                      value={currentTemplate.colors.text}
                      onChange={handleColorChange('colors.text')}
                    />
                    <ColorPicker
                      label="Color de Fondo"
                      value={currentTemplate.colors.background}
                      onChange={handleColorChange('colors.background')}
                    />
                    <ColorPicker
                      label="Color de Borde"
                      value={currentTemplate.colors.border}
                      onChange={handleColorChange('colors.border')}
                    />
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="layout" className="space-y-6 mt-6">
                {/* Configuración de Página */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Configuración de Página</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Formato de Página</Label>
                      <Select 
                        value={currentTemplate.page_format} 
                        onValueChange={(value) => updateTemplateField('page_format', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="A4">A4</SelectItem>
                          <SelectItem value="Letter">Carta</SelectItem>
                          <SelectItem value="Legal">Legal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Orientación</Label>
                      <Select 
                        value={currentTemplate.orientation} 
                        onValueChange={(value) => updateTemplateField('orientation', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="portrait">Vertical</SelectItem>
                          <SelectItem value="landscape">Horizontal</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Márgenes */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Márgenes (puntos)</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label>Superior: {currentTemplate.margins.top}pt</Label>
                      <Slider
                        value={[currentTemplate.margins.top]}
                        onValueChange={handleSliderChange('margins.top')}
                        min={36}
                        max={144}
                        step={6}
                      />
                    </div>
                    <div>
                      <Label>Inferior: {currentTemplate.margins.bottom}pt</Label>
                      <Slider
                        value={[currentTemplate.margins.bottom]}
                        onValueChange={handleSliderChange('margins.bottom')}
                        min={36}
                        max={144}
                        step={6}
                      />
                    </div>
                    <div>
                      <Label>Izquierdo: {currentTemplate.margins.left}pt</Label>
                      <Slider
                        value={[currentTemplate.margins.left]}
                        onValueChange={handleSliderChange('margins.left')}
                        min={36}
                        max={144}
                        step={6}
                      />
                    </div>
                    <div>
                      <Label>Derecho: {currentTemplate.margins.right}pt</Label>
                      <Slider
                        value={[currentTemplate.margins.right]}
                        onValueChange={handleSliderChange('margins.right')}
                        min={36}
                        max={144}
                        step={6}
                      />
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Configuración de Logo */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Configuración de Logo</h3>
                  
                  {/* Selector de Empresa */}
                  <div className="space-y-2">
                    <Label>Empresa</Label>
                    <Select 
                      value={empresaSeleccionada} 
                      onValueChange={setEmpresaSeleccionada}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Seleccione una empresa" />
                      </SelectTrigger>
                      <SelectContent>
                        {empresas.map((empresa) => (
                          <SelectItem key={empresa.id} value={empresa.id || ""}>
                            {empresa.razon_social} ({empresa.ruc})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Configuración de visualización del logo */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="show-logo"
                        checked={currentTemplate.layout.show_logo}
                        onChange={(e) => updateTemplateField('layout.show_logo', e.target.checked)}
                      />
                      <Label htmlFor="show-logo">Mostrar Logo</Label>
                    </div>
                    
                    <div>
                      <Label>Posición del Logo</Label>
                      <Select 
                        value={currentTemplate.layout.logo_position} 
                        onValueChange={(value) => updateTemplateField('layout.logo_position', value)}
                        disabled={!currentTemplate.layout.show_logo}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="top-left">Superior Izquierda</SelectItem>
                          <SelectItem value="top-center">Superior Centro</SelectItem>
                          <SelectItem value="top-right">Superior Derecha</SelectItem>
                          <SelectItem value="center-left">Centro Izquierda</SelectItem>
                          <SelectItem value="center">Centro</SelectItem>
                          <SelectItem value="center-right">Centro Derecha</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div>
                      <Label>Tamaño del Logo</Label>
                      <Select 
                        value={currentTemplate.layout.logo_size || "medium"} 
                        onValueChange={(value: 'small' | 'medium' | 'large') => updateTemplateField('layout.logo_size', value)}
                        disabled={!currentTemplate.layout.show_logo}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="small">Pequeño</SelectItem>
                          <SelectItem value="medium">Mediano</SelectItem>
                          <SelectItem value="large">Grande</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  {/* Configuración avanzada del logo */}
                  {currentTemplate.layout.show_logo && (
                    <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                      <h4 className="font-medium">Configuración Avanzada</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <Label>Ancho del Logo: {currentTemplate.layout.logo_width || 80}px</Label>
                          <Slider
                            value={[currentTemplate.layout.logo_width || 80]}
                            onValueChange={handleSliderChange('layout.logo_width')}
                            min={40}
                            max={200}
                            step={10}
                          />
                        </div>
                        <div>
                          <Label>Alto del Logo: {currentTemplate.layout.logo_height || 40}px</Label>
                          <Slider
                            value={[currentTemplate.layout.logo_height || 40]}
                            onValueChange={handleSliderChange('layout.logo_height')}
                            min={20}
                            max={100}
                            step={5}
                          />
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Gestión de Logo */}
                  {empresaSeleccionada && (
                    <LogoManager
                      empresaId={empresaSeleccionada}
                      onLogoChange={(hasLogo) => {
                        if (!hasLogo) {
                          updateTemplateField('layout.show_logo', false);
                        }
                      }}
                    />
                  )}
                </div>
              </TabsContent>

              <TabsContent value="typography" className="space-y-6 mt-6">
                {/* Configuración de Fuentes */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Fuentes</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <Label>Fuente Primaria</Label>
                      <Select 
                        value={currentTemplate.fonts.primary} 
                        onValueChange={(value) => updateTemplateField('fonts.primary', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Helvetica">Helvetica</SelectItem>
                          <SelectItem value="Times-Roman">Times Roman</SelectItem>
                          <SelectItem value="Courier">Courier</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Fuente Secundaria</Label>
                      <Select 
                        value={currentTemplate.fonts.secondary} 
                        onValueChange={(value) => updateTemplateField('fonts.secondary', value)}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Helvetica-Bold">Helvetica Bold</SelectItem>
                          <SelectItem value="Times-Bold">Times Bold</SelectItem>
                          <SelectItem value="Courier-Bold">Courier Bold</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Tamaños de Fuente */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Tamaños de Fuente</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div>
                      <Label>Título: {currentTemplate.fonts.sizes.title}pt</Label>
                      <Slider
                        value={[currentTemplate.fonts.sizes.title]}
                        onValueChange={handleSliderChange('fonts.sizes.title')}
                        min={12}
                        max={24}
                        step={1}
                      />
                    </div>
                    <div>
                      <Label>Subtítulo: {currentTemplate.fonts.sizes.subtitle}pt</Label>
                      <Slider
                        value={[currentTemplate.fonts.sizes.subtitle]}
                        onValueChange={handleSliderChange('fonts.sizes.subtitle')}
                        min={10}
                        max={18}
                        step={1}
                      />
                    </div>
                    <div>
                      <Label>Cuerpo: {currentTemplate.fonts.sizes.body}pt</Label>
                      <Slider
                        value={[currentTemplate.fonts.sizes.body]}
                        onValueChange={handleSliderChange('fonts.sizes.body')}
                        min={8}
                        max={14}
                        step={1}
                      />
                    </div>
                    <div>
                      <Label>Pequeño: {currentTemplate.fonts.sizes.small}pt</Label>
                      <Slider
                        value={[currentTemplate.fonts.sizes.small]}
                        onValueChange={handleSliderChange('fonts.sizes.small')}
                        min={6}
                        max={10}
                        step={1}
                      />
                    </div>
                  </div>
                </div>
              </TabsContent>

              <TabsContent value="templates" className="space-y-6 mt-6">
                <TemplateManager
                  templates={templates}
                  currentTemplate={currentTemplate}
                  onTemplateSelect={(template: TemplateConfig) => setCurrentTemplate(template)}
                  onTemplateDelete={loadTemplates}
                  isLoading={isLoading}
                />
              </TabsContent>

              <TabsContent value="predefined" className="space-y-6 mt-6">
                <PredefinedTemplates
                  onTemplateSelect={(template: TemplateConfig) => setCurrentTemplate(template)}
                  isLoading={isLoading}
                />
              </TabsContent>

              <TabsContent value="import-export" className="space-y-6 mt-6">
                <ImportExport
                  currentTemplate={currentTemplate}
                  onTemplateImported={(template: TemplateConfig) => setCurrentTemplate(template)}
                />
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      {/* Panel de Vista Previa */}
      <div className="lg:col-span-1">
        <TemplatePreview
          previewUrl={previewUrl}
          isLoading={isLoading}
          onRefresh={handlePreviewTemplate}
        />
      </div>
    </div>
  );
}
