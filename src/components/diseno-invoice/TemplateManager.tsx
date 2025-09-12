'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  FileText, 
  Trash2, 
  Copy, 
  Edit, 
  Plus,
  MoreVertical 
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import type { TemplateConfig, TemplateListItem } from '@/types/pdf-templates';

interface TemplateManagerProps {
  templates: TemplateListItem[];
  currentTemplate: TemplateConfig;
  onTemplateSelect: (template: TemplateConfig) => void;
  onTemplateDelete: () => void;
  isLoading: boolean;
}

// Helper function para crear una plantilla con valores por defecto
const createDefaultTemplate = (baseData: Partial<TemplateConfig>): TemplateConfig => ({
  name: baseData.name || "Nueva Plantilla",
  description: baseData.description || "Descripción de la nueva plantilla",
  page_format: baseData.page_format || "A4",
  orientation: baseData.orientation || "portrait",
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
    header_height: 120,
    footer_height: 60,
    table_style: "modern"
  },
  branding: {
    company_name_size: 16,
    show_tagline: true,
    custom_footer: ""
  },
  ...baseData
});

export function TemplateManager({ 
  templates, 
  currentTemplate, 
  onTemplateSelect, 
  onTemplateDelete
}: TemplateManagerProps) {
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(currentTemplate.id || null);

  const handleTemplateSelect = async (template: TemplateListItem) => {
    setSelectedTemplate(template.id || null);
    
    // Si tenemos un ID, cargar la plantilla completa
    if (template.id) {
      try {
        // Aquí cargarías la plantilla completa del servidor
        // const fullTemplate = await pdfService.getTemplate(template.id);
        // onTemplateSelect(fullTemplate);
        
        // Por ahora, usar valores por defecto
        const fullTemplate = createDefaultTemplate(template);
        onTemplateSelect(fullTemplate);
      } catch (error) {
        console.error('Error loading template:', error);
        const defaultTemplate = createDefaultTemplate(template);
        onTemplateSelect(defaultTemplate);
      }
    } else {
      const defaultTemplate = createDefaultTemplate(template);
      onTemplateSelect(defaultTemplate);
    }
  };

  const handleTemplateDelete = async (templateId: string) => {
    if (confirm('¿Estás seguro de que quieres eliminar esta plantilla?')) {
      try {
        // Aquí implementarías la lógica de eliminación
        // await pdfService.deleteTemplate(templateId);
        console.log(`Deleting template: ${templateId}`);
        onTemplateDelete();
      } catch (error) {
        console.error('Error deleting template:', error);
      }
    }
  };

  const handleTemplateDuplicate = (template: TemplateListItem) => {
    const duplicatedTemplate = createDefaultTemplate({
      ...template,
      id: undefined,
      name: `${template.name} (Copia)`,
      description: `Copia de ${template.description}`
    });
    onTemplateSelect(duplicatedTemplate);
  };

  const createNewTemplate = () => {
    const newTemplate = createDefaultTemplate({
      name: "Nueva Plantilla",
      description: "Descripción de la nueva plantilla",
      page_format: "A4",
      orientation: "portrait"
    });
    onTemplateSelect(newTemplate);
    setSelectedTemplate(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Gestión de Plantillas</h3>
        <Button onClick={createNewTemplate} size="sm">
          <Plus className="h-4 w-4 mr-2" />
          Nueva Plantilla
        </Button>
      </div>

      {templates.length === 0 ? (
        <Alert>
          <FileText className="h-4 w-4" />
          <AlertDescription>
            No hay plantillas guardadas. Crea tu primera plantilla para comenzar.
          </AlertDescription>
        </Alert>
      ) : (
        <div className="grid gap-4">
          {templates.map((template) => (
            <Card 
              key={template.id} 
              className={`cursor-pointer transition-all ${
                selectedTemplate === template.id 
                  ? 'ring-2 ring-blue-500 bg-blue-50' 
                  : 'hover:shadow-md'
              }`}
              onClick={() => handleTemplateSelect(template)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <CardTitle className="text-base flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      {template.name}
                    </CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {template.description}
                    </p>
                  </div>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={() => {
                          handleTemplateSelect(template);
                        }}
                      >
                        <Edit className="h-4 w-4 mr-2" />
                        Editar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => {
                          handleTemplateDuplicate(template);
                        }}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Duplicar
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => {
                          if (template.id) {
                            handleTemplateDelete(template.id);
                          }
                        }}
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Eliminar
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </CardHeader>
              <CardContent className="pt-0">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Badge variant="secondary" className="text-xs">
                    {template.page_format}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {template.orientation === 'portrait' ? 'Vertical' : 'Horizontal'}
                  </Badge>
                  {template.updated_at && (
                    <span>
                      Actualizado: {new Date(template.updated_at).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {selectedTemplate && (
        <Alert className="border-blue-200 bg-blue-50">
          <AlertDescription>
            Plantilla seleccionada: <strong>{currentTemplate.name}</strong>
            {currentTemplate.id ? ' (Guardada)' : ' (Sin guardar)'}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
