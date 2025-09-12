'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Download,
  Upload,
  FileText,
  CheckCircle,
  AlertCircle,
  Copy
} from 'lucide-react';
import { usePdfTemplates } from '@/hooks/usePdfTemplates';
import type { TemplateConfig } from '@/types/pdf-templates';

interface ImportExportProps {
  currentTemplate: TemplateConfig;
  onTemplateImported: (template: TemplateConfig) => void;
}

export function ImportExport({ currentTemplate, onTemplateImported }: ImportExportProps) {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [importData, setImportData] = useState('');
  const [customName, setCustomName] = useState('');
  const [exportData, setExportData] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const { exportTemplate, importTemplate } = usePdfTemplates();

  const handleExport = async () => {
    if (!currentTemplate.id) {
      setError('Debe seleccionar un template para exportar');
      return;
    }

    try {
      setIsExporting(true);
      setError(null);
      
      const response = await exportTemplate(currentTemplate.id);
      if (response.error) {
        throw new Error(response.error);
      }
      
      setExportData(response.data);
      setSuccess('Template exportado exitosamente');
      
    } catch (error) {
      console.error('Error exporting template:', error);
      setError('Error al exportar el template');
    } finally {
      setIsExporting(false);
    }
  };

  const handleDownloadJson = () => {
    if (!exportData) return;

    const dataStr = JSON.stringify(exportData, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    
    const link = document.createElement('a');
    link.href = url;
    link.download = `template-${currentTemplate.name.toLowerCase().replace(/\s+/g, '-')}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    URL.revokeObjectURL(url);
  };

  const handleCopyToClipboard = async () => {
    if (!exportData) return;

    try {
      await navigator.clipboard.writeText(JSON.stringify(exportData, null, 2));
      setSuccess('Configuración copiada al portapapeles');
    } catch {
      setError('Error al copiar al portapapeles');
    }
  };

  const handleImport = async () => {
    if (!importData.trim()) {
      setError('Debe proporcionar datos de configuración para importar');
      return;
    }

    try {
      setIsImporting(true);
      setError(null);
      
      const parsedData = JSON.parse(importData);
      const response = await importTemplate(parsedData, customName || undefined);
      
      if (response.error) {
        throw new Error(response.error);
      }
      
      if (response.data) {
        onTemplateImported(response.data);
        setSuccess('Template importado exitosamente');
        setImportData('');
        setCustomName('');
      }
      
    } catch (parseError) {
      if (parseError instanceof SyntaxError) {
        setError('Formato JSON inválido. Verifique la configuración.');
      } else {
        setError('Error al importar el template');
      }
    } finally {
      setIsImporting(false);
    }
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result as string;
      setImportData(content);
    };
    reader.readAsText(file);
  };

  // Clear messages after 5 seconds
  React.useEffect(() => {
    if (success || error) {
      const timer = setTimeout(() => {
        setSuccess(null);
        setError(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [success, error]);

  return (
    <div className="space-y-6">
      {/* Export Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            Exportar Template
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Exporta la configuración del template actual para compartir o hacer respaldo.
          </p>
          
          <div className="flex gap-2">
            <Button
              onClick={handleExport}
              disabled={isExporting || !currentTemplate.id}
            >
              {isExporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Exportando...
                </>
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </>
              )}
            </Button>
            
            {exportData && (
              <>
                <Button
                  variant="outline"
                  onClick={handleDownloadJson}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  Descargar JSON
                </Button>
                
                <Button
                  variant="outline"
                  onClick={handleCopyToClipboard}
                >
                  <Copy className="h-4 w-4 mr-2" />
                  Copiar
                </Button>
              </>
            )}
          </div>

          {exportData && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <Label className="text-sm font-medium">Configuración Exportada:</Label>
              <pre className="text-xs mt-2 max-h-32 overflow-y-auto bg-white p-2 rounded border">
                {JSON.stringify(exportData, null, 2)}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Import Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            Importar Template
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-gray-600">
            Importa una configuración de template desde un archivo JSON o texto.
          </p>

          <div className="space-y-4">
            <div>
              <Label htmlFor="custom-name">Nombre Personalizado (Opcional)</Label>
              <Input
                id="custom-name"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                placeholder="Ej: Mi Template Personalizado"
              />
            </div>

            <div>
              <Label htmlFor="file-upload">Subir Archivo JSON</Label>
              <Input
                id="file-upload"
                type="file"
                accept=".json"
                onChange={handleFileUpload}
                className="cursor-pointer"
              />
            </div>

            <div>
              <Label htmlFor="import-text">O Pegar Configuración JSON</Label>
              <textarea
                id="import-text"
                value={importData}
                onChange={(e) => setImportData(e.target.value)}
                className="w-full h-32 p-3 border rounded-lg resize-none font-mono text-sm"
                placeholder="Pegue aquí la configuración JSON del template..."
              />
            </div>

            <Button
              onClick={handleImport}
              disabled={isImporting || !importData.trim()}
              className="w-full"
            >
              {isImporting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Importando...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Importar Template
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Status Messages */}
      {success && (
        <Alert>
          <CheckCircle className="h-4 w-4" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
    </div>
  );
}
