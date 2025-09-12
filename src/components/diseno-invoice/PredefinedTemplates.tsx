'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Sparkles, 
  Download, 
  Eye,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { usePdfTemplates } from '@/hooks/usePdfTemplates';
import type { TemplateConfig } from '@/types/pdf-templates';

interface PredefinedTemplate {
  name: string;
  description: string;
  preview_colors: {
    primary: string;
    accent: string;
  };
  style: string;
}

interface PredefinedTemplatesProps {
  onTemplateSelect: (template: TemplateConfig) => void;
  isLoading: boolean;
}

export function PredefinedTemplates({ onTemplateSelect, isLoading }: PredefinedTemplatesProps) {
  const [predefinedTemplates, setPredefinedTemplates] = useState<PredefinedTemplate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [creatingTemplate, setCreatingTemplate] = useState<string | null>(null);

  const { 
    getPredefinedTemplates,
    createFromPredefined,
    initializePredefinedTemplates
  } = usePdfTemplates();

  const loadPredefinedTemplates = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await getPredefinedTemplates();
      if (response.error) {
        throw new Error(response.error);
      }
      
      setPredefinedTemplates(response.data || []);
    } catch (error) {
      console.error('Error loading predefined templates:', error);
      setError('Error al cargar templates predefinidos');
    } finally {
      setLoading(false);
    }
  }, [getPredefinedTemplates]);

  useEffect(() => {
    loadPredefinedTemplates();
  }, [loadPredefinedTemplates]);

  const handleUseTemplate = async (templateName: string) => {
    try {
      setCreatingTemplate(templateName);
      
      const response = await createFromPredefined(templateName);
      if (response.error) {
        throw new Error(response.error);
      }
      
      if (response.data) {
        onTemplateSelect(response.data);
      }
      
    } catch (error) {
      console.error('Error creating from predefined template:', error);
      setError(`Error al crear template desde ${templateName}`);
    } finally {
      setCreatingTemplate(null);
    }
  };

  const handleInitializeTemplates = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await initializePredefinedTemplates();
      if (response.error) {
        throw new Error(response.error);
      }
      
      // Recargar la lista después de inicializar
      await loadPredefinedTemplates();
      
    } catch (error) {
      console.error('Error initializing templates:', error);
      setError('Error al inicializar templates predefinidos');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Templates Predefinidos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="ml-2">Cargando templates...</span>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Templates Predefinidos
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              {error}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={loadPredefinedTemplates}
                className="ml-2"
              >
                Reintentar
              </Button>
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5" />
            Templates Predefinidos
          </CardTitle>
          {predefinedTemplates.length === 0 && (
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleInitializeTemplates}
              disabled={loading}
            >
              <Download className="h-4 w-4 mr-2" />
              Inicializar Templates
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {predefinedTemplates.length === 0 ? (
          <div className="text-center py-8">
            <Sparkles className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No hay templates predefinidos
            </h3>
            <p className="text-gray-500 mb-4">
              Inicializa los templates predefinidos para comenzar a usar diseños profesionales
            </p>
            <Button onClick={handleInitializeTemplates} disabled={loading}>
              <Download className="h-4 w-4 mr-2" />
              Inicializar Templates
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {predefinedTemplates.map((template) => (
              <div
                key={template.name}
                className="border rounded-lg p-4 hover:border-blue-300 transition-colors"
              >
                {/* Preview Colors */}
                <div className="flex gap-2 mb-3">
                  <div
                    className="w-8 h-8 rounded-full border-2 border-gray-200"
                    style={{ backgroundColor: template.preview_colors.primary }}
                    title={`Color primario: ${template.preview_colors.primary}`}
                  />
                  <div
                    className="w-8 h-8 rounded-full border-2 border-gray-200"
                    style={{ backgroundColor: template.preview_colors.accent }}
                    title={`Color de acento: ${template.preview_colors.accent}`}
                  />
                  <Badge variant="secondary" className="ml-auto">
                    {template.style}
                  </Badge>
                </div>

                {/* Template Info */}
                <h4 className="font-semibold text-lg mb-2">{template.name}</h4>
                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {template.description}
                </p>

                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    onClick={() => handleUseTemplate(template.name)}
                    disabled={creatingTemplate === template.name || isLoading}
                    className="flex-1"
                  >
                    {creatingTemplate === template.name ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                        Creando...
                      </>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Usar Template
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {/* Implementar preview */}}
                    disabled={isLoading}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}

        {predefinedTemplates.length > 0 && (
          <Alert className="mt-4">
            <Sparkles className="h-4 w-4" />
            <AlertDescription>
              Los templates predefinidos te permiten comenzar rápidamente con diseños profesionales.
              Puedes personalizarlos completamente después de seleccionarlos.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
}
