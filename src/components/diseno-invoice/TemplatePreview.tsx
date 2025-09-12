'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Eye, RefreshCw, Download } from 'lucide-react';

interface TemplatePreviewProps {
  previewUrl: string | null;
  isLoading: boolean;
  onRefresh: () => void;
}

export function TemplatePreview({ previewUrl, isLoading, onRefresh }: TemplatePreviewProps) {
  const handleDownload = () => {
    if (previewUrl) {
      const link = document.createElement('a');
      link.href = previewUrl;
      link.download = 'vista-previa-factura.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    }
  };

  return (
    <Card className="h-fit">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Eye className="h-5 w-5" />
            Vista Previa
          </CardTitle>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={onRefresh}
              disabled={isLoading}
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </Button>
            {previewUrl && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={handleDownload}
              >
                <Download className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
            <div className="text-center">
              <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2 text-gray-400" />
              <p className="text-sm text-gray-600">Generando vista previa...</p>
            </div>
          </div>
        ) : previewUrl ? (
          <div className="space-y-4">
            <iframe
              src={previewUrl}
              className="w-full h-96 border rounded-lg"
              title="Vista previa de la factura"
            />
            <Alert>
              <AlertDescription>
                La vista previa se genera con datos de ejemplo. El diseño final puede variar 
                según el contenido real de las facturas.
              </AlertDescription>
            </Alert>
          </div>
        ) : (
          <div className="flex items-center justify-center h-96 bg-gray-50 rounded-lg">
            <div className="text-center">
              <Eye className="h-12 w-12 mx-auto mb-4 text-gray-400" />
              <p className="text-lg font-medium text-gray-600 mb-2">
                Sin vista previa
              </p>
              <p className="text-sm text-gray-500 mb-4">
                Haz clic en &quot;Vista Previa&quot; para generar una muestra de tu plantilla
              </p>
              <Button onClick={onRefresh} disabled={isLoading}>
                <Eye className="h-4 w-4 mr-2" />
                Generar Vista Previa
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
